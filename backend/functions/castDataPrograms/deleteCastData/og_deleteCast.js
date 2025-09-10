const setTimeout = require('node:timers/promises').setTimeout;
const getLoginInfo = require('../../setting/externalSiteInfo');
const { db } = require('../../../utils/firebaseUtils');

const deleteCastToOg = async(accountKey, data, logId, page) => {

  const content_logs = db.ref(`users/${accountKey}/logs/girls_log/${logId}/content_logs`);
  const { id, pass, loginUrl } = await getLoginInfo(accountKey, 'og');

  try {

    await page.goto(loginUrl);
    await page.type('input[name="operatorId"]', id);
    await page.type('input[name="operatorPass"]', pass);
    await page.click('button[type="submit"]');
    await page.waitForSelector('body > section > nav > ul > li:nth-child(1) > ul > li:nth-child(7) > a');
    await page.click('body > section > nav > ul > li:nth-child(1) > ul > li:nth-child(7) > a');
    await page.waitForSelector('body > section > section > div > ul > li');

    const isFound = await page.evaluate((castName) => {

      let found = false;
      const listItems = document.querySelectorAll('body > section > section > div > ul > li');

      listItems.forEach((item) => {

        const nameElement = item.querySelector('p.name');

        if (nameElement && nameElement.textContent.trim() === castName) {

          found = true;
          const editBtn = item.querySelector('div.right > div > p:nth-child(1) > a');
          editBtn.click();

        }
      });

      return found;
    }, data.castName);

    if (!isFound) {

      await content_logs.push({
        og: '雄琴ガイド：キャストが見つかりませんでした'
      });
      return;

    }

    await page.waitForSelector('body > section > section > div > button');
    await page.click('body > section > section > div > button');
    await setTimeout(3000);

    await content_logs.push({
      og: '雄琴ガイド：削除完了'
    });
    
  } catch (error) {

    await content_logs.push({
      og: '雄琴ガイド：エラー！'
    });

  }
}

module.exports = deleteCastToOg;