const puppeteer = require('puppeteer');
const Ohp_sortCastData = require('./sortCastData/ohp_sortCastData');
const ch_sortCastData = require('./sortCastData/ch_sortCastData');
const ec_sortCastData = require('./sortCastData/ec_sortCastData');
const pl_sortCastData = require('./sortCastData/pl_sortCastData');
const fj_sortCastData = require('./sortCastData/fj_sortCastData');
const kj_sortCastData = require('./sortCastData/kj_sortCastData');
const kf_sortCastData = require('./sortCastData/kf_sortCastData');
const ok_sortCastData = require('./sortCastData/ok_sortCastData');
const og_sortCastData = require('./sortCastData/og_sortCastData');
const yg_sortCastData = require('./sortCastData/yg_sortCastData');

const sortCastDataPrograms = async(db, accountKey) => {
  const castRef = db.ref(`users/${accountKey}/add_girl/cast_data/`);
  const ordersRef = db.ref(`users/${accountKey}/add_girl/orders/`);

  //  realtimedatabaseからorderIdのリストを作成
  const parentSnapshot = await ordersRef.once('value');
  const parentSnapshotValue = parentSnapshot.val();
  const orderId = Object.keys(parentSnapshotValue);

  const logsRef = db.ref(`users/${accountKey}/logs/girls_log/`);
  let latestKey = null;
  const latestLogSnapshot = await logsRef.orderByKey().limitToLast(1).once('value');
  latestLogSnapshot.forEach((childSnapshot) => {
    latestKey = childSnapshot.key;
  });

  //  castRefからデータを取得
  const castRefSnapshot = await castRef.once('value');
  const castData = castRefSnapshot.val();
  
  //  並び替えの番号を0からではなく、1からにしておく
  for (let key in parentSnapshotValue) {
    if (parentSnapshotValue.hasOwnProperty(key)) {
      parentSnapshotValue[key] += 1;
    }
  }

  const allCastOrderData = {};
  const orderIdSet = new Set(orderId); // orderIdをSetに変換して検索を早くする
  for (const castName in castData) {
    const castId = String(castData[castName].profile.id);
    if (orderIdSet.has(castId)) {
      allCastOrderData[castName] = parentSnapshotValue[(castId)];
    }
  }

  // const browser = await puppeteer.launch({ headless: false });
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();

  page.on('dialog', async(dialog) => {
    await dialog.accept();
  });

  const sortFunctions = [
    Ohp_sortCastData,
    ch_sortCastData,
    ec_sortCastData,
    pl_sortCastData,
    fj_sortCastData,
    kj_sortCastData,
    kf_sortCastData,
    ok_sortCastData,
    og_sortCastData,
    yg_sortCastData
  ];

  try {
    for (const func of sortFunctions) {
      try {
        await func(accountKey, allCastOrderData, latestKey, page);
      
      } catch (error) {
        console.error(error.message);

      }
    }
  } finally {
    await browser.close();
    console.log('並び替え');

  }
}

module.exports = sortCastDataPrograms;