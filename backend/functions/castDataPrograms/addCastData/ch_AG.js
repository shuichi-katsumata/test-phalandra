const { tempFolderPath } = require('../../setting/downloadImageFromFirebaseStorage');
const { conversion_hiraToKana, conversion_kanaToHira } = require('../../setting/conversion_character');
const article_extraction = require('../../setting/article_extraction');
const setTimeout = require('node:timers/promises').setTimeout;
const getLoginInfo = require('../../setting/externalSiteInfo');
const { db } = require('../../../utils/firebaseUtils');

const writeToCh_addGirl = async(accountKey, data, panelRef, latestKey, page) => {

  const content_logs = db.ref(`users/${accountKey}/logs/girls_log/${latestKey}/content_logs`);
  const { id, pass, loginUrl } = await getLoginInfo(accountKey, 'ch');
  const [ year, month, day ] = data.entryDate.split('-');

  try {

    await page.goto(loginUrl);
    await page.type('input[style="font-family:tahoma;font-size: 20px;"]', id); // id,password共に、同じnameの物がdisplay:noneで隠されていてそっちに反応してしまうので、styleで指定
    await page.keyboard.press('Tab');
    await page.keyboard.type(pass);
    await Promise.all([
      page.waitForNavigation({waitUntil:'load'}),
      page.click('body > div > form.oldLogin > table > tbody > tr:nth-child(2) > td > button'),

    ]);

    const castListPageLink = await page.$x("//a[normalize-space(text())='キャスト情報']");
    //  女の子情報タブをクリック
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'load' }),
      castListPageLink[0].click(),
    
    ]);

    await Promise.all([
      page.waitForNavigation({waitUntil:'load'}),
      page.click('a.info2'),
    
    ]);

    //  公開の時は表示順を入れる
    if (data.situation !== 'public') {
      await page.click('#selKeisaiFlg_00');

    }

    if (data.entryDate) {
      await page.select('#sel_workyear', year);
      await page.select('#sel_workmonth', month);
      await page.select('#sel_workday', day);
    
    }

    await page.select('#entry_route', data.entryRoute)
    await page.type('input[name="girls_name"]', data.castName);
    await page.type('input[name="girls_name_hira"]', conversion_kanaToHira(data.castName));
    await page.type('input[name="girls_name_kana"]', conversion_hiraToKana(data.castName));
    await page.type('input[name="girls_catch"]', data.catchCopy);
    await page.select('#sel_GirlType', data.ch_type);

    await new Promise((resolve, reject)=> {
      panelRef.once('value', async(snapshot) => {
        const panelData = snapshot.val();
        if(panelData) {
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
      await page.focus(`input[name="girls_Question${i + 1}"]`);
      await page.keyboard.down('Control');
      await page.keyboard.press('KeyA');
      await page.keyboard.up('Control');
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
    const submitBtn = await page.$('input[name="insert"]');
    await submitBtn.evaluate(el => el.scrollIntoView());
    await Promise.all([
      page.waitForNavigation({waitUntil: 'load'}),
      submitBtn.click(),
    
    ]);

    await content_logs.push({
      ch: 'シティヘブン：登録完了'
    
    });
  } catch (error) {
    console.error(error.message);
    await content_logs.push({
      ch: 'シティヘブン：エラー！'

    });
  }
}

module.exports = writeToCh_addGirl;