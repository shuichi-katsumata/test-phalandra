const getLoginInfo = require('../../setting/externalSiteInfo');

const exportCastScheduleToKj = async(db, accountKey, logIdAndCastName, dateList, page) => {
  const { id, pass, loginUrl } = await getLoginInfo(accountKey, 'kj');

  try {
    //  ログイン処理
    await page.goto(loginUrl);
    await page.type( '#email', id);
    await page.type('#password', pass);
    await Promise.all([
      page.waitForNavigation({waitUntil: 'load'}),
      page.click('input[name="login"]'),

    ]);

    const castListPageLink = await page.$('body > div.slidemenu.slidemenu-left > div.slidemenu-body > ul > li:nth-child(5) > a');

    await castListPageLink.click();
    await page.waitForSelector('div.panel.panel-default');
    
    for (const [id, castName] of Object.entries(logIdAndCastName)) {
      //  ログ用
      const content_logs = db.ref(`users/${accountKey}/logs/schedule_log/${id}/content_logs`);
      
      try {
        //  女の子検索 
        const castList = await page.$('div.panel.panel-default');
        const castItems = await castList.$$('div.btn-group');
        let castFound = false;

        for (const item of castItems) {
          const girlElement = await item.$('button');
          const nameText = await page.evaluate(el => el.innerText.split('\n'), girlElement);
          const foundName = nameText.find(el => el.includes(castName));
          
          if (foundName === castName) {
            castFound = true;
            const girlMenuBtn = await item.$('button.dropdown-toggle');
            
            if (girlMenuBtn) {
              await girlMenuBtn.click();
              const scheduleBtn = await item.$('a[href*="shp_girl_schedule_edit5"]');
              
              if (scheduleBtn) {
              await scheduleBtn.click();
              await page.waitForNavigation({waitUntil: 'load'});
              
              }
            }
            break;
          }
        }

        if (!castFound) {
          await content_logs.push({
            kj: '口コミ風俗情報局：キャストが見つかりませんでした'

          });
          continue;

        }

        //  出勤登録（14日分）
        for (const dateStr of dateList.slice(0, 14)) {
          const schedulesRef = db.ref(`users/${accountKey}/add_girl/cast_data/${castName}/schedule_data/schedules/${dateStr}`);
          const snapshot = await schedulesRef.get();
          const schedule = snapshot.val();

          let startTime = '';
          let endTime = '';
          let status = '';

          if ( schedule ) {
            if (schedule.startTime && schedule.startTime !== 0 ) {
              let [hour, min] =  schedule.startTime.split(':').map(Number);

              if (hour < 9) {
                startTime = '09:00:00';

              } else {
                startTime = schedule.startTime + ':00';
              }

            }
            if (schedule.endTime && schedule.endTime !== 0 ) {
              endTime = schedule.endTime + ':00';
            
            }
            status = schedule.status;

          }

          const dateFormat = dateStr.replace(/-/g, '');
          const startTimeElement = await page.$(`#day${dateFormat}_s`);
          const endTimeElement = await page.$(`#day${dateFormat}_e`);

          await startTimeElement.evaluate(el => el.scrollIntoView());
          
          if (status === 'working' && startTime !== '' && endTime !== '') {
            console.log(dateStr + ' ' + startTime);
            await startTimeElement.select(dateStr + ' ' + startTime);

            if (endTime === '24:00:00') {
              await endTimeElement.evaluate(el => el.selectedIndex = el.options.length - 1);

            } else {
              await endTimeElement.select(dateStr + ' ' + endTime);

            }
          } else {
            await startTimeElement.evaluate((el) => el.selectedIndex = 0);
            await endTimeElement.evaluate((el) => el.selectedIndex = 0);
            
          }
        }

        const submitBtn = await page.$('button.btn.btn-primary.btn_submit');

        if (submitBtn) {
          await submitBtn.click();
          await page.waitForNavigation({waitUntil: 'load'});
        
        }

        await content_logs.push({
          kj: '口コミ風俗情報局：スケジュール編集完了'

        });
      } catch(error) {
        await content_logs.push({
          kj: '口コミ風俗情報局：エラー！'
  
        });
      }
    }
  } catch (error) {
    console.error(error.message);
    
  }
}

module.exports = exportCastScheduleToKj;