const { tempFolderPath } = require('../../setting/downloadImageFromFirebaseStorage');
const article_extraction = require('../../setting/article_extraction');
const setTimeout = require('node:timers/promises').setTimeout;
const getLoginInfo = require('../../setting/externalSiteInfo');
const { db } = require('../../../utils/firebaseUtils');
const path = require('path');
const checkAndResizeImage = require('../../setting/resizeImagesProgram');

const writeToEc_addGirl = async(accountKey, data, panelRef, latestKey, page) => {

  const content_logs = db.ref(`users/${accountKey}/logs/girls_log/${latestKey}/content_logs`);
  const { id, pass, loginUrl } = await getLoginInfo(accountKey, 'ec');

  try {

    if (data.situation === 'public') {  //  キャストの非表示がないので、publicの時だけ登録する。

      await page.goto(loginUrl);
      //  女の子編集で見つからなかった時に一度ログアウトするが、IDとパスワードが残っているので消す
      await page.evaluate(() => {
        const inputs = document.querySelectorAll('input[type="text"], input[type="password"]');
        inputs.forEach((input) => {
          input.value = '';
        });
      });
      await page.type( '#form_email', id);
      await page.type('#form_password', pass);
      await Promise.all([
        page.waitForNavigation({waitUntil:'load'}),
        page.click('#form_submit'),
      ]);
      
      await page.goto('https://ranking-deli.jp/admin/girls/create/');
      await page.waitForSelector('#form_name');

      await page.type('#form_name', data.castName);

      await page.evaluate((cupValue)=> {
        document.querySelector('#form_cup').options[cupValue].selected = true;

      }, data.cup);

      await page.type('#form_catchcopy', data.catchCopy);
      await page.type('#form_age', data.age);
      await page.type('#form_tall', data.height);
      await page.type('#form_waist', data.waist);
      await page.type('#form_bust', data.bust);
      await page.type('#form_hip', data.hip);
      await page.type('#form_girl_comments', article_extraction(data.girlComment));
      await page.type('#form_comments', article_extraction(data.shopComment));

      //  Q&A
      for (let i = 0; i < 10; i++) {
        await page.focus(`input[name="questions[${i + 1}]"]`);
        await page.keyboard.down('Control');
        await page.keyboard.press('KeyA');
        await page.keyboard.up('Control');
        await page.type(`input[name="questions[${i + 1}]"]`, data[`question${i + 1}`]);
        await page.type(`input[name="answers[${i + 1}]"]`, data[`answer${i + 1}`]);

      }

      //  タグの選択(必須項目なので、Phalandraで選択されていない事は無い)
      for (let i = 0; i < data.ec_selling_points.length; i++) {
        await page.evaluate((i) => {
          const selling_point = document.querySelector(`#genre${i}`);
          if (selling_point) {
            selling_point.click();
          
          }
        }, data.ec_selling_points[i].value);
      }

      await page.click('#form_update-btn');

      await page.waitForSelector('a.boxer.modal-open[data-target="con1"]');

      // パネル登録
      await new Promise((resolve, reject)=> {
        panelRef.once('value', async(snapshot) => {
          const panelData = snapshot.val();
          if (panelData) {
            const panelLength = Math.min(Object.keys(panelData).length, 4);
            for (let i = 0; i < panelLength; i++) {
              await page.click(`a.boxer.modal-open[data-target="con${i + 1}"]`);
              await setTimeout(5000);
              const file_input = await page.$(`#con${i + 1} input[name=upfile]`);
              const file_path = `${tempFolderPath}\\${panelData[i + 1]}`;

              //  ファイルサイズをチェックして必要ならリサイズ
              const uploadFilePath = await checkAndResizeImage(file_path, tempFolderPath, panelData, i, 1000);
              
              //  アップロード処理
              await file_input.uploadFile(uploadFilePath);
              await page.waitForSelector(`#con${i + 1} #upload-form > div > button`);
              await page.click(`#con${i + 1} #upload-form > div > button`);
              await page.waitForSelector(`#con${i + 1} .jcrop-holder`);
              await page.evaluate((index)=> {
                const jcropHolder = document.querySelector(`#con${index + 1} > div > div.ubox_3 > div > div:nth-child(1)`);
                const jcropHolderImg = document.querySelector(`#con${index + 1} > div > div.ubox_3 > div > div:nth-child(1) > div:nth-child(1) > img`);
                const jcropHolderX = document.querySelector(`#con1 #x`); // ここはcon1の#check-coordsの#x,y,w,hでそれぞれ設定されるみたい。
                const jcropHolderY = document.querySelector(`#con1 #y`);
                const jcropHolderW = document.querySelector(`#con1 #w`);
                const jcropHolderH = document.querySelector(`#con1 #h`);
                if(jcropHolder) {
                  jcropHolder.style.width = '300px';
                  jcropHolder.style.height = '300px';
                  jcropHolder.style.top = '0px';
                  jcropHolder.style.left = '0px';
                  jcropHolderImg.style.top = '0px';
                  jcropHolderImg.style.left = '0px';
                  jcropHolderX.value = '0';
                  jcropHolderY.value = '0';
                  jcropHolderW.value = '300';
                  jcropHolderH.value = '300';

                }
              }, i);
              await page.click(`#con${i + 1} #check-coords > input.btn`);
              await page.waitForNavigation();
            
            }
          } else {
            await page.click('a.boxer.modal-open[data-target="con1"]');
            await setTimeout(3000);
            const file_input = await page.$('#con1 input[name=upfile]');
            const file_path = path.resolve(__dirname, '../../../images/no_photo.jpg');
            await file_input.uploadFile(file_path);
            await page.waitForSelector('#con1 #upload-form > div > button');
            await page.click('#con1 #upload-form > div > button');
            await page.waitForSelector('#con1 .jcrop-holder');
            await page.evaluate(()=> {
              const jcropHolder = document.querySelector('#con1 > div > div.ubox_3 > div > div:nth-child(1)');
              const jcropHolderImg = document.querySelector('#con1 > div > div.ubox_3 > div > div:nth-child(1) > div:nth-child(1) > img');
              const jcropHolderX = document.querySelector('#con1 #x'); // ここはcon1の#check-coordsの#x,y,w,hでそれぞれ設定されるみたい。
              const jcropHolderY = document.querySelector('#con1 #y');
              const jcropHolderW = document.querySelector('#con1 #w');
              const jcropHolderH = document.querySelector('#con1 #h');
              if(jcropHolder) {
                jcropHolder.style.width = '300px';
                jcropHolder.style.height = '300px';
                jcropHolder.style.top = '50px';
                jcropHolder.style.left = '0px';
                jcropHolderImg.style.top = '-50px';
                jcropHolderImg.style.left = '0px';
                jcropHolderX.value = '0';
                jcropHolderY.value = '50';
                jcropHolderW.value = '300';
                jcropHolderH.value = '300';

              }
            });

            await Promise.all([
              page.waitForNavigation({waitUntil:'load'}),
              page.click('#con1 #check-coords > input[type="submit"]'),
            
            ]);
          }
          resolve();
        });
      });

      await content_logs.push({
        ec: '駅ちか：登録完了'
      
      });
    } else {
      await content_logs.push({
        ec: '駅ちか：非表示設定がないため登録されませんでした'
      
      });
    }
  } catch (error) {
    console.error(error.message);
    await content_logs.push({
      ec: '駅ちか：エラー！'
    
    });
  }
}

module.exports = writeToEc_addGirl;