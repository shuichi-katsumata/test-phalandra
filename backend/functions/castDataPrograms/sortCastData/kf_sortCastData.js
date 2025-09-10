const getLoginInfo = require('../../setting/externalSiteInfo');
const { db } = require('../../../utils/firebaseUtils');
const setTimeout = require('node:timers/promises').setTimeout;

const kf_sortCastData = async(accountKey, allCastOrderData, latestKey, page) => {

  const content_logs = db.ref(`users/${accountKey}/logs/girls_log/${latestKey}/content_logs`);
  const { id, pass, loginUrl } = await getLoginInfo(accountKey, 'kf');

  try {

    await page.goto(loginUrl);
    await page.type('#login_id', id);
    await page.type('#login_password', pass);

    await Promise.all([
      page.waitForNavigation({waitUntil: 'load'}),
      page.click('#ShopShopShopsLoginForm > div.adminLogin > div > input'),

    ]);

    await Promise.all([
      page.waitForNavigation({waitUntil: 'load'}),
      page.click('#slideMenu_mem__id > div > div:nth-child(8) > div.slideMenu_mem__navList > div:nth-child(1) > p > a'),
    
    ]);

    await page.click('#domSortable__start');
    await page.waitForSelector('li.ui-sortable-handle');
    
    //  並び替え
    await page.evaluate((allCastOrderData) => {
      const ul = document.querySelector('ul.girlOrder__items');
      const listItems = Array.from(ul.querySelectorAll('li.ui-sortable-handle')); //  現在のliの並びを配列に変換

      const reorderedItems = [];  //  ここに新しい順番を入れる
    
      //  アイテムを新しい順番で並べ替える
      listItems.forEach((item) => {
        const nameElement = item.querySelector('section > h1');
        const castName = nameElement.textContent.trim();

        if (allCastOrderData[castName]) {
          const targetIndex = allCastOrderData[castName] - 1; //  allCastOrderDataの値は1からになっているので0からに戻す
          reorderedItems[targetIndex] = item; //  reorderedItemsにtargetIndex（allCastOrderData[castName]の順番）を指定して入れている
    
        }
      });

      reorderedItems.forEach((item) => {
        ul.appendChild(item);
    
      });
    }, allCastOrderData);

    await setTimeout(3000);

    await Promise.all([
      page.waitForNavigation({waitUntil: 'load'}),
      page.click('#modalbtns__id > ul > li:nth-child(1) > div'),
    
    ]);

    await Promise.all([
      page.waitForNavigation({waitUntil: 'load'}),
      page.click('#slideMenu_mem__id > div > div:nth-child(8) > div.slideMenu_mem__navList > div:nth-child(1) > p > a'),
    
    ]);
    
    await content_logs.push({
      kf: '京風：並び替え完了'
    
    });
  } catch (error) {
    console.error(error.message);
    await content_logs.push({
      kf: '京風：エラー！'
    
    });
  }
}

module.exports = kf_sortCastData