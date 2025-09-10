const getLoginInfo = require('../../setting/externalSiteInfo');
const { db } = require('../../../utils/firebaseUtils');

const ch_sortCastData = async(accountKey, allCastOrderData, latestKey, page) => {
  
  const content_logs = db.ref(`users/${accountKey}/logs/girls_log/${latestKey}/content_logs`); 
  const { id, pass, loginUrl } = await getLoginInfo(accountKey, 'ch');

  try {
    
    await page.goto(loginUrl);
    await page.type('input[style="font-family:tahoma;font-size: 20px;"]', id); // id,password共に、同じnameの物がdisplay:noneで隠されていてそっちに反応してしまうので、styleで指定
    await page.keyboard.press('Tab');
    await page.keyboard.type(pass);
    await Promise.all([
      page.waitForNavigation({waitUntil:'load'}),
      page.click('body > div > form.oldLogin > table > tbody > tr:nth-child(2) > td > button'),

    ]);

    const castListPageLink = await page.$x("//a[normalize-space(text())='キャスト情報']");
    //  女の子情報タブをクリック
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'load' }),
      castListPageLink[0].click(),
    
    ]);

    //  並び替え
    await page.evaluate((allCastOrderData) => {
      const ul = document.querySelector('#list');
      const listItems = Array.from(ul.querySelectorAll('li.draggable')); // 現在のliの並びを配列に変換
    
      const reorderedItems = []; // 新しい順番を入れる
      // アイテムを新しい順番で並べ替える
      listItems.forEach((item) => {
        const fixedBtn = item.querySelector('div.galListData > div.sortForm > a');
        if (fixedBtn && fixedBtn.textContent.trim() === '女の子更新順') {
          fixedBtn.click();
        }

        const nameElement = item.querySelector('div.galListData > h5');
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
     
      // jQueryのsortableを操作
      $(ul).sortable('refresh'); // sortableの状態を更新
      // updateイベントを手動で発火
      $(ul).sortable('option', 'update')(null, { item: reorderedItems }); // `update`イベントを手動でトリガー
    
    }, allCastOrderData);
    
    await Promise.all([
      page.waitForNavigation({waitUntil: 'load'}),
      page.click('input[type=submit]'),
    
    ]);

    await content_logs.push({
      ch: 'シティヘブン：並び替え完了'
    
    });
  } catch (error) {
    console.error(error.message);
    await content_logs.push({
      ch: 'シティヘブン：エラー！'
    
    });
  }
}

module.exports = ch_sortCastData;