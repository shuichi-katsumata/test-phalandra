import { defineStore } from "pinia";
import { ref, watch, computed } from "vue";
import { ref as dbRef, get, onValue, onChildChanged } from 'firebase/database';
import { db } from '../firebase_settings/index.js';
import { useUserStore } from "./useUserStore.js";

export const useCastDataStore = defineStore('castData', () => {

  const userStore = useUserStore();
  const orders = ref({});
  const allCastData = ref([]);  
  const publicCastData = ref([]);
  const privateCastData = ref([]);
  const workingTodayCastData = ref([]);
  const isAddingMap =ref({});
  const isDeletingMap = ref({});
  const isEditingMap = ref({});
  const isImportingScheduleMap = ref({});
  const isExportingScheduleMap = ref({});

  const today = new Date().toISOString().slice(0,10);

  // 並び順ソート
  const sortedCastData = () => {
    if (!publicCastData.value.length) return; // ← これで無意味なソート防止
    publicCastData.value.sort((a, b) => {
      const orderA = orders.value[a.profile.id] ?? Infinity;
      const orderB = orders.value[b.profile.id] ?? Infinity;
      return orderA - orderB;
      
    });
  };

  // 並び替え用関数
  const fetchOrders = async() => {
    const ordersRef = dbRef(db, `users/${userStore.accountKey}/add_girl/orders`);
    const snapshot = await get(ordersRef);
    const ordersData = {};
    
    snapshot.forEach((childSnapshot) => {
      ordersData[childSnapshot.key] = childSnapshot.val();

    });

    orders.value = ordersData;
    sortedCastData();
  
  };

  // publicCastDataとprivateCastDataの振り分け
  const setCastData = (newData) => {

    // 1. allCastDataの削除処理
    allCastData.value = allCastData.value.filter(existingItem =>
      newData.some(item => item.profile.id === existingItem.profile.id)

    );

    // 2. allCastDataの追加処理
    newData.forEach(item => {
      const exists = allCastData.value.some(existingItem => existingItem.profile.id === item.profile.id);
      if (!exists) {
        allCastData.value.push(item);
        if (item.profile.situation === 'public') {
          publicCastData.value.push(item);
          
        } else {
          privateCastData.value.push(item);
        
        }
      }
    });

    // 3. publicCastDataの更新処理
    publicCastData.value = publicCastData.value.filter(existingItem => {
      const correspondingNewData = newData.find(item => item.profile.id === existingItem.profile.id);
      if (!correspondingNewData || correspondingNewData.profile.situation !== 'public') {
        return false;

      }
      return true;
    
    });

    //  4. privateCastDataの更新処理
    privateCastData.value = privateCastData.value.filter(existingItem => {
      const correspondingNewData = newData.find(item => item.profile.id === existingItem.profile.id);
      if (!correspondingNewData || correspondingNewData.profile.situation !== 'private') {
        return false;

      }
      return true;
    
    });

    // 5. 新規のpublicデータをpublicCastDataに追加
    newData.forEach(item => {
      const existsInPublic = publicCastData.value.some(filteredItem => filteredItem.profile.id === item.profile.id);
      if (!existsInPublic && item.profile.situation === 'public') {
        publicCastData.value.push(item);
        
        if (item.schedule_data.schedules[today].status === 'working') {
          workingTodayCastData.value.push(item);
        }

      }
    });

    // 6. 新規のprivateデータをpublicCastDataに追加
    newData.forEach(item => {
      const existsInPrivate = privateCastData.value.some(filteredItem => filteredItem.profile.id === item.profile.id);
      if (!existsInPrivate && item.profile.situation === 'private') {
        privateCastData.value.push(item);

      }
    });
  };

  // 全キャストデータ読み込み
  const castNames_fetchData = async (castDataRef) => {
    const castDataSnapshot = await get(castDataRef);
    const castData = castDataSnapshot.val();
    if (!castData) {
      return [];

    }
    return Object.keys(castData).map(castName => {
      const castDetails = castData[castName];
      return {
        profile: castDetails.profile,
        diaryAddress: castDetails.diaryAddress || null, // diaryAddressを追加
        schedule_data: castDetails.schedule_data 
          ? { ...castDetails.schedule_data, prospectiveTime: castDetails.schedule_data.prospectiveTime ?? { startTime: 0, endTime: 0 } } 
          : { prospectiveTime: { startTime: 0, endTime: 0 } },

      };
    });
  };

  const setupRealtimeListener = async () => {
    const castDataRef = dbRef(db, `users/${userStore.accountKey}/add_girl/cast_data`);
    
    // データを初回読み込み
    const profileData = await castNames_fetchData(castDataRef); 
    allCastData.value = profileData;
    publicCastData.value = profileData.filter(item => item.profile.situation === 'public');
    privateCastData.value = profileData.filter(item => item.profile.situation === 'private');
    workingTodayCastData.value = publicCastData.value.filter(item => item.schedule_data?.schedules?.[today]?.status === 'working');

    // 並び替え
    await fetchOrders();

  };

  //  対象キャストのスケジュールデータを得る
  const fech_castSchedule = async (name) => {
    const castScheduleDataRef = dbRef(db, `users/${userStore.accountKey}/add_girl/cast_data/${name}/schedule_data/schedules`);
    const castScheduleDataSnapshot = await get(castScheduleDataRef);
    const castScheduleData = castScheduleDataSnapshot.val();
    return {
      schedules: castScheduleData
      
    }
  }

  //  対象キャストのスケジュールデータを得てページに反映する
  const reflectionCastScheduleData = async (girlsName) => {
    for (let name of girlsName) {
      const castNewSchedule = await fech_castSchedule(name);
      const target = publicCastData.value.find(c => c.profile.castName === name);
      if (target) {
        target.schedule_data.schedules = castNewSchedule.schedules;
        publicCastData.value = [...publicCastData.value]; //  Vue に「配列が変わったよ」と知らせて強制的に再レンダリングさせる

      }
    }
  }

  const reset = () => {
    allCastData.value = [];
    publicCastData.value = [];
    privateCastData.value = [];
    orders.value = {};

  }

  watch(
    () => userStore.accountKey,
    (accountKey) => {
      if (!accountKey) return;

      const castDataRef = dbRef(db, `users/${accountKey}/add_girl`);  //  add_girl/cast_dataまで参照すると新規追加で反応しない
      onValue(castDataRef, (snapshot) => {
        const data = snapshot.val();
        const castDataSnapshot = data?.cast_data;
        if (castDataSnapshot) {
          const addingMap = {};
          const deletingMap = {};
          const editingMap = {};
          const importingScheduleMap = {};
          const exportingScheduleMap = {};
          
          Object.entries(castDataSnapshot).map(([castName, castDetails]) => {
            addingMap[castName] = !!castDetails.button_state?.isAdding;
            deletingMap[castName] = !!castDetails.button_state?.isDeleting;
            editingMap[castName] = !!castDetails.button_state?.isEditing;
            importingScheduleMap[castName] = !!castDetails.button_state?.isImportingThisCastSchedule;
            exportingScheduleMap[castName] = !!castDetails.button_state?.isExportingThisCastSchedule;

          });
          isAddingMap.value = addingMap;
          isDeletingMap.value = deletingMap;
          isEditingMap.value = editingMap;
          isImportingScheduleMap.value = importingScheduleMap;
          isExportingScheduleMap.value = exportingScheduleMap;
          
        }
      });
    },
    { immediate: true }
  );

  watch(
    () => userStore.accountKey,
    (accountKey) => {
      if (!accountKey) return;

      const castDataRef = dbRef(db, `users/${accountKey}/add_girl/cast_data`);

      onChildChanged(castDataRef, (snapshot) => {
        const castName = snapshot.key;
        const castDetails = snapshot.val();
        const newURL = castDetails.profile?.panelURLs?.[1] || null;

        // publicCastData の中で一致するキャストを探す
        const target = publicCastData.value.find(c => c.profile.castName === castName);

        if (target && target.profile.panelURLs[1] !== newURL) {
          target.profile.panelURLs[1] = newURL;
          // Vue に変更を伝えるために配列を再代入
          publicCastData.value = [...publicCastData.value];
        }
      });
    },
    { immediate: true }
  );
  
  const isAdding = computed(() => isAddingMap);
  const isDeleting = computed(() => isDeletingMap);
  const isEditing = computed(() => isEditingMap);
  const isImportingSchedule = computed(() => isImportingScheduleMap);
  const isExportingSchedule = computed(() => isExportingScheduleMap);

  return {
    today, allCastData, publicCastData, privateCastData, workingTodayCastData, isAdding, isDeleting, isEditing, isImportingSchedule, isExportingSchedule,
    sortedCastData, fetchOrders, setCastData, setupRealtimeListener, reflectionCastScheduleData, reset,
  }
});
