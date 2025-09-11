const { tempFolderPath } = require('../../setting/downloadImageFromFirebaseStorage');
const getLoginInfo = require('../../setting/externalSiteInfo');
const { db } = require('../../../utils/firebaseUtils');
const path = require('path');

const writeToOhp_addGirl = async(accountKey, data, panelRef, latestKey, page) => {

  const content_logs = db.ref(`users/${accountKey}/logs/girls_log/${latestKey}/content_logs`);
  const { id, pass, loginUrl } = await getLoginInfo(accountKey, 'ohp');
  
  try {

    await page.goto(loginUrl);
    await page.type('input[name=id]', id);
    await page.type('input[name=password]', pass);
    await page.click('input[type=submit]');
    await page.waitForSelector('#g_navi > ul > li:nth-child(5) > a');
    await page.click('#g_navi > ul > li:nth-child(5) > a');
    await page.waitForSelector('#s_navi > ul > li:nth-child(3) > a');
    await page.click('#s_navi > ul > li:nth-child(3) > a');
    await page.waitForSelector('input[class="form_day datepicker hasDatepicker"]');

    //  公開の時は表示順を入れる
    if (data.situation !== 'public') {
      await page.click('#redips-drag > form > table > tbody > tr:nth-child(2) > td > ul > li:nth-child(2) > label > input[type=radio]');
    }

    await page.type('input[name="Cast[name]"]', data.castName);

    if (data.entryDate) {
      await page.type('input[class="form_day datepicker hasDatepicker"]', data.entryDate);
      
    }

    if (data.flags) {
      for (let i = 0; i < data.flags.length; i++) {
        await page.evaluate((i) => {
          const flag = document.querySelectorAll('input[name="Cast_flag[]"]')[i - 1];
          if (flag) {
            flag.click();
          }
        }, data.flags[i]);
      }
    }

    await page.type('input[name="Cast[age]"]', data.age);
    await page.type('input[name="Cast[height]"]', data.height);
    await page.type('input[name="Cast[bust]"]', data.bust);
    await page.type('input[name="Cast[waist]"]', data.waist);
    await page.type('input[name="Cast[hip]"]', data.hip);

    await page.evaluate((cupValue)=> {
      document.querySelector('select[name="Cast[cup]"]').options[cupValue].selected = true;
    }, data.cup);

    //  Q&A
    for (let i = 0; i < 6; i++) {
      await page.focus(`input[name="Cast_freecontents[${i + 1}][content_name]"]`);
      await page.keyboard.down('Control');
      await page.keyboard.press('KeyA');
      await page.keyboard.up('Control');
      await page.type(`input[name="Cast_freecontents[${i + 1}][content_name]"]`, data[`question${i + 1}`]);
      await page.type(`input[name="Cast_freecontents[${i + 1}][content_detail]"]`, data[`answer${i + 1}`]);

    }

    await page.type('input[name="Cast[catchcopy]"]', data.catchCopy);

    await page.click('#cke_43');

    await page.type('#cke_1_contents > textarea', data.shopComment);

    if (data.selling_points) {
      for (let i=0; i<data.selling_points.length; i++) {
        await page.evaluate((i) => {
          const selling_point = document.querySelector(`input[name="Cast_setting[1][]"][value="${i}"]`); // ''ではなく``と&{}を使うことで変数を埋め込める
          if (selling_point) {
            selling_point.click();
            
          }
        }, data.selling_points[i]);
      }
    }

    //  パネルの登録
    await new Promise((resolve, reject)=> {
      panelRef.once('value', async(snapshot) => {
        const panelData = snapshot.val();
        if (panelData) {
          const panelLength = Object.keys(panelData).length;
          for (let i = 0; i < panelLength; i++) {
            const fileInputName = `cast_image_file_${i+1}`;
            const file_input = await page.$(`input[name="${fileInputName}"]`); // fileの選択
            const file_path = path.join(tempFolderPath, panelData[i + 1]);
            await file_input.uploadFile(file_path);

          }
        }
        resolve();
      });
    });

    await page.type('#redips-drag > form > table > tbody > tr:nth-child(30) > td > div > p.w85 > input', data.diary);

    await page.type('#redips-drag > form > table > tbody > tr:nth-child(31) > td > div > p.w85 > input', data.ogoto_guide);

    await page.type('#redips-drag > form > table > tbody > tr:nth-child(32) > td > div > p.w85 > input', data.x_account);

    await page.type('#redips-drag > form > table > tbody > tr:nth-child(33) > td > div > p.w85 > input', data.profile_url);

    await Promise.all ([
      page.waitForNavigation({waitUntil: 'load'}),
      page.click('input[name="edit"]'),
    ]);
    
    await content_logs.push({
      ohp: 'オフィシャル：登録完了'
    });

  } catch (error) {
    console.error(error.message);
    await content_logs.push({
      ohp: 'オフィシャル：エラー！'
    });

  }
}

module.exports = writeToOhp_addGirl;