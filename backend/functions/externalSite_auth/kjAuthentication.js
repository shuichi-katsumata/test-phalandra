const getLoginInfo = require('../setting/externalSiteInfo'); 

const writeKjAuthentication = async(accountKey, browser, page) => {
  const { id, pass, loginUrl } = await getLoginInfo(accountKey, 'kj');
  
  try {
    await page.goto(loginUrl);
    await page.type( '#email', id);
    await page.type('#password', pass);
    await page.click('input[name="login"]');
    const errorMessage = await page.$('#page_main > div > form > div > div > div.dialog_error');

    if (errorMessage) {
      throw new Error('ログインエラー: kjのログインに失敗しました');

    }
  } catch (error) {
    throw error;

  } finally {
    await browser.close();

  }
}

module.exports = writeKjAuthentication;