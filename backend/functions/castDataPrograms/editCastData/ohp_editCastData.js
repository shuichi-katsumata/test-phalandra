const { tempFolderPath } = require('../../setting/downloadImageFromFirebaseStorage');
const writeToOhp_addGirl = require('../addCastData/ohp_AG');
const getLoginInfo = require('../../setting/externalSiteInfo');
const { db } = require('../../../utils/firebaseUtils');
const path = require('path');

const editCastToOhp = async(accountKey, data, panelRef, logId, page) => {

  const content_logs = db.ref(`users/${accountKey}/logs/girls_log/${logId}/content_logs`);
  const { id, pass, loginUrl } = await getLoginInfo(accountKey, 'ohp');
  
  try {

    await page.goto(loginUrl);
    await page.type('input[name=id]', id);
    await page.type('input[name=password]', pass);
    await Promise.all([
      page.waitForNavigation({waitUntil: 'load'}),
      page.click('input[type=submit]'),
    ]);

    await Promise.all([
      page.waitForNavigation({waitUntil:'load'}),
      page.click('#g_navi > ul > li:nth-child(5) > a'),
    ]);

    //  女の子検索
    const castSearch = await page.evaluate((castName) => {
      let castSearch = false;
      const listItems = document.querySelectorAll('li.ui-sortable-handle');

      listItems.forEach((item) => {
        const nameElement = item.querySelector('p.name > a');
        if (nameElement.textContent.trim() === castName) {
          const editBtn = item.querySelector('p.edit > a');
          editBtn.click();
          castSearch = true;
        }
      });

      return castSearch;

    }, data.castName);

    if (!castSearch) {
      await Promise.all([
        page.waitForNavigation({waitUntil: 'load'}),
        page.click('#s_navi > ul > li:nth-child(2) > a'),
      ]);

      try {

        await page.evaluate((castName) => {
          const listItems = document.querySelectorAll('li.off');
          let found = false;

          listItems.forEach((item) => {
            const nameElement = item.querySelector('p.name');
            if (nameElement.textContent.trim() === castName) {
              const editBtn = item.querySelector('p.edit > a');
              editBtn.click();
              found = true;
            }
          });

          if (!found) {
            throw new Error('Cast not found');

          }
        }, data.castName);
      } catch (error) {
        //  ログアウトしてから追加処理プログラムを動かす
        await page.click('#login_info > ul > li:nth-child(2) > a');
        await writeToOhp_addGirl(accountKey, data, panelRef, logId, page);
        return;
        
      }
    }

    await page.waitForNavigation({waitUntil: 'load'});

    //  登録していた情報の消去
    await page.evaluate(() => {
      const inputs = document.querySelectorAll('input[type="text"]');
      inputs.forEach((input) => {
        input.value = '';
      });
      const checkedCheckboxes = document.querySelectorAll('input[type=checkbox]:checked');
      if (checkedCheckboxes) {
        checkedCheckboxes.forEach((checkbox) => {
          checkbox.checked = false;
        });
      }

      //  テキストエディタの登録情報消去
      const iframe = document.querySelector('iframe.cke_wysiwyg_frame');
      const doc = iframe.contentDocument || iframe.contentWindow.document;
      doc.body.innerHTML = '';
    });

    //  プロフィール再登録
    if (data.situation !== 'public') {
      await page.click('#redips-drag > form > table > tbody > tr:nth-child(2) > td > ul > li:nth-child(2) > label > input[type=radio]');
    }

    await page.type('input[name="Cast[name]"]', data.castName);

    if (data.entryDate) {
      await page.type('input[class="form_day datepicker hasDatepicker"]', data.entryDate);

    }

    if (data.flags[0].label !== '') {
      for (let i = 0; i < data.flags.length; i++) {
        await page.evaluate((i) => {
          const flag = document.querySelector(`input[name="Cast_flag[]"][value="${i - 1}"]`);

          if (flag) {
            flag.checked = true;
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

    if (data.selling_points[0].label !== '') {
      for (let i = 0; i < data.selling_points.length; i++) {
        await page.evaluate((i) => {
          const selling_point = document.querySelector(`input[name="Cast_setting[1][]"][value="${i}"]`);
          if (selling_point) {
            selling_point.checked = true;
          }
        }, data.selling_points[i]);
      }
    }

    //  パネル登録
    await new Promise((resolve, reject)=> {
      panelRef.once('value', async(snapshot) => {
        const panelData = snapshot.val();
        if (panelData) {
          const panelLength = Object.keys(panelData).length;
          for (let i = 0; i < panelLength; i++) {
            const fileInputName = `cast_image_file_${i + 1}`;
            const file_input = await page.$(`input[name="${fileInputName}"]`); // fileの選択
            const file_path = path.join(tempFolderPath, panelData[i + 1]);
            await file_input.uploadFile(file_path);

          }
          await page.evaluate((panelLength) => {
            for (let i = panelLength; i < 10; i++) {
              const imgDeleteBtns = document.querySelectorAll(`input[name="del_cast_image_file_${i + 1}"]`);
              if (imgDeleteBtns) {
                imgDeleteBtns.forEach((btn) => {
                  btn.click();
            
                });
              }
            }
          }, panelLength);
        } else {
          await page.evaluate(() => {
            const imgDeleteBtns = document.querySelectorAll('p.del > label > input[type=checkbox]');
            if (imgDeleteBtns) {
              imgDeleteBtns.forEach((btn) => {
                btn.click();

              });
            }
          });
        }
        resolve();
      });
    });

    await page.type('#redips-drag > form > table > tbody > tr:nth-child(30) > td > div > p.w85 > input', data.diary);

    await page.type('#redips-drag > form > table > tbody > tr:nth-child(31) > td > div > p.w85 > input', data.ogoto_guide);

    await page.type('#redips-drag > form > table > tbody > tr:nth-child(32) > td > div > p.w85 > input', data.x_account);

    await page.type('#redips-drag > form > table > tbody > tr:nth-child(33) > td > div > p.w85 > input', data.profile_url);

    await Promise.all([
      page.waitForNavigation({waitUntil: 'load'}),
      page.click('input[name="edit"]'),
    ]);

    await content_logs.push({
      ohp: 'オフィシャル：編集完了'
    });

  } catch (error) {
    
    console.error(error.message);
    await content_logs.push({
      ohp: 'オフィシャル：エラー！'
    });

  }
}
module.exports = editCastToOhp;