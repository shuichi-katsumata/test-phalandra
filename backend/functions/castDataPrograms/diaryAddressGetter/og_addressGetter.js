const getLoginInfo = require('../../setting/externalSiteInfo');

const ogAddressGetter = async(accountKey, castName, page) => {

  const { id, pass, loginUrl } = await getLoginInfo(accountKey, 'og');

  try {
    
    await page.goto(loginUrl);
    await page.type('input[name="operatorId"]', id);
    await page.type('input[name="operatorPass"]', pass);

    await Promise.all([
      page.waitForNavigation({waitUntil: 'load'}),
      page.click('button[type="submit"]'),

    ]);

    await Promise.all([
      page.waitForNavigation({waitUntil: 'load'}),
      page.click('body > section > nav > ul > li:nth-child(1) > ul > li:nth-child(7) > a'),
    
    ]);

    const { castSearch, diaryAddressSelector } = await page.evaluate((castName) => {
      let castSearch = false;
      let diaryAddressSelector = null;
      const listItems = document.querySelectorAll('body > section > section > div > ul > li');

      for (let item of listItems) {
        const nameElement = item.querySelector('div.left > p.name');
        
        if (nameElement.textContent.trim() === castName) {      
          castSearch = true;
          diaryAddressSelector = item.querySelector('div.right > div > p:nth-child(3) > a').getAttribute('href');
          break;

        }
      }
      return { castSearch, diaryAddressSelector };

    }, castName);
    
    if (!castSearch) {
      return null;
    
    }

    let diaryAddress = null;
    
    if (diaryAddressSelector) {
      //  現在のURLを取得
      const currentPageUrl = page.url();

      //  diaryAddressが相対パスなのでぜったいURLに変換
      const absoluteUrl = new URL(diaryAddressSelector, currentPageUrl).href;

      await page.goto(absoluteUrl);
      
      await page.waitForSelector('#main_container > div.m30-b > div > div:nth-child(3) > dl > dd');
      diaryAddress = await page.$eval('#main_container > div.m30-b > div > div:nth-child(3) > dl > dd', (dd) => dd.textContent.trim());
      return diaryAddress;

    }
    return diaryAddress;

  } catch(error) {
    console.error(error);
    return;

  }
}

module.exports = ogAddressGetter;