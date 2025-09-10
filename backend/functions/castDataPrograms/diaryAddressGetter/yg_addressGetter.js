const getLoginInfo = require('../../setting/externalSiteInfo');
const setTimeout = require('node:timers/promises').setTimeout;

const yg_addressGetter = async(accountKey, castName, page) => {

  const { id, pass, loginUrl } = await getLoginInfo(accountKey, 'yg');

  try {
    
    await page.goto(loginUrl);
    await page.type('input[name="username"]', id);
    await page.type('input[name="password"]', pass);

    await Promise.all([
      page.waitForNavigation(),
      page.click('input[type="submit"]'),
    
    ]);
    
    await page.click('#menu > div > div > ul > li:nth-child(12) > a');
    await setTimeout(5000);

    const frameHandle = await page.$('iframe.imain');
    const frame = await frameHandle.contentFrame();
    const { castSearch, diaryAddress } = await frame.evaluate((castName) => {
      let castSearch = false;
      let diaryAddress = null;
      const listItems = document.querySelectorAll('#item-list > tbody > tr');

      for (let item of listItems) {
        const nameElement = item.querySelector('#item-list > tbody > tr > td:nth-child(2) > span > strong');

        if (nameElement && nameElement.textContent.trim() === castName) {
          castSearch = true;
          const diaryAddressElement = item.querySelector('#item-list > tbody > tr > td:nth-child(5)');
          diaryAddress =  diaryAddressElement.textContent.trim();
          break;

        }
      }
      return { castSearch, diaryAddress };
    }, castName);

    if (!castSearch) {
      return null;
    
    }
    return diaryAddress;

  } catch(error) {
    console.error(error);
    return;

  }
}

module.exports = yg_addressGetter;