const puppeteer = require('puppeteer');
const writeToOhp_addGirl = require('./addCastData/ohp_AG');
const writeToCh_addGirl = require('./addCastData/ch_AG');
const writeToEc_addGirl = require('./addCastData/ec_AG');
const writeToPl_addGirl = require('./addCastData/pl_AG');
const writeToFj_addGirl = require('./addCastData/fj_AG');
const writeToKj_addGirl = require('./addCastData/kj_AG');
const writeToKf_addGirl = require('./addCastData/kf_AG');
const writeToOk_addGirl = require('./addCastData/ok_AG');
const writeToOg_addGirl = require('./addCastData/og_AG');
const writeToYg_addGirl = require('./addCastData/yg_AG');
const { downloadImageFromFirebaseStorage } = require('../setting/downloadImageFromFirebaseStorage');
const { cleanupTempFolder } = require('../setting/cleanupTempFolder');

const addCastDataPrograms = async(db, accountKey, castName) => {
  const castDataRef = db.ref(`users/${accountKey}/add_girl/cast_data/${castName}/profile`);
  const snapshot = await castDataRef.once('value');
  const castData = snapshot.val();
  const panelRef = db.ref(`users/${accountKey}/add_girl/cast_data/${castName}/profile/panel`);
  const storageFilePath = `users/${accountKey}/add_girl/${castName}`;

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

  const addFunctions = [
    // writeToOhp_addGirl,
    // writeToCh_addGirl,
    // writeToEc_addGirl,
    // writeToPl_addGirl,
    // writeToFj_addGirl,
    // writeToKj_addGirl,
    // writeToKf_addGirl,
    // writeToOk_addGirl,
    // writeToOg_addGirl,
    writeToYg_addGirl,
  ];
  
  try {
    for (const func of addFunctions) {
      try {
        await func(accountKey, castData, panelRef, latestKey, page);

      } catch (error) {
        console.error(error.message);

      }
    }
  } finally {
    await browser.close();

    //  ローカルフォルダ内の画像削除
    await cleanupTempFolder();
    console.log('追加');

  } 
}

module.exports = addCastDataPrograms;