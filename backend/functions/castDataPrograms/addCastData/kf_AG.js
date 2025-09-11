const { tempFolderPath } = require('../../setting/downloadImageFromFirebaseStorage');
const { conversion_kanaToHira } = require('../../setting/conversion_character');
const article_extraction = require('../../setting/article_extraction');
const setTimeout = require('node:timers/promises').setTimeout;
const getLoginInfo = require('../../setting/externalSiteInfo');
const { db } = require('../../../utils/firebaseUtils');
const checkAndResizeImage = require('../../setting/resizeImagesProgram');
const path = require('path');

const writeToKf_addGirl = async(accountKey, data, panelRef, latestKey, page) => {

  const content_logs = db.ref(`users/${accountKey}/logs/girls_log/${latestKey}/content_logs`);
  const { id, pass, loginUrl } = await getLoginInfo(accountKey, 'kf');

  try {

    await page.goto(loginUrl);
    await page.type('#login_id', id);
    await page.type('#login_password', pass);

    await Promise.all([
      page.waitForNavigation({waitUntil: 'load'}),
      page.click('#ShopShopShopsLoginForm > div.adminLogin > div > input'),

    ]);

    await page.click('#slideMenu_mem__id > div > div:nth-child(8) > div.slideMenu_mem__navList > div:nth-child(1) > p > a');
    await page.waitForSelector('#primaryHeader__Box > div:nth-child(2) > ul.primaryHeader__btns > li > a');
    await page.click('#primaryHeader__Box > div:nth-child(2) > ul.primaryHeader__btns > li > a');
    await page.waitForSelector('#GirlName');
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
    
    if (data.entryDate !== '') {
      const [year, month, day] = data.entryDate.split('-');
      await page.select('#GirlShopEnterYear', year);
      await page.select('#GirlShopEnterMonth', month);
      await page.select('#GirlShopEnterDay', day);
    
    }
    
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
    await page.waitForSelector('#primaryMain__tbody__id > div > ul > li:last-child > a');
    await page.click('#primaryMain__tbody__id > div > ul > li:last-child > a');
    await page.waitForSelector('li.displaySwitchItem');

    //  パネル登録
    await new Promise((resolve, reject)=> {
      panelRef.once('value', async(snapshot) => {
        const panelData = snapshot.val();
        if (panelData) {
          const panelLength = Math.min(Object.keys(panelData).length, 5);
          await page.evaluate((castName)=> {
            const listItems = document.querySelectorAll('li.displaySwitchItem');
            listItems.forEach(item => {
              const girlName = item.querySelector('.girlAdmin__name');
              if (girlName.textContent.trim() === castName) {
                const imgButton = item.querySelector('.girlAdmin__thumbnail_canvas.showing.modal_open');
                if (imgButton) {
                  imgButton.click();
         
                }
              }
            });
          }, data.castName);
          
          for (let i = 0; i < panelLength; i++) {
            const fileInputId = `#fileUpload__id_${i+1} input[type="file"]`;
            await page.waitForSelector(fileInputId);
            const file_input = await page.$(fileInputId); // fileの選択
            const file_path = path.join(tempFolderPath, panelData[i + 1]);
            //  ファイルサイズをチェックして必要ならリサイズ
            const uploadFilePath = await checkAndResizeImage(file_path, tempFolderPath, panelData, i, 1000);
            //  アップロード処理
            await file_input.uploadFile(uploadFilePath);
            await setTimeout(5000);
          
          }
          await page.click('.modalSubmit.flat[data-submit="girlImageForm"]');
        
        }
        resolve();
      });
    });

    await page.waitForSelector('li.displaySwitchItem');
    await setTimeout(2000);
    
    await content_logs.push({
      kf: '京風：登録完了'
    
    });
  } catch (error) {
    await content_logs.push({
      kf: '京風：エラー！'
    
    });
  }
}

module.exports = writeToKf_addGirl;