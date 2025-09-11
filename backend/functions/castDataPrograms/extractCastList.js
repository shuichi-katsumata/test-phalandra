const puppeteer = require('puppeteer');
const getLoginInfo = require('../setting/externalSiteInfo');

const extractCastList = async(accountKey) => {
  try {
    // const browser = await puppeteer.launch({ headless: false });
    const browser = await puppeteer.launch({
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    
    const page = await browser.newPage();
    const { id, pass, loginUrl } = await getLoginInfo(accountKey, 'ch');

    await page.goto(loginUrl);
    await page.type('input[style="font-family:tahoma;font-size: 20px;"]', id);
    await page.keyboard.press('Tab');
    await page.keyboard.type(pass);
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'load', timeout: 60000 }),
      page.click('body > div > form.oldLogin > table > tbody > tr:nth-child(2) > td > button'),
    ]);

    const castListPageLink = await page.$x("//a[normalize-space(text())='キャスト情報']");
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'load', timeout: 60000 }),
      castListPageLink[0].click(),
    ]);

    // 女の子の名前を収集
    const castData = await page.$$eval('div.galListData > h5', elements => {
      return elements.map(el => el.innerText);
    });

    await browser.close();

    // フロントエンドにデータを送信
    return castData;

  } catch (error) {
    console.error(error); // エラーをコンソールに表示
  }
};

// モジュールとしてエクスポート
module.exports = extractCastList;
