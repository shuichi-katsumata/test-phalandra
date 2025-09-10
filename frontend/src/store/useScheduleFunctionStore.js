import { defineStore } from "pinia";
import { ref as dbRef, update, get } from 'firebase/database';
import { db } from '../firebase_settings/index.js';
import { ref } from "vue";
import { useUserStore } from "./useUserStore.js";

export const useScheduleFunctionStore = defineStore('sheduleFunction', () => {

  const userStore = useUserStore();

  //  42日分の日付作成(日付(曜日)の形)
  const today = new Date();
  const days = ref([]);
  const daysOfWeek = ['日', '月', '火', '水', '木', '金', '土'];

  for (let i = 0; i < 42; i++) {
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + i);
    const dayOfWeek = daysOfWeek[nextDate.getDay()];
    const day = nextDate.getDate();
    const formattedDate = `${day}(${dayOfWeek})`;
    days.value.push(formattedDate);
  }

  //  42日分の日付作成(DB登録用)
  const registrationWeekDays = ref([]);

  for (let i = 0; i < 42; i++) {
    registrationWeekDays.value.push (
      new Date(Date.now() + i * 86400000).toISOString().split("T")[0]
    );
  }

  //  入力補助
  const updateProspectiveTime = async(castName, type, value) => {
    const prospectiveTimeRef = dbRef(db, `users/${userStore.accountKey}/add_girl/cast_data/${castName}/schedule_data/prospectiveTime`);
    await update(prospectiveTimeRef, { [type]: value });
  }
  //  出勤・退勤時間
  const updateDailySchedule = async(castName, day, type, value) => {
    const schedulesRef = dbRef(db, `users/${userStore.accountKey}/add_girl/cast_data/${castName}/schedule_data/schedules/${day}/`);
    await update(schedulesRef, { [type]: value });
  }
  //  コメント
  const updateDailyScheduleComment = async(castName, day, comment) => {
    const schedulesRef = dbRef(db, `users/${userStore.accountKey}/add_girl/cast_data/${castName}/schedule_data/schedules/${day}/`);
    if (comment !== undefined) {
      await update(schedulesRef, { comment: comment });
    }
  }

  //  出勤時間のdisabled設定
  const isStartTimeDisabled = (endTime, value) => {
    return endTime !== 0 && value >= endTime;
  }
  
  //  退勤時間のdisabled設定
  const isEndTimeDisabled = (startTime, value) => {
    return startTime !== 0 && value <= startTime;
  }
  
  //  出勤時間の入力漏れ防止措置
  const noSelectedEndTime = (startTime, endTime) => {
    if (startTime === 0 && endTime !== 0) {
      return { outline: '1px #FF0000 solid' };
    } 
    return {};
  }
  //  退勤時間の入力漏れ防止措置
  const noSelectedStartTime = (startTime, endTime) => {
    if (endTime === 0 && startTime !== 0) {
      return { outline: '1px #FF0000 solid' };
    }
    return {};
  }

  //  入力補助
  const inputProspectiveTime = async(castName, day, startTime, endTime, publicCastData) => {
    const schedulesRef = dbRef(db, `users/${userStore.accountKey}/add_girl/cast_data/${castName}/schedule_data/schedules/${day}/`);
    
    //  DBに登録
    await update(schedulesRef, { startTime: startTime, endTime: endTime });
  
    //  ローカルデータを更新
    const cast = publicCastData.find(c => c.profile.castName === castName);
  
    if (cast) {
      cast.schedule_data.schedules[day] = {
        ...cast.schedule_data.schedules[day],
        startTime,
        endTime,
      } 
    }
  }
  
  //  クリックで表示を切り替える
  const toggleStatus = async(castName, day, publicCastData) => {

    const schedulesRef = dbRef(db, `users/${userStore.accountKey}/add_girl/cast_data/${castName}/schedule_data/schedules/${day}/`);
    const schedulesSnapshot = await get(schedulesRef);
    const schedulesData = schedulesSnapshot.val() || {}; 

    const statusCycle = { null: 'working', working: 'off', off: 'unset', unset: 'working'};
    const newStatus = statusCycle[schedulesData.status] ?? 'working';

    //  DB登録
    await update(schedulesRef, { status: newStatus });
    
    const cast = publicCastData.find(c => c.profile.castName === castName);

    if (cast) {
      cast.schedule_data.schedules[day] = {
        ...cast.schedule_data.schedules[day],
        status: newStatus,
        ...(newStatus !== 'unset' && schedulesData.startTime !== undefined && schedulesData.endTime !== undefined
          ? { startTime: schedulesData.startTime, endTime: schedulesData.endTime, comment: schedulesData.comment}
          : {}
        ),
      }
    }
  }

  //  statusの状態によって色を変える
  const statusColor = (status) => {

    if (!status) {

      return { 'background-color': '#f8f9fa', 'color': '#979797' }; // デフォルトの色を設定
    
    } else if (status === 'working') {

      return { 'background-color': '#DBECFB', 'color': '#1E88E5' };

    } else if (status === 'off') {

      return { 'background-color': '#FDEDED', 'color': '#E53935' };

    } else {

      return { 'background-color': '#f8f9fa', 'color': '#979797' };

    }
  }

  return {
    days, registrationWeekDays,
    updateProspectiveTime, updateDailySchedule, updateDailyScheduleComment, isStartTimeDisabled, isEndTimeDisabled,
    noSelectedEndTime, noSelectedStartTime, inputProspectiveTime, toggleStatus, statusColor,
  }
});