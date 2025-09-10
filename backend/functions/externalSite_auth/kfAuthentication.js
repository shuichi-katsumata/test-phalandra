const getLoginInfo = require('../setting/externalSiteInfo'); 

const writeKfAuthentication = async(accountKey, browser, page) => {
  const { id, pass, loginUrl } = await getLoginInfo(accountKey, 'kf');
  
  try {
    await page.goto(loginUrl);
    await page.type('#login_id', id);
    await page.type('#login_password', pass);
    await page.click('#ShopShopShopsLoginForm > div.adminLogin > div > input');
    const errorMessage = await page.$('#ShopShopShopsLoginForm > div.adminLogin > div.mtp__errorfield');

    if (errorMessage) {
      throw new Error('ログインエラー: kfのログインに失敗しました');
    }
  } catch (error) {
    throw error;

  } finally {
    await browser.close();

  }
}

module.exports = writeKfAuthentication;