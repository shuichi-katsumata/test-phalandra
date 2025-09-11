const getLoginInfo = require('../../setting/externalSiteInfo');
const setTimeout = require('node:timers/promises').setTimeout;

const exportCastScheduleToPl = async(db, accountKey, logIdAndCastName, dateList, page) => {
  const { id, pass, loginUrl } = await getLoginInfo(accountKey, 'pl');
  const globalLogId = Object.keys(logIdAndCastName)[0];
  const globalContentLogs = db.ref(`users/${accountKey}/logs/schedule_log/${globalLogId}/content_logs`);

  try {
    //  ログイン処理
    await page.goto(loginUrl);
    await page.type( 'input[name="id"]', id);
    await page.type('input[name="password"]', pass);
    await Promise.all([
      page.waitForNavigation({waitUntil: 'load'}),
      page.click('#form_submit > input[type="image"]'),

    ]);

    await Promise.all([
      page.waitForNavigation({waitUntil: 'load'}),
      page.click('#sidenavi-girl > ul > li:nth-child(2) > a'),
    
    ]);
    
    for (const [id, castName] of Object.entries(logIdAndCastName)) {

      //  ログ用
      const content_logs = db.ref(`users/${accountKey}/logs/schedule_log/${id}/content_logs`);
      
      try {
        //  女の子検索 
        const castItems = await page.$$('li.view_on');
        let castFound = false;

        for (const item of castItems) {

          const nameElement = await item.$('div.girlsList_right b');
          const nameText = await page.evaluate(el => el.innerText, nameElement);
          const scheduleBtn = await item.$('input[value="出勤"]');

          if (nameText === castName && scheduleBtn) {
            castFound = true;
            await scheduleBtn.click();
            await page.waitForNavigation({waitUntil: 'load'});
            break;

          } 
        }

        if (!castFound) {
          const castItems = await page.$$('li.view_off');
          let privateCastFound = false;

          for (const item of castItems) {
            const nameElement = await item.$('div.girlsList_right b');
            const nameText = await page.evaluate(el => el.innerText, nameElement);

            if (nameText === castName) {
              privateCastFound = true;
              await content_logs.push({
                pl: 'ぴゅあらば：非公開のため設定できません'

              });
              break;
            } 
          }

          if (!privateCastFound) {
            await content_logs.push({
              pl: 'ぴゅあらば：キャストが見つかりませんでした'

            });
          }
          continue;
        }

        //  出勤登録（14日分）
        let divIndex = 0;
        for (let i = 0; i < dateList.slice(0, 14).length; i++) {
          const dateStr = dateList[i];
          const dateFormat = dateStr.replace(/-/g, '');
          const submitBtn = await page.$('#shop_main > main > section:nth-child(4) > form > div:nth-child(3) > div:nth-child(2) > button');

          if (i === 7) {
            if (submitBtn) {
              await submitBtn.hover();
              await setTimeout(1000);
              await Promise.all([
                page.waitForNavigation({ waitUntil: 'networkidle2' }),
                submitBtn.click(),
              
              ]);

              const pagerBtn = await page.$(`a[href*="/shop/schedule/edit-week/date/${dateFormat}"]`);

              if (pagerBtn) {
                await pagerBtn.click();
                await page.waitForNavigation({waitUntil: 'load'});
                await setTimeout(2000);
                divIndex = 0;

              }
            }
          }
          
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
          
          const scheduleDivIndex = divIndex + 3;
          const scheduleElement = await page.$(`div[id*="schedule-"] div:nth-child(${scheduleDivIndex})`);
          const startTimeElement = await scheduleElement.$(`select[name*="[${dateFormat}][start_time]"]`);
          const endTimeElement = await scheduleElement.$(`select[name*="[${dateFormat}][end_time]"]`);
          const holidayCheckBtn = await scheduleElement.$(`input[name*="[${dateFormat}][is_day_off]"]`);
          const isChecked = await holidayCheckBtn.evaluate(el => el.checked);
          const resetBtn = await scheduleElement.$(`div:nth-child(2) button`);
          
          if (scheduleElement) {
            await scheduleElement.evaluate(el => el.scrollIntoView());
            if (status === 'working' && startTime !== '' && endTime !== '') {
              if (isChecked) {
                await resetBtn.click();

              }
              await startTimeElement.select(startTime);
              await endTimeElement.select(endTime);
              
            } else {
              if (!isChecked) {
                await holidayCheckBtn.evaluate(el => el.scrollIntoView());
                await holidayCheckBtn.evaluate(btn => btn.click());
                
              }
            }
          }
          if (i === 13) {
            if (submitBtn) {
              await submitBtn.hover();
              await setTimeout(1000);
              await Promise.all([
                page.waitForNavigation({ waitUntil: 'networkidle2' }),
                submitBtn.click(),
              
              ]);
            }
          }
          divIndex++;
        }
        
        await setTimeout(1000);
        await content_logs.push({
          pl: 'ぴゅあらば：スケジュール編集完了'

        });

        const girlsListLink = await page.$('#sidenavi-girl > ul > li:nth-child(2) > a');
        if (girlsListLink) {
          await girlsListLink.evaluate(el => el.scrollIntoView({ block: 'center' }));
          await setTimeout(2000);
          await girlsListLink.click();
          await page.waitForNavigation({waitUntil: 'load'});
          
        }
      } catch (error) {
        console.error(error.message);
        await content_logs.push({
          pl: 'ぴゅあらば：エラー！'
  
        });
      }
    }
  } catch (error) {
    console.error(error.message);
    await globalContentLogs.push({
      pl: 'ぴゅあらば：エラー！'
    });
    
  }
}

module.exports = exportCastScheduleToPl;