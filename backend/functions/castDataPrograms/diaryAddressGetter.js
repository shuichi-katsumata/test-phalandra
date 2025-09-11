const puppeteer = require('puppeteer');
const ec_addressGetter = require('./diaryAddressGetter/ec_addressGetter');
const fj_addressGetter = require('./diaryAddressGetter/fj_addressGetter');
const kf_addressGetter = require('./diaryAddressGetter/kf_addressGetter');
const kj_addressGetter = require('./diaryAddressGetter/kj_addressGetter');
const og_addressGetter = require('./diaryAddressGetter/og_addressGetter');
const pl_addressGetter = require('./diaryAddressGetter/pl_addressGetter');
const yg_addressGetter = require('./diaryAddressGetter/yg_addressGetter');

const diaryAddressGetter = async(accountKey, castName) => {

  // const browser = await puppeteer.launch({ headless: false });
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  let ec, pl, fj, kj, kf, og, yg;

  try {
    ec = await ec_addressGetter(accountKey, castName, page);
    pl = await pl_addressGetter(accountKey, castName, browser, page); //  別タブも開くからbrowserを渡してる
    fj = await fj_addressGetter(accountKey, castName, page);
    kj = await kj_addressGetter(accountKey, castName, page);
    kf = await kf_addressGetter(accountKey, castName, page);
    og = await og_addressGetter(accountKey, castName, page);
    yg = await yg_addressGetter(accountKey, castName, page);
  
  } catch (error) {
    console.error(error.message);

  } finally {
    //  先の動作でブラウザが落ちた場合browser.close()がエラーになるので、tryに入れて安全にreturnまで行かせる
    try {
      await browser.close(); 
    
    } catch(error) {
      console.error(error.message);
    
    }
    return { ec, pl, fj, kj, kf, og, yg };
  
  }
};

// モジュールとしてエクスポート
module.exports = diaryAddressGetter;