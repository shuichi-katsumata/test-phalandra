const { tempFolderPath } = require('../../setting/downloadImageFromFirebaseStorage');
const { conversion_hiraToHankakuKana } = require('../../setting/conversion_character');
const setTimeout = require('node:timers/promises').setTimeout;
const getLoginInfo = require('../../setting/externalSiteInfo');
const { db } = require('../../../utils/firebaseUtils');
const checkAndResizeImage = require('../../setting/resizeImagesProgram');
const fs = require('fs');

const writeToYg_addGirl = async(accountKey, data, panelRef, latestKey, page) => {

  const content_logs = db.ref(`users/${accountKey}/logs/girls_log/${latestKey}/content_logs`);
  const { id, pass, loginUrl } = await getLoginInfo(accountKey, 'yg');

  try {

    await page.goto(loginUrl);
    await page.type('input[name="username"]', id);
    await page.type('input[name="password"]', pass);
    await page.click('input[type="submit"]');

    await page.waitForSelector('#menu > div > div > ul > li:nth-child(13) > a');
    await page.click('#menu > div > div > ul > li:nth-child(13) > a');
    await setTimeout(5000);

    const frameHandle = await page.$('iframe.imain');
    const frame = await frameHandle.contentFrame();
    
    await frame.click('button[type="submit"]');
    await setTimeout(5000);
    
    if (data.situation !== 'public') {
      await frame.click('#itemSetting\\.isPublished1');

    }
    
    await frame.type('input[id="itemProfile.name"]', data.castName);
    await frame.type('input[id="itemProfile.kana"]', conversion_hiraToHankakuKana(data.castName));
    await frame.type('input[id="itemProfile.age"]', data.age);
    await frame.type('input[id="itemFigure.height"]', data.height);
    await frame.type('input[id="itemFigure.bust"]', data.bust);
    
    await frame.evaluate((cupValue)=> {
      if (cupValue > 19) {
        document.querySelector('select[name="itemFigure.cupSize"]').options[20].selected = true;
      
      } else {
        document.querySelector('select[name="itemFigure.cupSize"]').options[cupValue].selected = true;
      
      }
    }, data.cup);
    
    await frame.type('input[id="itemFigure.waist"]', data.waist);
    await frame.type('input[id="itemFigure.hip"]', data.hip);
    
    await frame.evaluate((type)=> {
      if (type) {
        const og_type = document.querySelector('select[name="itemAttribute.fuzokuGalType"]');
        if (type === '01') {
          og_type.options[1].selected = true;
    
        } else if (type === '02') {
          og_type.options[2].selected = true;
    
        } else if (type === '03') {
          og_type.options[4].selected = true;
    
        } else if (type === '04') {
          og_type.options[8].selected = true;
    
        }
      }
    }, data.ch_type);
    
    //  Q&A
    await frame.evaluate((data)=> {
      for (let i = 0; i < 15; i++) {
        const questionElement = document.getElementById(`itemProfileDetails${i}.title`);
        questionElement.value = data[`question${i + 1}`];
        const answerElemnt = document.getElementById(`itemProfileDetails${i}.body`);
        answerElemnt.value = data[`answer${i + 1}`];
      
      }
    }, data);
    
    await frame.click('button[type="submit"]');
    await setTimeout(5000);
    
    // パネル登録
    await new Promise((resolve, reject) => {
      panelRef.once('value', async(snapshot) => {
        const panelData = snapshot.val();
        if (panelData) {
          await frame.click('body > div > div > div > ul > li:nth-child(2) > a');
          await setTimeout(5000);
          const panelLength = Math.min(Object.keys(panelData).length, 5);
          for (let i = 0; i < panelLength; i++) {
            const fileInputName = `images[${i}].file`;
            const file_input = await frame.$(`input[name="${fileInputName}"]`); // fileの選択
            const file_path = `${tempFolderPath}\\${panelData[i+1]}`;
            
            //  ファイルサイズをチェックして必要ならリサイズ
            const uploadFilePath = await checkAndResizeImage(file_path, tempFolderPath, panelData, i, 488);
         
            //  アップロード処理
            await file_input.uploadFile(uploadFilePath);
      
          }
          await frame.click('button[type="submit"]');
          await setTimeout(5000);
          await frame.click('body > div > div > div > ul > li:nth-child(4) > a');
          await setTimeout(5000);
         
          const file_input = await frame.$('input[name="file"]'); // fileの選択
          const originalPath = `${tempFolderPath}\\${panelData[1]}`;
          const resizedPath = `${tempFolderPath}\\resized${panelData[1]}`;
          
          //  先程リサイズした画像データがあればそちらを使う
          let uploadFilePath = fs.existsSync(resizedPath) ? resizedPath : originalPath; //  fs.existsSyncでファイルやディレクトリが存在するか調べられる
         
          await file_input.uploadFile(uploadFilePath);
          await setTimeout(5000);
          await frame.click('button[type="submit"]');
        
        }
        resolve();
      });
    });

    await setTimeout(3000);
    
    await content_logs.push({
      yg: '夜遊びガイド：登録完了'
    
    });
  } catch (error) {
    console.error(error.message);
    await content_logs.push({
      yg: '夜遊びガイド：エラー！'
    
    });
  }
}

module.exports = writeToYg_addGirl;