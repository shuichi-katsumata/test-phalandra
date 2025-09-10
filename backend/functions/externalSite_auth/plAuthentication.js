const getLoginInfo = require('../setting/externalSiteInfo'); 

const writePlAuthentication = async(accountKey, browser, page) => {
  const { id, pass, loginUrl } = await getLoginInfo(accountKey, 'pl');

  try {
    await page.goto(loginUrl);
    await page.type( 'input[name="id"]', id);
    await page.type('input[name="password"]', pass);
    await page.click('#form_submit > input[type="image"]');
    const errorMessage = await page.$('#login_contBox > div > font');

    if (errorMessage) {
      throw new Error('ログインエラー: plのログインに失敗しました');
    }
  } catch (error) {
    throw error;
    
  } finally {
    await browser.close();

  }
}

module.exports = writePlAuthentication;