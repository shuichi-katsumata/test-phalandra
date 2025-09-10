const getLoginInfo = require('../../setting/externalSiteInfo');
const { db } = require('../../../utils/firebaseUtils');
const setTimeout = require('node:timers/promises').setTimeout;

const pl_sortCastData = async(accountKey, allCastOrderData, latestKey, page) => {

  const content_logs = db.ref(`users/${accountKey}/logs/girls_log/${latestKey}/content_logs`); 
  const { id, pass, loginUrl } = await getLoginInfo(accountKey, 'pl');

  try {

    await page.goto(loginUrl);
    await page.type( 'input[name="id"]', id);
    await page.type('input[name="password"]', pass);

    await Promise.all([
      page.waitForNavigation({waitUntil: 'load'}),
      page.click('#form_submit > input[type="image"]'),

    ]);

    await page.waitForSelector('#sidenavi-girl > ul > li:nth-child(3) > a');
    const girlsSortLink = await page.$('#sidenavi-girl > ul > li:nth-child(3) > a');
    await girlsSortLink.evaluate(el => el.scrollIntoView());
    
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'load' }),
      girlsSortLink.click(),

    ]);

    //  並び替え
    await page.evaluate((allCastOrderData) => {
      const ul = document.querySelector('#girlsList');
      const listItems = Array.from(ul.querySelectorAll('li.view_on')); //  現在のliの並びを配列に変換

      const reorderedItems = [];  //  ここに新しい順番を入れる
      //  アイテムを新しい順番で並べ替える
      listItems.forEach((item) => {
        const nameElement = item.querySelector('div.girlsList_right > div > p:nth-child(1) > a > b');
        const castName = nameElement.textContent.trim();

        if (allCastOrderData[castName]) {
          const targetIndex = allCastOrderData[castName] - 1; //  allCastOrderDataの値は1からになっているので0からに戻す
          reorderedItems[targetIndex] = item; //  reorderedItemsにtargetIndex（allCastOrderData[castName]の順番）を指定して入れている
      
        }
      });

      reorderedItems.forEach((item) => {
        ul.appendChild(item);
      
      });
      
      //  sortable操作
      const sortableElement = $("#girlsList");
      const items = sortableElement.children("li");
      sortableElement.sortable("option", "stop").call(sortableElement, null, { item: items.last() });

    }, allCastOrderData);

    const sortBtn = await page.$('#sort_btn2');
    await sortBtn.evaluate(el => el.scrollIntoView());
    await sortBtn.click();
    await setTimeout(4000);

    await content_logs.push({
      pl: 'ぴゅあらば：並び替え完了'
    
    });

  } catch (error) {
    console.error(error.message);
    await content_logs.push({
      pl: 'ぴゅあらば：エラー！'
    
    });
  }
}

module.exports = pl_sortCastData;