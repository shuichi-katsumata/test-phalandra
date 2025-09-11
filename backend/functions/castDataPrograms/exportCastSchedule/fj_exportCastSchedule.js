const getLoginInfo = require('../../setting/externalSiteInfo');
const setTimeout = require('node:timers/promises').setTimeout;

const exportCastScheduleToFj = async(db, accountKey, logIdAndCastName, dateList, page) => {
  const { id, pass, loginUrl } = await getLoginInfo(accountKey, 'fj');
  const globalLogId = Object.keys(logIdAndCastName)[0];
  const globalContentLogs = db.ref(`users/${accountKey}/logs/schedule_log/${globalLogId}/content_logs`);
  
  try {

    //  ログイン処理
    await page.goto(loginUrl);
    await page.type('input[name=username]', id);
    await page.type('input[name=password]', pass);
    await Promise.all([
      page.waitForNavigation({waitUntil: 'load'}),
      page.click('#button'),

    ]);

    const castListPageLink = await page.$('#wrapper > div > div.leftColumn > nav > div:nth-child(8) > div > ul > li:nth-child(3) > a');
    await castListPageLink.click();
    await page.waitForSelector('#ul_sortable1 > li'); 
    
    for (const [id, castName] of Object.entries(logIdAndCastName)) {
      //  ログ用
      const content_logs = db.ref(`users/${accountKey}/logs/schedule_log/${id}/content_logs`);
    
      //  女の子検索  
      try {
        const castItems = await page.$$('li.ui-state-default.ui-sortable-handle');
        let castFound = false;

        for (const item of castItems) {
          const nameElement = await item.$('em.girl_name');
          const nameText = await page.evaluate(el => el.textContent.trim(), nameElement);

          if (nameText === castName) {
            castFound = true;
            await nameElement.evaluate(el => el.scrollIntoView());
            const scheduleBtn = await item.$('input.attend');

            if (scheduleBtn) {
              scheduleBtn.click();

            }
            break;
          }
        }

        if (!castFound) {
          await content_logs.push({
            fj: '風俗じゃぱん：キャストが見つかりませんでした'

          });
          continue;
        }

        await page.waitForFunction(() => {  //  スケジュール編集のポップアップが出るまで待つ
          const el = document.querySelector('div.popup_schedule');
          return el && window.getComputedStyle(el).display ==='block';
        
        });

        //  出勤登録（14日分）
        for (let i = 0; i < dateList.slice(0, 14).length; i++) {

          const dateStr = dateList[i];
          const tdIndex = (i % 7) + 2;
          const trSelector = i < 7 ? 'tr#js_this' : 'tr#js_next';
          const schedulesRef = db.ref(`users/${accountKey}/add_girl/cast_data/${castName}/schedule_data/schedules/${dateStr}`);
          const snapshot = await schedulesRef.get();
          const schedule = snapshot.val();

          let startTime = '';
          let endTime = '';
          let status = '';
          
          if (i === 7) {
            const pagerBtn = await page.$('span.next');
            if (pagerBtn) {
              await pagerBtn.evaluate(el => el.scrollIntoView());
              await pagerBtn.click();
              await setTimeout(1000);
        
            }
          }

          if ( schedule ) {
            if (schedule.startTime && schedule.startTime !== 0 ) {
              startTime = schedule.startTime.replace(/:/, '');

            }
            if (schedule.endTime && schedule.endTime !== 0 ) {
              endTime = schedule.endTime.replace(/:/, '');
            
            }
            status = schedule.status;

          }

          const scheduleDateBox = await page.$(`${trSelector} td:nth-child(${tdIndex})`);
          const scheduleTimeElements = await scheduleDateBox.$$('div.selectWrap');
          const startTimeElement = await scheduleTimeElements[0].$('#form_time');
          const endTimeElement = await scheduleTimeElements[1].$('#form_time');
          const resetBtn = await scheduleDateBox.$('span.reset');

          if (scheduleDateBox) {
            if (status === 'working' && startTime !== '' && endTime !== '') {
              await startTimeElement.evaluate(el => el.scrollIntoView());
              await startTimeElement.click();
              await startTimeElement.select(startTime);
              
              await endTimeElement.evaluate(el => el.scrollIntoView());
              await endTimeElement.click();
              await endTimeElement.select(endTime);
              await setTimeout(500);

            } else {
              if (resetBtn) {  //  一度スケジュールをリセット
                await resetBtn.evaluate(el => el.scrollIntoView());
                await resetBtn.click();
                await setTimeout(500);
                
              } 
            }
          }
        }

        await setTimeout(1000);
        await page.click('#wrapper > div > div.mainColumn > div.popup_schedule > div:nth-child(5)');  //  閉じるボタンを押す
        
        await content_logs.push({
          fj: '風俗じゃぱん：スケジュール編集完了'

        });
      } catch (error) {
        await content_logs.push({
          fj: '風俗じゃぱん：エラー！'
          
        });
      }
    }
  } catch (error) {
    console.error(error.message);
    await globalContentLogs.push({
      fj: '風俗じゃぱん：エラー！'
    });
    
  }
}

module.exports = exportCastScheduleToFj;