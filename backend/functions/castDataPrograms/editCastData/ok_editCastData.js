const { tempFolderPath } = require('../../setting/downloadImageFromFirebaseStorage');
const article_extraction = require('../../setting/article_extraction');
const writeToOk_addGirl = require('../addCastData/ok_AG');
const getLoginInfo = require('../../setting/externalSiteInfo');
const setTimeout = require('node:timers/promises').setTimeout;
const { db } = require('../../../utils/firebaseUtils');
const path = require('path');

const editCastToOk = async(accountKey, data, panelRef, logId, page) => {
  
  const content_logs = db.ref(`users/${accountKey}/logs/girls_log/${logId}/content_logs`);
  const { id, pass, loginUrl } = await getLoginInfo(accountKey, 'ok');

  try {

    await page.goto(loginUrl);
    await page.waitForSelector('input[name="id"]');
    await page.type('input[name="id"]', id);
    await page.type('input[name="password"]', pass);
    await setTimeout(2000);
    await page.click('input[name="login_req"]');
    await setTimeout(2000);

    await Promise.all([
      page.waitForNavigation({waitUntil: 'load'}),
      page.click('#container > div.menu > ul > li:nth-child(5) > a')
    ]);

    //  女の子検索
    try {

      await page.evaluate((castName) => {
        const listItems = document.querySelectorAll('.data-row');
        let found = false;

        listItems.forEach((item) => {
          const nameElement = item.querySelector('td:nth-child(2)');
          let name = nameElement.textContent.trim().split('\n')[0];
          name = name.replace(/\s*\(\d{2} 歳\)/, '').trim();

          if (name === castName) {
            const editBtn = item.querySelector('td:nth-child(3) > a:nth-child(1)');
            editBtn.click();
            found = true;
          }

        });

        if (!found) {
          throw new Error('Cast not found');

        }
      }, data.castName);
    } catch (error) {
      await writeToOk_addGirl(accountKey, data, panelRef, logId, page);
      return;

    }
    //  登録されている情報の消去
    await page.waitForSelector('input[type="text"]');
    await page.evaluate(() => {
      const inputs = document.querySelectorAll('input[type="text"], textarea');
      inputs.forEach((input) => {
        input.value = '';
      });
    });

    //  編集内容登録
    await page.type('input[name="name"]', data.castName);
    await page.type('input[name="age"]', data.age);
    await page.type('input[name="height"]', data.height);
    await page.type('input[name="bust"]', data.bust);
    await page.type('input[name="waist"]', data.waist);
    await page.type('input[name="hip"]', data.hip);
    await page.evaluate((cupValue)=> {
      if (cupValue > 11) {
        document.querySelector('#container > div:nth-child(2) > div > div > form > table:nth-child(4) > tbody > tr:nth-child(2) > td > select').options[12].selected = true;
      } else {
        document.querySelector('#container > div:nth-child(2) > div > div > form > table:nth-child(4) > tbody > tr:nth-child(2) > td > select').options[cupValue].selected = true;
      }
    }, data.cup);
    if (data.entryDate) {
      await page.evaluate((entryDate) => {
        const datepickerInput = document.querySelector('input[name="in_store"]'); // 入力フィールドのセレクタを適切なものに置き換える
        if (datepickerInput) {
          datepickerInput.removeAttribute('readonly'); // readonly属性を削除して直接入力可能にする
          datepickerInput.removeAttribute('id'); // id属性を削除してJavaScriptによるイベントが発火しないようにする
          datepickerInput.removeAttribute('class'); // class属性も削除して念のためJavaScriptによるスタイリングが適用されないようにする
          datepickerInput.value = entryDate;
        }
      }, data.entryDate);
    }
    await page.type('input[name="catch"]', data.catchCopy);
    await page.type('textarea[name="comment"]', article_extraction(data.shopComment));

    // パネル登録
    await new Promise((resolve, reject)=> {
      panelRef.once('value', async(snapshot) => {
        const panelData = snapshot.val();
        if (panelData) {
          const panelLength = Math.min(Object.keys(panelData).length, 5);
          for (let i = 0; i < panelLength; i++) {
            const fileInputName = `image${i+1}`;
            const file_input = await page.$(`input[name=${fileInputName}]`); // fileの選択
            const file_path = path.join(tempFolderPath, panelData[i + 1]);
            await file_input.uploadFile(file_path);
          }
          if (panelLength < 5) {
            for (let i = panelLength; i < 5; i++) {
              await page.evaluate((i) => {
                const imgDeleteBtn = document.querySelector(`input[name="delete${i + 1}"]`);
                if (imgDeleteBtn) {
                  imgDeleteBtn.checked = true;
                }
              }, i)
            }
          }
        } else {
          for (let i = 0; i < 5; i++) {
            await page.evaluate((i) => {
              const imgDeleteBtn = document.querySelector(`input[name="delete${i + 1}"]`);
              if (imgDeleteBtn) {
                imgDeleteBtn.checked = true;
              }
            }, i);
          }
        }
        resolve();
      });
    });
    await page.click('input[name="submit"]');

    //  公開・非公開登録
    await page.waitForSelector('#sortable');
    await page.evaluate((castName, situation) => {
      const listItems = document.querySelectorAll('.data-row');
      listItems.forEach((item) => {
        const nameElement = item.querySelector('td:nth-child(2)');
        let name = nameElement.textContent.trim().split('\n')[0];
        name = name.replace(/\s*\(\d{2} 歳\)/, '').trim();
        if (name === castName) {
          const private = document.querySelector('tr.disabled_row');
          if (situation === 'public' && private) {
            const checkbox = item.querySelector('input[type="checkbox"]');
            checkbox.click();
          } else if (situation === 'private' && !private) {
            const checkbox = item.querySelector('input[type="checkbox"]');
            checkbox.click();
          }
        }
      });
    }, data.castName, data.situation);

    await content_logs.push({
      ok: '雄琴協会サイト：編集完了'
    });

  } catch (error) {
    console.error(error.message);
    await content_logs.push({
      ok: '雄琴協会サイト：エラー！'
    });

  }
}
module.exports = editCastToOk;
