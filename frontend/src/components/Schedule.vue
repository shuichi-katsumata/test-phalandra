<template>
  <div v-if="castData" class="d-flex justify-content-between">
    <div class="d-flex flex-column text-center text-primary" style="width: 13%;">
      <img :src="castData.profile.panelURLs['1']">
      <span class="mt-2 mb-2">{{ castData.profile.castName }}</span>
      <div class="d-flex justify-content-center flex-wrap cautionary_note">
        <span>入力補助：</span>
        <div>
          <select v-model="castData.schedule_data.prospectiveTime.startTime" @change="scheduleFunctionStore.updateProspectiveTime(castData.profile.castName, 'startTime', castData.schedule_data?.prospectiveTime?.startTime)" style="border: solid 1px #007bff">
            <option v-for="item in timelineItems" :value="item.value" :disabled="scheduleFunctionStore.isStartTimeDisabled(castData.schedule_data?.prospectiveTime?.endTime, item.value)">
              {{ item.label }}
            </option>
          </select>
          <span class="ms-1 me-1">〜</span>
          <select v-model="castData.schedule_data.prospectiveTime.endTime" @change="scheduleFunctionStore.updateProspectiveTime(castData.profile.castName, 'endTime', castData.schedule_data.prospectiveTime.endTime)" style="border: solid 1px #007bff">
            <option v-for="item in timelineItems" :value="item.value" :disabled="scheduleFunctionStore.isEndTimeDisabled(castData.schedule_data.prospectiveTime.startTime, item.value)">
              {{ item.label }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <div style="width: 83%;">
      <div class="d-flex justify-content-between mb-3">
        <div>
          <button class="btn btn-success mx-2" style="width: 126px;" @click="modalFunctionStore.extractCastData('Import', isImportingThisCastSchedule)" :disabled="isImportingThisCastSchedule || isExportingThisCastSchedule">
            <div class="d-flex justify-content-center align-items-center">
              <span v-if="!isImportingThisCastSchedule" class="material-symbols-outlined">vertical_align_bottom</span>
              <span v-else class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
              <span>{{ isImportingThisCastScheduleText }}</span>
            </div>
          </button>
          <button class="btn btn-warning text-white mx-2" style="width: 158px;" @click="modalFunctionStore.extractCastData('Export', isExportingThisCastSchedule.value)" :disabled="isExportingThisCastSchedule || isImportingThisCastSchedule">
            <div class="d-flex justify-content-center align-items-center">
              <span v-if="!isExportingThisCastSchedule" class="material-symbols-outlined">vertical_align_top</span>
              <span v-else class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
              <span>{{ isExportingThisCastScheduleText }}</span>
            </div>
          </button>
        </div>
      </div>
      <table v-for="n in splitWeekDays.length" class="w-100 text-center" style="margin-bottom: 16px;">
        <thead>
          <tr class="border-top border-end">
            <th v-for="(week, weekIndex) in splitWeekDays[n-1]" :key="weekIndex" style="font-size: small;">{{ week }}</th>
          </tr>
        </thead>
        <tbody>
          <tr> 
            <td v-for="(day, weekScheduleDataIndex) in splitWeekDaysScheduleData[n-1]" :key="weekScheduleDataIndex" :style="scheduleFunctionStore.statusColor(castData.schedule_data?.schedules?.[day]?.status)" class="fw-bold text-start" style="font-size: small;">
              <div class="d-flex justify-content-between align-items-center" style="height: 28px;">
                <div class="fs-6 w-50 d-flex justify-content-between" style="cursor: pointer; user-select: none;" @click="scheduleFunctionStore.toggleStatus(castData.profile.castName, day, castDataStore.publicCastData)">
                  <div>
                    <span v-if="castData.schedule_data?.schedules?.[day]?.status === 'working'">出勤</span>
                    <span v-else-if="castData.schedule_data?.schedules?.[day]?.status === 'off'">休み</span>
                    <span v-else>未設定</span>
                  </div>
                  <span class="material-symbols-outlined">arrow_drop_down</span>
                </div>
                <button v-if="castData.schedule_data?.schedules?.[day]?.status === 'working'" class="btn btn-primary fw-bold p-1" style="font-size: 0.7rem; color: yellow;" @click="scheduleFunctionStore.inputProspectiveTime(castData.profile.castName, day, castData.schedule_data.prospectiveTime.startTime, castData.schedule_data.prospectiveTime.endTime, castDataStore.publicCastData)">入力補助</button>
              </div>
              <div class="mt-2 mb-2" style="height: 21.5px">
                <div v-if="castData.schedule_data?.schedules?.[day]?.status === 'working'" class="d-flex align-items-center justify-content-between">
                  <select v-model="castData.schedule_data.schedules[day].startTime" class="border-0 schedule_input" style="width: 42%;" :style="scheduleFunctionStore.noSelectedEndTime(castData.schedule_data.schedules[day].startTime, castData.schedule_data.schedules[day].endTime)" @change="scheduleFunctionStore.updateDailySchedule(castData.profile.castName, day, 'startTime', castData.schedule_data.schedules[day].startTime)">
                    <option v-for="item in timelineItems" :value="item.value" :disabled="scheduleFunctionStore.isStartTimeDisabled(castData.schedule_data.schedules[day].endTime, item.value)">
                      {{ item.label }}
                    </option>
                  </select>
                  <span>～</span>
                  <select v-model="castData.schedule_data.schedules[day].endTime" class="border-0 schedule_input" style="width: 42%;" :style="scheduleFunctionStore.noSelectedStartTime(castData.schedule_data.schedules[day].startTime, castData.schedule_data.schedules[day].endTime)" @change="scheduleFunctionStore.updateDailySchedule(castData.profile.castName, day, 'endTime', castData.schedule_data.schedules[day].endTime)">
                    <option v-for="item in timelineItems" :value="item.value" :disabled="scheduleFunctionStore.isEndTimeDisabled(castData.schedule_data.schedules[day].startTime, item.value)">
                      {{ item.label }}
                    </option>
                  </select>
                </div>
              </div>
              <div style="height: 21.5px">
                <input v-if="castData.schedule_data.schedules?.[day]?.status === 'working' || castData.schedule_data.schedules?.[day]?.status === 'off'" type="text" class="schedule_input border-0 w-100 ps-1" v-model="castData.schedule_data.schedules[day].comment" @input="scheduleFunctionStore.updateDailyScheduleComment(castData.profile.castName, day, castData.schedule_data.schedules[day].comment)" placeholder="コメントを入力">
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
  <ExtractCastModal
    :modelValueB = 'modalFunctionStore.selectedCastsArray'
    :show = 'modalFunctionStore.ExtractCastModal'
    :text = 'modalFunctionStore.text'
    :subTexts = 'modalFunctionStore.subTexts'
    :instruct = 'modalFunctionStore.instruct'
    :cancelAction = 'modalFunctionStore.closeModalWindow'
    :importAction = '() => modalFunctionStore.startImportAction("Shedules")'
    :goBackSelectedAction = 'modalFunctionStore.goBackSelectedCast'
    :confirmationClick = 'modalFunctionStore.confirmationClick'
  />
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useCastDataStore } from '../store/useCastDataStore.js';
import { timelineItems } from './Composable/timeline_items.js'
import { useRouter } from 'vue-router';
import { useUserStore } from '../store/useUserStore.js';
import { useModalFunctionStore } from '../store/useModalFunctionStore.js'
import { useScheduleFunctionStore } from '../store/useScheduleFunctionStore.js';
import ExtractCastModal from './modalWindow/ExtractCastModal.vue';
import { db } from '../firebase_settings/index.js';
import { ref as dbRef, onValue } from 'firebase/database';

