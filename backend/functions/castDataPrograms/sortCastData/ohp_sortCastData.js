const getLoginInfo = require('../../setting/externalSiteInfo');
const { db } = require('../../../utils/firebaseUtils');

const ohp_sortCastData = async(accountKey, allCastOrderData, latestKey, page) => {

  const content_logs = db.ref(`users/${accountKey}/logs/girls_log/${latestKey}/content_logs`); 
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

    //  並び替え
    await page.evaluate((allCastOrderData) => {
      const ul = document.querySelector('#sortAxisXY');
      const listItems = Array.from(ul.querySelectorAll('li.ui-sortable-handle')); //  現在のliの並びを配列に変換

      const reorderedItems = [];  //  ここに新しい順番を入れる
      //  アイテムを新しい順番で並べ替える
      listItems.forEach((item) => {
        const nameElement = item.querySelector('p.name > a');
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

    await page.click('input[type=submit]');
    await page.waitForSelector('#main_contents > p'); //  「登録しました」が出るまで待つ

    await content_logs.push({
      ohp: 'オフィシャル：並び替え完了'
    
    });
  } catch (error) {
    console.error(error.message);
    await content_logs.push({
      ohp: 'オフィシャル：エラー！'
    
    });
  }
}

module.exports = ohp_sortCastData;