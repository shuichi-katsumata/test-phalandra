const { tempFolderPath } = require('../../setting/downloadImageFromFirebaseStorage');
const { conversion_hiraAndKanaToRomaji } = require('../../setting/conversion_character');
const article_extraction = require('../../setting/article_extraction');
const setTimeout = require('node:timers/promises').setTimeout;
const getLoginInfo = require('../../setting/externalSiteInfo');
const { db } = require('../../../utils/firebaseUtils');

const writeToOg_addGirl = async(accountKey, data, panelRef, latestKey, page) => {

  const content_logs = db.ref(`users/${accountKey}/logs/girls_log/${latestKey}/content_logs`);
  const { id, pass, loginUrl } = await getLoginInfo(accountKey, 'og');

  try {

    await page.goto(loginUrl);
    await page.type('input[name="operatorId"]', id);
    await page.type('input[name="operatorPass"]', pass);
    await page.click('button[type="submit"]');

    await page.waitForSelector('body > section > nav > ul > li:nth-child(1) > ul > li:nth-child(7) > a');
    await page.click('body > section > nav > ul > li:nth-child(1) > ul > li:nth-child(7) > a');
    
    await page.waitForSelector('body > section > section > ul > li:nth-child(2) > a');
    await page.click('body > section > section > ul > li:nth-child(2) > a');
    await page.waitForSelector('input[name="castEntryDate"]');

    //  入店日設定
    await page.focus('input[name="castEntryDate"]');
    await page.keyboard.down('Control');
    await page.keyboard.press('KeyA');
    await page.keyboard.up('Control');
    await page.type('input[name="castEntryDate"]', data.entryDate);

    await page.type('input[name="castAccount"]', conversion_hiraAndKanaToRomaji(data.castName));
    await page.type('input[name="castName"]', data.castName);
    await page.type('input[name="castAge"]', data.age);
    await page.type('input[name="castBodyT"]', data.height);
    await page.type('input[name="castBodyB"]', data.bust);
    await page.type('input[name="castBodyW"]', data.waist);
    await page.type('input[name="castBodyH"]', data.hip);

    await page.evaluate((cupValue)=> {
      document.querySelector('select[name="castBodyC"]').options[cupValue].selected = true;
    
    }, data.cup);

    await page.select('select[name="castSmoke"]', data.smoking);
    await page.type('input[name="castComment3"]', data.catchCopy);
    await page.type('textarea[name="castComment1"]', article_extraction(data.shopComment));
    await page.type('textarea[name="castComment2"]', article_extraction(data.girlComment));
    
    if (data.situation !== 'public') {
      await page.click('body > section > section > form > div > table > tbody > tr:nth-child(28) > td > label:nth-child(2) > input[type=radio]');
    
    }
    
    await page.click('button[type="submit"]');
    await page.waitForSelector('body > section > section > ul > li:nth-child(2) > a');
    
    //  パネル登録 
    await new Promise((resolve, reject)=> {
      panelRef.once('value', async(snapshot) => {
        const panelData = snapshot.val();
        if (panelData) {
          await page.evaluate((castName)=> {
            const girlElements = document.querySelectorAll('ul[class="girls_list"] > li');
            girlElements.forEach(girlElement => {
              const girlElementName = girlElement.querySelector('p[class="name"]');
              if (girlElementName.textContent.trim() === castName) {
                const imgButton = girlElement.querySelector('div.right > div > p:nth-child(2) > a');
                if (imgButton) {
                  imgButton.click();

                } else {
                  console.log('Not found imgButton...');
                
                }
              }
            });
          }, data.castName);
          
          await page.waitForSelector('#f > div:nth-child(2) > div:nth-child(2) > input[type="file"]');
          const panelLength = Object.keys(panelData).length;
          
          for (let i=0; i<panelLength; i++) {
            const fileInputElement = '#f > div:nth-child(2) > div:nth-child(2) > input[type="file"]';
            const file_path = `${tempFolderPath}\\${panelData[i+1]}`;
            
            if (i === 0) {
              const thumbInputElement = '#thumb';
              const thumb_input = await page.$(thumbInputElement);
              await thumb_input.uploadFile(file_path);
              await page.waitForSelector(fileInputElement);
              const file_input = await page.$(fileInputElement); // fileの選択
              await file_input.uploadFile(file_path);
              await page.waitForSelector(fileInputElement);
            
            } else if (i === 9) {
              const file_input = await page.$(fileInputElement); // fileの選択
              await file_input.uploadFile(file_path);
              await page.waitForSelector('#f > div:nth-child(2) > input[type=file]:nth-child(3)'); // 10枚入れるとinputのセレクターが変わる
            
            } else {
              const file_input = await page.$(fileInputElement); // fileの選択
              await file_input.uploadFile(file_path);
              await page.waitForSelector(fileInputElement);
            
            }
          }
          await page.click('button[type="submit"]');
        
        }
        resolve();
      });
    });

    await setTimeout(3000);

    await content_logs.push({
      og: '雄琴ガイド：登録完了'
    
    });
  } catch (error) {
    await content_logs.push({
      og: '雄琴ガイド：エラー！'
    
    });
  }
}

module.exports = writeToOg_addGirl;