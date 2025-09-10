const getLoginInfo = require('../../setting/externalSiteInfo');
const { db } = require('../../../utils/firebaseUtils');

const ec_sortCastData = async(accountKey, allCastOrderData, latestKey, page) => {
  
  const content_logs = db.ref(`users/${accountKey}/logs/girls_log/${latestKey}/content_logs`); 
  const { id, pass, loginUrl } = await getLoginInfo(accountKey, 'ec');

  try {

    await page.goto(loginUrl);
    await page.type( '#form_email', id);
    await page.type('#form_password', pass);
    await Promise.all([
      page.waitForNavigation({waitUntil:'load'}),
      page.click('#form_submit'),

    ]);
    
    await page.goto('https://ranking-deli.jp/admin/girls/');

    //  並び替え
    await page.evaluate((allCastOrderData) => {
      const ul = document.querySelector('#girls-list-box');
      const listItems = Array.from(ul.querySelectorAll('li.girls-cell')); //  現在のliの並びを配列に変換

      const reorderedItems = [];  //  ここに新しい順番を入れる
      //  アイテムを新しい順番で並べ替える
      listItems.forEach((item) => {
        const nameElement = item.querySelector('p.girl-name');
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
      page.waitForNavigation({waitUntil:'load'}),
      await page.click('#girls_list_btn2'),
    
    ]);

    await content_logs.push({
      ec: '駅ちか：並び替え完了'
    
    });
  } catch (error) {
    console.error(error.message);
    await content_logs.push({
      ec: '駅ちか：エラー！'
    
    });
  }
}

module.exports = ec_sortCastData;