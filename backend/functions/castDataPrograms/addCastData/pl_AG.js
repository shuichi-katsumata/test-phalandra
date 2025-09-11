const { tempFolderPath } = require('../../setting/downloadImageFromFirebaseStorage');
const { conversion_kanaToHira } = require('../../setting/conversion_character');
const article_extraction = require('../../setting/article_extraction');
const setTimeout = require('node:timers/promises').setTimeout;
const getLoginInfo = require('../../setting/externalSiteInfo');
const { db } = require('../../../utils/firebaseUtils');
const checkAndResizeImage = require('../../setting/resizeImagesProgram');
const path = require('path');

const writeToPl_addGirl = async(accountKey, data, panelRef, latestKey, page) => {

  const content_logs = db.ref(`users/${accountKey}/logs/girls_log/${latestKey}/content_logs`);
  const { id, pass, loginUrl } = await getLoginInfo(accountKey, 'pl');

  try {

    await page.goto(loginUrl);
    await page.type( 'input[name="id"]', id);
    await page.type('input[name="password"]', pass);
    await page.click('#form_submit > input[type="image"]');

    await page.waitForSelector('#sidenavi-girl > ul > li:nth-child(1) > a');
    const girlsAddLink = await page.$(`#sidenavi-girl > ul > li:nth-child(1) > a`);
    await girlsAddLink.evaluate(el => el.scrollIntoView());
    await girlsAddLink.click();

    await page.waitForSelector('input[name="name"]');
    await page.type('input[name="name"]', data.castName);
    await setTimeout(500);

    await page.type('input[name="name_kana"]', conversion_kanaToHira(data.castName));
    await setTimeout(500);

    await page.type('#word', data.catchCopy);
    await setTimeout(500);

    if (data.entryDate) {
      const [year, month, day] = data.entryDate.split('-');
      await page.select('#year', year);
      await page.evaluate((selectMonth, selectDay)=> {

        // 整数を作る
        function integer(days) {
          return parseInt(days, 10).toString();
        }

        document.querySelector('#month').options[integer(selectMonth)].selected = true;
        document.querySelector('#day').options[integer(selectDay)].selected = true;
      
      }, month, day);
      await setTimeout(500);
    
    }

    await page.type('input[name="age"]', data.age);
    await setTimeout(500);

    await page.type('input[name="height"]', data.height);
    await setTimeout(500);

    await page.type('input[name="bust"]', data.bust);
    await setTimeout(500);

    await page.type('input[name="waist"]', data.waist);
    await setTimeout(500);

    await page.type('input[name="hip"]', data.hip);
    await setTimeout(500);

    await page.evaluate((cupValue)=> {
      if (cupValue >= 14) {
        document.querySelector('#cup').options[14].selected = true;

      } else {
        document.querySelector('#cup').options[cupValue].selected = true;
      
      }
    }, data.cup);

    if (data.smoking === '1') {
      await page.click('#girl_smoke1');
      await setTimeout(500);

    } else if (data.smoking === '2') {
      await page.click('#girl_smoke2');
      await setTimeout(500);

    }

    if (data.drink === '1') {
      await page.click('#girl_drink1');
      await setTimeout(500);

    } else if (data.drink === '2') {
      await page.click('#girl_drink2');
      await setTimeout(500);

    } else if (data.drink === '3') {
      await page.click('#girl_drink3');
      await setTimeout(500);

    }

    await page.type('#shop_comment', article_extraction(data.shopComment));
    await setTimeout(500);

    await page.type('#girl_comment', article_extraction(data.girlComment));
    await setTimeout(500);

    if (data.situation !== 'public') {
      await page.click('#girl_state2');
      await setTimeout(500);
      
    }

    const confirmationBtn = await page.$('#form1 > div.editArea > div > div > p > input[type="submit"]');
    await confirmationBtn.evaluate(el => el.scrollIntoView({ behavior: 'smooth', block: 'center' }));
    await setTimeout(5000);
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
      confirmationBtn.click()
    ]);

    const submitBtn = await page.waitForSelector('#form1 > div > div > p > input[type="submit"]:nth-child(4)');
    await submitBtn.evaluate(el => el.scrollIntoView({ behavior: 'smooth', block: 'center' }));
    await setTimeout(5000);
    await Promise.all([
      page.waitForNavigation({waitUntil: 'networkidle2'}),
      submitBtn.click()
    
    ]);

    // パネル登録
    await page.waitForSelector('#edit_girl_photo');
    await new Promise((resolve, reject)=> {
      panelRef.once('value', async(snapshot) => {
        try {
          const panelData = snapshot.val();
          if (panelData) {
            await page.click('#edit_girl_photo');
            await page.waitForSelector('#fileupload');
            const panelLength = Math.min(Object.keys(panelData).length, 5);
            for (let i = 0; i < panelLength; i++) {
              const file_input = await page.$('input[name="upload_file[]"]');
              const file_path = path.join(tempFolderPath, panelData[i + 1]);
              //  ファイルサイズをチェックして必要ならリサイズ
              const uploadFilePath = await checkAndResizeImage(file_path, tempFolderPath, panelData, i, 1000);
              //  アップロード処理
              await file_input.uploadFile(uploadFilePath);
              await setTimeout(2000);

            }

            const updateBtn = await page.$('#form1 > div > div > p > input[type="button"]');
            await updateBtn.evaluate(el => el.scrollIntoView({ block: 'center' }));
            await updateBtn.click();
            await setTimeout(3000);
            await page.waitForSelector('#edit_girl_photo');

          }
          resolve();

        } catch(error) {
          await content_logs.push({
            pl: 'ぴゅあらば：エラー！'
          
          });
          resolve();

        }
      });  
    });

    await page.click('#sidenavi-girl > ul > li:nth-child(2) > a');
    await page.waitForSelector('#girlsList');

    // タグ・特徴の登録
    if (data.pl_selling_points[0].label !== '') {
      await page.evaluate((data)=> {
        const listItem = document.querySelectorAll('.girlsList_right');
        listItem.forEach(girl => {
          const nameElement = girl.querySelector('b');
          if (nameElement.textContent.trim() === data.castName) {
            const tagButton = girl.querySelector('input[value="タグ・特徴"]');
            if (tagButton) {
              tagButton.click();
    
            }
          }
        });
      }, data);
    
      await page.waitForSelector('#submit_button_main');

      for (let i = 0; i < data.pl_selling_points.length; i++) {
        await page.evaluate((index) => {
          const selling_point = document.querySelector(`#main_tag-${index}`);
          if (selling_point) {
            selling_point.click();
    
          }
        }, data.pl_selling_points[i].value);
        await setTimeout(500);
    
      }

      const submitBtnMain = await page.$('#submit_button_main');
      await submitBtnMain.evaluate(el => el.scrollIntoView({ block: 'center' }));
      await submitBtnMain.click();
    
    }
    await setTimeout(2000);

    await content_logs.push({
      pl: 'ぴゅあらば：登録完了'
    
    });
  } catch (error) {
    console.error(error.message);
    await content_logs.push({
      pl: 'ぴゅあらば：エラー！'
    
    });
  }
}

module.exports = writeToPl_addGirl;