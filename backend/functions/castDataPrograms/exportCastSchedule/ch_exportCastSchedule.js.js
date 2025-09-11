const getLoginInfo = require('../../setting/externalSiteInfo');

const exportCastScheduleToCh = async(db, accountKey, logIdAndCastName, dateList, page) => {
  const { id, pass, loginUrl } = await getLoginInfo(accountKey, 'ch');
  const globalLogId = Object.keys(logIdAndCastName)[0];
  const globalContentLogs = db.ref(`users/${accountKey}/logs/schedule_log/${globalLogId}/content_logs`);

  
  try {

    //  ログイン処理
    await page.goto(loginUrl);
    await page.type('input[style="font-family:tahoma;font-size: 20px;"]', id); // id,password共に、同じnameの物がdisplay:noneで隠されていてそっちに反応してしまうので、styleで指定
    await page.keyboard.press('Tab');
    await page.keyboard.type(pass);
    await Promise.all([
      page.waitForNavigation({waitUntil:'load'}),
      page.click('body > div > form.oldLogin > table > tbody > tr:nth-child(2) > td > button'),

    ]);

    const castListPageLink = await page.$x("//a[normalize-space(text())='キャスト情報']");
    //  女の子情報タブをクリック
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'load' }),
      castListPageLink[0].click(),
    
    ]);

    for (const [id, castName] of Object.entries(logIdAndCastName)) {

      //  ログ用
      const content_logs = db.ref(`users/${accountKey}/logs/schedule_log/${id}/content_logs`);
      
      try {

        //  女の子検索
        const castSearch = await page.evaluate((castName) => {
          let castSearch = false;
          const listItems = document.querySelectorAll('#list > li');
          listItems.forEach((item) => {
            const nameElement =item.querySelector('div.galListData > h5');
            if (nameElement.textContent.trim() === castName) {
              const scheduleBtn = item.querySelector('div.galDataForm > input[type=button]:nth-child(2)');
              
              scheduleBtn.click();
              castSearch = true;
            
            }
          });
          return castSearch;
        
        }, castName);

        if (!castSearch) {
          await content_logs.push({
            ch: 'シティヘブン：キャストが見つかりませんでした'
          
          });
          continue;
        
        }

        await page.waitForNavigation({waitUntil: 'load'});

        await Promise.all([
          page.waitForNavigation({waitUntil:'load'}),
          page.click('#shukkinShiftTable > tbody > tr.time > td.girl-thum > a'),
        
        ]);

        //  出勤登録
        for (let i = 0; i < dateList.length; i++) {
          const dateStr = dateList[i];
          const schedulesRef = db.ref(`users/${accountKey}/add_girl/cast_data/${castName}/schedule_data/schedules/${dateStr}`);
          const snapshot = await schedulesRef.get();
          const schedule = snapshot.val();

          let startTime = '';
          let endTime = '';
          let status = '';
          
          if ( schedule ) {
            if (schedule.startTime && schedule.startTime !== 0 ) {
              startTime = schedule.startTime.replace(/:/, '');

            }
            if (schedule.endTime && schedule.endTime !== 0 ) {
              endTime = schedule.endTime.replace(/:/, '');
              
            }
            status = schedule.status;

          }

          const idStr = dateStr.replace(/-/g, '');
          let scheduleDateBox = await page.$(`#shift_type_${idStr}`);
          const nextMonthLink = await page.$('a[title="次の月"]');

          if (scheduleDateBox) {
            await scheduleDateBox.click();

          } else {
            if (nextMonthLink) {
              await Promise.all([
                page.waitForNavigation({waitUntil:'load', timeout: 60000}),
                nextMonthLink.click()

              ]);
              scheduleDateBox = await page.$(`#shift_type_${idStr}`);
              if (scheduleDateBox) {
                await scheduleDateBox.click();
              } else {
                continue;

              }
            }
          }

          const startTimeElement = await page.$('#edit_start_time');
          const endTimeElement = await page.$('#edit_end_time');
          const offBtn = await page.$('#absentCheck');
          const undecidedBtn = await page.$('#form_dlg > div.editMidBox.clearfix > div.resetBtn > a');
          const saveScheduleBtn = await page.$('.submitBtn a');
          const deleteScheduleBtn = await page.$('.resetBtn a');

          if (deleteScheduleBtn) {  //  休み登録されてるとクリックできない部分もあるので、とりあえずリセット
            await deleteScheduleBtn.click();
          
          }

          if (status === 'working') {
            if (startTimeElement) {
              if (startTime && startTime !== 0) {
                await startTimeElement.evaluate((el, time) => el.value = time, startTime);
              
              } else {
                await startTimeElement.evaluate((el) => el.selectedIndex = 0);
              
              }
            }

            if (endTimeElement && endTime !== 0) {
              if (endTime) {
                if (endTime === '2400') {
                  await endTimeElement.evaluate((el) => el.value = '2359');
              
                } else {
                  await endTimeElement.evaluate((el, time) => el.value = time, endTime);
              
                }
              } else {
                await endTimeElement.evaluate((el) => el.selectedIndex = 0);
              
              }
            }
          } else if ( i < 7 && ['unset', null].includes(status) ) {
            if (offBtn) {
              await offBtn.click();
            
            }
          } else if (status === 'off') {
            if (offBtn) {
              await offBtn.click();
            
            }
          } else {
            if (undecidedBtn) {
              await undecidedBtn.click();
            
            }
          }
          
          if (saveScheduleBtn) {
            await saveScheduleBtn.click();
          
          }
        }

        const castListPageLink2 = await page.$x("//a[normalize-space(text())='キャスト情報']");
        //  女の子情報タブをクリック
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'load' }),
          castListPageLink2[0].click(),
        
        ]);

        await content_logs.push({
          ch: 'シティヘブン：スケジュール編集完了'
        
        });
      } catch(error) {

        console.error(error.message);
        await content_logs.push({
          ch: 'シティヘブン：エラー！'
        
        });

        const castListPageLink2 = await page.$x("//a[normalize-space(text())='キャスト情報']");
        //  女の子情報タブをクリック
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'load' }),
          castListPageLink2[0].click(),
        
        ]);
      }
    }
  } catch (error) {
    console.error(error.message);
    await globalContentLogs.push({
      ch: 'シティヘブン：エラー！'
    });
    
  }
}

module.exports = exportCastScheduleToCh;