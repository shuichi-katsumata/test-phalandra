const getLoginInfo = require('../../setting/externalSiteInfo');
const setTimeout = require('node:timers/promises').setTimeout;

const kjAddressGetter = async(accountKey, castName, page) => {

  const { id, pass, loginUrl } = await getLoginInfo(accountKey, 'kj');

  try {
    
    await page.goto(loginUrl);
    await page.type( '#email', id);
    await page.type('#password', pass);

    await Promise.all([
      page.waitForNavigation(),
      page.click('input[name="login"]'),
      
    ]);

    await Promise.all([
      page.waitForNavigation(),
      page.click('body > div.slidemenu.slidemenu-left > div.slidemenu-body > ul > li:nth-child(7) > a'),
    
    ]);

    await Promise.all([
      page.waitForNavigation(),
      page.click('#page-content-wrapper > div.button-list-frame > a.btn.btn-info'),
    
    ]);

    const { castSearch } = await page.evaluate((castName) => {
      let castSearch = false;
      const listItems = document.querySelectorAll('tr.shp_about_section_tablebody_row');

      for (let item of listItems) {
        const nameElement = item.querySelector('td.shp_about_section_girlinfo > a > span');

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

    await page.waitForSelector('table.girl-area > tbody > tr:nth-child(1) > td');
    let diaryAddress = await page.$eval('table.girl-area > tbody > tr:nth-child(1) > td', (td) => td.textContent.trim());
    if (diaryAddress === '未設定') {
      const diaryAddressRegistration = await page.$('#accordion1 > div > a');
      if (diaryAddressRegistration) {
        await diaryAddressRegistration.click();
        await setTimeout(2000);

        const issueBtn = await page.$('#collapse1 > div > div > a');
        if (issueBtn) {
          await issueBtn.click();
          await setTimeout(2000);

          const iframeElement = await page.$('iframe.fancybox-iframe');   
          
          if (iframeElement) {
            const frame = await iframeElement.contentFrame();
            const diaryAddressElement = await frame.$('body > div > div > p > span');
            if (diaryAddressElement) {
              diaryAddress = await frame.evaluate(el => el.textContent.trim(), diaryAddressElement);
              
            }
            await frame.click('body > div > div > div > a');

          }
        }
      }
    }

    return diaryAddress;

  } catch(error) {
    return;

  }
}

module.exports = kjAddressGetter;