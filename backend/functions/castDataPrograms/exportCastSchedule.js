const puppeteer = require('puppeteer');
const exportCastScheduleToOhp = require('./exportCastSchedule/ohp_exportCastSchedule');
const exportCastScheduleToCh = require('./exportCastSchedule/ch_exportCastSchedule.js');
const exportCastScheduleToEc = require('./exportCastSchedule/ec_exportCastSchedule.js');
const exportCastScheduleToPl = require('./exportCastSchedule/pl_exportCastSchedule.js')
const exportCastScheduleToFj = require('./exportCastSchedule/fj_exportCastSchedule.js');
const exportCastScheduleToKj = require('./exportCastSchedule/kj_exportCastSchedule.js');
const exportCastScheduleToKf = require('./exportCastSchedule/kf_exportCastSchedule.js');
const exportCastScheduleToOk = require('./exportCastSchedule/ok_exportCastSchedule.js');
const exportCastScheduleToOg = require('./exportCastSchedule/og_exportCastSchedule.js');
const exportCastScheduleToYg = require('./exportCastSchedule/yg_exportCastSchedule.js');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

const exportCastSchedule = async(db, accountKey, selectedCast) => {
  const today = new Date();
  const dbRef = db.ref('/');
  const updates = {};
  dayjs.extend(utc);
  dayjs.extend(timezone);
  const jpTime = dayjs().tz('Asia/Tokyo').format('YYYY-MM-DD HH:mm:ss');

  //  スケジュールログ登録
  const logIdAndCastName = {};
  for (const castName of selectedCast) {

    let id = today.getTime() + Math.floor(Math.random() * 10000);
    Object.assign(updates, {
      [`users/${accountKey}/logs/schedule_log/${id}`]: {
        content: `キャストスケジュール登録：${castName}`,
        registration_date: jpTime,
      },
    });

    logIdAndCastName[id] = castName;
  }

  await dbRef.update(updates);

  // const browser = await puppeteer.launch({ headless: false });
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();

  page.on('dialog', async(dialog) => {
    await dialog.accept();
  });

  const exportCastScheduleFunctions = [
    exportCastScheduleToOhp,
    exportCastScheduleToCh,
    exportCastScheduleToEc,
    exportCastScheduleToPl,
    exportCastScheduleToFj,
    exportCastScheduleToKj,
    exportCastScheduleToKf,
    exportCastScheduleToOk,
    exportCastScheduleToOg,
    exportCastScheduleToYg,
  ];

  try {

    today.setHours(today.getHours() + 9); //  +9で日本時間にする
    const dateList = Array.from({ length: 42 }, (_, i) => { //  42日分の日付を得る
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      return d.toISOString().split('T')[0];
    });

    for (const func of exportCastScheduleFunctions ) {
      try {

        await func(db, accountKey, logIdAndCastName, dateList, page);

      } catch(error) {

        console.error(error.message);

      }
    }
  } finally {
    
    await browser.close();
    console.log('スケジュール編集');

  }
}

module.exports = exportCastSchedule;