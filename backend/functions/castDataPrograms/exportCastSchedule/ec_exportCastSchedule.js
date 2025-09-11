const getLoginInfo = require('../../setting/externalSiteInfo');
const setTimeout = require('node:timers/promises').setTimeout;

const exportCastScheduleToEc = async(db, accountKey, logIdAndCastName, dateList, page) => {
  const { id, pass, loginUrl } = await getLoginInfo(accountKey, 'ec');
  const globalLogId = Object.keys(logIdAndCastName)[0];
  const globalContentLogs = db.ref(`users/${accountKey}/logs/schedule_log/${globalLogId}/content_logs`);

  try {

    //  ログイン処理
    await page.goto(loginUrl);
    await page.type( '#form_email', id);
    await page.type('#form_password', pass);
    await Promise.all([
      page.waitForNavigation({waitUntil:'load'}),
      page.click('#form_submit'),
    ]);
    
    await page.goto('https://ranking-deli.jp/admin/girlswork/');
    
    for (const [id, castName] of Object.entries(logIdAndCastName)) {

      //  ログ用
      const content_logs = db.ref(`users/${accountKey}/logs/schedule_log/${id}/content_logs`);

      try {

        //  女の子検索
        const castItems = await page.$$('ul.girls_schedule.clearfix');
        let castFound = false;

        for (const item of castItems) {
          const nameElement = await item.$('span.girls_name');
          const nameText = await page.evaluate(el => el.textContent.trim(), nameElement);

          if (nameText === castName) {
            castFound = true;
            await nameElement.evaluate(el => el.scrollIntoView());  //  チェックボックスを操作するために該当箇所までスクロールさせる

            //  出勤登録（7日分）
            for (let i = 0; i < dateList.slice(0, 7).length; i++) {

              const dateStr = dateList[i];
              const liIndex = i + 2;
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

              const scheduleDateBox = await item.$(`li:nth-child(${liIndex})`);
              const attendanceCheckbox = await scheduleDateBox.$('input.work_check');
              const selects = await scheduleDateBox.$$('select.starthour');

              if (scheduleDateBox) {
                const isChecked = await attendanceCheckbox.evaluate(el => el.checked);

                if (status === 'working' && startTime !== '' && endTime !== '') {
                  await selects[0].select(startTime);
                  await selects[1].select(endTime);
                  if (!isChecked) {
                    await attendanceCheckbox.evaluate(btn => btn.click()); //  DOM操作だとチェックが自動でついてくれないので

                  }
                } else {
                  if (isChecked) {
                    await attendanceCheckbox.evaluate(btn => btn.click());

                  }
                }
              }
            }
          }
        }

        if (!castFound) {
          await content_logs.push({
            ec: '駅ちか：キャストが見つかりませんでした'
          });
          continue;
          
        }
      
        await content_logs.push({
          ec: '駅ちか：スケジュール編集完了'

        });
      } catch(error) {
        console.error(error.message);
        await content_logs.push({
          ec: '駅ちか：エラー！'
        
        });
      }
    }

    const saveScheduleBtn = await page.$('#form_work_btn');
    
    //  出勤を一括登録する
    if (saveScheduleBtn) {
      await saveScheduleBtn.evaluate(btn => btn.click());

    }

    await setTimeout(5000);

  } catch (error) {
    console.error(error.message);
    await globalContentLogs.push({
      ec: '駅ちか：エラー！'
    });

  }
}

module.exports = exportCastScheduleToEc;