<template>
  <div v-if="data.buttonStateFlag" class="d-flex justify-content-between mb-3">
    <div>
      <button class="btn btn-success mx-2" style="width: 126px;" @click="modalFunctionStore.extractCastData('Import')" :disabled="importingCastSchedule">
        <div class="d-flex justify-content-center align-items-center">
          <span v-if="!importingCastSchedule" class="material-symbols-outlined">vertical_align_bottom</span>
          <span v-else class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
          <span>{{ importingCastScheduleText }}</span>
        </div>
      </button>
      <button class="btn btn-warning text-white mx-2" style="width: 158px;" @click="modalFunctionStore.extractCastData('Export')" :disabled="exportingCastSchedule">
        <div class="d-flex justify-content-center align-items-center">
          <span v-if="!exportingCastSchedule" class="material-symbols-outlined">vertical_align_top</span>
          <span v-else class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
          <span>{{ exportingCastScheduleText }}</span>
        </div>
      </button>
    </div>
    <div>
      <button class="btn btn-primary me-5" @click="prevPage" :disabled="currentPage === 0">前の週</button>
      <button class="btn btn-primary me-2" @click="nextPage" :disabled="(currentPage + 1) * displayInformation >= scheduleFunctionStore.registrationWeekDays.length">次の週</button>
    </div>
  </div>
  <table class="w-100 text-center border-top">
    <thead>
      <tr>
        <th class="fw-normal text-start align-bottom" style="padding: 0 8px; width: 14.6%;">
          <div style="margin-left: 0.3rem;">
            <input type="checkbox" v-model="data.selectAll" class="align-middle me-2">
            <label class="text-primary" style="font-size: 14px;">全て選択</label>
          </div>
        </th>
        <td v-for="(displayDay, index) in displayWeekDays" :key="index" class="fw-bold bg-light" style="width: 12.2%;">{{ displayDay }}</td>
      </tr>
    </thead>
  </table>
  <table class="w-100 text-center" style="margin-bottom: 16px;">
    <tbody>
      <tr v-for="castData in castDataStore.publicCastData" :class="{ fading: castDataStore.isDeleting.value[castData.profile.castName] }" :key="castData.profile.castName"> 
        <td class="fw-normal text-primary text-start" style="width: 14.6%;">
          <div class="d-flex align-items-center">
            <input type="checkbox" v-model="modalFunctionStore.selectedCasts" class="me-4" :value="castData.profile.castName" :disabled="castDataStore.isDeleting.value[castData.profile.castName] || castDataStore.isAdding.value[castData.profile.castName] || castDataStore.isImportingSchedule.value[castData.profile.castName] || castDataStore.isExportingSchedule.value[castData.profile.castName]">
            <img :src="castData.profile.panelURLs['1']" style="width: 45px">
            <span class="ms-4">{{ castData.profile.castName }}</span>
          </div>
          <div class="mt-2 cautionary_note">
            <span>入力補助：</span>
            <select v-model="castData.schedule_data.prospectiveTime.startTime" @change="scheduleFunctionStore.updateProspectiveTime(castData.profile.castName, 'startTime', castData.schedule_data.prospectiveTime.startTime)" style="border: solid 1px #007bff" :disabled="castDataStore.isDeleting.value[castData.profile.castName]">
              <option v-for="item in timelineItems" :value="item.value" :disabled="scheduleFunctionStore.isStartTimeDisabled(castData.schedule_data.prospectiveTime.endTime, item.value)">
                {{ item.label }}
              </option>
            </select>
            <span class="ms-1 me-1">〜</span>
            <select v-model="castData.schedule_data.prospectiveTime.endTime" @change="scheduleFunctionStore.updateProspectiveTime(castData.profile.castName, 'endTime', castData.schedule_data.prospectiveTime.endTime)" style="border: solid 1px #007bff" :disabled="castDataStore.isDeleting.value[castData.profile.castName]">
              <option v-for="item in timelineItems" :value="item.value" :disabled="scheduleFunctionStore.isEndTimeDisabled(castData.schedule_data.prospectiveTime.startTime, item.value)">
                {{ item.label }}
              </option>
            </select>
          </div>
        </td>
        <td v-for="(day, index) in weekDays" :key="index" :style="scheduleFunctionStore.statusColor(castData.schedule_data?.schedules?.[day]?.status)" class="fw-bold text-start" style="font-size: small; width: 12.2%;">
          <div class="d-flex justify-content-between align-items-center" style="height: 28px;">
            <div class="fs-6 w-50 d-flex justify-content-between" :style="{ cursor: castDataStore.isDeleting.value[castData.profile.castName]? 'default' : 'pointer', userSelect: 'none' }" @click="!castDataStore.isDeleting.value[castData.profile.castName] && scheduleFunctionStore.toggleStatus(castData.profile.castName, day, castDataStore.publicCastData)">
              <div>
                <span v-if="castData.schedule_data?.schedules?.[day]?.status === 'working'">出勤</span>
                <span v-else-if="castData.schedule_data?.schedules?.[day]?.status === 'off'">休み</span>
                <span v-else>未設定</span>
              </div>
              <span class="material-symbols-outlined">arrow_drop_down</span>
            </div>
            <button v-if="castData.schedule_data?.schedules?.[day]?.status === 'working'" class="btn btn-primary fw-bold p-1" style="font-size: 0.7rem; color: yellow;" @click="scheduleFunctionStore.inputProspectiveTime(castData.profile.castName, day, castData.schedule_data.prospectiveTime.startTime, castData.schedule_data.prospectiveTime.endTime, castDataStore.publicCastData)" :disabled="castDataStore.isDeleting.value[castData.profile.castName]">入力補助</button>
          </div>
          <div class="mt-2 mb-2" style="height: 21.5px">
            <div v-if="castData.schedule_data?.schedules?.[day]?.status === 'working'" class="d-flex align-items-center justify-content-between">
              <select v-model="castData.schedule_data.schedules[day].startTime" class="border-0 schedule_input" style="width: 42%;" :style="scheduleFunctionStore.noSelectedEndTime(castData.schedule_data.schedules[day].startTime, castData.schedule_data.schedules[day].endTime)" @change="scheduleFunctionStore.updateDailySchedule(castData.profile.castName, day, 'startTime', castData.schedule_data.schedules[day].startTime)" :disabled="castDataStore.isDeleting.value[castData.profile.castName]">
                <option v-for="item in timelineItems" :value="item.value" :disabled="scheduleFunctionStore.isStartTimeDisabled(castData.schedule_data.schedules[day].endTime, item.value)">
                  {{ item.label }}
                </option>
              </select>
              <span>～</span>
              <select v-model="castData.schedule_data.schedules[day].endTime" class="border-0 schedule_input" style="width: 42%;" :style="scheduleFunctionStore.noSelectedStartTime(castData.schedule_data.schedules[day].startTime, castData.schedule_data.schedules[day].endTime)" @change="scheduleFunctionStore.updateDailySchedule(castData.profile.castName, day, 'endTime', castData.schedule_data.schedules[day].endTime)" :disabled="castDataStore.isDeleting.value[castData.profile.castName]">
                <option v-for="item in timelineItems" :value="item.value" :disabled="scheduleFunctionStore.isEndTimeDisabled(castData.schedule_data.schedules[day].startTime, item.value)">
                  {{ item.label }}
                </option>
              </select>
            </div>
          </div>
          <div style="height: 21.5px">
            <input v-if="castData.schedule_data.schedules?.[day]?.status === 'working' || castData.schedule_data.schedules?.[day]?.status === 'off'" type="text" class="schedule_input border-0 w-100 ps-1" v-model="castData.schedule_data.schedules[day].comment" @input="scheduleFunctionStore.updateDailyScheduleComment(castData.profile.castName, day, castData.schedule_data.schedules[day].comment)" placeholder="コメントを入力" :disabled="castDataStore.isDeleting.value[castData.profile.castName]">
          </div>
        </td>
      </tr>
    </tbody>
  </table>
  <div v-if="data.buttonStateFlag" class="text-center">
    <button class="btn btn-warning" @click="modalFunctionStore.extractCastData('Export')" :disabled="exportingCastSchedule">
      <div class="d-flex text-white fs-5">
        <span>{{ exportingCastSchedule_bottomButtonText }}</span>
        <span class="material-symbols-outlined" style="padding-top: 0.2rem;">arrow_forward_ios</span>
      </div>
    </button>
  </div>
  <ExtractCastModal
    v-model:modelValueB = 'modalFunctionStore.selectedCastsArray'
    :show = 'modalFunctionStore.ExtractCastModal'
    :text = 'modalFunctionStore.text'
    :subTexts = 'modalFunctionStore.subTexts'
    :instruct = 'modalFunctionStore.instruct'
    :cancelAction = 'modalFunctionStore.closeModalWindow'
    :importAction = "() => modalFunctionStore.startImportAction('Shedules')"
    :goBackSelectedAction = 'modalFunctionStore.goBackSelectedCast'
    :showCastSelection = 'data.showCastSelection'
    :confirmationClick = 'modalFunctionStore.confirmationClick'
  />
