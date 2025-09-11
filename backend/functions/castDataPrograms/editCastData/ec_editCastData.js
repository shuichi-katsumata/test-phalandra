const { tempFolderPath } = require('../../setting/downloadImageFromFirebaseStorage');
const article_extraction = require('../../setting/article_extraction');
const setTimeout = require('node:timers/promises').setTimeout;
const writeToEc_addGirl = require('../addCastData/ec_AG');
const getLoginInfo = require('../../setting/externalSiteInfo');
const { db } = require('../../../utils/firebaseUtils');
const path = require('path');
const checkAndResizeImage = require('../../setting/resizeImagesProgram');

const editCastToEc = async(accountKey, data, panelRef, logId, page) => {

  const content_logs = db.ref(`users/${accountKey}/logs/girls_log/${logId}/content_logs`);
  const { id, pass, loginUrl } = await getLoginInfo(accountKey, 'ec');

  try {
    
    await page.goto(loginUrl);
    await page.type( '#form_email', id);
    await page.type('#form_password', pass);
    await Promise.all([
      page.waitForNavigation({waitUntil:'load'}),
      page.click('#form_submit'),
    ]);
    
    await page.goto('https://ranking-deli.jp/admin/girls/');

    if (data.situation === 'public') {  //  キャストの非表示がないので、publicの時だけ登録する。

      //  女の子検索
      const castSearch = await page.evaluate((castName) => {
        let castSearch = false;
        const listItems = document.querySelectorAll('li.girls-cell');
        listItems.forEach((item) => {
          const nameElement = item.querySelector('p.girl-name');
          if (nameElement.textContent.trim() === castName) {
            const editBtn = item.querySelector('div.girl-btn > a:nth-child(1)');
            editBtn.click();
            castSearch = true;
          }
        });
        return castSearch;
      }, data.castName);

      if (!castSearch) {
        //  検索に名前がなかったら、ログアウトして追加処理する
        await page.click('#hdr_bt > ul > li.statebtn > a');
        await setTimeout(3000);
        await writeToEc_addGirl(accountKey, data, panelRef, logId, page);
        return;
      }

      await page.waitForSelector('#form_name');

      // パネル登録(新規追加時、パネル登録がないとエラーが出るため、パネル変更を最初に実行する)
      await new Promise((resolve, reject)=> {
        panelRef.once('value', async(snapshot) => {
          const panelData = snapshot.val();
          //  全パネル削除（消す毎にページが読み込まれるので、同時にプロフィールを変更することが出来ないので注意）
          await page.evaluate(() => {
            const imgListItems = document.querySelectorAll('ul.img_signup > li');
            imgListItems.forEach((item) => {
              const imgDeleteBtn = item.querySelector('ul > li.delete > form > button');
              if (imgDeleteBtn) {
                imgDeleteBtn.click();
              }
            });
          });

          await page.waitForNavigation({waitUntil: 'load'});

          if (panelData) {
            //  パネル再登録
            const panelLength = Math.min(Object.keys(panelData).length, 4);
            for (let i = 0; i < panelLength; i++) {
              await page.click(`a.boxer.modal-open[data-target="con${i + 1}"]`);
              await setTimeout(3000);
              const file_input = await page.$(`#con${i + 1} input[name=upfile]`);
              const file_path = path.join(tempFolderPath, `${panelData[i+1]}`);
              //  ファイルサイズをチェックして必要ならリサイズ
              const uploadFilePath = await checkAndResizeImage(file_path, tempFolderPath, panelData, i, 1000);
              //  アップロード処理
              await file_input.uploadFile(uploadFilePath);
              await page.waitForSelector(`#con${i + 1} #upload-form > div > button`);
              await page.click(`#con${i + 1} #upload-form > div > button`);
              await page.waitForSelector(`#con${i + 1} .jcrop-holder`);

              const thmbElement = await page.$(`#con${i + 1} > div > div.ubox_2`);
              const isVisible = await page.evaluate(el => el.style.display === 'block', thmbElement);
              if (isVisible) {
                
                await page.evaluate((index)=> {
                  const jcropHolder = document.querySelector(`#con${index + 1} > div > div.ubox_2 > div`);
                  const jcropHolderImg = document.querySelector(`#con${index + 1} > div > div.ubox_2 > div > img`);
                  const jcropHolderX = document.querySelector(`#con1 #m_x`); // ここはcon1の#check-coordsの#x,y,w,hでそれぞれ設定されるみたい。
                  const jcropHolderY = document.querySelector(`#con1 #m_y`);
                  const jcropHolderW = document.querySelector(`#con1 #m_w`);
                  const jcropHolderH = document.querySelector(`#con1 #m_h`);

                  if(jcropHolder) {
                    jcropHolder.style.width = '375px';
                    jcropHolder.style.height = '500px';
                    jcropHolder.style.top = '0px';
                    jcropHolder.style.left = '0px';
                    jcropHolderImg.style.top = '0px';
                    jcropHolderImg.style.left = '0px';
                    jcropHolderX.value = '0';
                    jcropHolderY.value = '0';
                    jcropHolderW.value = '375';
                    jcropHolderH.value = '500';

                  }
                }, i);

                await page.evaluate((index) => {
                  const btn = document.querySelector(`#con${index + 1} #check-coords1 > input.btn`);
                  if (btn) btn.click();
                }, i);
                
                await page.waitForFunction((index) => {
                  const el = document.querySelector(`#con${index + 1} div.ubox_3`);
                  return el && window.getComputedStyle(el).display === 'block';

                }, { timeout: 30000 }, i);
              }
              
              await setTimeout(3000);
              await page.evaluate((index)=> {
                const jcropHolder = document.querySelector(`#con${index + 1} > div > div.ubox_3 > div > div:nth-child(1)`);
                const jcropHolderX = document.querySelector(`#con1 #x`); // ここはcon1の#check-coordsの#x,y,w,hでそれぞれ設定されるみたい。
                const jcropHolderY = document.querySelector(`#con1 #y`);
                const jcropHolderW = document.querySelector(`#con1 #w`);
                const jcropHolderH = document.querySelector(`#con1 #h`);

                if(jcropHolder) {
                  jcropHolder.style.width = '300px';
                  jcropHolder.style.height = '300px';
                  jcropHolder.style.top = '0px';
                  jcropHolder.style.left = '0px';
                  jcropHolderX.value = '0';
                  jcropHolderY.value = '0';
                  jcropHolderW.value = '300';
                  jcropHolderH.value = '300';

                }
              }, i);
              await setTimeout(3000);
              await page.evaluate((index) => {
                const btn = document.querySelector(`#con${index + 1} #check-coords > input.btn`);
                if (btn) btn.click();

              }, i);
              await page.waitForNavigation(); 

            }
          } else {
            //  一枚目だけ消せない仕様なので、No image画像をセット
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

      //  登録していた情報の消去
      await page.evaluate(() => {
        const inputs = document.querySelectorAll('input[type="text"], textarea');
        const selling_points = document.querySelectorAll('li.check3, li.check4, li.check5, li.check6, li.check7');
        inputs.forEach((input) => {
          input.value = '';
        });
        selling_points.forEach((selling_point) => {
          const checkedPoint = selling_point.querySelector('input[type="checkbox"]');
          if  (checkedPoint.checked === true) {
            checkedPoint.click();
          }
        });
      });

      await page.type('#form_name', data.castName);

      await page.evaluate((cupValue)=> {
        document.querySelector('#form_cup').options[cupValue].selected = true;
      }, data.cup);

      await page.type('#form_catchcopy', data.catchCopy);

      await page.type('#form_age', data.age);

      await page.type('#form_tall', data.height);

      await page.type('#form_bust', data.bust);

      await page.type('#form_waist', data.waist);

      await page.type('#form_hip', data.hip);

      await page.type('#form_girl_comments', article_extraction(data.girlComment));

      await page.type('#form_comments', article_extraction(data.shopComment));

      //  Q&A
      for (let i = 0; i < 10; i++) {
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

      await Promise.all([
        page.waitForNavigation({waitUntil: 'load'}),
        page.click('#form_update-btn'),
      ]);

      await content_logs.push({
        ec: '駅ちか：編集完了'
      });

    } else {

      //  非表示設定がないので、削除する
      const castSearch = await page.evaluate((castName) => {
        const listItems = document.querySelectorAll('li.girls-cell');
        let found = false;
        
        listItems.forEach((item) => {
          const nameElement = item.querySelector('p.girl-name');
          if (nameElement.textContent.trim() === castName) {
            const deleteBtn = item.querySelector('div.girl-btn > a:nth-child(2)');
            deleteBtn.click();
            found = true;
          }
        });
        return found;

      }, data.castName);

      if (castSearch) {
        content_logs.push({
          ec: '駅ちか：非表示設定がないため削除しました'
        });
      } else {
        content_logs.push({
          ec: '駅ちか：非表示設定がないため登録操作を行いませんでした'
        });
      }

    }
  } catch (error) {

    console.error(error.message);
    await content_logs.push({
      ec: '駅ちか：エラー！'
    });

  }
}

module.exports = editCastToEc;
