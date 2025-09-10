import { defineStore } from "pinia";
import { ref } from "vue";
import { useCastDataStore } from './useCastDataStore.js';
import { useUserStore } from "./useUserStore.js";
import { db } from '../firebase_settings/index.js';
import { ref as dbRef, onValue } from 'firebase/database';

export const useModalFunctionStore = defineStore('modalFunction', () => {
  const castDataStore =  useCastDataStore();
  const userStore = useUserStore();

  const selectedCasts = ref([]);
  const selectedCastsArray = ref([]);
  const ExtractCastModal = ref(false);
  const confirmationClick = ref(false);
  const text = ref('');
  const subTexts = ref([]);
  const instruct = ref('');
  
  const importingType = ref('');
  const scheduleType = ref('');
  const individualFlag = ref(false);
  const keepSelectedCast = ref(false);

  const extractCastData = (type) => {
    selectedCastsArray.value = Object.values(selectedCasts.value);
    ExtractCastModal.value = true;
    importingType.value = type;

    if (type === 'Import') {
      text.value = 'オフィシャルホームページから出勤情報を取り込みます';
      subTexts.value = ['取り込んだ出勤情報はPhalandra内で上書きされます。', '選択する女性人数によっては取り込みに時間がかかる場合があります。'];
      instruct.value = '取り込み開始';

    } else if (type === 'Export') {
      text.value = '出勤情報を外部サイトへ反映します';
      subTexts.value = ['選択する女性人数によっては取り込みに時間がかかる場合があります。', '回線の状況によっては最新の情報が反映されない場合があります。必ずキャスト情報更新結果を確認してください。'];
      instruct.value = '反映開始';

    }
    //  表示をあいうえお順にする
    selectedCastsArray.value.sort((a,b) => {
      return a.localeCompare(b,'ja'); //  言語の順番でソートするときはlocaleCompareが必要。
    
    });
  }
  
  //  キャンセルボタンの処理
  const closeModalWindow = () => {
    ExtractCastModal.value = false;
    if (!individualFlag.value && keepSelectedCast.value === false) {
      selectedCasts.value = [];

    }
  }

  //  戻るボタンの処理
  const goBackSelectedCast = () => {
    ExtractCastModal.value = false;

  }

  //  出勤管理情報の取得
  const startImportAction = async(type) => {
    const selectedCastsData = Object.values(selectedCasts.value);

    if (type === 'Shedules' && importingType.value === 'Import') {
      
      try {
        selectedCasts.value = [];
        ExtractCastModal.value = false;
        const response = await fetch(`${userStore.API_BASE_URL}/importCastSchedule`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',

          },
          body: JSON.stringify({ accountKey: userStore.accountKey, selectedCast: selectedCastsData }),
        });
      
        if (!response.ok) {
          throw new Error('Network response was not ok');

        }
        await Promise.all(
          selectedCastsData.map(cast => new Promise(resolve => {
            const buttonStateRef = dbRef(db, `users/${userStore.accountKey}/add_girl/cast_data/${cast}/button_state/isImportingThisCastSchedule`);
            const unsubscribe = onValue(buttonStateRef, (snapshot) => {
              const newVal = snapshot.val();
              if (!newVal) {
                castDataStore.reflectionCastScheduleData([cast]);
                unsubscribe();
                resolve();

              }
            });
          }))
        );
      } catch (error) {
        console.error(error);
      
      }
    } else if (type === 'Shedules' && importingType.value === 'Export') {
    
      try {
        selectedCasts.value = [];
        ExtractCastModal.value = false;
        const response = await fetch(`${userStore.API_BASE_URL}/exportCastSchedule`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',

          },
          body: JSON.stringify({ accountKey: userStore.accountKey, selectedCast: selectedCastsData }),
        
        });
        
        if (!response.ok) {
          throw new Error('Network response was not ok');

        }
        await Promise.all(
          selectedCastsData.map(cast => new Promise(resolve => {
            const buttonStateRef = dbRef(db, `users/${userStore.accountKey}/add_girl/cast_data/${cast}/button_state/isExportingThisCastSchedule`);
            const unsubscribe = onValue(buttonStateRef, (snapshot) => {
              const newVal = snapshot.val();
              if (!newVal) {
                unsubscribe(); // 監視解除しないと無限に呼ばれる
                resolve();     // このキャスト終わり

              }
            });
          }))
        );
      } catch (error) {
        console.error(error);
      
      }
    }
  }

  return {
    selectedCasts, selectedCastsArray, ExtractCastModal, text, subTexts, instruct,
    confirmationClick,scheduleType, individualFlag, keepSelectedCast,
    extractCastData, closeModalWindow, goBackSelectedCast, startImportAction,
  }
});