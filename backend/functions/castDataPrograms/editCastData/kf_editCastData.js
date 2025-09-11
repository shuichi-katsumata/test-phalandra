const { tempFolderPath } = require('../../setting/downloadImageFromFirebaseStorage');
const { conversion_kanaToHira } = require('../../setting/conversion_character');
const article_extraction = require('../../setting/article_extraction');
const setTimeout = require('node:timers/promises').setTimeout;
const writeToKf_addGirl = require('../addCastData/kf_AG');
const getLoginInfo = require('../../setting/externalSiteInfo');
const { db } = require('../../../utils/firebaseUtils');
const checkAndResizeImage = require('../../setting/resizeImagesProgram');
const path = require('path');

const editCastToKf = async(accountKey, data, panelRef, logId, page) => {

  const content_logs = db.ref(`users/${accountKey}/logs/girls_log/${logId}/content_logs`);
  const { id, pass, loginUrl } = await getLoginInfo(accountKey, 'kf');

  try {

    await page.goto(loginUrl);
    await page.type('#login_id', id);
    await page.type('#login_password', pass);
    await Promise.all([
      page.waitForNavigation({waitUntil: 'load'}),
      page.click('#ShopShopShopsLoginForm > div.adminLogin > div > input'),
    ]);

    //  女の子検索
    await page.click('#slideMenu_mem__id > div > div:nth-child(8) > div.slideMenu_mem__navList > div:nth-child(1) > p > a');
    await page.waitForSelector('input[name="data[search][name]"]');
    await page.type('input[name="data[search][name]"]', data.castName);

    await Promise.all([
      page.waitForNavigation({waitUntil: 'load'}),
      page.click('button[type="submit"]'),
    ]);
    
    try {

      await page.evaluate((castName) => {
        const listItems = document.querySelectorAll('.displaySwitchItem');
        let found = false;

        listItems.forEach((item) => {
          const nameElement = item.querySelector('div.left_container > div.girlAdmin__name > a > p');
          
          if (nameElement.textContent.trim() === castName) {
            const editBtn =  item.querySelector('div.left_container > div.edit > a');
            editBtn.click();
            found = true;
          }

        });

        if (!found) {
          throw new Error('Cast not found');
        
        }
      }, data.castName);
    } catch (error) {
      //  一度ログアウトして追加処理
      await page.click('#bodyHeader__id > div.right_container > div.bodyHeader__userAccount > div > span');
      const accountLink = await page.waitForSelector('#account > a', { visible: true });
      await accountLink.evaluate(el => el.scrollIntoView());
      await accountLink.click();
      await setTimeout(3000);

      await writeToKf_addGirl(accountKey, data, panelRef, logId, page);
      return;

    }

    await page.waitForSelector('#GirlName');

    //  登録されている情報の消去
    await page.evaluate(() => {
      const inputs = document.querySelectorAll('input[type="text"], input[type="number"], textarea');
      inputs.forEach((input) => {
        input.value = '';
      });
    });

    //  編集内容登録
    await page.type('#GirlName', data.castName);
    await page.type('#GirlNameKana', conversion_kanaToHira(data.castName));
    await page.select('#GirlAge', data.age);
    await page.type('#GirlHeight', data.height);
    await page.type('#GirlBust', data.bust);

    await page.evaluate((cupValue)=> {
      document.querySelector('#GirlCup').options[cupValue].selected = true;
    }, data.cup);

    await page.type('#GirlWaist', data.waist);
    await page.type('#GirlHip', data.hip);

    await page.evaluate((entryDate) => {
      const [year, month, day] = entryDate.split('-');
      const entryDateColumn = document.querySelector('#date');
    
      if (entryDateColumn && entryDate !== '') {

        const selectYear = document.querySelector('#GirlShopEnterYear');
        const yearOption = Array.from(selectYear.options).find(option => option.value === year);
        yearOption.selected = true;

        const selectMonth = document.querySelector('#GirlShopEnterMonth');
        const monthOption = Array.from(selectMonth.options).find(option => option.value === month);
        monthOption.selected = true;
        
        const selectDay = document.querySelector('#GirlShopEnterDay');
        const dayOption = Array.from(selectDay.options).find(option => option.value === day);
        dayOption.selected = true;

      }
    
    }, data.entryDate);
    
    await page.type('#GirlGirlMessage', article_extraction(data.girlComment));
    await page.type('#GirlShopMessage', article_extraction(data.shopComment));

    if (data.situation === 'public') {

      await page.evaluate(() => {
        const situationButton = document.querySelector('#GirlDisplay1');
        situationButton.click();
      });

    } else {

      await page.evaluate(() => {
        const situationButton = document.querySelector('#GirlDisplay0');
        situationButton.click();
      });

    }

    await page.click('#editForm > div > div.submitBtn');

    //  再度女の子検索
    await page.waitForSelector('input[name="data[search][name]"]');
    await page.type('input[name="data[search][name]"]', data.castName);

    await Promise.all([
      page.waitForNavigation({waitUntil: 'load'}),
      page.click('button[type="submit"]'),
    ]);
    
    await page.evaluate((castName) => {
      const listItems = document.querySelectorAll('.displaySwitchItem');
    
      listItems.forEach((item) => {
        const nameElement = item.querySelector('div.left_container > div.girlAdmin__name > a > p');
    
        if (nameElement.textContent.trim() === castName) {
    
          const imgButton =  item.querySelector('.girlAdmin__thumbnail_canvas.showing.modal_open');
          imgButton.click();
    
        }
      });
    
    }, data.castName);

    //  パネル登録
    await new Promise((resolve, reject)=> {

      panelRef.once('value', async(snapshot) => {
        const panelData = snapshot.val();
        
        if (panelData) {
          const panelLength = Math.min(Object.keys(panelData).length, 5);

          for (let i = 0; i < panelLength; i++) {
          
            const fileInputId = `#fileUpload__id_${i+1} input[type="file"]`;
            await page.waitForSelector(fileInputId);
            const file_input = await page.$(fileInputId); // fileの選択
            const file_path = path.join(tempFolderPath, panelData[i + 1]);
            //  ファイルサイズをチェックして必要ならリサイズ
            const uploadFilePath = await checkAndResizeImage(file_path, tempFolderPath, panelData, i, 1000);
            //  アップロード処理
            await file_input.uploadFile(uploadFilePath);
          
          }

          for (let i = panelLength; i < 5; i++) {
            await page.evaluate((i) => {
              const imgDeleteBtns = document.querySelectorAll('#GirlImageDelete.icon-checkbox');
              if (imgDeleteBtns[i]) {
                imgDeleteBtns[i].checked = true;

              }
            }, i);
          }

          await setTimeout(5000);
          await page.click('.modalSubmit.flat[data-submit="girlImageForm"]');
        
        } else {
          await page.waitForSelector('#girl_photo_list');
          await page.evaluate(() => {
            const imgDeleteBtns = document.querySelectorAll('#GirlImageDelete.icon-checkbox');
          
            if (imgDeleteBtns) {
              imgDeleteBtns.forEach((btn) => {
                console.log(btn);
                btn.checked = true;
             
              });
            }
          });
          
          await setTimeout(5000);
          await page.click('.modalSubmit.flat[data-submit="girlImageForm"]');
        
        }
        resolve();
      });
    });
    
    await page.waitForSelector('li.displaySwitchItem');
    await setTimeout(3000);
    
    await content_logs.push({
      kf: '京風：編集完了'
    
    });
  
  } catch (error) {
    console.error(error.message);
    await content_logs.push({
      kf: '京風：エラー！'
    
    });
  }
}

module.exports = editCastToKf;
