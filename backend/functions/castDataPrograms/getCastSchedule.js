const { db } = require('../../utils/firebaseUtils');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const puppeteer = require('puppeteer');
const getLoginInfo = require('../setting/externalSiteInfo');
const importCastSchedulesToFirebase = require('./importCastSchedulesToFirebase');

const getCastSchedule = async(accountKey, selectedCast) => {

  // const browser = await puppeteer.launch({ headless: false });
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  const { id, pass, loginUrl } = await getLoginInfo(accountKey, 'ohp');
  dayjs.extend(utc);
  dayjs.extend(timezone);
  const jpTime = dayjs().tz('Asia/Tokyo').format('YYYY-MM-DD HH:mm:ss');

  
  try {
    //  ログイン
    await page.goto(loginUrl);
    await page.type('input[name=id]', id);
    await page.type('input[name=password]', pass);
    await Promise.all([
      page.waitForNavigation({waitUntil: 'load'}),
      page.click('input[type=submit]'),
    ]);

    // 女の子管理タブをクリック 
    await Promise.all([
      page.waitForNavigation({waitUntil:'load'}),
      page.click('#g_navi > ul > li:nth-child(5) > a'),
    ]);

    //  女の子情報収集
    for (let index = 0; index < selectedCast.length; index++) {
      
      let logId = new Date().getTime();
      db.ref(`users/${accountKey}/logs/schedule_log/${logId}`).set({
        content: `キャストスケジュール取り込み：${selectedCast[index]}`,
        registration_date: jpTime,

      });
      
      // 女の子を検索(非公開の女の子は出勤変更できないよ)
      const found = await page.evaluate((selectedCast) => {
        const listItems = document.querySelectorAll('li.ui-sortable-handle');
  
        for (const item of listItems) {
          const  nameElement = item.querySelector('p.name > a');
          if (nameElement.textContent.trim() === selectedCast) {
            const attendBtn = item.querySelector('p.attend > a');
            attendBtn.click();
            return true;
          }
        }
        return false;

      }, selectedCast[index]);

      if (!found) {
        await db.ref(`users/${accountKey}/logs/schedule_log/${logId}/content_logs`).push({
          phalandra: 'キャストが見つかりませんでした。',
        
        });
        continue;
      
      }

      await page.waitForNavigation({waitUntil: 'load'});
  
      const schedules = await page.evaluate(() => {
  
        const extractTimes = (timeStr) => {
          const match = timeStr.match(/(\d{1,2}:\d{2})〜(\d{1,2}:\d{2})/);
          if (!match) return { startTime: 0, endTime: 0 };
          const startTime = match[1];
          const endTime = match[2];
          return { startTime, endTime };
        }

        return Array.from(document.querySelectorAll('span.time')).slice(2).map(el => {  // 入力補助にも'span.time'が2つあるので、slice(2)でそれを省いている
          const time = el.textContent.replace(/\s+/g, '');
          const offElement = el.closest('td.day')?.querySelector('.scheduleStatus.offDay');

          let status = 'working';

          if (offElement && getComputedStyle(offElement).display === 'block') {
            status = 'off';
          } else if (time === '〜') {
            status = 'unset';
          }
          const { startTime, endTime } = extractTimes(time);
          return { startTime, endTime, status }
        });
      });

      await importCastSchedulesToFirebase(db, dayjs, accountKey, selectedCast[index], schedules, logId);  //  realtimedatabase登録処理

      await Promise.all([
        page.waitForNavigation({waitUntil:'load'}),
        page.click('#g_navi > ul > li:nth-child(4) > a'),
      ]);

    }

  } catch (error) {
    console.error(error); // エラーをコンソールに表示

  } finally {
    if (browser) await browser.close();

  }
};
// モジュールとしてエクスポート
module.exports = getCastSchedule;