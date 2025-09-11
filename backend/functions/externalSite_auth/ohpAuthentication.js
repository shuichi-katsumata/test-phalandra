const getLoginInfo = require('../setting/externalSiteInfo'); 

const writeOhpAuthentication = async(accountKey, browser, page) => {
  const { id, pass, loginUrl } = await getLoginInfo(accountKey, 'ohp');
  
  try {
    await page.goto(loginUrl);
    await page.type('input[name=id]', id);
    await page.type('input[name=password]', pass);
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'load' }),
      page.click('input[type=submit]')
    ]);
    const errorMessage = await page.$('#gateway_in > p');

    if (errorMessage) {
      throw new Error('ログインエラー: ohpのログインに失敗しました');

    }
  } catch (error) {
    throw error;

  } finally {
    await browser.close();

  }
}

module.exports = writeOhpAuthentication;