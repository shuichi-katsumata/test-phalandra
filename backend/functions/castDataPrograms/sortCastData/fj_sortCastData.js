const getLoginInfo = require('../../setting/externalSiteInfo');
const { db } = require('../../../utils/firebaseUtils');

const fj_sortCastData = async(accountKey, allCastOrderData, latestKey, page) => {
  
  const content_logs = db.ref(`users/${accountKey}/logs/girls_log/${latestKey}/content_logs`);
  const { id, pass, loginUrl } = await getLoginInfo(accountKey, 'fj');

  try {

    await page.goto(loginUrl);
    await page.type('input[name=username]', id);
    await page.type('input[name=password]', pass);

    await Promise.all([
      page.waitForNavigation({waitUntil: 'load'}),
      page.click('#button'),

    ]);

    await Promise.all([
      page.waitForNavigation({waitUntil: 'load'}),
      page.click('#wrapper > div > div.leftColumn > nav > div:nth-child(8) > div > ul > li:nth-child(3) > a'),
    
    ]);
    
    //  並び替え
    await page.evaluate((allCastOrderData) => {
      const ul = document.querySelector('#ul_sortable1');
      const listItems = Array.from(ul.querySelectorAll('li.ui-state-default')); //  現在のliの並びを配列に変換

      const reorderedItems = [];  //  ここに新しい順番を入れる
    
      //  アイテムを新しい順番で並べ替える
      listItems.forEach((item) => {
        const nameElement = item.querySelector('div.girl_field > em');
        const castName = nameElement.textContent.trim();

        if (allCastOrderData[castName]) {
          const targetIndex = allCastOrderData[castName] - 1; //  allCastOrderDataの値は1からになっているので0からに戻す
          reorderedItems[targetIndex] = item; //  reorderedItemsにtargetIndex（allCastOrderData[castName]の順番）を指定して入れている
    
        }
      });

      reorderedItems.forEach((item) => {
        ul.appendChild(item);
    
      });

      // jQueryのsortableを操作
      $(ul).sortable('refresh'); // sortableの状態を更新
      // updateイベントを手動で発火
      $(ul).sortable('option', 'update')(null, { item: reorderedItems }); // `update`イベントを手動でトリガー

    }, allCastOrderData);

    await Promise.all([
      page.waitForNavigation({waitUntil: 'load'}),
      page.click('#form_change-submit'),
    
    ]);

    await content_logs.push({
      fj: '風俗じゃぱん：並び替え完了'
    
    });
  } catch (error) {
    console.error(error.message);
    await content_logs.push({
      fj: '風俗じゃぱん：エラー！'
    
    });
  }
}

module.exports = fj_sortCastData