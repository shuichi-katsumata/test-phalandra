<template>
  <tbody>
    <tr>
      <th class="text-center table_title" style="width: 1500px;" colspan="2">即姫・接客一括更新</th>
    </tr>
    <tr>
      <td style="height: 57px;">
        <div v-if="userStore.isInitialized">
          <ul item-key="id" class="list-unstyled d-flex justify-content-start flex-wrap" style="margin: 0;">
            <li v-for="cast of castDataStore.workingTodayCastData" :class="[ 'me-2', 'mb-3', 'border', 'position-relative', { fading: castDataStore.isDeleting.value[cast.profile.castName] || castDataStore.isAdding.value[cast.profile.castName] } ]" :style="{ width: '175px' }">
              <div class="d-flex flex-column align-items-center">
                <p class="mt-1 mb-0">現在：{{ selectStatus.find(status => status.value === cast.schedule_data.schedules[castDataStore.today].isWaitingStatus)?.label || '未設定' }}</p>
                <div style="height: 173px; width: 130px;">
                  <img v-if="cast.profile.panelURLs && cast.profile.panelURLs['1']" :src="cast.profile.panelURLs['1']" class="mt-1" style="width: 130px;">
                </div>
                <p class="text-primary mb-0" style="margin: 0.5rem 0;">{{ cast.profile.castName }} </p>
                <p class="text-secondary mb-0">{{ cast.schedule_data.schedules[castDataStore.today].startTime }}&nbsp;～&nbsp;{{ cast.schedule_data.schedules[castDataStore.today].endTime }}</p>
                <select v-model="editedStatusMap[cast.profile.castName]" class="form-select mb-2" style="width: 65%;">
                  <option v-for="status in selectStatus" :key="status.value" :value="status.value">{{ status.label }}</option>
                </select>
                <button class="btn btn-success text-white mb-2" style="width: 80px;">更新</button>
              </div>
            </li>
          </ul>
        </div>
      </td>
    </tr>
  </tbody>
</template>

<script setup>
import { reactive, ref, watch } from 'vue';
import { useUserStore } from '../store/useUserStore';
import { useCastDataStore } from '../store/useCastDataStore';

const userStore = useUserStore();
const castDataStore = useCastDataStore();
const editedStatusMap = ref({});

const selectStatus = [
  {value:'0', label:'未設定'},
  {value:'1', label:'待機中'},
  {value:'2', label:'接客中'},
  {value:'3', label:'受付終了'},
]

watch(() => castDataStore.workingTodayCastData,
  (workingTodayCastData) => {
    if (!workingTodayCastData || workingTodayCastData.length ===0) return;
    workingTodayCastData.forEach(cast => {
      const currentStatus = cast.schedule_data.schedules?.[castDataStore.today]?.isWaitingStatus ?? '0';
      editedStatusMap.value[cast.profile.castName] = currentStatus;
      
    });
    
    //  並び順
    workingTodayCastData.sort((a, b) => {
      const aTime = a.schedule_data.schedules[castDataStore.today].startTime || '00:00';
      const bTime = b.schedule_data.schedules[castDataStore.today].startTime || '00:00';

      const toMinutes = (timeStr) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
      };
      return toMinutes(aTime) - toMinutes(bTime); // 昇順
    
    });
  },
  { immediate: true }
);
</script>