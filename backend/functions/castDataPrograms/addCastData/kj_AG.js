const { tempFolderPath } = require('../../setting/downloadImageFromFirebaseStorage');
const article_extraction = require('../../setting/article_extraction');
const setTimeout = require('node:timers/promises').setTimeout;
const getLoginInfo = require('../../setting/externalSiteInfo');
const { db } = require('../../../utils/firebaseUtils');
const path = require('path');

const writeToKj_addGirl = async(accountKey, data, panelRef, latestKey, page) => {

  const content_logs = db.ref(`users/${accountKey}/logs/girls_log/${latestKey}/content_logs`);
  const { id, pass, loginUrl } = await getLoginInfo(accountKey, 'kj');

  try {

    await page.goto(loginUrl);
    const email = await page.$('#email');

    //  女の子編集の時に対象の子が見つからずログアウトしてURL入れるとログイン後のページになっちゃうので、#emailがあるか確認する
    if (email) {
      await page.type( '#email', id);
      await page.type('#password', pass);
      await Promise.all([
        page.waitForNavigation(),
        page.click('input[name="login"]'),

      ]);
    }
    
    await page.click('body > div.slidemenu.slidemenu-left > div.slidemenu-body > ul > li:nth-child(5) > a');
    await page.waitForSelector('#page-content-wrapper > div.button-list-frame > a.btn.btn-info');
    await page.click('#page-content-wrapper > div.button-list-frame > a.btn.btn-info');
    await page.waitForSelector('#girl_name');

    //  女の子登録
    await page.type('#girl_name', data.castName);
    
    const EntryDateOld = (entryDate) => {  // 入店日が3ヶ月以上前か調べる
      const date = new Date();
      date.setMonth(date.getMonth() - 3);
      return new Date(entryDate) < date;
    
    }

    if (data.entryDate && !EntryDateOld(data.entryDate)) {
      await page.select('#girl_join_date', data.entryDate);
    
    }

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

    // パネル登録
    await new Promise((resolve, reject)=> {
      panelRef.once('value', async(snapshot) => {
        const panelData = snapshot.val();
        if (panelData) {
          const panelLength = Object.keys(panelData).length;
          for (let i=0; i<panelLength; i++) {
            for (let i = 0; i < panelLength; i++) {
              const fileInputName = i === 0 ? 'girl_filename': `girl_filename${i + 1}`;
              const file_input = await page.$(`input[name=${fileInputName}]`); // fileの選択
              const file_path = path.join(tempFolderPath, panelData[i + 1]);
              await file_input.uploadFile(file_path);
    
            }
          }
        }
        resolve();
      });
    });

    //  Q&A
    for (let i = 0; i < 12; i++) {
      await page.focus(`#girl_prof_title${i+1}`);
      await page.keyboard.down('Control');
      await page.keyboard.press('KeyA');
      await page.keyboard.up('Control');
      await page.type(`#girl_prof_title${i+1}`, data[`question${i + 1}`]);
      await page.type(`#girl_prof_text${i+1}`, data[`answer${i + 1}`]);

    }

    await page.click('#page-content-wrapper > form > fieldset > div.form-group.form-group-last-submit > button');
    await page.waitForSelector('#page-content-wrapper > fieldset > div.form-group.text-center > a.btn.btn-primary.btn_submit');
    await setTimeout(5000);
    await page.click('#page-content-wrapper > fieldset > div.form-group.text-center > a.btn.btn-primary.btn_submit');
    await page.waitForSelector('#page-content-wrapper > div:nth-child(6) > div.panel-body .btn-group');

    // 非公開設定
    if (data.situation !== 'public') {
      await setTimeout(5000);
      await page.evaluate((castName)=> {
        const girls_group = document.querySelectorAll('#page-content-wrapper > div:nth-child(6) > div.panel-body .btn-group');
        girls_group.forEach(girl => {
          const nameElement = girl.querySelector('button');
          if (nameElement.textContent.trim() === castName) {
            const girlMenuButton = girl.querySelector('button.dropdown-toggle');
            girlMenuButton.click();
            const hiddenButton = girl.querySelector('a[href*="shp_girl_temp_delete"]');
            if (hiddenButton) {
              hiddenButton.click();

            }
          }
        });
      }, data.castName);

      await setTimeout(5000);

      // ボタンを押してからjsでポップアップが開かれて、その中のiframe内に一時退店ボタンがあるよ。
      const iframeElement = await page.$('iframe.fancybox-iframe');   
      if (iframeElement) {
        const frame = await iframeElement.contentFrame();
        await frame.waitForSelector('a[href*="shp_girl_temp_delete_post"]');
        await frame.click('a[href*="shp_girl_temp_delete_post"]');

      } else {
          console.log('Not found frame...');
      
      }
    }
    
    await page.waitForSelector('#page-content-wrapper > div:nth-child(6) > div.panel-body .btn-group');
    
    await content_logs.push({
      kj: '口コミ風俗情報局：登録完了'
    
    });
  } catch (error) {
    console.error(error.message);
    await content_logs.push({
      kj: '口コミ風俗情報局：エラー！'
    
    });
  }
}

module.exports = writeToKj_addGirl;