import { createApp, watch } from 'vue';
import { createPinia } from 'pinia';
import { useCastDataStore } from './store/useCastDataStore.js';
import { useUserStore } from './store/useUserStore.js';
import App from './App.vue';
import router from './router/index.js';
import './index.css';
import 'jodit/build/jodit.min.css';
import JoditEditor from 'jodit-vue3';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.use(JoditEditor);

const castDataStore = useCastDataStore();
const userStore = useUserStore();

watch(
  () => [userStore.isInitialized, userStore.accountKey],
  ([initialized, accountKey]) => {
    if (initialized && accountKey) {
      castDataStore.setupRealtimeListener();
    }
  },
  { immediate: true }
);


app.mount('#app');