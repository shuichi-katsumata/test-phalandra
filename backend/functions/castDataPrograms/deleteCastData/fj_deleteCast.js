const setTimeout = require('node:timers/promises').setTimeout;
const getLoginInfo = require('../../setting/externalSiteInfo');
const { db } = require('../../../utils/firebaseUtils');

const deleteCastToFj = async(accountKey, data, logId, page) => {

  const content_logs = db.ref(`users/${accountKey}/logs/girls_log/${logId}/content_logs`);
  const { id, pass, loginUrl } = await getLoginInfo(accountKey, 'fj');

  try {

    await page.goto(loginUrl);
    await page.type('input[name=username]', id);
    await page.type('input[name=password]', pass);
    await page.click('#button');
    await page.waitForSelector('#wrapper > div > div.leftColumn > nav > div:nth-child(8) > div > ul > li:nth-child(3) > a');
    await page.click('#wrapper > div > div.leftColumn > nav > div:nth-child(8) > div > ul > li:nth-child(3) > a');
    await page.waitForSelector('li.ui-state-default');

    const isFound = await page.evaluate((castName)=> {

      let found = false;
      const listItems = document.querySelectorAll('li.ui-state-default'); 

      listItems.forEach((item) => {

        const nameElement = item.querySelector('.girl_name');

        if (nameElement && nameElement.textContent.trim() === castName) {
          
          found = true;
          const checkbox = item.querySelector('input[type="checkbox"]');
          checkbox.click();
        
        }
      });

      return found;
    }, data.castName);


    if (!isFound) {

      await content_logs.push({
        fj: '風俗じゃぱん：キャストが見つかりませんでした'
      });
      return;

    }

    // 「更新する」のボタンが追跡してきて削除ボタンを押す邪魔になっているので消す
    const change_submitElement = await page.$('.submit_area');

    if (change_submitElement) {

      await page.evaluate((element) => {

        element.style.display = 'none';

      }, change_submitElement)

    }

    await page.click('#form > div > div.control > ul > li:nth-child(2) > button');
    await page.click('#js-delete > ul > li:nth-child(1) > button');
    await setTimeout(3000);

    await content_logs.push({
      fj: '風俗じゃぱん：削除完了'
    });
    
  } catch (error) {
    console.error(error.message);
    await content_logs.push({
      fj: '風俗じゃぱん：エラー！'
    });

  }
}

module.exports = deleteCastToFj;