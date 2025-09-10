const getLoginInfo = require('../../setting/externalSiteInfo');

const ecAddressGetter = async(accountKey, castName, page) => {

  const { id, pass, loginUrl } = await getLoginInfo(accountKey, 'ec');

  try {
    
    await page.goto(loginUrl);
    await page.type( '#form_email', id);
    await page.type('#form_password', pass);

    await Promise.all([
      page.waitForNavigation({ waitUntil:'load' }),
      page.click('#form_submit'),

    ]);

    await Promise.all([
      page.waitForNavigation({ waitUntil:'load' }),
      page.goto('https://ranking-deli.jp/admin/maillist/'),
    
    ]);
    
    const { castSearch, diaryAddress } = await page.evaluate((castName) => {

      let castSearch = false;
      let diaryAddress = null;
      const listItems = document.querySelectorAll('body > div.main > div.col-md-12 > ul > li');
      
      for ( let item of listItems ) {
        const nameElement = item.querySelector('div.md_column.md_poster_column');
      
        if (nameElement && nameElement.textContent.trim() === castName) {
          const diaryAddressElement = item.querySelector('div.md_column.md_mail_column');
          
          if ( diaryAddressElement ) {
            const match = diaryAddressElement.textContent.match(/メールアドレス：(.+@.+)/);
            
            if ( match && match[1] ) {
              diaryAddress = match[1].trim();
              castSearch = true;
              break;

            }
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

  }
}

module.exports = ecAddressGetter;