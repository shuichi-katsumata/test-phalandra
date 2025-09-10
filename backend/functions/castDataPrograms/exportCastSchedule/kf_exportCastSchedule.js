const { timeout } = require('puppeteer-core');
const getLoginInfo = require('../../setting/externalSiteInfo');
const { default: puppeteer } = require('puppeteer');

const exportCastScheduleToKf = async(db, accountKey, logIdAndCastName, dateList, page) => {
  const { id, pass, loginUrl } = await getLoginInfo(accountKey, 'kf');

  try {
    //  ログイン処理
    await page.goto(loginUrl);
    await page.type('#login_id', id);
    await page.type('#login_password', pass);
    await Promise.all([
      page.waitForNavigation({waitUntil: 'load'}),
      page.click('#ShopShopShopsLoginForm > div.adminLogin > div > input'),

    ]);

    const castSchedulePageLink = await page.$('a[href*="/shopadmin/schedule"]');
    await castSchedulePageLink.click();
    await page.waitForSelector('#scheduleAdmin__items__id');
    
    for (const [id, castName] of Object.entries(logIdAndCastName)) {
      //  ログ用
      const content_logs = db.ref(`users/${accountKey}/logs/schedule_log/${id}/content_logs`);
      
      try {
        let castFound = false;
        //  出勤登録（14日分）
        for (let i = 0; i < dateList.slice(0, 14).length; i++) {
          const dateStr = dateList[i];
          const pagerBtn = await page.$('li.pagination__btn svg path[d*="6-6"]');
          if (i === 7) {
            if (pagerBtn) { //  Promise.allだと不安定になる
              await pagerBtn.click();
              await page.waitForSelector('#scheduleAdmin__items__id');
            
            }
          }

          //  女の子検索 
          const castItems = await page.$$('li[id^="data_"]');
          let foundCastElement = false;

          for (const item of castItems) {
            const girlElement = await item.$('div.scheduleAdmin__name');
            const nameText = await page.evaluate(el => el.innerText.trim(), girlElement);

            if (nameText === castName) {
              foundCastElement = item;
              castFound = true;
              break;

            }
          }
          
          if (!castFound) {
            await content_logs.push({
              kf: '京風：キャストが見つかりませんでした'
  
            });
            continue;
  
          }

          const schedulesRef = db.ref(`users/${accountKey}/add_girl/cast_data/${castName}/schedule_data/schedules/${dateStr}`);
          const snapshot = await schedulesRef.get();
          const schedule = snapshot.val();

          let startTime = '';
          let endTime = '';
          let status = '';

          if ( schedule ) {
            if (schedule.startTime && schedule.startTime !== 0 ) {
              startTime = schedule.startTime + ':00';

            }
            if (schedule.endTime && schedule.endTime !== 0 ) {
              endTime = schedule.endTime + ':00';
            
            }
            status = schedule.status;

          }

          const scheduleDateBox = await foundCastElement.$(`[data-date="${dateStr}"]`);

          if (scheduleDateBox) {
            try {
              await scheduleDateBox.click();
              
              await page.waitForFunction(() => {  //  スケジュール編集のポップアップが出るまで待つ
                const el = document.querySelector('#popup__id');
                return el && !el.classList.contains('popup__invisible');

              }, {timeout: 2000});

              await page.waitForSelector('div.schedulePopup');
              const popupContents = await page.$('div.schedulePopup');
              const startTimeElement = await popupContents.$('#GirlScheduleStart');
              const endTimeElement = await popupContents.$('#GirlScheduleEnd');
              const submitBtn = await popupContents.$('div.popup__submit[data-submit="girlScheduleEditForm"]');
              const cancelBtn = await popupContents.$('div.popup__cancel[data-submit="girlScheduleEditForm"]');
              const deleteBtn = await popupContents.$('div[data-submit="girlScheduleDeleteForm"]');

              if (status === 'working' && startTime !== '' && endTime !== '') {
                await startTimeElement.select(dateStr + ' ' + startTime);

                if (endTime === '24:00:00') {
                  await endTimeElement.evaluate(el => el.selectedIndex = el.options.length - 1);

                } else {
                  await endTimeElement.select(dateStr + ' ' + endTime);

                }

                if(submitBtn) {
                  await page.waitForSelector('div.popup__submit[data-submit="girlScheduleEditForm"][data-enable="enable"]', { visible: true });
                  await Promise.all([
                    page.waitForNavigation({ waitUntil: 'load' }),
                    page.evaluate((sel) => {
                      const btn = document.querySelector(sel);
                      if (btn) btn.click();
                    }, 'div.popup__submit[data-submit="girlScheduleEditForm"][data-enable="enable"]')
                  ]);
                  await page.waitForSelector('#scheduleAdmin__items__id');
                  
                } else {
                  continue;

                }
              } else if (deleteBtn && (status === 'off' || status === 'unset' || startTime === '' || endTime === '')) {
                if (deleteBtn) {
                  await Promise.all([
                    page.waitForNavigation({ waitUntil: 'load' }),
                    deleteBtn.click()
      
                  ]);
                } else {
                  continue;

                }
              } else {
                if(cancelBtn) {
                  cancelBtn.click();
                } else {
                  continue;

                }
              }
            } catch (error) {
              continue;

            }
          }
        }

        if (castFound) {
          await content_logs.push({
            kf: '京風：スケジュール編集完了'
  
          });
        }

        const pagerBtn = await page.$('li.pagination__btn svg path[d*="41-6"]');
        if (pagerBtn) { //  Promise.allだと不安定になる
          await pagerBtn.click();
          await page.waitForSelector('#scheduleAdmin__items__id'); 
        }

      } catch(error) {
        console.error(error.message);
        await content_logs.push({
          kf: '京風：エラー！'
  
        });
      }
    }
  } catch (error) {
    console.error(error.message);
    
  }
}

module.exports = exportCastScheduleToKf;