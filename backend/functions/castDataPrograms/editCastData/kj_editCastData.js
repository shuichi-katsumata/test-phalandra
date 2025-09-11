const { tempFolderPath } = require('../../setting/downloadImageFromFirebaseStorage');
const article_extraction = require('../../setting/article_extraction');
const setTimeout = require('node:timers/promises').setTimeout;
const writeToKj_addGirl = require('../addCastData/kj_AG');
const getLoginInfo = require('../../setting/externalSiteInfo');
const { db } = require('../../../utils/firebaseUtils');
const path = require('path');

const editCastToKj = async(accountKey, data, panelRef, logId, page) => {
  
  const content_logs = db.ref(`users/${accountKey}/logs/girls_log/${logId}/content_logs`);
  const { id, pass, loginUrl } = await getLoginInfo(accountKey, 'kj');

  try {

    await page.goto(loginUrl);
    await page.type( '#email', id);
    await page.type('#password', pass);
    await Promise.all([
      page.waitForNavigation({waitUntil: 'load'}),
      page.click('input[name="login"]'),
    ]);
    
    await page.click('body > div.slidemenu.slidemenu-left > div.slidemenu-body > ul > li:nth-child(5) > a');
    await page.waitForSelector('#page-content-wrapper > div:nth-child(6) > div.panel-body');
    
    //  女の子非公開欄検索（非公開だった時は一度復帰させないと編集できないのでその処理）
    await page.evaluate((castName)=> {
      const listItems = document.querySelectorAll('#page-content-wrapper > div:nth-child(7) > div.panel-body > div.btn-group');
      
      listItems.forEach((item) => {
        const nameElement = item.querySelector('button');
        const lines = nameElement.innerText.split('\n');
        const foundLine = lines.find(line => line.includes(castName));

        if (foundLine === castName) {
          const girlMenuBtn = item.querySelector('button.dropdown-toggle');
          girlMenuBtn.click();

          const comebackBtn = item.querySelector('a[href*="shp_girl_temp_add"]');
          comebackBtn.click();
        }

      });

    }, data.castName);
    
    await setTimeout(5000);

    //  ポップアップ処理
    const iframeElement = await page.$('iframe.fancybox-iframe');   
    if (iframeElement) {

      const frame = await iframeElement.contentFrame();
      await frame.waitForSelector('a[href*="shp_girl_temp_add_post"]');
      await frame.click('a[href*="shp_girl_temp_add_post"]');

    }

    //  女の子検索
    await setTimeout(5000);

    try {

      await page.evaluate((castName)=> {
        const listItems = document.querySelectorAll('#page-content-wrapper > div:nth-child(6) > div.panel-body > div.btn-group');
        let found = false;

        listItems.forEach((item) => {
          const nameElement = item.querySelector('button');
          if (nameElement.textContent.trim() === castName) {
            const girlMenuBtn = item.querySelector('button.dropdown-toggle');
            girlMenuBtn.click();
            const editBtn = item.querySelector('a[href*="shp_girl3_edit"]');
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
      await writeToKj_addGirl(accountKey, data, panelRef, logId, page);
      return;

    }

    // パネル登録
    await page.waitForSelector('#page-content-wrapper > form > fieldset');
    await new Promise((resolve, reject)=> {
      panelRef.once('value', async(snapshot) => {
        const panelData = snapshot.val();
        if (panelData) {
          const panelLength = Object.keys(panelData).length;

          for (let i = 0; i < panelLength; i++) {
              const fileInputName = i === 0 ? 'girl_filename': `girl_filename${i + 1}`;
              const file_input = await page.$(`input[name=${fileInputName}]`); // fileの選択
              const file_path = path.join(tempFolderPath, panelData[i + 1]);
              await file_input.uploadFile(file_path);
          }

          // 画像削除ボタンの確認とチェック処理
          await page.evaluate((panelLength) => {
            const imgdeleteButtons = document.querySelectorAll('span.input-block > label > input[type="checkbox"]');
            
            if (imgdeleteButtons.length > 0) {
              for (let i = panelLength; i < imgdeleteButtons.length; i++) {
                imgdeleteButtons[i].checked = true;
              }
            }
            
          }, panelLength);

        } else {

          await page.evaluate(() => {
            const imgdeleteButtons = document.querySelectorAll('span.input-block > label > input[type="checkbox"]');
            imgdeleteButtons.forEach((btn) => {
              btn.checked = true;
            })
          });
          
        }
        resolve();
      });
    });

    //  登録されている情報の消去
    await page.evaluate(() => {
      const inputs = document.querySelectorAll('input[type="text"], textarea');
      inputs.forEach((input) => {
        input.value = '';
      });
    });

    //  編集内容登録
    await page.select('#girl_age', data.age);
    await page.select('#girl_t', data.height);
    await page.select('#girl_b', data.bust);

    await page.evaluate((cupValue)=> {
      document.querySelector('#girl_b_cup').options[cupValue].selected = true;
    }, data.cup);
    
    await page.select('#girl_w', data.waist);
    await page.select('#girl_h', data.hip);
    await page.type('#girl_catchcopy', data.catchCopy);
    await page.type('#girl_comment', article_extraction(data.shopComment));

    //  Q&A
    for (let i = 0; i < 12; i++) {
      await page.type(`#girl_prof_title${i + 1}`, data[`question${i + 1}`]);
      await page.type(`#girl_prof_text${i + 1}`, data[`answer${i + 1}`]);

    }
    
    await page.click('#page-content-wrapper > form > fieldset > div.form-group.form-group-last-submit > button');
    await page.waitForSelector('#page-content-wrapper > fieldset > div.form-group.text-center > a.btn.btn-primary.btn_submit');
    await page.click('#page-content-wrapper > fieldset > div.form-group.text-center > a.btn.btn-primary.btn_submit');
    await page.waitForSelector('#page-content-wrapper > div:nth-child(6) > div.panel-body .btn-group');

    //  公開・非公開設定
    if (data.situation === 'public') {
      await page.evaluate((castName)=> {
        const girls_group = document.querySelectorAll('#page-content-wrapper > div:nth-child(7) > div.panel-body > div.btn-group');
        girls_group.forEach((item) => {
          const nameElement = item.querySelector('button');
          const lines = nameElement.innerText.split('\n');
          const foundLine = lines.find(line => line.includes(castName));
          if (foundLine === castName) {
            const girlMenuButton = item.querySelector('button.dropdown-toggle');
            girlMenuButton.click();
            const comebackButton = item.querySelector('a[href*="shp_girl_temp_add"]');
            comebackButton.click();
            
          }
        });
      }, data.castName);
      
      // ボタンを押してからjsでポップアップが開かれて、その中のiframe内に一時退店ボタンがあるよ。
      await setTimeout(5000);
      const iframeElement = await page.$('iframe.fancybox-iframe');

      if (iframeElement) {
        const frame = await iframeElement.contentFrame();
        await frame.waitForSelector('a[href*="shp_girl_temp_add_post"]');
        await frame.click('a[href*="shp_girl_temp_add_post"]');
      }

    } else {

      await page.evaluate((castName)=> {
        const listItems = document.querySelectorAll('#page-content-wrapper > div:nth-child(6) > div.panel-body .btn-group');
        
        listItems.forEach((item) => {
          const nameElement = item.querySelector('button');

          if (nameElement.textContent.trim() === castName) {
            const girlMenuButton = item.querySelector('button.dropdown-toggle');
            girlMenuButton.click();
            const hiddenButton = item.querySelector('a[href*="shp_girl_temp_delete"]');
            
            if (hiddenButton) {
              hiddenButton.click();
            }

          }

        });

      }, data.castName);

      // ボタンを押してからjsでポップアップが開かれて、その中のiframe内に一時退店ボタンがあるよ。
      await setTimeout(5000);
      const iframeElement = await page.$('iframe.fancybox-iframe');   

      if (iframeElement) {
        const frame = await iframeElement.contentFrame();
        await frame.waitForSelector('a[href*="shp_girl_temp_delete_post"]');
        await frame.click('a[href*="shp_girl_temp_delete_post"]');
      }

    }
    await page.waitForSelector('#page-content-wrapper > div:nth-child(6) > div.panel-body .btn-group');
    
    await content_logs.push({
      kj: '口コミ風俗情報局：編集完了'
    });

  } catch (error) {
    
    console.error(error.message);
    await content_logs.push({
      kj: '口コミ風俗情報局：エラー！'
    });
    
  }
}
module.exports = editCastToKj;
