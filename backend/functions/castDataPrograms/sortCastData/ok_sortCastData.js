const getLoginInfo = require('../../setting/externalSiteInfo');
const { db } = require('../../../utils/firebaseUtils');

const ok_sortCastData = async(accountKey, allCastOrderData, latestKey, page) => {

  const content_logs = db.ref(`users/${accountKey}/logs/girls_log/${latestKey}/content_logs`); 
  const { id, pass, loginUrl } = await getLoginInfo(accountKey, 'ok');

  try {

    await page.goto(loginUrl);
    await page.type('input[name="id"]', id);
    await page.type('input[name="password"]', pass);

    await Promise.all([
      page.waitForNavigation({waitUntil: 'load'}),
      page.click('input[name="login_req"]'),
      
    ]);

    await page.click('#container > div.menu > ul > li:nth-child(5) > a');
    await page.waitForSelector('tr.data-row');

    //  並び替え
    await page.evaluate((allCastOrderData) => {
      const ul = document.querySelector('tbody.ui-sortable');
      const listItems = Array.from(ul.querySelectorAll('tr.data-row')); //  現在のliの並びを配列に変換

      const reorderedItems = [];  //  ここに新しい順番を入れる
      
      //  アイテムを新しい順番で並べ替える
      listItems.forEach((item) => {
        const nameElement = item.querySelector('td:nth-child(2)');
        let castName = nameElement.textContent.trim().split('\n')[0];
        castName = castName.replace(/\s*\(\d{2} 歳\)/, '').trim();

        if (allCastOrderData[castName]) {
          const targetIndex = allCastOrderData[castName] - 1; //  allCastOrderDataの値は1からになっているので0からに戻す
          reorderedItems[targetIndex] = item; //  reorderedItemsにtargetIndex（allCastOrderData[castName]の順番）を指定して入れている
      
        }
      });

      reorderedItems.forEach((item) => {
        ul.appendChild(item);
      
      });

      //  sortable操作
      const sortableElement = $("tbody.ui-sortable");
      const items = sortableElement.children("li");
      sortableElement.sortable("option", "stop").call(sortableElement, null, { item: items.last() });

    }, allCastOrderData);

    await content_logs.push({
      ok: '雄琴協会サイト：並び替え完了'
    
    });
  } catch (error) {

    console.error(error.message);
    await content_logs.push({
      ok: '雄琴協会サイト：エラー！'
    
    });
  }
}

module.exports = ok_sortCastData;