const { tempFolderPath } = require('../../setting/downloadImageFromFirebaseStorage');
const article_extraction = require('../../setting/article_extraction');
const getLoginInfo = require('../../setting/externalSiteInfo');
const setTimeout = require('node:timers/promises').setTimeout;
const { db } = require('../../../utils/firebaseUtils');
const path = require('path');

const writeToOk_addGirl = async(accountKey, data, panelRef, latestKey, page) => {

  const content_logs = db.ref(`users/${accountKey}/logs/girls_log/${latestKey}/content_logs`);
  const { id, pass, loginUrl } = await getLoginInfo(accountKey, 'ok');

  try {

    await page.goto(loginUrl);
    await page.waitForSelector('input[name="id"]');
    await page.type('input[name="id"]', id);
    await page.type('input[name="password"]', pass);
    await setTimeout(2000);
    await page.click('input[name="login_req"]');
    
    await setTimeout(2000);
    await page.click('#container > div.menu > ul > li:nth-child(7) > a');

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
        datepickerInput.removeAttribute('readonly'); // readonly属性を削除して直接入力可能にする
        datepickerInput.removeAttribute('id'); // id属性を削除してJavaScriptによるイベントが発火しないようにする
        datepickerInput.removeAttribute('class'); // class属性も削除して念のためJavaScriptによるスタイリングが適用されないようにする
        datepickerInput.value = entryDate;

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
          for (let i=0; i<panelLength; i++) {
            const fileInputName = `image${i+1}`;
            const file_input = await page.$(`input[name=${fileInputName}]`); // fileの選択
            const file_path = path.join(tempFolderPath, panelData[i + 1]);
            await file_input.uploadFile(file_path);

          }
        }
        resolve();
      });
    });

    await page.click('input[name="submit"]');
    await page.waitForSelector('#sortable');

    if (data.situation !== 'public') {
      await page.evaluate((castName)=> {
        const girlsElement = document.querySelectorAll('tr[class="data-row"]');
        girlsElement.forEach(girl => {
          const girlElementName = girl.querySelector('td:nth-child(2)').textContent.trim();
          if (girlElementName.includes(castName)) {
            const checkbox = girl.querySelector('input[type="checkbox"]');
            checkbox.click();

          }
        });
      }, data.castName);
    }

    await content_logs.push({
      ok: '雄琴協会サイト：登録完了'
    
    });
  } catch (error) {
    console.error(error.message);
    await content_logs.push({
      ok: '雄琴協会サイト：エラー！'
    
    });
  }
}

module.exports = writeToOk_addGirl;