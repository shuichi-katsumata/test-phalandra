<template>
  <div v-if="!isLoginPage" class="position-fixed vh-100 bg-white z-2 sidebar text-center">
    <Sidebar />
  </div>

  <div :class="[ 'd-flex', isLoginPage ? 'justify-content-center' : 'justify-content-end']">
    <div class="main_board p-5">
      <router-view/>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import Sidebar from './components/Sidebar.vue';
import { useRoute } from 'vue-router';
import { useUserStore } from './store/useUserStore.js';

const route = useRoute();
const userStore = useUserStore();

//  ログインページかどうか判定
const isLoginPage = computed(() => route.path === '/login');

onMounted(() => {
  userStore.initAuth();
});
</script>
