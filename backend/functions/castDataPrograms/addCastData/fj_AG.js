const { tempFolderPath } = require('../../setting/downloadImageFromFirebaseStorage');
const article_extraction = require('../../setting/article_extraction');
const setTimeout = require('node:timers/promises').setTimeout;
const getLoginInfo = require('../../setting/externalSiteInfo');
const { db } = require('../../../utils/firebaseUtils');
const checkAndResizeImage = require('../../setting/resizeImagesProgram');

const writeToFj_addGirl = async(accountKey, data, panelRef, latestKey, page) => {

  const content_logs = db.ref(`users/${accountKey}/logs/girls_log/${latestKey}/content_logs`);
  const { id, pass, loginUrl } = await getLoginInfo(accountKey, 'fj');
  const [year, month, day] = data.entryDate.split('-');
 
  try {

    await page.goto(loginUrl);
    await page.type('input[name=username]', id);
    await page.type('input[name=password]', pass);
    await page.click('#button');

    await page.waitForSelector('#wrapper > div > div.leftColumn > nav > div:nth-child(8) > div > ul > li:nth-child(2) > a');
    await page.click('#wrapper > div > div.leftColumn > nav > div:nth-child(8) > div > ul > li:nth-child(2) > a');
    
    await page.waitForSelector('#form_girl_name');
    await page.type('#form_girl_name', data.castName);
    await page.type('#form_girl_age', data.age);
    await page.click('label[for="form_girl_blood_5"]');
    await page.type('#form_girl_height', data.height);
    await page.type('#form_girl_sizeb', data.bust);

    await page.evaluate((cupValue)=> {
      document.querySelector('#form_girl_cup').options[cupValue].selected = true;
    }, data.cup);
    
    await page.type('#form_girl_sizew', data.waist);
    await page.type('#form_girl_sizeh', data.hip);
    
    // 在籍Q＆Aは、サイト自体が#form_prof_q${i+1}の順番がぐちゃぐちゃなので注意
    for (let i = 0; i < 10; i++) {
      await page.focus(`#form_prof_q${i + 1}`);
      await page.keyboard.down('Control');
      await page.keyboard.press('KeyA');
      await page.keyboard.up('Control');
      await page.type(`#form_prof_q${i + 1}`, data[`question${i + 1}`]);
      await page.type(`#form_prof_a${i + 1}`, data[`answer${i + 1}`]);
    
    }
    
    if (data.entryDate !== '') {
      await page.type('#form_visiting_year', year);
      await page.type('#form_visiting_month', month);
      await page.type('#form_visiting_date', day);
    
    }

    // セールスポイント選択
    if (data.fj_selling_points[0].label !== '') {
      await page.evaluate((fj_selling_points) => {
        const sellingPointBtn = document.querySelectorAll('button.tag_btn');
        fj_selling_points.forEach((point) => {
          sellingPointBtn.forEach((btn) => {
            if (btn.value === point.value) {
              btn.click();
    
            }
          });
        });
      }, data.fj_selling_points);
    }
    
    await page.evaluate(() => {
      const sortableList = document.querySelector('#sortable');
      const autoTags = document.querySelectorAll('button.ui-sortable-handle');
      autoTags.forEach((autoTag) => {
        const parentAutoTag = autoTag.closest('li.tag_btnItem');
        sortableList.appendChild(parentAutoTag);
    
      });
    });

    // パネル登録
    await new Promise((resolve, reject)=> {
      panelRef.once('value', async(snapshot) => {
        const panelData = snapshot.val();
        if (panelData) {
          const panelLength = Object.keys(panelData).length;
          for (let i = 0; i < panelLength; i++) {
            await page.evaluate((index)=> {
              const inputStyle = document.querySelector(`#form_file_girl_photo${index+1}`);
              inputStyle.style.display = 'block';
            }, i);
            const file_input = await page.$(`input[name=file_girl_photo${i+1}]`);
            const file_path = `${tempFolderPath}\\${panelData[i+1]}`;
            //  ファイルサイズをチェックして必要ならリサイズ
            const uploadFilePath = await checkAndResizeImage(file_path, tempFolderPath, panelData, i, 1000);
            //  アップロード処理
            await file_input.uploadFile(uploadFilePath);
    
          }
        }
        resolve();
      });
    });
    
    await page.type('#form_girl_pr', article_extraction(data.shopComment));
    await page.click('#girls_add > form > div.button_area > input[type=submit]');
    await page.waitForSelector('#wrapper > div > div.leftColumn > nav > div:nth-child(8) > div > ul > li:nth-child(3) > a');
    await page.click('#wrapper > div > div.leftColumn > nav > div:nth-child(8) > div > ul > li:nth-child(3) > a');

    // 非表示の場合の処理
    if (data.situation !== 'public') {
      await page.waitForSelector('.chk_field');
      await page.evaluate((castName)=> {
        const listItems = document.querySelectorAll('li.ui-state-default'); 
        listItems.forEach(item => {
          const nameElement = item.querySelector('.girl_name');
          if (nameElement && nameElement.textContent.trim() === castName) {
            const checkbox = item.querySelector('input[type="checkbox"]');
            if (checkbox) {
                checkbox.click();
    
            }
          }
        });
      }, data.castName);
  
      // 「更新する」のボタンが追跡してきて非表示ボタンを押す邪魔になっているので消す
      const change_submitElement = await page.$('.submit_area');
      if (change_submitElement) {
        await page.evaluate((element) => {
          element.style.display = 'none';
        }, change_submitElement)
  
      }
      await page.click('#form > div > div.control > ul > li:nth-child(1) > button');
      await page.click('#js-active > ul > li:nth-child(1) > button');
  
    }
  
    await setTimeout(3000);
    await content_logs.push({
      fj: '風俗じゃぱん：登録完了'
  
    });
  } catch (error) {
    console.error(error.message);
    await content_logs.push({
      fj: '風俗じゃぱん：エラー！'
    
    });
  }
}

module.exports = writeToFj_addGirl;