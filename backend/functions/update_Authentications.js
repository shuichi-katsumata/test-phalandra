const writeOhpAuthentication = require('../functions/externalSite_auth/ohpAuthentication');
const writeChAuthentication = require('../functions/externalSite_auth/chAuthentication');
const writeEcAuthentication = require('../functions/externalSite_auth/ecAuthentication');
const writePlAuthentication = require('../functions/externalSite_auth/plAuthentication');
const writeFjAuthentication = require('../functions/externalSite_auth/fjAuthentication');
const writeKjAuthentication = require('../functions/externalSite_auth/kjAuthentication');
const writeKfAuthentication = require('../functions/externalSite_auth/kfAuthentication');
const writeOkAuthentication = require('../functions/externalSite_auth/okAuthentication');
const writeOgAuthentication = require('../functions/externalSite_auth/ogAuthentication');
const writeYgAuthentication = require('../functions/externalSite_auth/ygAuthentication');
const puppeteer = require('puppeteer');

const update_Authentications = async(accountKey, siteName) => {
  // const browser = await puppeteer.launch({ headless: false });
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();

  const siteFunctions = {
    ohp: writeOhpAuthentication,
    ch: writeChAuthentication,
    ec: writeEcAuthentication,
    pl: writePlAuthentication,
    fj: writeFjAuthentication,
    kj: writeKjAuthentication,
    kf: writeKfAuthentication,
    ok: writeOkAuthentication,
    og: writeOgAuthentication,
    yg: writeYgAuthentication,

  }

  await siteFunctions[siteName]?.(accountKey, browser, page);  //対象のsiteNameがあれば動く

}
module.exports = update_Authentications;