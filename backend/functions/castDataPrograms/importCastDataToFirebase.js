const { db } = require('../../utils/firebaseUtils');
const dayjs = require('dayjs');

const importCastDataToFirebase = async(accountKey, castData) => {
  let d = new Date();
  let id = d.getTime();
  let panelUpdates = {};
  let panelURLsUpdates = {};
  //  realtimedatabseの書き込む場所の設定
  const dbRef = db.ref('/');
  const ordersRef = db.ref(`users/${accountKey}/add_girl/orders`);
  const snapshot = await ordersRef.once('value');
  const keyCount = snapshot.numChildren();  //  キーの数を取得
  const updates = {};

  //  既存のキャストデータが存在するかチェック
  const castDataRef = db.ref(`users/${accountKey}/add_girl/cast_data/${castData.castName}/profile`);
  const castSnapshot = await castDataRef.once('value');
  const isCastDataExists = castSnapshot.exists(); //  once('value')でデータを取得した後に、.exists()を使うことで、そのデータが存在するかどうかを真偽値（trueまたはfalse）で判定できる
  
  //  質問と回答の書き込み
  for (let i = 0; i < castData.questions.length; i++) {
    updates[`users/${accountKey}/add_girl/cast_data/${castData.castName}/profile/question${i + 1}`] = castData.questions[i];
    updates[`users/${accountKey}/add_girl/cast_data/${castData.castName}/profile/answer${i + 1}`] = castData.answers[i];
  }

  //  パネルの名前と画像URLの書き込み
  if (castData.panels && castData.panels.length > 0) {
    castData.panels.forEach((panel, index) => {
      panelUpdates[(index + 1)] = panel;
    });
    updates[`users/${accountKey}/add_girl/cast_data/${castData.castName}/profile/panel`] = panelUpdates;

    castData.panelURLs.forEach((panelURL, index) => {
      panelURLsUpdates[(index + 1)] = panelURL;
    });
    updates[`users/${accountKey}/add_girl/cast_data/${castData.castName}/profile/panelURLs`] = panelURLsUpdates;
  } else {
    const noImgUrl = 'https://firebasestorage.googleapis.com/v0/b/phalandra-256-da694.appspot.com/o/noPhoto_panel%2Fno_photo.jpg?alt=media&token=3ac5cfde-1cea-413a-ad86-a915e27838d4';
    panelURLsUpdates[1] = noImgUrl;
    updates[`users/${accountKey}/add_girl/cast_data/${castData.castName}/profile/panelURLs`] = panelURLsUpdates;
  }

  //  登録先パスの設定
  const castProfile = (castName) => {
    return `users/${accountKey}/add_girl/cast_data/${castName}/profile`;
  } 
  const castProfilePath = castProfile(castData.castName);

  //  その他の書き込み
  Object.assign(updates, {
    [`users/${accountKey}/logs/girls_log/${id}`]: {
      content: `キャストデータ取り込み：${castData.castName}`,
      registration_date: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    },
    [`${castProfilePath}/situation`]: 'public',
    [`${castProfilePath}/castName`]: castData.castName,
    [`${castProfilePath}/entryDate`]: castData.entryDate,
    [`${castProfilePath}/entryRoute`]: castData.entryRoute,
    [`${castProfilePath}/age`]: castData.age,
    [`${castProfilePath}/height`]: castData.height,
    [`${castProfilePath}/bust`]: castData.bust,
    [`${castProfilePath}/waist`]: castData.waist,
    [`${castProfilePath}/hip`]: castData.hip,
    [`${castProfilePath}/cup`]: castData.cupValue,
    [`${castProfilePath}/ch_type`]: castData.ch_type,
    [`${castProfilePath}/catchCopy`]: castData.catchCopy,
    [`${castProfilePath}/shopComment`]: castData.shopComment,
    [`${castProfilePath}/girlComment`]: castData.girlComment,
    [`${castProfilePath}/ch_selling_points`]: castData.ch_selling_points.length > 0 ? castData.ch_selling_points : { 0: { label: '', value: '' } },
  });

  //  存在しなかったらidと順番を追加
  if (!isCastDataExists) {
    updates[`users/${accountKey}/add_girl/orders/${id}`] = keyCount;
    updates[`${castProfilePath}/id`] = id;
  }

  //  realtimedatabseに書き込み
  try {
    await dbRef.update(updates);
    await db.ref(`users/${accountKey}/logs/girls_log/${id}/content_logs`).push({
      phalandra: 'Phalandra内への登録完了',
    });

  } catch (error) {
    await dbRef.update({
      [`users/${accountKey}/logs/girls_log/${id}`]: {
        content: `キャストデータ取り込み：${castData.castName}`,
        registration_date: dayjs().format('YYYY-MM-DD HH:mm:ss'),

      }
    });
    await db.ref(`users/${accountKey}/logs/girls_log/${id}/content_logs`).push({
      phalandra: 'エラー! Phalandra内への取り込みに失敗しました',

    });
    console.error('Error updating database:', error.message || error);

  }
}

module.exports = importCastDataToFirebase;