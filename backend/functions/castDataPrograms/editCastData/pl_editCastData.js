const { tempFolderPath } = require('../../setting/downloadImageFromFirebaseStorage');
const { conversion_kanaToHira } = require('../../setting/conversion_character');
const article_extraction = require('../../setting/article_extraction');
const setTimeout = require('node:timers/promises').setTimeout;
const writeToPl_addGirl = require('../addCastData/pl_AG');
const getLoginInfo = require('../../setting/externalSiteInfo');
const { db } = require('../../../utils/firebaseUtils');
const checkAndResizeImage = require('../../setting/resizeImagesProgram');
const path = require('path');

const editCastToPl = async(accountKey, data, panelRef, logId, page) => {

  const content_logs = db.ref(`users/${accountKey}/logs/girls_log/${logId}/content_logs`);
  const { id, pass, loginUrl } = await getLoginInfo(accountKey, 'pl');

  try {

    await page.goto(loginUrl);
    await page.type( 'input[name="id"]', id);
    await page.type('input[name="password"]', pass);
    await Promise.all([
      page.waitForNavigation({waitUntil: 'load'}),
      page.click('#form_submit > input[type="image"]'),
    ]);

    await page.waitForSelector('#sidenavi-girl > ul > li:nth-child(2) > a');
    const girlsListLink = await page.$('#sidenavi-girl > ul > li:nth-child(2) > a');
    await girlsListLink.evaluate(el => el.scrollIntoView({ block: 'center' }));
    await girlsListLink.click();
    await page.waitForSelector('.girlsList_right');

    //  女の子検索
    try {
      await page.evaluate((castName) =>{
        let found = false;
        const listItems = document.querySelectorAll('div.girlsList_right');
        listItems.forEach((item) => {
          const nameElement = item.querySelector('div.pdLeft05 > p > a > b');
          if (nameElement.textContent.trim() === castName) {
            const editBtn = item.querySelector('div.row.flex:nth-child(2) > button');
            editBtn.click();
            found = true;
          }
        });
  
        if (!found) {
          throw new Error('Cast not found');
        
        }
      }, data.castName);
    } catch (error) {
      await writeToPl_addGirl(accountKey, data, panelRef, logId, page);
      return; 
      
    }
    
    //  登録されている情報の消去
    await page.waitForSelector('input[type="text"]');
    await page.evaluate(() => {
      const inputs = document.querySelectorAll('input[type="text"], textarea');
      inputs.forEach((input) => {
        input.value = '';
      })
    });

    //  編集内容登録
    const nameElement = await page.$('#form1 > div > table > tbody > tr:nth-child(1)');
    await nameElement.evaluate(el => el.scrollIntoView({ block: 'center' }));
    await page.type('input[name="name"]', data.castName);
    await setTimeout(500);

    await page.type('input[name="name_kana"]', conversion_kanaToHira(data.castName));
    await setTimeout(500);
    await page.type('#word', data.catchCopy);
    await setTimeout(500);

    if (data.entryDate) {
      const [year, month, day] = data.entryDate.split('-');
      await page.select('#year', year);
      await setTimeout(500);
      await page.evaluate((selectMonth, selectDay)=> {
        // 整数を作る
        function integer(days) {
          return parseInt(days, 10).toString();
        
        }
        document.querySelector('#month').options[integer(selectMonth)].selected = true;
        document.querySelector('#day').options[integer(selectDay)].selected = true;
      
      }, month, day);
    }
    
    const ageElement = await page.$('#form1 > div > table > tbody > tr:nth-child(6)');
    await ageElement.evaluate(el => el.scrollIntoView({ block: 'center' }));
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
    await setTimeout(500);
    
    if (data.smoking === '1') {
      await page.click('#girl_smoke1');
    } else if (data.smoking === '2') {
      await page.click('#girl_smoke2');
    }
    await setTimeout(500);

    if (data.drink === '1') {
      await page.click('#girl_drink1');
    } else if (data.drink === '2') {
      await page.click('#girl_drink2');
    } else if (data.drink === '3') {
      await page.click('#girl_drink3')
    }
    await setTimeout(500);

    const shopComment = await page.$('#shop_comment');
    await shopComment.evaluate(el => el.scrollIntoView({ block: 'center' }));
    await shopComment.type(article_extraction(data.shopComment));
    await setTimeout(500);
    
    await page.type('#girl_comment', article_extraction(data.girlComment));
    await setTimeout(500);

    if (data.situation === 'public') {
      await page.click('#girl_state1');
    } else {
      await page.click('#girl_state2');
    }
    await setTimeout(500);
    
    const submitBtn = await page.$('#form1 > div > div > p > input[type=submit]');
    await submitBtn.evaluate(el => el.scrollIntoView({ block: 'center' }));
    await setTimeout(5000);
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
      submitBtn.click()
    ]);

    const confirmationBtn = await page.$('#form1 > div > div > p > input[type="submit"]:nth-child(4)');
    await confirmationBtn.evaluate(el => el.scrollIntoView({ behavior: 'smooth', block: 'center' }));
    await setTimeout(5000);
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
      confirmationBtn.click()
    ]);

    await page.waitForSelector('#sidenavi-girl > ul > li:nth-child(2) > a');
    const girlsListLink2 = await page.$('#sidenavi-girl > ul > li:nth-child(2) > a');
    await girlsListLink2.evaluate(el => el.scrollIntoView({ block: 'center' }));
    await girlsListLink2.click();
    await page.waitForSelector('.girlsList_right');

    //  再度女の子検索
    await page.evaluate((castName) =>{
      const listItems = document.querySelectorAll('div.girlsList_right');
      listItems.forEach((item) => {
        const nameElement = item.querySelector('div.pdLeft05 > p > a > b');
        if (nameElement.textContent.trim() === castName) {
          const tagEditBtn = item.querySelector('div.row:nth-child(4) > div > input[type=button]');
          tagEditBtn.click();

        }
      });
    }, data.castName);
    await page.waitForSelector('#submit_button_main');
    const submitBtnMain = await page.$('#submit_button_main');

    // タグ・特徴の登録
    if (data.pl_selling_points[0].label !== '' ) {

      await page.evaluate(() => {
        const selling_pointBtns = document.querySelectorAll('li > input[type="checkbox"]');
        selling_pointBtns.forEach((btn) => {
          if (btn.checked === true) {
            btn.click();
          }
        });
      });

      for (let i = 0; i < data.pl_selling_points.length; i++) {
        await page.evaluate((index) => {
          const selling_point = document.querySelector(`#main_tag-${index}`);
          selling_point.click();
        }, data.pl_selling_points[i].value);
        await setTimeout(500);
      }

      await submitBtnMain.evaluate(el => el.scrollIntoView({ block: 'center' }));
      await submitBtnMain.click();
    } else {

      await page.evaluate(() => {
        const selling_pointBtns = document.querySelectorAll('li > input[type="checkbox"]');
        selling_pointBtns.forEach((btn) => {
          if (btn.checked === true) {
            btn.click();
          }
        });
      });

      await submitBtnMain.evaluate(el => el.scrollIntoView({ block: 'center' }));
      await submitBtnMain.click();
    }
    
    const girlsListLink3 = await page.$('#sidenavi-girl > ul > li:nth-child(2) > a');
    await girlsListLink3.evaluate(el => el.scrollIntoView({ block: 'center' }));
    await Promise.all([
      page.waitForNavigation({waitUntil: 'networkidle2'}),
      girlsListLink3.click()
    ]);

    await new Promise((resolve, reject)=> {
      panelRef.once('value', async(snapshot) => {

        //  再度女の子検索
        await page.evaluate((castName) =>{
          const listItems = document.querySelectorAll('div.girlsList_right');
          listItems.forEach((item) => {
            const nameElement = item.querySelector('div.pdLeft05 > p > a > b');
            if (nameElement.textContent.trim() === castName) {
              const imgEditBtn = item.querySelector('div.row.flex:nth-child(2) > div > input[type=button]');
              imgEditBtn.click();
            }
          });
        }, data.castName);
        try {
          await page.waitForSelector('#fileupload');
          const updateBtn = await page.$('#form1 > div > div > p > input[type="button"]');

          //  パネル登録
          const imgElements = await page.$$('tr.t_on');

          //  一度全削除
          if (imgElements) {
            for (const imgElement of imgElements) {
              const imgDeleteBtn = await imgElement.$('td:nth-child(1) > a');
              await imgDeleteBtn.evaluate(el => el.scrollIntoView({ block: 'center' }));
              await imgDeleteBtn.click();
              await setTimeout(2000);

            }
          }
            
          const panelData = snapshot.val();
          if (panelData) {
            const panelLength = Math.min(Object.keys(panelData).length, 5);

            //  登録
            for (let i = 0; i < panelLength; i++) {
              const file_input = await page.$('input[name="upload_file[]"]');
              const file_path = path.join(tempFolderPath, panelData[i + 1]);
              //  ファイルサイズをチェックして必要ならリサイズ
              const uploadFilePath = await checkAndResizeImage(file_path, tempFolderPath, panelData, i, 1000);
              //  アップロード処理
              await file_input.uploadFile(uploadFilePath);
              await setTimeout(2000);

            }

            await updateBtn.evaluate(el => el.scrollIntoView({ block: 'center' }));
            
            await Promise.all([
              page.waitForNavigation({waitUntil: 'networkidle2'}),
              updateBtn.click()

            ]);

            await page.waitForSelector('#edit_girl_photo');
            
          } else {
            await updateBtn.evaluate(el => el.scrollIntoView({ block: 'center' }));
            await Promise.all([
              page.waitForNavigation({waitUntil: 'networkidle2'}),
              updateBtn.click()
              
            ])
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

    await page.waitForSelector('#shop_main > div.end > div.endReturn > ul > li:nth-child(2) > a');
    await Promise.all([
      page.waitForNavigation({waitUntil:'load'}),
      page.click('#shop_main > div.end > div.endReturn > ul > li:nth-child(2) > a'),
    ]);

    await setTimeout(2000);
    await content_logs.push({
      pl: 'ぴゅあらば：編集完了'
    });

  } catch (error) {

    console.error(error.message);
    await content_logs.push({
      pl: 'ぴゅあらば：エラー！'
    });

  }
}

module.exports = editCastToPl;