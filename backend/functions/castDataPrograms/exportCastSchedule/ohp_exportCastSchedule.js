const getLoginInfo = require('../../setting/externalSiteInfo');
const setTimeout = require('node:timers/promises').setTimeout;
const { formatTime } = require('../../../utils/timeUtils');

const exportCastScheduleToOhp = async(db, accountKey, logIdAndCastName, dateList, page) => {
  const { id, pass, loginUrl } = await getLoginInfo(accountKey, 'ohp');
  
  try {

    //  ログイン処理
    await page.goto(loginUrl);
    await page.type('input[name=id]', id);
    await page.type('input[name=password]', pass);
    await Promise.all([
      page.waitForNavigation({waitUntil: 'load'}),
      page.click('input[type=submit]'),
    ]);

    await Promise.all([
      page.waitForNavigation({waitUntil:'load'}),
      page.click('#g_navi > ul > li:nth-child(5) > a'),
    ]);
      
    for (const [id, castName] of Object.entries(logIdAndCastName)) {

      try {

        //  ログ用
        const content_logs = db.ref(`users/${accountKey}/logs/schedule_log/${id}/content_logs`);

        //  女の子検索
        const castSearch = await page.evaluate((castName) => {
          let castSearch = false;
          const listItems = document.querySelectorAll('li.ui-sortable-handle');

          listItems.forEach((item) => {
            const nameElement = item.querySelector('p.name > a');
            if (nameElement.textContent.trim() === castName) {
              const scheduleBtn = item.querySelector('p.attend > a');
              scheduleBtn.click();
              castSearch = true;

            }
          });
          return castSearch;

        }, castName);

        if (!castSearch) {
          await content_logs.push({
            ohp: 'オフィシャル：キャストが見つかりませんでした'
          });
          continue;

        }

        await page.waitForNavigation({waitUntil: 'load'});

        //  出勤登録
        for (const dateStr of dateList) {
          const schedulesRef = db.ref(`users/${accountKey}/add_girl/cast_data/${castName}/schedule_data/schedules/${dateStr}`);
          const snapshot = await schedulesRef.get();
          const schedule = snapshot.val();

          let startTime = '';
          let endTime = '';
          let status = '';

          if ( schedule ) {
            startTime = formatTime(schedule.startTime);
            endTime = formatTime(schedule.endTime);
            status = schedule.status;
          
          }
          
          const [year, month, day] = dateStr.split('-');
          const idStr = month.padStart(2, '0') + day.padStart(2, '0');

          await page.evaluate((idStr) => {
            const scheduleItems = document.getElementById(idStr);
            if ( scheduleItems ) {
              scheduleItems.click();
          
            }
          }, idStr);

          const popover = await page.waitForSelector('.popover.fade.top.in, .popover.show', {timeout: 3000});
          const startTimeElement = await popover.$('select:nth-child(1)');
          const endTimeElement = await popover.$('select:nth-child(2)');
          const scheduleType = await popover.$('select[name="schedule_type"]');
          const saveScheduleBtn = await popover.$('button.saveSchedule');
          const deleteScheduleBtn = await popover.$('button.deleteSchedule.schedule');  //  削除ボタン3つあるから気を付けるように

          if (status === 'working') {
            if (startTimeElement) {
              await startTimeElement.evaluate(el => el.scrollIntoView());
              if (startTime) {
                await startTimeElement.evaluate((el, time) => el.value = time, startTime);
              
              } else {
                await startTimeElement.evaluate((el) => el.selectedIndex = 0);
              
              }
            }

            if (endTimeElement) {
              if (endTime) {
                await endTimeElement.evaluate((el, time) => el.value = time, endTime);
              
              } else {
                await endTimeElement.evaluate((el) => el.selectedIndex = 0);
              
              }
            }

            if (saveScheduleBtn) {
              await saveScheduleBtn.evaluate(el => el.scrollIntoView());
              await setTimeout(1500); //  間を空けないとOHPのスクリプトが処理しきれない
              await saveScheduleBtn.click();
            
            }
          } else if (status === 'off') {

            if (scheduleType) {
              await scheduleType.evaluate(el => el.scrollIntoView());
              await scheduleType.evaluate((el) => el.value = '1');
            
            }
          } else {

            if (deleteScheduleBtn) {
              await deleteScheduleBtn.evaluate(el => el.scrollIntoView());
              await setTimeout(1500); //  間を空けないとOHPのスクリプトが処理しきれない
              await deleteScheduleBtn.click();
            
            }
          } 
        }
      
        await content_logs.push({
          ohp: 'オフィシャル：スケジュール編集完了'
        
        });
        
        await Promise.all([
          page.waitForNavigation({waitUntil:'load'}),
          page.click('#g_navi > ul > li:nth-child(4) > a'),
        
        ]);
      } catch(error) {
        await content_logs.push({
          ohp: 'オフィシャル：エラー！'
        
        });

        //  エラーが出たページによって女の子管理のセレクタが変わるので一度TOPに戻す
        await Promise.all([
          page.waitForNavigation({waitUntil:'load'}),
          page.click('#g_navi > ul > li:nth-child(1) > a'),
        
        ]);
        
        await Promise.all([
          page.waitForNavigation({waitUntil:'load'}),
          page.click('#g_navi > ul > li:nth-child(5) > a'),
        
        ]);
      }
    }
  } catch (error) {
    console.error(error.message);
    
  }
}

module.exports = exportCastScheduleToOhp;