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
      const elementTd = document.querySelector('#bodyLayout > div > div:nth-child(2) > div > form > div.innerListLayout > div > table > tbody > tr:nth-child(1) > td:nth-child(1)');
      elementTd.style.display = 'none';
      const elementDiv = document.querySelector('div.innerLinkRightFloat');
      elementDiv.style.display = 'none';
      const elementA = document.querySelector('a.girlListCheckImg');
      elementA.style.display = 'none';
    });

    await page.click('td.girlrightmenu > a:nth-child(3)');
    await setTimeout(2000);

    const listItemsHandles = await page.$$('li.draggable');
    let isFound = false;

    for (const itemHandle of listItemsHandles) {
      const nameHandle = await itemHandle.$('div.galListData > h5');
      if (!nameHandle) continue;

      const normalize = (str) =>
        str
          .normalize("NFKC")              // 全角半角統一
          .replace(/[\u200B-\u200D\uFEFF]/g, '') // ゼロ幅スペース等削除
          .replace(/\s+/g, '')            // スペース・改行削除
          .trim();

      const nameText = await page.evaluate(el => el.textContent, nameHandle);

      if (normalize(nameText) === normalize(data.castName)) {

        // スクロールして画面内に表示
        await itemHandle.evaluate(el => el.scrollIntoView());

        // 選択ボタンをクリック
        const chooseBtn = await itemHandle.$('div.galListData');
        await chooseBtn.click();

        isFound = true;
        break;
      }
    }

    if (!isFound) {
      await content_logs.push({
        ch: 'シティヘブン：キャストが見つかりませんでした'
      });
      return;
      
    }

    const submitBtn = await page.$('input[type="submit"]');
    await submitBtn.evaluate(el => el.scrollIntoView());
    await submitBtn.click();

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