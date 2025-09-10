const setTimeout = require('node:timers/promises').setTimeout;
const getLoginInfo = require('../../setting/externalSiteInfo');

const plAddressGetter = async(accountKey, castName, browser, page) => {

  const { id, pass, loginUrl } = await getLoginInfo(accountKey, 'pl');
  let newPage;

  try {
    
    await page.goto(loginUrl);
    await page.type( 'input[name="id"]', id);
    await page.type('input[name="password"]', pass);

    await Promise.all([
      page.waitForNavigation({ waitUntil:'load' }),
      page.click('#form_submit > input[type="image"]'),
    
    ]);
    
    await page.evaluate(() => {
      const el = document.querySelector('#shop_main');
      if (el) {
        el.style.display = 'none';
      }
    });

    const diaryPageLink = await page.$('#sidenavi-girl > ul > li > a[href="/shop/diary-list/index/"]');
    await diaryPageLink.evaluate(el => el.scrollIntoView());
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'load' }),
      diaryPageLink.click(),
    ]);

    [ newPage ] = await Promise.all([
      browser.waitForTarget(target => target.opener() === page.target()).then(target => target.page()), //  新しいタブが親タブから開かれたか確認して、そうであればそのタブからページを取得する
      page.click('#shop_main > div.qr-diary-box > a'),
    
    ]);
    
    await newPage.waitForSelector('#qr-list > div.qr-box > ul');
    await setTimeout(5000); // ulの中のliが全て読み込まれる前に動いちゃうからこれで落ち着かせてる

    const { castSearch, diaryAddress } = await newPage.evaluate((castName) => {  
      let castSearch = false;
      let diaryAddress = null;
      const listItems = document.querySelectorAll('#qr-list > div.qr-box > ul > li > div.wrap');
      
      for ( let item of listItems ) {
        const nameElement = item.querySelector('p.girls-name > a');

        if (nameElement && nameElement.textContent.trim() === castName) {
          const diaryAddressElement = item.querySelector('p.address');
          
          if ( diaryAddressElement ) {
            diaryAddress = diaryAddressElement.textContent.trim();
            castSearch = true;
            break;

          }
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

  } finally {
    if (newPage) {
      newPage.close();
    
    }
  }
}

module.exports = plAddressGetter;