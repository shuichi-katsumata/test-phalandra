const setTimeout = require('node:timers/promises').setTimeout;
const getLoginInfo = require('../../setting/externalSiteInfo');
const { db } = require('../../../utils/firebaseUtils');

const deleteCastToYg = async(accountKey, data, logId, page) => {

  const content_logs = db.ref(`users/${accountKey}/logs/girls_log/${logId}/content_logs`);
  const { id, pass, loginUrl } = await getLoginInfo(accountKey, 'yg');

  try {

    await page.goto(loginUrl);
    await page.type('input[name="username"]', id);
    await page.type('input[name="password"]', pass);
    await page.click('input[type="submit"]');

    await page.waitForSelector('#menu > div > div > ul > li:nth-child(13) > a');
    await page.click('#menu > div > div > ul > li:nth-child(13) > a');
    await setTimeout(5000);

    //  女の子検索と削除
    await page.waitForSelector('#menu > div > div > ul > li:nth-child(13) > a');
    await page.click('#menu > div > div > ul > li:nth-child(13) > a');
    await setTimeout(5000);

    const frameHandle = await page.$('iframe.imain');
    const frame = await frameHandle.contentFrame();

    const isFound = await frame.evaluate((castName)=> {
      
      let found = false;
      const listItems = document.querySelectorAll('#item-list > tbody > tr'); 

      listItems.forEach((item) => {

        const nameElement = item.querySelector('.txt_large');

        if (nameElement.textContent.trim() === castName) {

          found = true;
          const deleteBtn = item.querySelector('.delete_btn');
          deleteBtn.click();

        }
      });

      return found;
    }, data.castName);

    if (!isFound) {

      await frame.click('body > div > div > div > div:nth-child(3) > div > a.btn.bg-white.mr4');
      await setTimeout(5000);

      const privateCastSearch = await frame.evaluate((castName) => {

        let castFound = false;
        const listItems = document.querySelectorAll('#item-list > tbody > tr');

        listItems.forEach((item) => {
        
          const nameElement = item.querySelector('.txt_large');
        
          if (nameElement.textContent.trim().split('\n')[0] === castName) {
        
            castFound = true;
            const deleteBtn = item.querySelector('.delete_btn');
            deleteBtn.click();
        
          }
        });

        return castFound;
      }, data.castName);

      if (!privateCastSearch) {

        await content_logs.push({
          yg: '夜遊びガイド：キャストが見つかりませんでした'
        });
        return;

      }
    }

    await setTimeout(5000);
    await frame.click('body > div > div > div > form > button');
    await setTimeout(5000);

    await content_logs.push({
      yg: '夜遊びガイド：削除完了'
    });

  } catch (error) {

    await content_logs.push({
      yg: '夜遊びガイド：エラー！'
    });

  }
}

module.exports = deleteCastToYg;