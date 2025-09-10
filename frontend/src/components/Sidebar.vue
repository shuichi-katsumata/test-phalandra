<template>
  <div class="pt-4">
    <div class="fw-bold">{{ shopName }}</div>
    <div class="mt-2 d-flex justify-content-end" style="font-size:0.9em">
      <button @click="logout()" class="me-3 d-flex text-primary bg-transparent" style="border: none; ">
        <span class="me-1 material-symbols-outlined" style="font-size:larger; padding-top: 2px;">
        logout
        </span>
        <p class="mb-0">ログアウト</p>
      </button>
    </div>
    <List />
  </div>
</template>

<script setup>
import List from './List.vue';
import { getAuth, signOut } from 'firebase/auth';
import { ref, watch } from 'vue';
import { ref as dbRef, get } from 'firebase/database';
import { db } from '../firebase_settings/index.js';
import { useUserStore } from '../store/useUserStore.js';
import { useCastDataStore } from '../store/useCastDataStore.js';
import { useRouter } from 'vue-router';

const router = useRouter();
const castDataStore = useCastDataStore();
const userStore = useUserStore();
const shopName = ref('読み込み中…'); // ← 表示するデータ用のref

const logout = async() => {
  const auth = getAuth();
  try {
    await signOut(auth);
    userStore.reset(); //  ユーザーストア初期化
    castDataStore.reset();
    router.push('/login');

  } catch(error) {
    console.error(error.message);
  
  }
}

watch(() => userStore.accountKey,
  async (accountKey) => {
    if (accountKey) {
      const shopNameRef = dbRef(db, `users/${accountKey}/shop_name`);
      const snapshot = await get(shopNameRef);
      if (snapshot.exists()) {
        shopName.value = snapshot.val();

      } else {
        shopName.value = '店舗名未設定';
      
      }
    }
  },
  { immediate: true } // 初期実行もする
);

</script>
