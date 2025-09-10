const getLoginInfo = require('../../setting/externalSiteInfo');
const { db } = require('../../../utils/firebaseUtils');

const deleteCastToOk = async(accountKey, data, logId, page) => {
  const content_logs = db.ref(`users/${accountKey}/logs/girls_log/${logId}/content_logs`);
  const { id, pass, loginUrl } = await getLoginInfo(accountKey, 'ok');

  try {

    await page.goto(loginUrl);
    await page.type('input[name="id"]', id);
    await page.type('input[name="password"]', pass);
    await page.click('input[name="login_req"]');
    await page.click('#container > div.menu > ul > li:nth-child(5) > a');

    const isFound = await page.evaluate((castName)=> {

      let found = false;
      const listItems = document.querySelectorAll('.data-row');

      listItems.forEach((item) => {
      
        const nameElement = item.querySelector('td:nth-child(2)');
        let name = nameElement.textContent.trim().split('\n')[0];
        name = name.replace(/\s*\(\d{2} 歳\)/, '').trim();
        
        if (name === castName) {

          found = true;
          const deleteBtn = item.querySelector('td:nth-child(3) > a:nth-child(2)');
          deleteBtn.click();

        }
      });

      return found;
    }, data.castName);

    if (!isFound) {

      await content_logs.push({
        ok: '雄琴協会サイト：キャストが見つかりませんでした'
      });
      return;

    }

    await content_logs.push({
      ok: '雄琴協会サイト：削除完了'
    });

  } catch (error) {

    await content_logs.push({
      ok: '雄琴協会サイト：エラー！'
    });

  }
}

module.exports = deleteCastToOk;