const puppeteer = require('puppeteer');
const deleteCastToOhp = require('./deleteCastData/ohp_deleteCast');
const deleteCastToCh = require('./deleteCastData/ch_deleteCast');
const deleteCastToEc = require('./deleteCastData/ec_deleteCast');
const deleteCastToPl = require('./deleteCastData/pl_deleteCast');
const deleteCastToFj = require('./deleteCastData/fj_deleteCast');
const deleteCastToKj = require('./deleteCastData/kj_deleteCast');
const deleteCastToKf = require('./deleteCastData/kf_deleteCast');
const deleteCastToOk = require('./deleteCastData/ok_deleteCast');
const deleteCastToOg = require('./deleteCastData/og_deleteCast');
const deleteCastToYg = require('./deleteCastData/yg_deleteCast');

const deleteCastDataPrograms = async(db, accountKey, removedCastRef) => {

  const removedCastProfileRef = removedCastRef.child('profile');
  const snapshot = await removedCastProfileRef.once('value');
  const removedCastData = snapshot.val();

  let latestKey = null;
  const logsRef = db.ref(`users/${accountKey}/logs/girls_log/`);
  const latestLogSnapshot = await logsRef.orderByKey().limitToLast(1).once('value');
  latestLogSnapshot.forEach((childSnapshot) => {
    latestKey = childSnapshot.key;
  });

  // const browser = await puppeteer.launch({ headless: false });
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();

  page.on('dialog', async(dialog) => {
    await dialog.accept();
  });

  const deleteFunctions = [
    deleteCastToOhp,
    deleteCastToCh,
    deleteCastToEc,
    deleteCastToPl,
    deleteCastToFj,
    deleteCastToKj,
    deleteCastToKf,
    deleteCastToOk,
    deleteCastToOg,
    deleteCastToYg,
  ];
  
  try {
    for (const func of deleteFunctions) {
      try {
        await func(accountKey, removedCastData, latestKey, page);

      } catch(error) {
        console.error(error.message);

      }
    }
  } finally {
    if (browser) {
      await browser.close();
    }
    console.log('削除');

  }
}

module.exports = deleteCastDataPrograms;