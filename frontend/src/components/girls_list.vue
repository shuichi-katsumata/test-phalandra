<template>
  <div v-if="data.buttonStateFlag">
    <router-link to="/add_girl" class="btn btn-success mx-2 mb-3">
      <div class="d-flex">
        <span class="material-symbols-outlined">add</span>
        <span>新規登録</span>
      </div>
    </router-link>
    <button class="btn btn-success mx-2 mb-3" style="width: 130px;" @click="extractCastData()" :disabled="importingCastButtonState">
      <div class="d-flex justify-content-center align-items-center">
        <span v-if="!importingCastButtonState" class="material-symbols-outlined">vertical_align_bottom</span>
        <span v-else class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
        <span>{{ importingCastButtonText }}</span>
      </div>
    </button>
    <button class="btn btn-primary mx-2 mb-3" @click="publicCast()">
      <div class="d-flex">
        <span class="material-symbols-outlined">woman</span>
        <span>公開中のキャスト</span>
      </div>
    </button>
    <button class="btn btn-secondary mx-2 mb-3" @click="privateCast()">
      <div class="d-flex">
        <span class="material-symbols-outlined">woman</span>
        <span>非公開キャスト</span>
      </div>
    </button>
  </div>
  <div v-else style="height: 54px"></div>
  <tbody>
    <tr>
      <th class="text-center table_title" style="width: 1500px;" colspan="2">{{ data.title }}</th>
    </tr>
    <tr>
      <td style="height: 57px;">
        <div v-if="userStore.isInitialized">
          <draggable v-model="filteredCastData" item-key="id" tag="ul" class="list-unstyled d-flex justify-content-start flex-wrap" style="margin: 0;" :disabled="isPrivateView">
            <template #item="{ element, index }">
              <li :class="[ 'me-2', 'mb-3', 'border', 'position-relative', { fading: castDataStore.isDeleting.value[element.profile.castName] || castDataStore.isAdding.value[element.profile.castName] } ]" :style="{ width: '175px', cursor: isPrivateView ? 'default' : 'all-scroll', backgroundColor: isPrivateView ? '#e2e2e2' : '#fff' }">
                <span class="position-absolute top-0 start-0 ms-1">{{ index + 1 }}</span>
                <div class="d-flex flex-column align-items-center">
                  <div style="height: 173px; width: 130px;">
                    <img v-if="element.profile.panelURLs && element.profile.panelURLs['1']" :src="element.profile.panelURLs['1']" class="mt-1" style="width: 130px;">
                  </div>
                  <p style="margin: 0.5rem 0;" :style="{ color: isPrivateView ?'#2c3e50' : '#0d6efd' }">{{ element.profile.castName }}</p>
                  <div>
                    <div>
                      <router-link :to="`/edit_girl/${element.profile.id}`" :class="[ 'btn', 'btn-primary', 'mx-2', 'mb-2', { 'button-disabled': castDataStore.isDeleting.value[element.profile.castName], disabled: castDataStore.isAdding.value[element.profile.castName] || castDataStore.isEditing.value[element.profile.castName] } ]">編集</router-link>
                      <router-link :to="isPrivateView ? '#' : `/schedule/${element.profile.id}`" :class="[ 'btn', 'btn-primary', 'mx-2', 'mb-2', { isPrivateView, 'pe-none': isPrivateView, 'button-disabled': castDataStore.isDeleting.value[element.profile.castName], disabled: castDataStore.isAdding.value[element.profile.castName] } ]">出勤</router-link>
                    </div>
                    <button :class="[ 'btn', 'btn-danger', 'mx-2', 'mb-1', { 'button-disabled': castDataStore.isDeleting.value[element.profile.castName] } ]"  @click="confirmationDeleteCastData(element)" :disabled="castDataStore.isEditing.value[element.profile.castName] || castDataStore.isAdding.value[element.profile.castName]">削除</button>
                  </div>
                  <!-- <p>{{ castDataStore.isAdding.value[element.profile.castName] }}</p> -->
                  <!-- <span> {{ element.profile.id }} </span> -->
                </div>
              </li>
            </template>
          </draggable>
        </div>
        <div v-if="filteredCastData.length > 1 && userStore.isInitialized" class="text-center" :style="{ display: isPrivateView ? 'none' : 'block' }">
          <button class="btn btn-warning mx-2 mb-3 px-5" @click="confirmationSaveOrder()" :disabled="sortingCastButtonState || disabledSortButtonState">
            <div class="d-flex align-items-center text-white fs-5">
              <span v-if="sortingCastButtonState" :class="['spinner-border', 'spinner-border-sm', 'me-1']" role="status" aria-hidden="true"></span>
              <span> {{ sortingCastButtonText }} </span>
              <span class="material-symbols-outlined">arrow_forward_ios</span>
            </div>
          </button>
        </div>
      </td>
    </tr>
  </tbody>
  <ExtractCastModal
    v-model:modelValueA = 'data.searchCast'
    v-model:modelValueB = 'data.selectedCast'
    :show = 'data.ExtractCastModal'
    :text = 'data.text'
    :subTexts = 'data.subTexts'
    :loading = 'data.loading'
    :castList = 'data.castList'
    :instruct = 'data.instruct'
    :cancelAction = 'closeModalWindow'
    :confirmationAction = 'confirmationCastDataAction'
    :importAction = 'startImportAction'
    :goBackSelectedAction = 'goBackSelectedCast'
    :filteredCastList = 'filteredCastList'
    :selectAll = 'data.selectAll'
    :showCastSelection = 'data.showCastSelection'
    :confirmationClick = 'data.confirmationClick'
    @update:selectAll = "data.selectAll = $event"
    @close = 'closeUploadModal'
    @save = 'executeCurrentAction'
  />
  <ConfirmationModal
    :show = 'data.ConfirmationModal'
    :text = 'data.text'
    :instruct = 'data.instruct'
    :action = 'currentAction'
    @close = 'closeUploadModal'
    @save = 'executeCurrentAction'
  />
