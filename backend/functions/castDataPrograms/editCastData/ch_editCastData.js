const { tempFolderPath } = require('../../setting/downloadImageFromFirebaseStorage');
const { conversion_hiraToKana, conversion_kanaToHira } = require('../../setting/conversion_character');
const article_extraction = require('../../setting/article_extraction');
const writeToCh_addGirl = require('../addCastData/ch_AG');
const setTimeout = require('node:timers/promises').setTimeout;
const getLoginInfo = require('../../setting/externalSiteInfo');
const { db } = require('../../../utils/firebaseUtils');

const editCastToCh = async(accountKey, data, panelRef, logId, page) => {

  const content_logs = db.ref(`users/${accountKey}/logs/girls_log/${logId}/content_logs`);
  const { id, pass, loginUrl } = await getLoginInfo(accountKey, 'ch');
  
  try {

    await page.goto(loginUrl);
    await page.type('input[style="font-family:tahoma;font-size: 20px;"]', id); // id,password共に、同じnameの物がdisplay:noneで隠されていてそっちに反応してしまうので、styleで指定
    await page.keyboard.press('Tab');
    await page.keyboard.type(pass);
    await Promise.all([
      page.waitForNavigation({waitUntil:'load'}),
      page.click('body > div > form.oldLogin > table > tbody > tr:nth-child(2) > td > button'),
    ]);

    const castListPageLink2 = await page.$x("//a[normalize-space(text())='キャスト情報']");
    //  女の子情報タブをクリック
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'load' }),
      castListPageLink2[0].click(),
    
    ]);

    //  女の子検索
    const castSearch = await page.evaluate((castName) => {
      let castSearch = false;
      const listItems = document.querySelectorAll('#list > li');
      listItems.forEach((item) => {
        const nameElement =item.querySelector('div.galListData > h5');
        if (nameElement.textContent.trim() === castName) {
          const editBtn = item.querySelector('div.galDataForm > input[type=button]:nth-child(1)');
          editBtn.click();
          castSearch = true;
        }
      });
      return castSearch;
    }, data.castName);

    if (!castSearch) {
      await page.click('a.info8');
      await page.waitForSelector('#list');
      try {
        await page.evaluate ((castName) => {
          const listItems = document.querySelectorAll('#list > li');
          let found = false;

          listItems.forEach((item) => {
            const nameElement = item.querySelector('div.galListData.non-publish > h5');
            if (nameElement.textContent.trim() === castName) {
              const editBtn = item.querySelector('div.galDataForm > input[type=button]');
              editBtn.click();
              found = true;
            }
          });

          if (!found) {
            throw new Error('Cast not found');
          }

        }, data.castName);
      } catch (error) {
        await writeToCh_addGirl(accountKey, data, panelRef, logId, page);
        return;
      
      }
    }

    await page.waitForNavigation({waitUntil: 'load'});

    //  登録していた情報の消去
    await page.evaluate(() => {
      const inputs = document.querySelectorAll('input[type="text"], textarea');
      const selling_points = document.querySelectorAll('label.iconChecked');
      inputs.forEach((input) => {
        if (!input.id.includes('fwd_addr')) {
          input.value = '';
        }
      });
      selling_points.forEach((selling_point) => {
        selling_point.click();
      });

      //  全パネル削除
      const imgDeleteBtns = document.querySelectorAll('#list > li > a');
      imgDeleteBtns.forEach((btn) => {
        btn.click();
      });
    });
    await page.waitForNavigation({waitUntil: 'load'});

    //  プロフィール再登録
    if (data.situation !== 'public') {
      await page.click('#selKeisaiFlg_00');
    }

    await page.evaluate((entryDate) => {
      const [ year, month, day ] = entryDate.split('-');
      const selectYear = document.querySelector('#sel_workyear');
      const selectMonth = document.querySelector('#sel_workmonth');
      const selectDay = document.querySelector('#sel_workday');
      if (selectYear && entryDate) {
        selectYear.value = year;
        selectMonth.value = month;
        selectDay.value = day;
      }
    }, data.entryDate);

    await page.select('#entry_route', data.entryRoute);

    await page.type('input[name="girls_name"]', data.castName);

    await page.type('input[name="girls_name_hira"]', conversion_kanaToHira(data.castName));

    await page.type('input[name="girls_name_kana"]', conversion_hiraToKana(data.castName));

    await page.type('input[name="girls_catch"]', data.catchCopy);

    await page.select('#sel_GirlType', data.ch_type);

    // パネル登録
    await new Promise((resolve, reject)=> {
      panelRef.once('value', async(snapshot) => {
        const panelData = snapshot.val();
        //  パネル再登録
        if (panelData) {
          const panelLength = Object.keys(panelData).length;
          for (let i = 0; i < panelLength; i++) {
            const fileInputName = `girls_photo${i}`;
            const file_input = await page.$(`input[name="${fileInputName}"]`); // ページ上で指定された名前属性を持つファイル入力要素を取得
            const file_path = `${tempFolderPath}\\${panelData[i + 1]}`;
            await file_input.uploadFile(file_path); // uploadFileを使うのでclickはいらない
            await page.waitForNavigation(); // 各画像のアップロードに時間がかかるので、完了するまで待って繰り返す
          }
        }
        resolve();
      });
    });

    await page.type('input[name="girls_age"]', data.age);

    await page.type('input[name="girls_height"]', data.height);

    await page.type('input[name="girls_bust"]', data.bust);

    await page.evaluate((cupValue)=> {
      if (cupValue >= 20) {
        document.querySelector('#sel_GirlCup').options[20].selected = true;
      } else {
        document.querySelector('#sel_GirlCup').options[cupValue].selected = true;
      }
    }, data.cup);

    await page.type('input[name="girls_waist"]', data.waist);

    await page.type('input[name="girls_hip"]', data.hip);

    await page.type('textarea[name="guest_chatch"]', article_extraction(data.girlComment));

    await page.type('textarea[name="owner_comment"]', article_extraction(data.shopComment));

    //  Q&A
    for (let i = 0; i < 10; i++) {
      await page.type(`input[name="girls_Question${i + 1}"]`, data[`question${i + 1}`]);
      await page.type(`input[name="girls_Answer${i + 1}"]`, data[`answer${i + 1}`]);
    }
    
    if (data.ch_selling_points[0].label !== '') {
      for (let i = 0; i < data.ch_selling_points.length; i++) {
        await page.evaluate((i) => {
          const selling_point = document.querySelector(`#galAttribute_${i}`);
          if (selling_point) {
            selling_point.click();
          }
        }, data.ch_selling_points[i]);
      }
    }
    
    await setTimeout(4000);
    const submitBtn = await page.$('input[name="update"]');
    await submitBtn.evaluate(el => el.scrollIntoView());
    await Promise.all([
      page.waitForNavigation({waitUntil: 'load'}),
      submitBtn.click(),
    
    ]);

    await content_logs.push({
      ch: 'シティヘブン：編集完了'
    });

  } catch (error) {

    console.error(error.message);
    await content_logs.push({
      ch: 'シティヘブン：エラー！'
    });

  }
}
module.exports = editCastToCh;
