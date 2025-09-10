import { defineStore } from "pinia";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { ref } from 'vue';

export const useUserStore = defineStore('user', () => {
  const email = ref('');
  const accountKey = ref('');
  const isInitialized = ref(false);

  const initAuth = () => {
    const auth = getAuth();
    onAuthStateChanged(auth, (user) => {
      if (user && user.email) {
        email.value = user.email;
        accountKey.value = user.uid;

      } else {
        email.value = '';
        accountKey.value = '';

      }
      isInitialized.value = true; 
    });
  }

  const reset = () => {
    email.value = '';
    accountKey.value = '';
    isInitialized.value = false;

  }

  // ExpressのURL設定
  const API_BASE_URL = ref(
    import.meta.env.DEV
      ? 'http://localhost:3001'
      : 'http://133.18.110.248/api'
  );

  return {
    email, accountKey, isInitialized, API_BASE_URL,
    initAuth, reset,
  }
});