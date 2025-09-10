const puppeteer = require('puppeteer');
const getLoginInfo = require('../setting/externalSiteInfo');

const writeToCh_castPage = async(accountKey, castName, diaryAddress) => {
  const { id, pass, loginUrl } = await getLoginInfo(accountKey, 'ch');
  // const browser = await puppeteer.launch({ headless: false });
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  try {
    await page.goto(loginUrl);
    await page.type('input[style="font-family:tahoma;font-size: 20px;"]', id); // id,password共に、同じnameの物がdisplay:noneで隠されていてそっちに反応してしまうので、styleで指定
    await page.keyboard.press('Tab');
    await page.keyboard.type(pass);
    await Promise.all([
      page.waitForNavigation({waitUntil:'load'}),
      page.click('body > div > form.oldLogin > table > tbody > tr:nth-child(2) > td > button'),
      
    ]);

    const castListPageLink = await page.$x("//a[normalize-space(text())='キャスト情報']");
    //  女の子情報タブをクリック
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'load' }),
      castListPageLink[0].click(),
    
    ]);

    //  女の子検索
    const castSearch = await page.evaluate((castName) => {
      let castSearch = false;
      const listItems = document.querySelectorAll('#list > li');
      listItems.forEach((item) => {
        const nameElement =item.querySelector('div.galListData > h5');
        if (nameElement.textContent.trim() === castName) {
          const editBtn = item.querySelector('div.galDataForm > input[type=button]:nth-child(1)');
          editBtn.click();
          castSearch = true;
        
        }
      });
      return castSearch;
    }, castName);

    if (!castSearch) {
      await page.click('a.info8');
      await page.waitForSelector('#list');
      await page.evaluate ((castName) => {
        const listItems = document.querySelectorAll('#list > li');
        let found = false;

        listItems.forEach((item) => {
          const nameElement = item.querySelector('div.galListData.non-publish > h5');
          if (nameElement.textContent.trim() === castName) {
            const editBtn = item.querySelector('div.galDataForm > input[type=button]');
            editBtn.click();
            found = true;
        
          }
        });

        if (!found) {
          throw new Error('Cast not found');
        
        }
      }, castName);
    }

    await page.waitForNavigation({ waitUntil: 'load' });

    //  登録していた写メ日記アドレス情報を一度消去(input.value = ''でやったら削除したのが登録されなかった)
    for (let i = 0; i < 10; i++) {
      await page.focus(`#fwd_addr${ i + 1 }`);
      await page.keyboard.down('Control');
      await page.keyboard.press('KeyA');
      await page.keyboard.up('Control');
      await page.keyboard.press('Backspace');
    
    }

    //  転送アドレス書き込み
    const diaryAddressData = Object.values(diaryAddress);

    if (!diaryAddressData.every(item => item === '')) {

      for (let i = 0; i < 10; i++) {
        await page.type(`#fwd_addr${ i + 1 }`, diaryAddressData[i] || '');
      
      }

      //  登録
      await page.click('input[name="update"]');

      await page.waitForSelector('#agree');

      await page.click('#agree');
      
      await Promise.all([
        page.once('dialog', async dialog => {
          await dialog.accept();
        }),
        page.waitForNavigation({ waitUntil: 'load' }),
        page.click('#modal-entry'),
      
      ]);

    } else {
      await Promise.all([
        page.once('dialog', async dialog => {
          await dialog.accept();
        }),
        page.waitForNavigation({waitUntil: 'load'}),
        page.click('input[name="update"]'),
      
      ]);
    }
  } catch (error) {
    console.error(error.message);
    throw error;
  
  } finally {
    if (browser) {
      browser.close();
    
    }
  }
}

module.exports = writeToCh_castPage;