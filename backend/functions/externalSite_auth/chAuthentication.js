const getLoginInfo = require('../setting/externalSiteInfo'); 

const writeChAuthentication = async(accountKey, browser, page) => {
  const { id, pass, loginUrl } = await getLoginInfo(accountKey, 'ch');
  
  try {
    await page.goto(loginUrl);
    await page.type('input[style="font-family:tahoma;font-size: 20px;"]', id); // id,password共に、同じnameの物がdisplay:noneで隠されていてそっちに反応してしまうので、styleで指定
    await page.keyboard.press('Tab');
    await page.keyboard.type(pass);
    await Promise.all([
      page.waitForNavigation({ waitUntil:'load', timeout: 60000 }),
      page.click('body > div > form.oldLogin > table > tbody > tr:nth-child(2) > td > button'),
    ]);
    const errorMessage = await page.$('body > div > div.section.error > font > ul > li');

    if (errorMessage) {
      throw new Error('ログインエラー: chのログインに失敗しました');

    }
  } catch (error) {
    throw error;
    
  } finally {
    await browser.close();

  }
}

module.exports = writeChAuthentication;