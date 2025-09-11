const getLoginInfo = require('../../setting/externalSiteInfo');
const setTimeout = require('node:timers/promises').setTimeout;

const exportCastScheduleToOk = async(db, accountKey, logIdAndCastName, dateList, page) => {
  const { id, pass, loginUrl } = await getLoginInfo(accountKey, 'ok');

  try {
    //  ログイン処理
    await page.goto(loginUrl);
    await page.type('input[name="id"]', id);
    await page.type('input[name="password"]', pass);
    await page.click('input[name="login_req"]');
    await setTimeout(2000);
    
    await page.click('#container > div.menu > ul > li:nth-child(4) > a');
    await setTimeout(2000);
    
    const castProcessResults = [];
    const weeks = [dateList.slice(0, 7), dateList.slice(7, 14)];

    for (const week of weeks) {
      await setTimeout(1000);

      await page.evaluate(() => {
        const sideMenu = document.querySelector('#container > div.menu');
        if (sideMenu) {
          sideMenu.style.display = 'none';

        }
      })

      const castItems = await page.$$('tr');

      for (const [id, castName] of Object.entries(logIdAndCastName)) {
        let castFound = false;
        for (const item of castItems) {
          //  女の子検索
          const nameElement = await item.$('td:first-child');
          
          if (nameElement) {
            const nameText = await page.evaluate(el => el.innerText.trim(), nameElement);
            
            if (nameText === castName) {
              castFound = true;
              //  出勤登録（7日分*2）
              for (const dateStr of week) {
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
                
                const startTimeElement = await item.$(`select[name^="${dateStr}"][name$="_start"]`);  //  ^=で前方一致、$=で後方一致
                const endTimeElement = await item.$(`select[name^="${dateStr}"][name$="_end"]`);
                const attendCheckBtn = await item.$(`input[name^="${dateStr}"][name$="_attend"]`);
                const isChecked = await page.evaluate(el => el.checked, attendCheckBtn);
                const scheduleInputBtn = await item.$(`div[data-date="${dateStr}"]`);

                if (status === 'working' && startTime !== '' && endTime !== '') {
                  await startTimeElement.evaluate(el => el.scrollIntoView({ block: 'center' }));
                  if (!isChecked) {
                    await scheduleInputBtn.evaluate(el => el.scrollIntoView({ block: 'center' }));
                    
                    await scheduleInputBtn.evaluate(el => {
                      el.scrollIntoView({ block: 'center' });
                      el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
                      el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
                      el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
                      el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                    
                    });
                    
                    await page.waitForFunction(el => {
                      const td = el.closest('td');
                      if (!td) return false;
                      const bg = window.getComputedStyle(td).backgroundColor;
                      return bg === 'rgb(255, 145, 181)'; 
                    }, { timeout: 5000 }, scheduleInputBtn);
                  
                  }
                  
                  await page.evaluate((el, value) => {
                    el.value = value;
                    el.dispatchEvent(new Event('input', { bubbles: true }));
                    el.dispatchEvent(new Event('change', { bubbles: true }));
                    el.dispatchEvent(new Event('blur', { bubbles: true }));
                  }, startTimeElement, startTime);

                  if (endTime === '24:00') {
                    await endTimeElement.evaluate(el => el.scrollIntoView({ block: 'center' }));
                    await page.evaluate((el) => {
                      el.value = 'LAST';
                      el.dispatchEvent(new Event('input', { bubbles: true }));
                      el.dispatchEvent(new Event('change', { bubbles: true }));
                      el.dispatchEvent(new Event('blur', { bubbles: true }));
                    
                    }, endTimeElement);  
                  } else {
                    await endTimeElement.evaluate(el => el.scrollIntoView({ block: 'center' }));
                    
                    await page.evaluate((el, value) => {
                      el.value = value;
                      el.dispatchEvent(new Event('input', { bubbles: true }));
                      el.dispatchEvent(new Event('change', { bubbles: true }));
                      el.dispatchEvent(new Event('blur', { bubbles: true }));
                    
                    }, endTimeElement, endTime);
                  }
                  setTimeout(500);
    
                } else {
                  await startTimeElement.evaluate(el => el.scrollIntoView({ block: 'center' }));
                  if (isChecked) {
                    await scheduleInputBtn.evaluate(el => el.scrollIntoView({ block: 'center' }));
                    await scheduleInputBtn.evaluate(el => {
                      el.scrollIntoView({ block: 'center' });
                      el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
                      el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
                      el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
                      el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                    
                    });
                    
                    await page.waitForFunction(el => {
                      const td = el.closest('td');  //  親要素のtd
                      if (!td) return false;
                      const bg = window.getComputedStyle(td).backgroundColor;
                      return bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent'; 
                    
                    }, { timeout: 5000 }, scheduleInputBtn);
                  }
                  
                  await page.evaluate((el) => {
                    el.value = '00:00';
                    el.dispatchEvent(new Event('input', { bubbles: true }));
                    el.dispatchEvent(new Event('change', { bubbles: true }));
                    el.dispatchEvent(new Event('blur', { bubbles: true }));
                  }, startTimeElement);

                  await endTimeElement.evaluate(el => el.scrollIntoView({ block: 'center' }));
                  
                  await page.evaluate((el) => {
                    el.value = '00:00';
                    el.dispatchEvent(new Event('input', { bubbles: true }));
                    el.dispatchEvent(new Event('change', { bubbles: true }));
                    el.dispatchEvent(new Event('blur', { bubbles: true }));
                  }, endTimeElement);
                  setTimeout(500);
                
                }
                await setTimeout(500);

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
        const pagerBtn = await page.$('input[value="次の一週間"]');
        if (pagerBtn) {
          await pagerBtn.evaluate(el => el.scrollIntoView());
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
          ok: '雄琴協会サイト：スケジュール編集完了'

        });
      } else {
        await content_logs.push({
        ok: '雄琴協会サイト：キャストが見つかりませんでした'

        });
      }
    }
  } catch (error) {
    console.error(error.message);
    for (const [id] of Object.entries(logIdAndCastName)) {
      const content_logs = db.ref(`users/${accountKey}/logs/schedule_log/${id}/content_logs`);
      await content_logs.push({
        ok: '雄琴協会サイト：エラー！'

      });
    }
  }
}

module.exports = exportCastScheduleToOk;