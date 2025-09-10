<template>
    <div class="mx-auto col-sm-6">
      <h2>ログイン</h2>
      <form @submit.prevent>
        <div class="mb-3">
          <label class="form-label">メールアドレス：</label>
          <input type="email" class="form-control" v-model="userStore.email" autocomplete="email">
        </div>
        <div class="mb-3">
          <label class="form-label">パスワード：</label>
          <input type="password" class="form-control" v-model="data.password" autocomplete="current-password">
        </div>
      </form>
      <div class="d-grid gap-2 d-md-flex justify-content-md-end">
        <button @click="login" class="btn btn-info text-white fw-bold">ログイン</button>
      </div>
    </div>
</template>

<script setup>
  import { reactive } from 'vue';
  import { getAuth, signInWithEmailAndPassword, setPersistence,  browserSessionPersistence } from "firebase/auth";
  import { useUserStore } from '../store/useUserStore.js';
  import router from '../router';

  const userStore = useUserStore();
  const data = reactive({
    password: '',
  });

  const auth = getAuth();
  
  const login = async() => {
    try {
      await setPersistence(auth, browserSessionPersistence);  //  ログイン中のユーザーの認証情報保持
      await signInWithEmailAndPassword(auth, userStore.email, data.password);
      router.push('/girls_list');

    } catch(error) {
      console.log(error.code, error.message);
      userStore.email = '';
      data.password = '';

    }
  }
</script>