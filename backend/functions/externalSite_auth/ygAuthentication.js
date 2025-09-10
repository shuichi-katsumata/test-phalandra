const getLoginInfo = require('../setting/externalSiteInfo'); 

const writeYgAuthentication = async(accountKey, browser, page) => {
  const { id, pass, loginUrl } = await getLoginInfo(accountKey, 'yg');

  try {
    await page.goto(loginUrl);
    await page.type('input[name="username"]', id);
    await page.type('input[name="password"]', pass);
    await page.click('input[type="submit"]');
    const errorMessage = await page.$('body > main > div > div.box_msg.error');

    if (errorMessage) {
      throw new Error('ログインエラー: ygのログインに失敗しました')
    }
  } catch (error) {
    throw error;
    
  } finally {
    await browser.close();

  }
}

module.exports = writeYgAuthentication;