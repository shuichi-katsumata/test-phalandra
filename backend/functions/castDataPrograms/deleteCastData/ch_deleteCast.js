const getLoginInfo = require('../../setting/externalSiteInfo');
const setTimeout = require('node:timers/promises').setTimeout;
const { db } = require('../../../utils/firebaseUtils');

const deleteCastToCh = async(accountKey, data, logId, page) => {

  const content_logs = db.ref(`users/${accountKey}/logs/girls_log/${logId}/content_logs`);
  const { id, pass, loginUrl } = await getLoginInfo(accountKey, 'ch');

  try {
    await page.goto(loginUrl);
    await page.type('input[style="font-family:tahoma;font-size: 20px;"]', id); // id,password共に、同じnameの物がdisplay:noneで隠されていてそっちに反応してしまうので、styleで指定
    await page.keyboard.press('Tab');
    await page.keyboard.type(pass);

    await Promise.all([
      page.waitForNavigation({waitUntil: 'load'}),
      page.click('body > div > form.oldLogin > table > tbody > tr:nth-child(2) > td > button'),
    ]);

    const castListPageLink = await page.$x("//a[normalize-space(text())='キャスト情報']");
    //  女の子情報タブをクリック
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'load' }),
      castListPageLink[0].click(),
    
    ]);
    await page.evaluate(() => {
      const element = document.querySelector('a.girlListCheckImg');
      element.style.display = 'none';
    });

    await page.click('td.girlrightmenu > a:nth-child(3)');
    await setTimeout(2000);

    console.log('d');
    const isFound = await page.evaluate((castName) => {

      let found = false;
      const listItems = document.querySelectorAll('li.draggable');

      listItems.forEach((item) => {

        const nameElement = item.querySelector('div.galListData > h5');

        if (nameElement && nameElement.textContent.trim() === castName) {

          found = true;
          const chooseBtn = item.querySelector('div.galListData');
          chooseBtn.click();

        }
      });

      return found;
    }, data.castName);

    if (!isFound) {

      await content_logs.push({
        ch: 'シティヘブン：キャストが見つかりませんでした'
      });
      return;
      
    }
    console.log('e');
    await page.click('input[type="submit"]');
    console.log('f');
    await content_logs.push({
      ch: 'シティヘブン：削除完了'
    });
    
  } catch (error) {
    console.error(error.message);
    await content_logs.push({
      ch: 'シティヘブン：エラー！'
    });

  }
}

module.exports = deleteCastToCh;