</template>

<script setup>
import { reactive, ref, computed } from 'vue';
import { set, ref as dbRef, get, update, remove, onValue } from 'firebase/database';
import { ref as imgRef, deleteObject, listAll } from "firebase/storage";
import { db, storage } from '../firebase_settings/index.js';
import { useCastDataStore } from '../store/useCastDataStore.js';
import { useUserStore } from '../store/useUserStore.js';
import dayjs from 'dayjs';
import draggable from 'vuedraggable';
import ConfirmationModal from './modalWindow/ConfirmationModal.vue';
import ExtractCastModal from './modalWindow/ExtractCastModal.vue';

const castDataStore =  useCastDataStore();
const userStore = useUserStore();

const data = reactive ({
  title: '公開中のキャスト一覧',
  ConfirmationModal: false,
  text: '',
  subTexts: [],
  send_completed: '',
  ExtractCastModal: false,
  loading: false,
  searchCast: '',
  selectedCast: [],
  castList: [],
  selectAll: false,
  showCastSelection: true,
  confirmationClick: true,
  buttonStateFlag: false,
});

const isPrivateView = ref(false);
const currentAction = ref(null);
const filteredCastData = ref([]);
const importingCastButtonState = ref({});
const importingCastButtonText = ref('');
const disabledSortButtonState = ref({});
const sortingCastButtonState = ref({});
const sortingCastButtonText = ref('');

//  公開キャスト表示
const publicCast = () => {
  data.title = '公開中のキャスト一覧';
  filteredCastData.value = castDataStore.publicCastData;
  isPrivateView.value = false;

}

//  非公開キャスト表示
const privateCast = () => {
  data.title = '非公開キャスト一覧';
  filteredCastData.value = castDataStore.privateCastData;
  isPrivateView.value = true;

}

