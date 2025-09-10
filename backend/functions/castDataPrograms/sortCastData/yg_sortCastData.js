const getLoginInfo = require('../../setting/externalSiteInfo');
const { db } = require('../../../utils/firebaseUtils');
const setTimeout = require('node:timers/promises').setTimeout;

const yg_sortCastData = async(accountKey, allCastOrderData, latestKey, page) => {

  const content_logs = db.ref(`users/${accountKey}/logs/girls_log/${latestKey}/content_logs`); 
  const { id, pass, loginUrl } = await getLoginInfo(accountKey, 'yg');

  try {

    await page.goto(loginUrl);
    await page.type('input[name="username"]', id);
    await page.type('input[name="password"]', pass);

    await Promise.all([
      page.waitForNavigation({waitUntil: 'load'}),
      page.click('input[type="submit"]'),

    ]);
    
    await page.waitForSelector('#menu > div > div > ul > li:nth-child(13) > a');
    await page.click('#menu > div > div > ul > li:nth-child(13) > a');
    
    const frameHandle = await page.$('iframe.imain');
    const frame = await frameHandle.contentFrame();

    await frame.waitForSelector('body > div > div > div > div:nth-child(3) > div > a.btn.bg-white.ml10'),
    await frame.click('body > div > div > div > div:nth-child(3) > div > a.btn.bg-white.ml10'),

    await frame.waitForSelector('li.ui-sortable-handle'),

    //  並び替え
    await frame.evaluate((allCastOrderData) => {
      const ul = document.querySelector('#sort > ul');
      const listItems = Array.from(ul.querySelectorAll('li.ui-sortable-handle')); //  現在のliの並びを配列に変換

      const reorderedItems = [];  //  ここに新しい順番を入れる
      
      //  アイテムを新しい順番で並べ替える
      listItems.forEach((item) => {
        const nameElement = item.querySelector('p.name');
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
    
    await setTimeout(2000);
    await frame.click('#sort > div:nth-child(3) > button');

    await content_logs.push({
      yg: '夜遊びガイド：並び替え完了'
    
    });
  } catch (error) {
    console.error(error.message);
    await content_logs.push({
      yg: '夜遊びガイド：エラー！'
    
    });
  }
}

module.exports = yg_sortCastData;