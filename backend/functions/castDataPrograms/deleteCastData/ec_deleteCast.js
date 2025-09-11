const setTimeout = require('node:timers/promises').setTimeout;
const getLoginInfo = require('../../setting/externalSiteInfo');
const { db } = require('../../../utils/firebaseUtils');

const deleteCastToEc = async(accountKey, data, logId, page) => {

  const content_logs = db.ref(`users/${accountKey}/logs/girls_log/${logId}/content_logs`);
  const { id, pass, loginUrl } = await getLoginInfo(accountKey, 'ec');

  try {
    
    await page.goto(loginUrl);
    await page.type( '#form_email', id);
    await page.type('#form_password', pass);
    await page.click('#form_submit');
    await page.goto('https://ranking-deli.jp/admin/girls/');
    await setTimeout(2000);

    const isFound = await page.evaluate((castName) => {
      const normalize = (str) =>
        str
          .normalize("NFKC")
          .replace(/[\u200B-\u200D\uFEFF]/g, '') // ゼロ幅スペース削除
          .replace(/\s+/g, '')                  // 空白削除
          .trim();

      let found = false;
      const listItems = document.querySelectorAll('li.girls-cell');

      listItems.forEach((item) => {

        const nameElement = item.querySelector('p.girl-name');

        if (normalize(nameElement.textContent) === normalize(castName)) {
          found = true;
          const deleteBtn = item.querySelector('div.girl-btn > a:nth-child(2)');
          deleteBtn.click();

        }
      });

      return found;
    }, data.castName);

    if (!isFound) {

      await content_logs.push({
        ec: '駅ちか：キャストが見つかりませんでした'
      });
      return;
      
    }

    await setTimeout(5000);

    await content_logs.push({
      ec: '駅ちか：削除完了'
    });
  
  } catch (error) {
    console.error(error.message);
    await content_logs.push({
      ec: '駅ちか：エラー！'
    });
  
  }
}
module.exports = deleteCastToEc;
