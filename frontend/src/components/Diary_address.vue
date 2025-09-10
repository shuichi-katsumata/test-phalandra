<template>
  <tbody>
    <tr>
      <th class="text-center table_title" style="width: 1500px;" colspan="2">写メ日記転送設定</th>
    </tr>
    <tr>
      <div v-if="userStore.isInitialized">
        <div v-for="castData in castDataStore.publicCastData" :key="castData.profile.castName" :class="[ 'align-middle', { fading: castDataStore.isDeleting.value[castData.profile.castName] || castDataStore.isAdding.value[castData.profile.castName] } ]">
          <th style="width: 8%;">
            <img :src="castData.profile.panelURLs['1']" class="mt-1 w-100" style="width:inherit">
            <p class="fw-normal text-primary mb-0 text-center" style="margin: 0.5rem 0; font-size: 0.7rem;">{{ castData.profile.castName }}</p>
          </th>
          <td>
            <div class="d-flex align-items-center justify-content-between">
              <ul class=" list-unstyled d-flex flex-wrap w-100" style="margin: 0; padding: 0.5rem 0; font-size: small;">
                <li v-for="externalSite in diaryTargetSite" :key="externalSite.name" class="w-50 mt-1 mb-1 d-flex align-items-center">
                  <span class="me-2 text-end" style="width: 25%;">{{ externalSite.siteName }}：</span>
                  <input v-model="castData.diaryAddress[externalSite.name]" type="text" class="mb-0 w-75 text-secondary" :disabled="castDataStore.isDeleting.value[castData.profile.castName] || castDataStore.isAdding.value[castData.profile.castName]">
                </li>
              </ul>
              <div class="d-flex flex-column align-items-center" style="width: 15%;"> 
                <button type="button" :class="[ 'btn', 'btn-warning', 'm-2', 'text-white', { 'button-disabled': castDataStore.isDeleting.value[castData.profile.castName] } ]" style="width: 100px;" @click="diaryAddressGetter(castData.profile.castName)" :disabled="isProcessing[castData.profile.castName] || isRegistering[castData.profile.castName] || castDataStore.isAdding.value[castData.profile.castName]">
                  <div class="d-flex align-items-center justify-content-center">
                    <span v-if="isProcessing[castData.profile.castName]" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    <span>{{ getterText[castData.profile.castName] }}</span>
                  </div>
                </button>
                <button type="button" :class="[ 'btn', 'm-2', !isProcessing[castData.profile.castName] ? 'btn-success' : 'btn-secondary', { 'button-disabled': castDataStore.isDeleting.value[castData.profile.castName] } ]" style="width: 100px;" @click="saveDiaryTransfer(castData.profile.castName)" :disabled="isProcessing[castData.profile.castName] || isRegistering[castData.profile.castName] || castDataStore.isAdding.value[castData.profile.castName]">
                  <span v-if="isRegistering[castData.profile.castName]" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  <span>{{ registrationText[castData.profile.castName] }}</span>
                </button>
              </div>
            </div>
          </td>
        </div>
      </div>
    </tr>
  </tbody>
</template>

<script setup>
import { reactive, ref, watch } from 'vue';
import { ref as dbRef, onValue, set } from 'firebase/database';
import { db } from '../firebase_settings/index.js';
import { externalSites } from './Composable/externalSites.js';
import { useCastDataStore } from '../store/useCastDataStore.js';
import { useUserStore } from '../store/useUserStore.js';

const castDataStore =  useCastDataStore();
const userStore = useUserStore();

const isProcessing = ref({});
const isRegistering = ref ({});
const getterText = ref({});
const registrationText = ref({});

//  castDataStore.publicCastDataのデータにdiaryAddressが無いものがあったときの対応
watch(
  () => castDataStore.publicCastData,
  (newCastData) => {
    newCastData.forEach(cast => {
      if (!cast.diaryAddress) {
        cast.diaryAddress = {};

      }
    });
  },
  { immediate: true } // 初期化時にも実行する
);

//  ボタン制御
watch(
  () => castDataStore.publicCastData,
  (publicCastData) => {
    if (!userStore.accountKey) return;

    publicCastData.forEach(cast => {
      const castName = cast.profile.castName;
      const buttonStateRef = dbRef(db, `users/${userStore.accountKey}/add_girl/cast_data/${castName}/button_state`);

      onValue(buttonStateRef, (snapshot) => {
        const enabled = snapshot.val();
        isProcessing.value[castName] = !!(enabled?.get_diaryAddress);
        isRegistering.value[castName] = !!(enabled?.registering_diaryAddress);

        if (isProcessing.value[castName] === true) {
          getterText.value[castName] = '取得中';

        } else {
          getterText.value[castName] = '一括取得';
        
        }

        if (isRegistering.value[castName] === true) {
          registrationText.value[castName] = '登録中';

        } else {
          registrationText.value[castName] = '登録';

        }
      });
    });
  },
  { immediate: true }
);

//  写メ日記が対応しているサイトを設定
const excludedSite = [ 'ohp', 'ch', 'ok' ]; //  写メ日記の転送除外サイト(chの転送機能を使うのでchもここに入る)
const diaryTargetSite = reactive(externalSites.filter(site => !excludedSite.includes(site.name)));

//  各外部サイトからアドレスの収集
const diaryAddressGetter = async(castName) => {
  try {
    const response = await fetch(`${userStore.API_BASE_URL}/get-diaryAddress`, {
      method: 'POST',
      headers: {
        'Content-type': 'application/json',
      },
      body: JSON.stringify({ accountKey: userStore.accountKey, castName: castName }),
    });

    const result = await response.json();
    
    //  得たresultをinputの枠に表示
    castDataStore.publicCastData.forEach(cast => {
      if (cast.profile.castName === castName && result) {
        Object.keys(result).forEach(key => {
          if (!result[key]) {
            cast.diaryAddress[key] = 'アドレスが見つかりません。手動での更新をお願いします。'

          } else {
            cast.diaryAddress[key] = result[key];

          }
        });
      }
    });
  } catch(error) {
    console.error(error.message);
  
  }
}

//  DBへの登録とシティヘブンへの書き込み
const saveDiaryAddress = async(castName, diaryAddress) => {
  //  日本語チェック
  const japaneseRegex = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}ー々〆〤]/gu;
  
  // アドレスが日本語だったら空文字にする
  Object.keys(diaryAddress).forEach(key => {
    if (japaneseRegex.test(diaryAddress[key])) {
      diaryAddress[key] = '';
    }
  });
  const diaryAddressRef = dbRef(db, `users/${userStore.accountKey}/add_girl/cast_data/${castName}/diaryAddress`);
  await set(diaryAddressRef, diaryAddress);

}

const saveDiaryTransfer = async(castName) => {
  const castData = castDataStore.publicCastData.find(cast => cast.profile.castName === castName);
  let diaryAddress = castData?.diaryAddress || '';

  await saveDiaryAddress(castName, diaryAddress);

  const response = await fetch(`${userStore.API_BASE_URL}/write_diaryAddress`, {
    method: 'POST',
    headers: {
      'Content-type': 'application/json',
    },
    body: JSON.stringify({ accountKey: userStore.accountKey, castName: castName, diaryAddress }),
  });

  const result = await response.json();
  console.log('Success:', result);
}

</script>