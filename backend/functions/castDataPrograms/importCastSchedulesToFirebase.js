const importCastSchedulesToFirebase = async(db, dayjs, accountKey, selectedCast, schedules, id) => {
  //  realtimedatabseの書き込む場所の設定
  const dbRef = db.ref('/');
  const updates = {};
  
  //  登録先パスの設定
  const castProfile = (selectedCast) => {
    return `users/${accountKey}/add_girl/cast_data/${selectedCast}/schedule_data/schedules`;

  } 
  const castSchedulePath = castProfile(selectedCast);

  //  その他の書き込み
  for (let i = 0; i < 42; i++) {
    const weekDate = dayjs().add(i, 'day').format('YYYY-MM-DD');
    updates[`${castSchedulePath}/${weekDate}`] = schedules[i];
  
  }

  try {

    await dbRef.update(updates);
    await db.ref(`users/${accountKey}/logs/schedule_log/${id}/content_logs`).push({
      phalandra: 'Phalandra内への登録完了',

    });
    console.log('Database updated successfully');

  } catch (error) {

    await dbRef.update({
      [`users/${accountKey}/logs/schedule_log/${id}`]: {
        content: `キャストスケジュール取り込み：${selectedCast}`,
        registration_date: dayjs().format('YYYY-MM-DD HH:mm:ss'),

      }
    });

    await db.ref(`users/${accountKey}/logs/schedule_log/${id}/content_logs`).push({
      phalandra: 'エラー! Phalandra内への取り込みに失敗しました',
    
    });
    console.error('Error updating database:', error.message || error);

  }
}

module.exports = importCastSchedulesToFirebase;