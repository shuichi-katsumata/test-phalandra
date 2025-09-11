const addCastDataPrograms = require('./functions/castDataPrograms/addCastDataPrograms');
const deleteCastDataPrograms = require('./functions/castDataPrograms/deleteCastDataPrograms');
const editCastDataPrograms = require('./functions/castDataPrograms/editCastDataPrograms');
const sortCastDataPrograms = require('./functions/castDataPrograms/sortCastDataPrograms');

const update_Authentications = require('./functions/update_Authentications');
const extractCastList = require('./functions/castDataPrograms/extractCastList');
const getCastData = require('./functions/castDataPrograms/getCastData');
const diaryAddressGetter = require('./functions/castDataPrograms/diaryAddressGetter');
const writeToCh_castPage = require('./functions/castDataPrograms/writeToCh_castPage');
const getCastSchedule = require('./functions/castDataPrograms/getCastSchedule');
const exportCastSchedule = require('./functions/castDataPrograms/exportCastSchedule');

const { db } = require('./utils/firebaseUtils');

const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors()); // corsを有効にする
app.use(express.json());  //  jsonデータの解析
app.use(express.urlencoded({ extended: true }));  //  URLエンコードされたデータを解析

//  サーバーの起動
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

//  シティヘブンから女の子リストを抽出
app.post('/extractCastList', async(req, res) => {
  const { accountKey } = req.body;
  try {
    const castList = await extractCastList(accountKey);
    res.status(200).json({ message: 'Data received successfully', castList: castList });

  } catch (error) {
    console.error('Error extract cast list:', error);
    res.status(500).json({ message: 'Error extract cast list', error: error.message });
  
  }
});

//  取り込み選択した女の子の名前を取得して、ヘブンからデータを抽出し、realtimedatabaseに書き込む（POSTリクエスト）
app.post('/importCastData', async(req, res) => {
  const { accountKey, selectedCast } = req.body;  //  フロントエンドから送信されたデータを取得
  const siteButtonStateRef = db.ref(`users/${accountKey}/site_button_state`);  
  await siteButtonStateRef.update({ importingCast: true });
  res.status(200).json({ message: 'Cast data import started' });

  // ジョブを非同期で実行
  setImmediate(async() => {
    try {
      await getCastData(accountKey, selectedCast);

    } catch (error) {
      console.error('Error importCastData:', error);

    } finally {
      await siteButtonStateRef.update({ importingCast: false });
    
    }
  });
});

//  女の子データの追加
app.post('/add-castData', async(req, res) => {
  const { accountKey, castName } = req.body;  //  クライアント側からcastNameを受け取る
  const button_stateRef = db.ref(`users/${accountKey}/add_girl/cast_data/${castName}/button_state`);
  const siteButtonStateRef = db.ref(`users/${accountKey}/site_button_state/`);  
  await button_stateRef.update({ isAdding: true });
  await siteButtonStateRef.update({ disabledSortingCast: true });
  res.status(200).json({ message: 'Add started', castName });

  setImmediate(async() => {
    try {
      await addCastDataPrograms(db, accountKey, castName);
    
    } catch (error) {
      res.status(500).json({ message: 'Failed to add cast data', error: error.message });
    
    } finally {
      await button_stateRef.update({ isAdding: false });
      await siteButtonStateRef.update({ disabledSortingCast: false });

    }
  });
});

//  女の子データの編集
app.post('/edit-castData', async(req, res) => {
  const { accountKey, castName } = req.body;  //  クライアント側からcastNameを受け取る
  const button_stateRef = db.ref(`users/${accountKey}/add_girl/cast_data/${castName}/button_state`);
  await button_stateRef.update({ isEditing: true });
  res.status(200).json({ message: 'Edit started', castName });

  setImmediate(async() => {
    try {
      await editCastDataPrograms(db, accountKey, castName);
    
    } catch (error) {
      res.status(500).json({ message: 'Failed to edit cast data', error: error.message });

    } finally {
      await button_stateRef.update({ isEditing: false });

    }
  });
});

//  女の子データの並び替え
app.post('/sort-castData', async(req, res) => {
  const { accountKey } = req.body;
  const siteButtonStateRef = db.ref(`users/${accountKey}/site_button_state/`);  
  await siteButtonStateRef.update({ sortingCast: true });
  res.status(200).json({ message: 'Sort started' });

  setImmediate(async() => {
    try {
      await sortCastDataPrograms(db, accountKey);
    
    } catch(error) {
      console.error('Error sortCastData:', error);
      res.status(500).json({ message: 'Error sorting data', error: error.message });

    } finally {
      await siteButtonStateRef.update({ sortingCast: false });
      
    }
  });
});