//  並び替え登録
const saveOrder = async() => {
  let d = new Date();
  let id = d.getTime();
  const updates = {};

  filteredCastData.value.forEach((item, index) => {
    updates[`users/${userStore.accountKey}/add_girl/orders/${item.profile.id}`] = index;
  });

  await update(dbRef(db), updates);
  
  set(dbRef(db, `users/${userStore.accountKey}/logs/girls_log/${id}`), {
    content: '並び替え',
    registration_date: dayjs().format('YYYY-MM-DD HH:mm:ss'),
  });
  
  data.ConfirmationModal = false;
  
  try {
    const response = await fetch(`${userStore.API_BASE_URL}/sort-castData`, {
      method: 'POST',
      headers: {
        'Content-type': 'application/json',
      },
      body: JSON.stringify({ accountKey:userStore.accountKey }),
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const sortButtonStateRef = dbRef(db, `users/${userStore.accountKey}/site_button_state/sortingCast`);
    await new Promise(resolve => {
        const unsubscribe = onValue(sortButtonStateRef, (snapshot) => {
          const newVal = snapshot.val();
          if (!newVal) {
            unsubscribe(); // 監視解除しないと無限に呼ばれる
            resolve();     // 終わり

          }
        });
      }
    );
  } catch (error) {
    console.error(error.message);

  } finally {
    console.log('終わった');
    castDataStore.fetchOrders();
  
  }
}

//  storage削除用関数
const deleteFilesInDirectory = async(directoryPath) => {
  const directoryRef = imgRef(storage, directoryPath);
  const listResult = await listAll(directoryRef);
  const deleteFilePromises = listResult.items.map((itemRef) => deleteObject(itemRef));
  const subdirectoryPromises = listResult.prefixes.map(async(prefix) => {
    const subListResult = await listAll(prefix);
    return Promise.all(subListResult.items.map((itemRef) => deleteObject(itemRef))); 
  });
  await Promise.all([...deleteFilePromises, ...subdirectoryPromises]);
}

//  キャストデータ削除
const deleteCastData = async(element) => {
  let d = new Date();
  let id = d.getTime();
  
  //  ログに書き込み
  set(dbRef(db, `users/${userStore.accountKey}/logs/girls_log/${id}`), {
    content: `キャスト削除：${element.profile.castName}`,
    registration_date: dayjs().format('YYYY-MM-DD HH:mm:ss'),
  });

  //  storage削除
  if (element.profile.panel) {
    await deleteFilesInDirectory(`users/${userStore.accountKey}/add_girl/${element.profile.castName}`);
  }

  //  並び順の変更と削除  
  if (element.profile.situation === 'public') {
    const ordersRef = dbRef(db, `users/${userStore.accountKey}/add_girl/orders`);
    const snapshot = await get(ordersRef);
    const ordersData = snapshot.val(); // ordersデータのオブジェクトを取得
    const updateOrderNumber = {};
    const orderNumber = ordersData[element.profile.id];
    
    Object.keys(ordersData).forEach(key => {
      const currentOrder = ordersData[key];
      currentOrder > parseInt(orderNumber) && element.profile.id !== key
        ? updateOrderNumber[`users/${userStore.accountKey}/add_girl/orders/${key}`] = currentOrder - 1
        : updateOrderNumber[`users/${userStore.accountKey}/add_girl/orders/${key}`] = currentOrder;
    });

    if (Object.keys(updateOrderNumber).length > 0) {
      await update(dbRef(db), updateOrderNumber);
    }
    await remove(dbRef(db, `users/${userStore.accountKey}/add_girl/orders/${element.profile.id}`));
  
  }
  data.ConfirmationModal = false;

}

//  キャスト削除の確認
const confirmationDeleteCastData = (element) => {
  data.ConfirmationModal = true;
  data.text = `${element.profile.castName}を削除し、各サイトに反映させますか？`;
  data.instruct = '削除';

  //  「はい」を押したら実行（引数がある場合はアロー関数を設定しないと「はい」を押す前に実行されてしまう）
  currentAction.value = async() => {
    await deleteCastData(element);

    try {
      const response = await fetch(`${userStore.API_BASE_URL}/delete-castData`, {
        method: 'POST',
        headers: {
          'Content-type': 'application/json',
        },
        body: JSON.stringify({ accountKey: userStore.accountKey, castName: element.profile.castName }),
      });
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

    } catch(error) {
      console.error(error.message);

    }
  }; 
}

//  キャストデータをあいうえお順で表示及び検索結果の表示
const filteredCastList = computed(() => {
  if (!data.searchCast.trim()) {
    data.castList.sort((a,b) => {
      return a.localeCompare(b,'ja'); //  言語の順番でソートするときはlocaleCompareが必要。
    });
  }
  //  検索結果の表示
  return data.castList.filter((item) => item.includes(data.searchCast.trim()));

});

//  ヘブンからキャストデータの取り込み
const extractCastData = async() => {
  data.ExtractCastModal = true;
  data.loading = true;
  data.text = 'シティヘブンネットから女性情報を取り込みます';
  data.subTexts = ['取り込んだ女性情報はPhalandra内で上書きされます。', '取り込んだ女性がPhalandra内に存在しない場合は、新規登録されます。', '選択する女性人数によっては取り込みに時間がかかる場合があります。'];
  data.instruct = '確認画面へ';
  
  try {
    const response = await fetch(`${userStore.API_BASE_URL}/extractCastList`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',

      },
      body: JSON.stringify({ accountKey: userStore.accountKey }),
    
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const result = await response.json();
    data.castList = result.castList;

  } catch (error) {
    console.error(error.message);
  
  } finally {
    data.loading = false;
  
  }
}

//  キャンセルボタンの処理
const closeModalWindow = () => {
  data.confirmationClick = true;
  data.showCastSelection = true;
  data.ExtractCastModal = false;
  data.selectedCast = [];

}

//  戻るボタンの処理
const goBackSelectedCast = () => {
  data.confirmationClick = true;
  data.showCastSelection = true;
  data.instruct = '確認画面へ';

}

//  取り込みボタンの処理
const confirmationCastDataAction = () => {
  data.confirmationClick = false;
  data.showCastSelection = false;
  data.instruct = '取り込み開始';
  data.subTexts = ['サイト固有の必須項目がある場合は、取り込んだ後に女性プロフィール編集画面での入力、保存が必要です。']

}

//  取り込み開始ボタンの処理
const startImportAction = async() => {
  const selectedCast = data.selectedCast;
  
  try {
    data.confirmationClick = true;
    data.showCastSelection = true;
    data.ExtractCastModal = false;

    const response = await fetch(`${userStore.API_BASE_URL}/importCastData`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ accountKey: userStore.accountKey, selectedCast }),
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const importButtonStateRef = dbRef(db, `users/${userStore.accountKey}/site_button_state/importingCast`);
    await new Promise(resolve => {
        const unsubscribe = onValue(importButtonStateRef, (snapshot) => {
          const newVal = snapshot.val();
          if (!newVal) {
            unsubscribe(); // 監視解除しないと無限に呼ばれる
            resolve();     // 終わり

          }
        });
      }
    );
  
  } catch (error) {
    console.error(error.message);
  
  } finally {
    data.selectedCast = [];
  
  }
}

//  並び替えの確認
const confirmationSaveOrder = () => {
  data.ConfirmationModal = true;
  data.text = '並び替えを各サイトに反映させますか？';
  data.instruct = 'はい';
  //  「はい」を押したら実行
  currentAction.value = saveOrder;
}

const executeCurrentAction = async() => {
  if (currentAction.value) {
    await currentAction.value();
  
  }
}

const closeUploadModal = ()=> {
  data.ConfirmationModal = false;
  data.ExtractCastModal = false;

}

//  ボタン制御
const siteButtonStateRef = dbRef(db, `users/${userStore.accountKey}/site_button_state`);
onValue(siteButtonStateRef, async(snapshot) => {
  const enabled = snapshot.val();
  
  //  キャスト取り込みボタン
  importingCastButtonState.value = !!(enabled?.importingCast);
  if (importingCastButtonState.value === true) {
    importingCastButtonText.value = '取り込み中';

  } else {
    importingCastButtonText.value = '取り込み';

  }

  //  キャスト並び替えボタン
  disabledSortButtonState.value = !!(enabled?.disabledSortingCast);
  sortingCastButtonState.value = !!(enabled?.sortingCast);
  if (sortingCastButtonState.value === true) {
    sortingCastButtonText.value = '並び替え中';

  } else {
    sortingCastButtonText.value = '並び替え';
  
  }
  //  ボタン状態取得完了フラグ
  data.buttonStateFlag = true;  
  
});

// リアルタイムでデータを更新
const castDataRef = dbRef(db, `users/${userStore.accountKey}/add_girl/cast_data`);
onValue(castDataRef, async(snapshot) => {
  const castDataSnapshot = snapshot.val();
  
  if (castDataSnapshot) {
    const newData = Object.values(castDataSnapshot).map(castDetails => ({
      profile: castDetails.profile,
      panelURLs: castDetails.profile.panelURLs,
      diaryAddress: castDetails.diaryAddress || null, // diaryAddressが存在しない場合にはnullを代入
      schedule_data: castDetails.schedule_data 
        ? { ...castDetails.schedule_data, prospectiveTime: castDetails.schedule_data.prospectiveTime ?? { startTime: 0, endTime: 0 } } 
        : { prospectiveTime: { startTime: 0, endTime: 0 } }

    }));
    castDataStore.setCastData(newData);
    await castDataStore.fetchOrders();
    filteredCastData.value = [...castDataStore.publicCastData];
  
  } else {
    castDataStore.setCastData([]);
    filteredCastData.value = [];

  }
});

</script>