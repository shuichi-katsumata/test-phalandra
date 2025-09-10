const getLoginInfo = require('../setting/externalSiteInfo'); 

const writeOkAuthentication = async(accountKey, browser, page) => {
  const { id, pass, loginUrl } = await getLoginInfo(accountKey, 'ok');

  try {
    await page.goto(loginUrl);
    await page.type('input[name="id"]', id);
    await page.type('input[name="password"]', pass);
    await page.click('input[name="login_req"]');
    const errorMessage = await page.$('#container > div > div > div.container > div > form > span');

    if (errorMessage) {
      throw new Error('ログインエラー: okのログインに失敗しました')
    }
  } catch (error) {
    throw error;
    
  } finally {
    await browser.close();

  }
}

module.exports = writeOkAuthentication;