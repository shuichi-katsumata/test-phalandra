const getLoginInfo = require('../../setting/externalSiteInfo');

const kfAddressGetter = async(accountKey, castName, page) => {

  const { id, pass, loginUrl } = await getLoginInfo(accountKey, 'kf');

  try {
    
    await page.goto(loginUrl);
    await page.type('#login_id', id);
    await page.type('#login_password', pass);

    await Promise.all([
      page.waitForNavigation({waitUntil: 'load'}),
      page.click('#ShopShopShopsLoginForm > div.adminLogin > div > input'),
      
    ]);

    //  女の子検索
    await page.click('#slideMenu_mem__id > div > div:nth-child(8) > div.slideMenu_mem__navList > div:nth-child(1) > p > a');
    await page.waitForSelector('input[name="data[search][name]"]');
    await page.type('input[name="data[search][name]"]', castName);

    await Promise.all([
      page.waitForNavigation({waitUntil: 'load'}),
      page.click('button[type="submit"]'),

    ]);

    const { castSearch, diaryAddress } = await page.evaluate((castName) => {
      let castSearch = false;
      let diaryAddress = null;
      const listItems = document.querySelectorAll('.displaySwitchItem');

      for (let item of listItems) {
        const nameElement = item.querySelector('div.left_container > div.girlAdmin__name > a > p');
        
        if (nameElement.textContent.trim() === castName) {
          castSearch = true;
          const diaryAddressElement =  item.querySelector('div.girlAdmin__photoMailAddress > a');
          diaryAddress = diaryAddressElement.textContent.trim();
          break;

        }
      };
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

module.exports = kfAddressGetter;