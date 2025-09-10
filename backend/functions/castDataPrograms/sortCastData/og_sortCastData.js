const getLoginInfo = require('../../setting/externalSiteInfo');
const { db } = require('../../../utils/firebaseUtils');

const og_sortCastData = async(accountKey, allCastOrderData, latestKey, page) => {

  const content_logs = db.ref(`users/${accountKey}/logs/girls_log/${latestKey}/content_logs`); 
  const { id, pass, loginUrl } = await getLoginInfo(accountKey, 'og');

  try {
  
    await page.goto(loginUrl);
    await page.type('input[name="operatorId"]', id);
    await page.type('input[name="operatorPass"]', pass);

    await Promise.all([
      page.waitForNavigation({waitUntil:'load'}),
      page.click('button[type="submit"]'),

    ]);
    
    await Promise.all([
      page.waitForNavigation({waitUntil:'load'}),
      page.click('body > section > nav > ul > li:nth-child(1) > ul > li:nth-child(7) > a'),
    
    ]);
    
    await Promise.all([
      page.waitForNavigation({waitUntil:'load'}),
      page.click('body > section > section > ul > li:nth-child(3) > a'),
    
    ]);

    //  並び替え
    await page.evaluate((allCastOrderData) => {
      const ul = document.querySelector('#sortAxisXY');
      const listItems = Array.from(ul.querySelectorAll('li.ui-sortable-handle')); // 現在のliの並びを配列に変換
    
      const reorderedItems = []; // 新しい順番を入れる
    
      // アイテムを新しい順番で並べ替える
      listItems.forEach((item) => {
        const nameElement = item.querySelector('p.name');
        const castName = nameElement.textContent.trim();
    
        if (allCastOrderData[castName]) {
          const targetIndex = allCastOrderData[castName] - 1; // allCastOrderDataの値は1からなので0からに戻す
          reorderedItems[targetIndex] = item; // reorderedItemsにtargetIndex（allCastOrderData[castName]の順番）を指定して入れている
    
        }
      });
    
      // リストの並べ替え後、DOMに反映
      reorderedItems.forEach((item) => {
        ul.appendChild(item);
    
      });
     
      //  sortable操作
      const sortableElement = $("#sortAxisXY");
      const items = sortableElement.children("li");
      sortableElement.sortable("option", "stop").call(sortableElement, null, { item: items.last() });

    }, allCastOrderData);
    
    await Promise.all([
      page.waitForNavigation({waitUntil: 'load'}),
      page.click('#sortForm > div.al-c.p10-t.p10-b > button'),
    
    ]);

    await content_logs.push({
      og: '雄琴ガイド：並び替え完了'
    
    });
  } catch (error) {
    console.error(error.message);
    await content_logs.push({
      og: '雄琴ガイド：エラー！'
    
    });
  }
}

module.exports = og_sortCastData;