const castDataStore =  useCastDataStore();
const modalFunctionStore = useModalFunctionStore();
const scheduleFunctionStore = useScheduleFunctionStore();
const userStore = useUserStore();
const router = useRouter();

const isImportingThisCastSchedule = ref({});
const isImportingThisCastScheduleText = ref('');
const isExportingThisCastSchedule = ref({});
const isExportingThisCastScheduleText = ref('');

// キャストデータの表示用
const castData = ref(null);
const url = window.location.href;
const parts = url.split('/');
const lastPart = parts[parts.length-1];

const splitWeekDays = computed(() => {
  let result = [];
  for(let i = 0; i < scheduleFunctionStore.days.length; i += 7) {
    result.push(scheduleFunctionStore.days.slice(i, i + 7));
  }
  return result;

});

const splitWeekDaysScheduleData = computed(() => {
  let result = [];
  for (let i = 0; i < scheduleFunctionStore.registrationWeekDays.length; i += 7) {
    result.push(scheduleFunctionStore.registrationWeekDays.slice(i, i + 7));
  }
  return result;

});

watch(() => castData.value, (newVal) => {
  if (newVal) {
    //  ボタン制御
    const buttonStateRef = dbRef(db, `users/${userStore.accountKey}/add_girl/cast_data/${castData.value.profile.castName}/button_state`);
    onValue(buttonStateRef, async(snapshot) => {
      const enabled = snapshot.val();
      isImportingThisCastSchedule.value = !!enabled?.isImportingThisCastSchedule;
      isExportingThisCastSchedule.value = !!enabled?.isExportingThisCastSchedule;
      
      if (isImportingThisCastSchedule.value) {
        isImportingThisCastScheduleText.value = '取り込み中';
      
      } else {
        isImportingThisCastScheduleText.value = '取り込み';

      }

      if (isExportingThisCastSchedule.value) {
        isExportingThisCastScheduleText.value = 'サイトへ反映中';

      } else {
        isExportingThisCastScheduleText.value = 'サイトへ反映';

      }
    });
  }
});

const setupCastSchedule = (castData) => {
  castData.schedule_data ??= {};
  castData.schedule_data.schedules ??= {};
  castData.schedule_data.prospectiveTime ??= {};
  castData.schedule_data.prospectiveTime.startTime ??= 0;
  castData.schedule_data.prospectiveTime.endTime ??= 0;
  scheduleFunctionStore.registrationWeekDays.forEach(day => {
    castData.schedule_data.schedules[day] ??= {};
    castData.schedule_data.schedules[day].startTime ??= 0;
    castData.schedule_data.schedules[day].endTime ??= 0;

  });
}

watch(() => castDataStore.publicCastData, (newVal) => {
  modalFunctionStore.keepSelectedCast = true;
  
  if (newVal && newVal.length > 0) {
    castData.value = newVal.find(cast => cast.profile.id === parseInt(lastPart));
    newVal.forEach(castData => {
      setupCastSchedule(castData);
    });

    //  selectedCasts初期化
    if(castData.value) {
      modalFunctionStore.selectedCasts.splice(0);
      modalFunctionStore.selectedCasts.push(castData.value.profile.castName);
      modalFunctionStore.individualFlag = true;

    }      
  }
}, { immediate: true });

onMounted(() => {
  //  ↓Single Page Application (SPA)なので前ページ（girls_list.vue）のスクロール位置が保持されてしまうのでそれを回避
  router.afterEach(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  })
});
</script>