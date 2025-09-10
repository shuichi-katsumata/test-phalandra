const setTimeout = require('node:timers/promises').setTimeout;
const getLoginInfo = require('../../setting/externalSiteInfo');
const { db } = require('../../../utils/firebaseUtils');

const deleteCastToPl = async(accountKey, data, logId, page) => {

  const content_logs = db.ref(`users/${accountKey}/logs/girls_log/${logId}/content_logs`);
  const { id, pass, loginUrl } = await getLoginInfo(accountKey, 'pl');

  try {

    await page.goto(loginUrl);
    await page.type( 'input[name="id"]', id);
    await page.type('input[name="password"]', pass);
    await page.click('#form_submit > input[type="image"]');
    
    await page.waitForSelector('#sidenavi-girl > ul > li:nth-child(2) > a');
    const girlsListLink = await page.$('#sidenavi-girl > ul > li:nth-child(2) > a');
    await girlsListLink.evaluate(el => el.scrollIntoView());
    await girlsListLink.click();
    await page.waitForSelector('.girlsList_right');
    
    const isFound = await page.evaluate((castName)=> {
      
      let found = false;
      const listItems = document.querySelectorAll('.girlsList_right');
      
      listItems.forEach((item) => {
      
        const nameElement = item.querySelector('b');
      
        if (nameElement && nameElement.textContent.trim() === castName) {
      
          found = true;
          const deleteBtn = item.querySelector('input[value="削除"]');
          deleteBtn.click();
      
        }
      });
    
      return found;
    }, data.castName);

    if (!isFound) {

      await content_logs.push({
        pl: 'ぴゅあらば：キャストが見つかりませんでした'
      });
      return;

    }

    await setTimeout(5000);

    await content_logs.push({
      pl: 'ぴゅあらば：削除完了'
    });

  } catch (error) {
    
    await content_logs.push({
      pl: 'ぴゅあらば：エラー！'
    });

  }
}

module.exports = deleteCastToPl;