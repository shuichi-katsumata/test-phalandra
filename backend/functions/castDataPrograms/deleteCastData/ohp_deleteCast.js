const getLoginInfo = require('../../setting/externalSiteInfo');
const { db } = require('../../../utils/firebaseUtils');

const deleteCastToOhp = async(accountKey, data, logId, page) => {

  const content_logs = db.ref(`users/${accountKey}/logs/girls_log/${logId}/content_logs`);
  const { id, pass, loginUrl } = await getLoginInfo(accountKey, 'ohp');
  
  try {

    await page.goto(loginUrl);
    await page.type('input[name=id]', id);
    await page.type('input[name=password]', pass);

    await Promise.all([
      page.waitForNavigation({waitUntil: 'load'}),
      page.click('input[type=submit]'),
    ]);

    await Promise.all([
      page.waitForNavigation({waitUntil:'load'}),
      page.click('#g_navi > ul > li:nth-child(5) > a'),
    ]);

    //  女の子検索
    const isFound = await page.evaluate((castName) => {

      let found = false;
      const listItems = document.querySelectorAll('li.ui-sortable-handle');
      listItems.forEach((item) => {
        const nameElement = item.querySelector('p.name > a');

        if (nameElement.textContent.trim() === castName) {
          const editBtn = item.querySelector('p.edit > a');
          editBtn.click();
          found = true;
        }
        
      });

      return found;
    }, data.castName);

    if (!isFound) {

      await Promise.all([
        page.waitForNavigation({waitUntil: 'load'}),
        page.click('#s_navi > ul > li:nth-child(2) > a'),
      ]);

      const privateCastSearch = await page.evaluate((castName) => {

        let castFound = false;
        const listItems = document.querySelectorAll('li.off');

        listItems.forEach((item) => {
        
          const nameElement = item.querySelector('p.name');
        
          if (nameElement.textContent.trim() === castName) {
            
            castFound = true;
            const editBtn = item.querySelector('p.edit > a');
            editBtn.click();
        
          }
        });

        return castFound;
      }, data.castName);

      if (!privateCastSearch) {

        await content_logs.push({
          ohp: 'オフィシャル：キャストが見つかりませんでした'
        });
        return;

      }
    }

    await page.waitForNavigation({ waitUntil: 'load' });

    await page.click('input[name="delete"]');

    await content_logs.push({
      ohp: 'オフィシャル：削除完了'
    });

  } catch (error) {

    console.error(error.message);
    await content_logs.push({
      ohp: 'オフィシャル：エラー！'
    });
  
  }
}

module.exports = deleteCastToOhp;