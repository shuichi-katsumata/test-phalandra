import { createRouter, createWebHistory } from 'vue-router';
import { getAuth } from "firebase/auth";
import Login from '../components/Login.vue';
import Add_girl from '../components/Add_girl.vue';
import Id_pass from '../components/id_pass.vue';
import Add_girl_logs from '../components/Add_girl_logs.vue';
import Girls_list from '../components/girls_list.vue';
import Edit_girl from '../components/Edit_girl.vue';
import Diary_address from '../components/Diary_address.vue';
import Schedule_list from '../components/Schedule_list.vue';
import Schedule from '../components/Schedule.vue';
import Schedule_logs from '../components/Schedule_logs.vue';
import Sokuhime from '../components/Sokuhime.vue';

const routes = [
  {
    path: '/:pathMatch(.*)*',
    redirect: '/login',
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { requiresAuth: false }
  },
  {
    path: '/idsettings',
    name: 'Id_pass',
    component: Id_pass,
    meta: { requiresAuth: true }
  },
  {
    path: '/girls_list',
    name: 'Girls_list',
    component: Girls_list,
    meta: { requiresAuth: true }
  },
  {
    path: '/add_girl',
    name: 'Add_girl',
    component: Add_girl,
    meta: { requiresAuth: true }
  },
  {
    path: '/edit_girl/:id',
    name: 'Edit_girl',
    component: Edit_girl,
    meta: { requiresAuth: true }
  },
  {
    path: '/diary_address',
    name: 'Diary_address',
    component: Diary_address,
    meta: { requiresAuth: true }
  },
  {
    path: '/add_girl_logs',
    name: 'Add_girl_logs',
    component: Add_girl_logs,
    meta: { requiresAuth: true }
  },
  {
    path: '/shedule_list',
    name: 'Shedule_list',
    component: Schedule_list,
    meta: { requiresAuth: true }
  },
  {
    path: '/schedule/:id',
    name: 'Schedule',
    component: Schedule,
    meta: { requiresAuth: true }
  },
  {
    path: '/schedule_logs',
    name: 'Schedule_logs',
    component: Schedule_logs,
    meta: { requiresAuth: true }
  },
  {
    path: '/sokuhime',
    name: 'Sokuhime',
    component: Sokuhime,
    meta: { requiresAuth: true }
  },
  
];

const router = createRouter({
  history: createWebHistory('/phalandra/'),
  routes,
});

router.beforeEach(async (to, from) => {
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth); //  ログインが必要なページか判定
  const isAuthenticated = await new Promise((resolve) => {
    const unsubscribe = getAuth().onAuthStateChanged((user) => {
      unsubscribe();
      resolve(user ? true : false); // userだったらtrue、違ったらfalseを返す

    });
  });

  //  認証されてなければログインページへ
  if (requiresAuth && !isAuthenticated) {
    return { path: '/login' };

  }

  //  ログイン済みなのにログインページに来たらリダイレクト
  if (to.name === 'Login' && isAuthenticated) {
    return { path: '/girls_list' };

  }
});


export default router;