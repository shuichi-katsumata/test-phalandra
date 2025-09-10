const getLoginInfo = require('../setting/externalSiteInfo'); 

const writeEcAuthentication = async(accountKey, browser, page) => {
  const { id, pass, loginUrl } = await getLoginInfo(accountKey, 'ec');
  
  try {
    await page.goto(loginUrl);
    await page.type( '#form_email', id);
    await page.type('#form_password', pass);
    await page.click('#form_submit');
    const errorMessage = await page.$('body > div.main > div > div.row > div.col-md-3.login_form > form > div.error');

    if (errorMessage) {
      throw new Error('ログインエラー: ecのログインに失敗しました');

    }
  } catch (error) {
    throw error;

  } finally {
    await browser.close();

  }
}

module.exports = writeEcAuthentication;