</template>

<script setup>
import { reactive, ref, computed, watch } from 'vue';
import { db } from '../firebase_settings/index.js';
import { ref as dbRef, onValue } from 'firebase/database';
import { useCastDataStore } from '../store/useCastDataStore.js';
import { useUserStore } from '../store/useUserStore.js';
import { useModalFunctionStore } from '../store/useModalFunctionStore.js'
import { useScheduleFunctionStore } from '../store/useScheduleFunctionStore.js';
import { timelineItems } from './Composable/timeline_items.js';
import ExtractCastModal from './modalWindow/ExtractCastModal.vue';

const castDataStore =  useCastDataStore();
const userStore = useUserStore();
const modalFunctionStore = useModalFunctionStore();
const scheduleFunctionStore = useScheduleFunctionStore();
 
const importingCastSchedule = ref({});
const importingCastScheduleText = ref('');
const exportingCastSchedule = ref({});
const exportingCastScheduleText = ref('');
const exportingCastSchedule_bottomButtonText = ref('');

const data = reactive ({
  selectAll: false,
  buttonStateFlag: false,
  
});

//  チェックボックス(全て選択)
watch(() => data.selectAll, (newVal) => {
  if (newVal) {
    modalFunctionStore.selectedCasts = castDataStore.publicCastData.map(cast => cast.profile.castName);
  } else {
    //  newValがtrueではない時
    if (modalFunctionStore.selectedCasts.length === castDataStore.publicCastData.length) {
      modalFunctionStore.selectedCasts = [];
    }
  }
});

