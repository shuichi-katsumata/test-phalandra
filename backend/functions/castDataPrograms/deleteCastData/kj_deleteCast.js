const getLoginInfo = require('../../setting/externalSiteInfo');
const { db } = require('../../../utils/firebaseUtils');
const setTimeout = require('node:timers/promises').setTimeout;

const deleteCastToKj = async(accountKey, data, logId, page) => {

  const content_logs = db.ref(`users/${accountKey}/logs/girls_log/${logId}/content_logs`);
  const { id, pass, loginUrl } = await getLoginInfo(accountKey, 'kj');

  try {

    await page.goto(loginUrl);
    await page.type( '#email', id);
    await page.type('#password', pass);

    await Promise.all([
      page.waitForNavigation(),
      page.click('input[name="login"]'),
    ]);

    await page.click('body > div.slidemenu.slidemenu-left > div.slidemenu-body > ul > li:nth-child(5) > a');
    await page.waitForSelector('#page-content-wrapper > div:nth-child(6) > div.panel-body .btn-group');

    //  女の子検索と削除ボタンクリック
    const isFound = await page.evaluate(async(castName) => {

      let found = false;
      const listItems1 = document.querySelectorAll('#page-content-wrapper > div:nth-child(6) > div.panel-body .btn-group');

      for (const item of listItems1) {
        const nameElement = item.querySelector('button');

        if (nameElement.textContent.trim() === castName) {

          found = true;
          const girlMenuBtn = item.querySelector('button.dropdown-toggle');
          girlMenuBtn.click();
          const deleteBtn = item.querySelector('a[href*="shp_girl_delete"]');
          deleteBtn.click();

          //  ポップアップが開かれる。
          await new Promise((resolve) => setTimeout(resolve, 5000));
          const iframeElement =  document.querySelector('iframe.fancybox-iframe');   
          console.log(iframeElement);

          if (iframeElement) {

            const frame = iframeElement.contentWindow;
            const deleteBtn = frame.document.querySelector('a[href*="shp_girl_delete_post"]');

            if (deleteBtn) {

              deleteBtn.click();
            }
          }

          break;
        }
      }

      return found;
    }, data.castName);

    if (!isFound) {

      const privateCastSearch = await page.evaluate(async(castName) => {

        let castFound = false;
        const listItems2 = document.querySelectorAll('#page-content-wrapper > div:nth-child(7) > div.panel-body > .btn-group');

        for (const item of listItems2) {
        
          const buttons = item.querySelectorAll('button');
        
          for (const button of buttons) {
        
            const lines = button.innerText.split('\n');
            const foundLine = lines.find((line) => line === castName);
        
            if (foundLine) {

              const girlMenuBtn = item.querySelector('button.dropdown-toggle');
              girlMenuBtn.click();

              const comebackBtn = item.querySelector('a[href*="shp_girl_delete"]');
              comebackBtn.click();

              // ボタンを押してからjsでポップアップが開かれて、その中のiframe内に一時退店ボタンがあるよ。
              await new Promise((resolve) => setTimeout(resolve, 5000));
              const iframeElement =  document.querySelector('iframe.fancybox-iframe');
          
              if (iframeElement) {

                const frame = iframeElement.contentWindow.document;
                const deleteBtn = frame.querySelector('body > div > a.btn.btn-danger.marg');
                
                if (deleteBtn) {
                
                  castFound = true;
                  deleteBtn.click();
                
                }
              }
            }
          }
        }
        return castFound;
      }, data.castName);

      if (!privateCastSearch) {
        await content_logs.push({
          kj: '口コミ風俗情報局：キャストが見つかりませんでした'
        });
        return;
      }
    }
    

    await page.waitForSelector('#page-content-wrapper > div:nth-child(6) > div.panel-body > .btn-group');
    await content_logs.push({
      kj: '口コミ風俗情報局：削除完了'
    });

  } catch (error) {

    console.error(error.message);
    await content_logs.push({
      kj: '口コミ風俗情報局：エラー！'
    });

  }
}

module.exports = deleteCastToKj;