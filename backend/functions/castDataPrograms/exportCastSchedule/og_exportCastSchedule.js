const getLoginInfo = require('../../setting/externalSiteInfo');
const setTimeout = require('node:timers/promises').setTimeout;

const exportCastScheduleToOg = async(db, accountKey, logIdAndCastName, dateList, page) => {
  const { id, pass, loginUrl } = await getLoginInfo(accountKey, 'og');

  try {
    //  ログイン処理
    await page.goto(loginUrl);
    await page.type('input[name="operatorId"]', id);
    await page.type('input[name="operatorPass"]', pass);
    await Promise.all([
      page.waitForNavigation({waitUntil:'load'}),
      page.click('button[type="submit"]')

    ]);
    
    await Promise.all([
      page.waitForNavigation({waitUntil:'load'}),
      page.click('body > section > nav > ul > li:nth-child(1) > ul > li:nth-child(9) > a')
    
    ]);

    const castProcessResults = [];
    const weeks = [dateList.slice(0, 7), dateList.slice(7, 14)];

    for (const week of weeks) {
      const castItems = await page.$$('tr');

      for (const [id, castName] of Object.entries(logIdAndCastName)) {
        let castFound = false;
      
        for (const item of castItems) {
          
          //  女の子検索
          const nameElement = await item.$('div.schedule_name');
          
          if (nameElement) {
            const nameText = await page.evaluate(el => el.innerText, nameElement);
            
            if (nameText === castName) {
              castFound = true;
              await nameElement.evaluate(el => el.scrollIntoView());

              //  出勤登録（7日分*2）
              for (const dateStr of week) {
                const [year, month, day] = dateStr.split('-');
                const dateFormat = `${month}${day}`;
                const schedulesRef = db.ref(`users/${accountKey}/add_girl/cast_data/${castName}/schedule_data/schedules/${dateStr}`);
                const snapshot = await schedulesRef.get();
                const schedule = snapshot.val();
                
                let startTime = '';
                let endTime = '';
                let status = '';

                if ( schedule ) {
                  if (schedule.startTime && schedule.startTime !== 0 ) {
                    startTime = schedule.startTime;

                  }
                  if (schedule.endTime && schedule.endTime !== 0 ) {
                    endTime = schedule.endTime;
                  
                  }
                  status = schedule.status;

                }
                
                const scheduleDateBox = await item.$(`td[id^="${dateFormat}"]`);

                if (scheduleDateBox) {
                  await scheduleDateBox.click();
                  await page.waitForFunction(() => {  //  スケジュール編集のポップアップが出るまで待つ
                    const el = document.querySelector('div.popover.fade.top.in');
                    return el;

                  });
                }
                    
                await page.waitForSelector('div.popover-content');
                const popupContents = await page.$('div.popover-content');
                const startTimeElement = await popupContents.$('select[name="scheduleMin"]');
                const endTimeElement = await popupContents.$('select[name="scheduleMax"]');
                const scheduleType = await popupContents.$('select[name="scheduleType"]');
                const submitBtn = await popupContents.$('button.btn.btn-sm.btn-primary.saveSchedule');

                
                if (popupContents) {
                  if (status === 'working' && startTime !== '' && endTime !== '') {
                    await startTimeElement.select(startTime);
                    await endTimeElement.select(endTime);

                  } else {
                    await scheduleType.select('1');

                  }
                  await setTimeout(1000);
                  await submitBtn.click();
          
                }
                await page.waitForFunction(() => {
                  const el = document.querySelector('div.popover.fade.top.in');
                  return !el;

                });
              }
            }
          }
        }
        if (week === weeks[1]) {
          castProcessResults.push({id, castFound});
          
        }
      }
      
      if (week === weeks[0]) {
        const pagerBtn = await page.$('div.schedule_head > p > a');
        await pagerBtn.evaluate(el => el.scrollIntoView());
        if (pagerBtn) {
          await pagerBtn.click();
          await page.waitForNavigation({ waitUntil: 'load' });

        }
      }
    }
    
    for (const {id, castFound} of castProcessResults) {
      //  ログ用
      const content_logs = db.ref(`users/${accountKey}/logs/schedule_log/${id}/content_logs`);
      if (castFound) {
        await content_logs.push({
          og: '雄琴ガイド：スケジュール編集完了'

        });
      } else {
        await content_logs.push({
        og: '雄琴ガイド：キャストが見つかりませんでした'

        });
      }
    }
  } catch (error) {
    for (const [id] of Object.entries(logIdAndCastName)) {
      const content_logs = db.ref(`users/${accountKey}/logs/schedule_log/${id}/content_logs`);
      await content_logs.push({
        og: '雄琴ガイド：エラー！'

      });
    }
  }
}

module.exports = exportCastScheduleToOg;