//  女の子データの削除
app.post('/delete-castData', async(req, res) => {
  const { accountKey, castName } = req.body;
  const removedCastRef = db.ref(`users/${accountKey}/add_girl/cast_data/${castName}`);
  const button_stateRef = db.ref(`users/${accountKey}/add_girl/cast_data/${castName}/button_state`);
  await button_stateRef.update({ isDeleting: true });
  res.status(200).json({ message: 'Delete started'});

  setImmediate(async() =>{
    try {
      await deleteCastDataPrograms(db, accountKey, removedCastRef);

    } catch (error) {
      res.status(200).json({ message: 'Failed to delete cast data', castName });
    
    } finally {
      await removedCastRef.remove();  //  DBから消すのでsiteButtonStateRefとかの制御はいらない

    }
  });
});

//  外部サイトのID・PASS登録
app.post('/authentications', async(req, res) => {
  const { accountKey, siteName } = req.body;
  const authRef = db.ref(`users/${accountKey}/id_pass/${siteName}`);
  await authRef.update({ auth: '認証中' });
  
  try {
    await update_Authentications(accountKey, siteName);
    res.status(200).json({ message: 'authentication successful' });
    await authRef.update({ auth: '認証確認済' });

  } catch (error) {
    console.error(error.message);
    res.status(200).json({ message: 'could not authenticate' });
    await authRef.update({ auth: '認証確認出来ませんでした。入力内容に間違いがないか見直してください' });

  }
});

//  写メ日記転送アドレス取得
app.post('/get-diaryAddress', async(req, res) => {
  const { accountKey, castName } = req.body;
  const button_stateRef = db.ref(`users/${accountKey}/add_girl/cast_data/${castName}/button_state`);
  await button_stateRef.update({ get_diaryAddress: true });

  try {
    const { ec, pl, fj, kj, kf, og, yg } = await diaryAddressGetter(accountKey, castName);
    res.status(200).json({ ec, pl, fj, kj, kf, og, yg });

  } catch(error) {
    res.status(200).end();
    
  } finally {
    await button_stateRef.update({ get_diaryAddress: false });

  }
});

//  写メ日記転送アドレス登録
app.post('/write_diaryAddress', async(req, res) => {
  const { accountKey, castName, diaryAddress } = req.body;
  const button_stateRef = db.ref(`users/${accountKey}/add_girl/cast_data/${castName}/button_state`);
  await button_stateRef.update({ registering_diaryAddress: true });
  res.status(200).json({ message: 'writing address started'});

  setImmediate(async() => {
    try {
      await writeToCh_castPage(accountKey, castName, diaryAddress);

    } catch (error) {
      res.status(200).end();
    
    } finally {
      await button_stateRef.update({ registering_diaryAddress: false });

    }
  });
});

//  出勤情報取り込み
app.post('/importCastSchedule', async(req, res) => {
  const { accountKey, selectedCast } = req.body;
  const siteButtonStateRef = db.ref(`users/${accountKey}/site_button_state/`);
  await siteButtonStateRef.update({ importingCastSchedule: true });
  for (const castName of selectedCast) {
    const button_stateRef = db.ref(`users/${accountKey}/add_girl/cast_data/${castName}/button_state`);
    await button_stateRef.update({ isImportingThisCastSchedule: true});

  }
  res.status(200).json({ message: 'Schedule data import started'});

  setImmediate(async() => {
    try {
      await getCastSchedule(accountKey, selectedCast);

    } catch (error) {
      console.error('Error importing cast schedule data:', error);
      res.status(500).json({ message: 'Error importing cast schedule data', error: error.message });

    } finally {
      for (const castName of selectedCast) {
        const button_stateRef = db.ref(`users/${accountKey}/add_girl/cast_data/${castName}/button_state`);
        await button_stateRef.update({ isImportingThisCastSchedule: false });

      };
      await siteButtonStateRef.update({ importingCastSchedule: false });

    }
  });
});

//  出勤情報外部サイト反映
app.post('/exportCastSchedule', async(req, res) => {
  const { accountKey, selectedCast } = req.body;
  for (const castName of selectedCast) {
    const button_stateRef = db.ref(`users/${accountKey}/add_girl/cast_data/${castName}/button_state`);
    await button_stateRef.update({ isExportingThisCastSchedule: true});

  }
  const siteButtonStateRef = db.ref(`users/${accountKey}/site_button_state/`);
  await siteButtonStateRef.update({ exportingCastSchedule: true });
  res.status(200).json({ message: 'Schedule data export started'});

  setImmediate(async() => {
    try {
      await exportCastSchedule(db, accountKey, selectedCast);

    } catch (error) {
      console.error('Error exporting cast data:', error);
      res.status(500).json({ message: 'Error exporting cast schedule data', error: error.message });

    } finally {
      for (const castName of selectedCast) {
        const button_stateRef = db.ref(`users/${accountKey}/add_girl/cast_data/${castName}/button_state`);
        await button_stateRef.update({ isExportingThisCastSchedule: false });

      };
      await siteButtonStateRef.update({ exportingCastSchedule: false });

    }
  });
});