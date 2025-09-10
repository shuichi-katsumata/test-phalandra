const puppeteer = require('puppeteer');
const editCastToOhp = require('./editCastData/ohp_editCastData');
const editCastToCh = require('./editCastData/ch_editCastData');
const editCastToEc = require('./editCastData/ec_editCastData');
const editCastToPl = require('./editCastData/pl_editCastData');
const editCastToFj = require('./editCastData/fj_editCastData');
const editCastToKj = require('./editCastData/kj_editCastData');
const editCastToKf = require('./editCastData/kf_editCastData');
const editCastToOk = require('./editCastData/ok_editCastData');
const editCastToOg = require('./editCastData/og_editCastData');
const editCastToYg = require('./editCastData/yg_editCastData');
const { downloadImageFromFirebaseStorage } = require('../setting/downloadImageFromFirebaseStorage');
const { cleanupTempFolder } = require('../setting/cleanupTempFolder');

const editCastDataPrograms = async(db, accountKey, castName) => {
  const storageFilePath = `users/${accountKey}/add_girl/${castName}`;
  const castDataRef = db.ref(`users/${accountKey}/add_girl/cast_data/${castName}/profile`);
  const panelRef = db.ref(`users/${accountKey}/add_girl/cast_data/${castName}/profile/panel`);

  const snapshot = await castDataRef.once('value');
  const castData = snapshot.val();

  //  ログ用
  let latestKey = null;
  const logsRef = db.ref(`users/${accountKey}/logs/girls_log/`);
  const latestLogSnapshot = await logsRef.orderByKey().limitToLast(1).once('value');
  latestLogSnapshot.forEach((childSnapshot) => {
    latestKey = childSnapshot.key;
  });

  const browser = await puppeteer.launch({ headless: false });
  // const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();

  page.on('dialog', async(dialog) => {
    await dialog.accept();
  });

  await downloadImageFromFirebaseStorage(accountKey, storageFilePath, castData);

  const editFunctions = [
    // editCastToOhp,
    // editCastToCh,
    // editCastToEc,
    editCastToPl,
    // editCastToFj,
    // editCastToKj,
    // editCastToKf,
    // editCastToOk,
    // editCastToOg,
    // editCastToYg
  ];

  try {
    for (const func of editFunctions ) {
      try {
        await func(accountKey, castData, panelRef, latestKey, page);

      } catch(error) {
        console.error(error.message);

      }
    }
  } finally {
    await browser.close();

    //  ローカルフォルダ内の画像削除
    await cleanupTempFolder();
    console.log('編集');

  }
}

module.exports = editCastDataPrograms;