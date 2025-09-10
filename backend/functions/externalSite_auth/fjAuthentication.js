const getLoginInfo = require('../setting/externalSiteInfo'); 

const writeFjAuthentication = async(accountKey, browser, page) => {
  const { id, pass, loginUrl } = await getLoginInfo(accountKey, 'fj');

  try {
    await page.goto(loginUrl);
    await page.type('input[name=username]', id);
    await page.type('input[name=password]', pass);
    await page.click('#button');
    await page.waitForNavigation({waitUntil: 'load'});
    const errorMessage = await page.$('#agent_login > form > section > div > p.errorText.bold.red');

    if (errorMessage) {
      throw new Error('ログインエラー: fjのログインに失敗しました');
    }
  } catch (error) {
    throw error;

  } finally {
    await browser.close();

  }
}

module.exports = writeFjAuthentication;