watch(() => modalFunctionStore.selectedCasts, (newVal) => {
  data.selectAll = newVal.length === castDataStore.publicCastData.length;
});

const displayInformation = 7;
const currentPage = ref(0); //  現在のページ番号

//  ページごとの表示データを計算
const displayWeekDays = computed(() => {
  const start = currentPage.value * displayInformation;  // sliceする最初の値
  return scheduleFunctionStore.days.slice(start, start + displayInformation);

});

//  ページごとの表示データを計算
const weekDays = computed(() => {  
  const start = currentPage.value * displayInformation;  // sliceする最初の値
  return scheduleFunctionStore.registrationWeekDays.slice(start, start + displayInformation);

});

//  次の週
const nextPage = () => {
  if ((currentPage.value + 1) * displayInformation < scheduleFunctionStore.registrationWeekDays.length) {
    currentPage.value++;

  }
}

//  前の週
const prevPage = () => {
  if (currentPage.value > 0) {
    currentPage.value--;

  }
}

//  ボタン制御
const siteButtonStateRef = dbRef(db, `users/${userStore.accountKey}/site_button_state`);
onValue(siteButtonStateRef, async(snapshot) => {
  const enabled = snapshot.val();
  importingCastSchedule.value = !!enabled?.importingCastSchedule;
  exportingCastSchedule.value = !!enabled?.exportingCastSchedule;

  if (importingCastSchedule.value) {
    importingCastScheduleText.value = '取り込み中';

  } else {
    importingCastScheduleText.value = '取り込み';

  }

  if (exportingCastSchedule.value) {
    exportingCastScheduleText.value = 'サイトへ反映中';
    exportingCastSchedule_bottomButtonText.value = '出勤情報反映中';

  } else {
    exportingCastScheduleText.value = 'サイトへ反映';
    exportingCastSchedule_bottomButtonText.value = 'チェックしたキャストの出勤を反映';

  }//  ボタン状態取得完了フラグ
  data.buttonStateFlag = true;

});

//  スケジュール表示
modalFunctionStore.individualFlag = false;
modalFunctionStore.selectedCasts.splice(0);
const setupCastSchedule = (castData) => {
  castData.schedule_data ??= {};
  castData.schedule_data.schedules ??= {};
  castData.schedule_data.prospectiveTime ??= {};
  castData.schedule_data.prospectiveTime.startTime ??= 0;
  castData.schedule_data.prospectiveTime.endTime ??= 0;
  weekDays.value.forEach(day => {
    castData.schedule_data.schedules[day] ??= {};
    castData.schedule_data.schedules[day].startTime ??= 0;
    castData.schedule_data.schedules[day].endTime ??= 0;
  });
}

// castDataが変更されるたびにsetupCastScheduleを呼び出す
watch(
  () => castDataStore.publicCastData,
  (newData) => {
    newData.forEach(castData => {
      setupCastSchedule(castData);
      
    });
  },
  { immediate: true } // 初回の読み込み時にも実行

);

</script>