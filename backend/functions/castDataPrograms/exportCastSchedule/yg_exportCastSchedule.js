const getLoginInfo = require('../../setting/externalSiteInfo');
const setTimeout = require('node:timers/promises').setTimeout;

const exportCastScheduleToYg = async(db, accountKey, logIdAndCastName, dateList, page) => {
  const { id, pass, loginUrl } = await getLoginInfo(accountKey, 'yg');

  try {
    //  ログイン処理
    await page.goto(loginUrl);
    await page.type('input[name="username"]', id);
    await page.type('input[name="password"]', pass);
    await Promise.all([
      page.waitForNavigation({waitUntil: 'load'}),
      page.click('input[type="submit"]')
    ]);

    await page.click('#menu > div > div > ul > li:nth-child(10) > a');
    await setTimeout(3000);
    const castProcessResults = [];
    const weeks = [dateList.slice(0, 7), dateList.slice(7, 14)];

    for (const week of weeks) {
      const frameHandle = await page.$('iframe.imain');
      const frame = await frameHandle.contentFrame();
      const castItems = await frame.$$('tr');

      for (const [id, castName] of Object.entries(logIdAndCastName)) {
        let castFound = false;
      
        for (const item of castItems) {
          
          //  女の子検索
          const nameElement = await item.$('td.touch-link > a');
          
          if (nameElement) {
            const nameText = await frame.evaluate(el => el.innerText.trim(), nameElement);
            
            if (nameText === castName) {
              castFound = true;
              await nameElement.evaluate(el => el.scrollIntoView());

              //  出勤登録（7日分*2）
              for (const dateStr of week) {
                const schedulesRef = db.ref(`users/${accountKey}/add_girl/cast_data/${castName}/schedule_data/schedules/${dateStr}`);
                const snapshot = await schedulesRef.get();
                const schedule = snapshot.val();

                let startHour = '';
                let startMinute = '';
                let endHour = '';
                let endMinute = '';
                let status = '';
                
                if ( schedule ) {
                  if (schedule.startTime && schedule.startTime !== 0 ) {
                    [startHour, startMinute] = schedule.startTime.split(':');

                  }
                  if (schedule.endTime && schedule.endTime !== 0 ) {
                    [endHour, endMinute] = schedule.endTime.split(':');
                  
                  }
                  status = schedule.status;

                }

                const dateFormat = dateStr.replace(/-/g, '');
                const startHourFormat = dateFormat + startHour;
                const endHourFormat = dateFormat + endHour
                const scheduleDateBox = await item.$(`a.link_fcb[href$="${dateFormat}/edit"]`);

                if (scheduleDateBox) {
                  await scheduleDateBox.click();
                  await frame.waitForFunction(() => {  //  スケジュール編集のポップアップが出るまで待つ
                    const el = document.querySelector('iframe.fancybox-iframe');
                    return el;

                  });
                }

                //  ポップアップもiframeなので
                const popupFrameHandle = await frame.$('iframe.fancybox-iframe');
                const popupFrame = await popupFrameHandle.contentFrame();
                const scheduleType = await popupFrame.$('#atwork_edit_status');
                const startHourElement = await popupFrame.$('#atwork_edit_start_hour');
                const startMinuteElement = await popupFrame.$('#atwork_edit_start_minute');
                const endHourElement = await popupFrame.$('#atwork_edit_end_hour');
                const endMinuteElement = await popupFrame.$('#atwork_edit_end_minute');
                const scheduleInputBtn = await popupFrame.$('#atwork_edit_submit');

                if (status === 'working' && schedule.startTime !== '' && schedule.endTime !== '') {
                  await scheduleType.select('ON_CLOSE');
                  await startHourElement.select(startHourFormat);
                  await startMinuteElement.select(startMinute);
                  
                  if (endHour === '24') {
                    const lastValue = await endHourElement.$eval('option:last-child', o => o.value);
                    await endHourElement.select(lastValue);

                  } else {
                    await endHourElement.select(endHourFormat);
                  
                  }
                  await endMinuteElement.select(endMinute);
                  
                } else {
                  await scheduleType.select('OFF');

                }
                await scheduleInputBtn.click();
                await frame.waitForFunction(() => {  //  スケジュール編集のポップアップが消えるまで待つ
                  const el = document.querySelector('iframe.fancybox-iframe');
                  return !el;

                });
                await setTimeout(1000);

              }
            }
          }
        }
        if (week === weeks[1]) {
          castProcessResults.push({id, castFound});
          
        }
      }
      await setTimeout(1000);
      if (week === weeks[0]) {
        const pagerBtn = await frame.$('button.link_pager.notbtn');
        
        if (pagerBtn) {
          await pagerBtn.click();
          await setTimeout(3000);

        }
      }
    }
    
    for (const {id, castFound} of castProcessResults) {
      //  ログ用
      const content_logs = db.ref(`users/${accountKey}/logs/schedule_log/${id}/content_logs`);
      if (castFound) {
        await content_logs.push({
          yg: '夜遊びガイド：スケジュール編集完了'

        });
      } else {
        await content_logs.push({
        yg: '夜遊びガイド：キャストが見つかりませんでした'

        });
      }
    }
  } catch (error) {
    console.error(error);

    for (const [id] of Object.entries(logIdAndCastName)) {
      const content_logs = db.ref(`users/${accountKey}/logs/schedule_log/${id}/content_logs`);
      await content_logs.push({
        yg: '夜遊びガイド：エラー！'

      });
    }
  }
}

module.exports = exportCastScheduleToYg;