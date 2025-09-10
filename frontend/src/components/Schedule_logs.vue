<template>
  <div class="d-flex justify-content-between">
    <div style="width: 60%">
      <table style="width: 100%;">
        <tbody class="custom-tbody">
          <tr>
            <th class="text-center table_title">出勤情報更新結果</th>
          </tr>
          <tr v-for="(log, key) in logsData" :key="key">
            <td>
              <div @click="fetchData(log.id)" style="cursor: pointer;">
                {{ log.registration_date }}&emsp;{{ log.content }}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <!-- 追従させる -->
    <div class="sticky-top" style="width:35%"> 
      <div class="bg-white rounded sticky-top" style="height: 500px;">
        <div class="d-flex flex-column p-3" v-if="selectedLog.content">
          <p class="text-center border-bottom">
            {{ selectedLog.content }}
          </p>
          <p v-for="(value, key) in content_logs" :key="key" :class="{ 'text-danger' : value.includes('エラー'), 'text-success' : value.includes('完了')}">
            {{ value }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ref as dbRef, get, onValue, query, orderByKey, set } from 'firebase/database';
import { db } from '../firebase_settings/index.js';
import { useUserStore } from '../store/useUserStore.js';

const userStore = useUserStore();

// データを保持するリアクティブな変数
const logsData = ref([]);
const selectedLog = ref({});
const content_logs = ref([]);

// DBからデータの取得＆保存数を制限する関数
const add_girl_logsFetchData = () => {
  const logsRef = dbRef(db, `users/${userStore.accountKey}/logs/schedule_log`);

  onValue(logsRef, (snapshot) => {
    const logs = [];
    snapshot.forEach((childSnapshot) => {
      const key = childSnapshot.key;
      const value = childSnapshot.val();
      logs.push({ id: key, ...value });
    });

    // 降順にして表示
    logsData.value = logs.reverse();

    // 保存数制限
    if (logs.length > 20) {
      const oldestKey = logs[logs.length - 1].id; // 古いものは最後尾
      const oldestLogRef = dbRef(db, `users/${userStore.accountKey}/logs/schedule_log/${oldestKey}`);
      set(oldestLogRef, null);
    }
  });
};

const fetchData = (log) => {
  content_logs.value = [];
  const logRef = dbRef(db, `users/${userStore.accountKey}/logs/schedule_log/${log}`);
  onValue(logRef, (snapshot) => {
    selectedLog.value = snapshot.val();
  });

  const content_logsRef = dbRef(db, `users/${userStore.accountKey}/logs/schedule_log/${log}/content_logs`);
  onValue(content_logsRef, (snapshot) => {
    snapshot.forEach((childSnapshot) => {
      const value = childSnapshot.val();
      Object.values(value).forEach((val) => {
        if (val !== "" && val !== [] && !content_logs.value.includes(val)) {
          content_logs.value.push(val); // 空の文字列や空の配列以外の値だけを追加する

        }
      });
    });
  });
}

// コンポーネントがマウントされた後にデータを取得
onMounted(() => {
  add_girl_logsFetchData();
});
</script>
