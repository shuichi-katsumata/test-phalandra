const getLoginInfo = require('../setting/externalSiteInfo'); 

const writeOgAuthentication = async(accountKey, browser, page) => {
  const { id, pass, loginUrl } = await getLoginInfo(accountKey, 'og');
  
  try {
    await page.goto(loginUrl);
    await page.type('input[name="operatorId"]', id);
    await page.type('input[name="operatorPass"]', pass);
    await page.click('button[type="submit"]');
    const errorMessage = await page.$('body > section > div > div');

    if (errorMessage) {
      throw new Error('ログインエラー: ogのログインに失敗しました')

    }
  } catch (error) {
    throw error;

  } finally {
    await browser.close();

  }
}

module.exports = writeOgAuthentication;