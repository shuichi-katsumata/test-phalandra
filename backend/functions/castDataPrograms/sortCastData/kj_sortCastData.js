const getLoginInfo = require('../../setting/externalSiteInfo');
const { db } = require('../../../utils/firebaseUtils');

const kj_sortCastData = async(accountKey, allCastOrderData, latestKey, page) => {

  const content_logs = db.ref(`users/${accountKey}/logs/girls_log/${latestKey}/content_logs`);
  const { id, pass, loginUrl } = await getLoginInfo(accountKey, 'kj');

  try {

    await page.goto(loginUrl);
    await page.type( '#email', id);
    await page.type('#password', pass);

    await Promise.all([
      page.waitForNavigation({waitUntil: 'load'}),
      page.click('input[name="login"]'),

    ]);
    
    await Promise.all([
      page.waitForNavigation({waitUntil: 'load'}),
      page.click('body > div.slidemenu.slidemenu-left > div.slidemenu-body > ul > li:nth-child(5) > a'),
    
    ]);
    
    await Promise.all([
      page.waitForNavigation({waitUntil: 'load'}),
      page.click('#page-content-wrapper > div:nth-child(6) > div.panel-heading > div > a'),
    
    ]);
    
    //  並び替え
    await page.evaluate((allCastOrderData) => {
      const ul = document.querySelector('ul.sortable');
      const listItems = Array.from(ul.querySelectorAll('li.btn-group')); //  現在のliの並びを配列に変換

      const reorderedItems = [];  //  ここに新しい順番を入れる
    
      //  アイテムを新しい順番で並べ替える
      listItems.forEach((item) => {
        const nameElement = item.querySelector('div > div');
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

    await Promise.all([
      page.waitForNavigation({waitUntil: 'load'}),
      page.click('#page-content-wrapper > div:nth-child(3) > button'),
    
    ]);
    
    await content_logs.push({
      kj: '口コミ風俗情報局：並び替え完了'
    
    });
  } catch (error) {
    console.error(error.message);
    await content_logs.push({
      kj: '口コミ風俗情報局：エラー！'
    
    });
  }
}

module.exports = kj_sortCastData