const getLoginInfo = require('../../setting/externalSiteInfo');

const fjAddressGetter = async(accountKey, castName, page) => {

  const { id, pass, loginUrl } = await getLoginInfo(accountKey, 'fj');

  try {
    
    await page.goto(loginUrl);
    await page.type('input[name=username]', id);
    await page.type('input[name=password]', pass);

    await Promise.all([
      page.waitForNavigation({ waitUntil:'load' }),
      page.click('#button'),

    ]);

    await Promise.all([
      page.waitForNavigation({ waitUntil:'load' }),
      page.click('#wrapper > div > div.leftColumn > nav > div:nth-child(7) > div > ul > li:nth-child(1) > a'),
    
    ]);
    
    const { castSearch } = await page.evaluate((castName) => {
      let castSearch = false;
      const listItems = document.querySelectorAll('#girls > ul > li');

      for (let item of listItems) {
        const nameElement = item.querySelector('a > div.girl_name');
        if (nameElement && nameElement.textContent.trim() === castName) {
          castSearch = true;
          nameElement.click();
          break;

        }
      }
      return { castSearch };

    }, castName);

    if (!castSearch) {
      return null;
    
    }

    await page.waitForSelector('input[name="diary_email"]');
    const diaryAddress = await page.$eval('input[name="diary_email"]', (input) => input.value);
    return diaryAddress;

  } catch(error) {
    console.error(error);
    return;
    
  }
}

module.exports = fjAddressGetter;