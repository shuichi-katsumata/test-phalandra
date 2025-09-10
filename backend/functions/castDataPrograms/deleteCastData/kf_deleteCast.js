const getLoginInfo = require('../../setting/externalSiteInfo');
const { db } = require('../../../utils/firebaseUtils');

const deleteCastToKf = async(accountKey, data, logId, page) => {

  const content_logs = db.ref(`users/${accountKey}/logs/girls_log/${logId}/content_logs`);
  const { id, pass, loginUrl } = await getLoginInfo(accountKey, 'kf');

  try {

    await page.goto(loginUrl);
    await page.type('#login_id', id);
    await page.type('#login_password', pass);

    await Promise.all([
      page.waitForNavigation({waitUntil: 'load'}),
      page.click('#ShopShopShopsLoginForm > div.adminLogin > div > input'),
    ]);

    //  女の子検索
    await page.click('#slideMenu_mem__id > div > div:nth-child(8) > div.slideMenu_mem__navList > div:nth-child(1) > p > a');
    await page.waitForSelector('input[name="data[search][name]"]');
    await page.type('input[name="data[search][name]"]', data.castName);

    await Promise.all([
      page.waitForNavigation({waitUntil: 'load'}),
      page.click('button[type="submit"]'),
    ]);

    const isFound = await page.evaluate((castName) => {

      let found = false;
      const listItems = document.querySelectorAll('.displaySwitchItem');

      listItems.forEach((item) => {

        const nameElement = item.querySelector('div.left_container > div.girlAdmin__name > a > p');
        
        if (nameElement.textContent.trim() === castName) {

          found = true;
          const editBtn =  item.querySelector('div.left_container > div.edit > a');
          editBtn.click();

        }
      });

      return found;
    }, data.castName);

    if (!isFound) {

      await content_logs.push({
        kf: '京風：キャストが見つかりませんでした'
      });
      return;

    }

    //  女の子削除
    await page.waitForSelector('#editForm > div > div.rightCorner > a');
    
    await page.click('#editForm > div > div.rightCorner > a');
    await page.waitForSelector('li.displaySwitchItem');
    
    await content_logs.push({
      kf: '京風：削除完了'
    });
    
  } catch (error) {

    await content_logs.push({
      kf: '京風：エラー！'
    });

  }
}

module.exports = deleteCastToKf;