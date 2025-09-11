const puppeteer = require('puppeteer');
const getLoginInfo = require('../setting/externalSiteInfo');
const { bucket } = require('../../utils/firebaseUtils');
const path = require('path');
const importCastDataToFirebase = require('../castDataPrograms/importCastDataToFirebase');

const getCastData = async(accountKey, selectedCast) => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  const { id, pass, loginUrl } = await getLoginInfo(accountKey, 'ch');

  try {
    //  ログイン
    await page.goto(loginUrl);
    await page.type('input[style="font-family:tahoma;font-size: 20px;"]', id);
    await page.keyboard.press('Tab');
    await page.keyboard.type(pass);
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'load', timeout: 60000 }),
      page.click('body > div > form.oldLogin > table > tbody > tr:nth-child(2) > td > button'),
    ]);

    const castListPageLink = await page.$x("//a[normalize-space(text())='キャスト情報']");
    //  女の子情報タブをクリック
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'load', timeout: 60000 }),
      castListPageLink[0].click(),
    
    ]);

    //  女の子情報収集
    for (let index = 0; index < selectedCast.length; index++) {
      try {
        // 女の子を検索
        await page.evaluate((selectedCast) => {
          const listItems = document.querySelectorAll('#list > li');
          listItems.forEach((item) => {
            const nameElement =item.querySelector('div.galListData > h5');
            if (nameElement.textContent.trim() === selectedCast) {
              const editBtn = item.querySelector('div.galDataForm > input[type=button]:nth-child(1)');
              if (editBtn) {
                editBtn.click();
              }
            }
          });
        }, selectedCast[index]);

        await page.waitForNavigation({waitUntil: 'load', timeout: 60000});
      
      } catch(error) {
        continue;

      } 


      //  入店日
      const year = await page.$eval('input[name="sel_workyear"]', element => {
        return element.value;
      });
      const month = await page.$eval('input[name="sel_workmonth"]', element => {
        return element.value;
      });
      const day = await page.$eval('input[name="sel_workday"]', element => {
        return element.value;
      });
      const entryDate = year + '-' + month + '-' + day;
      //  入店経路
      const entryRoute = await page.$eval('#entry_route', element => { //  $ は、Puppeteerに「1つのもの（要素）を探してね！」ってお願いする命令で、$$ は、「たくさんのもの（要素）を探してね！」ってお願いする命令。eval は、「探してくれたものに対して何かをしてね！」というお願い。
        return element.value;
      });
      //  名前
      const castName = await page.$eval('input[name="girls_name"]', element => {
        return element.value;
      })
      //  キャッチコピー
      const catchCopy = await page.$eval('input[name="girls_catch"]', element => {
        return element.value;
      });
      //  タイプ
      const ch_type = await page.$eval('#sel_GirlType', element => {
        return element.value;
      });

      //  firebase storageに画像登録処理
      const noImgUrl = 'https://firebasestorage.googleapis.com/v0/b/phalandra-256-da694.appspot.com/o/noPhoto_panel%2Fno_photo.jpg?alt=media&token=3ac5cfde-1cea-413a-ad86-a915e27838d4';
      const baseUrl = 'https://newmanager.cityheaven.net';
      const fetch = await import('node-fetch').then(module => module.default);
      const panelURLs = [];
      const panels = [];

      //  storageに画像を登録
      const uploadImage = async(imgUrl, storagePath, retries = 3) => {

        try {

          //  画像の取得
          const response = await fetch(imgUrl);
          const arrayBuffer = await response.arrayBuffer(); //  これだけだと「バイナリデータの保存形式」で、ただの連結したデータの塊
          const buffer = Buffer.from(arrayBuffer);  //  ここでarrayBufferをNode.jsが扱いやすいBufferに変換する
          //  firebase storageにアップロード
          const file = bucket.file(storagePath);
          await file.save(buffer, {
            contentType: 'image/jpeg',
          });
          
          // パブリックにアクセス可能に設定
          await file.makePublic();
          //  画像urlの取得
          const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(storagePath)}?alt=media`;
          return publicUrl;

        } catch (error) {
          console.error(error.message);

          if (retries > 0) {
            console.log(`Retrying... (${3 - retries + 1})`);
            await new Promise(res => setTimeout(res, 2000)); // 2秒待機
            return uploadImage(imgUrl, storagePath, retries - 1); // リトライ

          } else {
            throw new Error('Failed to upload image after multiple retries.');
          }
        }
      }  

      //  ヘブンの画像URLを取得
      const imgUrls = await page.$$eval('li.girls_photo_list > div > img', elements => {
        return elements.map(el => {
          const src = el.src;
          return src.startsWith('http') ? src : baseUrl + src;

        });
      });  

      //  画像登録処理
      const firstUrl = imgUrls[0];
      const urlSegments = firstUrl.split('/');
      const filelNameSegment = urlSegments[urlSegments.length - 1];  //  画像urlの最後の部分を取得
      const prefix = filelNameSegment.substring(0, 4);  //  先頭4文字を取得

      //  対象キャストの画像フォルダがあれば削除
      const castDirectoryPath = `users/${accountKey}/add_girl/${selectedCast[index]}`
      async function deleteFilesInDirectory(path) {
        // ディレクトリ内の全ファイルとサブディレクトリも含めて取得
        const [files] = await bucket.getFiles({ prefix: path });

        if (files.length === 0) return;

        // すべて削除
        const deletePromises = files.map(file => file.delete());
        await Promise.all(deletePromises);

      }

      if (castDirectoryPath) {
        await deleteFilesInDirectory(castDirectoryPath);

      }
      
      if (prefix !== 'grpb') {  //  ヘブンのnoPHOTOのパネルがあてられてる時は画像urlの最後の部分の先頭がgrpbになっているので比較している（指定したパネルの場合はla_grpbになっている）
        for (let i = 0; i < imgUrls.length; i++) {
          let timestamp = Date.now();
          let fileName = `${selectedCast[index]}_${i + 1}_${timestamp}`;  //  タイムスタンプを入れてDBのpanelURLsに変更を入れる
          if (!path.extname(fileName)) {
            fileName += '.jpg';
          }
          panels.push(fileName);
          const uploadedUrl = await uploadImage(imgUrls[i], `users/${accountKey}/add_girl/${selectedCast[index]}/${i + 1}/${fileName}`);
          panelURLs.push(uploadedUrl);
          await new Promise(res => setTimeout(res, 1000)); //  storageに画像を同時に登録するタイミングを無くす

        }
      }

      //  年齢
      const age = await page.$eval('input[name="girls_age"]', elemnt => {
        return elemnt.value;
      });

      //  身長・3サイズ
      const height = await page.$eval('input[name="girls_height"]', element => {
        return element.value;
      });
      const bust = await page.$eval('input[name="girls_bust"]', element => {
        return element.value;
      });
      const cup = await page.$eval('#sel_GirlCup', element => {
        return element.value;
      });
      const cupValue = parseInt(cup, 10);

      const waist = await page.$eval('input[name="girls_waist"]', element => {
        return element.value;
      });
      const hip = await page.$eval('input[name="girls_hip"]', element => {
        return element.value;
      });

      //  アピールコメント
      const girlComment = await page.$eval('textarea[name="guest_chatch"]', element => {
        return element.value;
      });
      
      //  店長からのコメント
      const shopComment = await page.$eval('textarea[name="owner_comment"]', element => {
        return element.value;
      });
      
      //  質問と回答
      const questions = [];
      for (let i = 0; i < 10; i++) {
        const question = await page.$eval(`input[name="girls_Question${i + 1}"]`, element => element.value);
        questions.push(question);
      }

      const answers = [];
      for (let i = 0; i < 10; i++) {
        const answer = await page.$eval(`input[name="girls_Answer${i + 1}"]`, element => element.value);
        answers.push(answer);
      }

      //  セールスポイント
      const ch_selling_points = await  page.$$eval('div.salesPointItem > label.iconChecked > input', elements => {
        return elements.map(el => el.value);
      });
      const castData = { 'entryDate': entryDate, 'entryRoute': entryRoute, 'castName': castName, 'catchCopy': catchCopy, 'ch_type': ch_type, 'panels': panels, 'panelURLs': panelURLs, 'age': age, 'height':height, 'bust': bust, 'cupValue':cupValue, 'waist': waist, 'hip':hip, 'girlComment': girlComment, 'shopComment': shopComment, 'questions': questions, 'answers': answers, 'ch_selling_points':ch_selling_points};
      
      const castListPageLink2 = await page.$x("//a[normalize-space(text())='キャスト情報']");
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'load', timeout: 60000 }),
        castListPageLink2[0].click(),
      ]);

      await importCastDataToFirebase(accountKey, castData);

    }
  } catch (error) {
    console.error(error); // エラーをコンソールに表示
  
  } finally {
    if (browser) {
      await browser.close();

    }
  }
};

// モジュールとしてエクスポート
module.exports = getCastData;