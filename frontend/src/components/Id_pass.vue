<template>
  <tbody>
    <tr>
      <th class="text-center table_title" colspan="2">ID・PASS登録</th>
    </tr>
    <tr v-for="(externalSite, index) in reactiveSites" :key="index">
      <th style="width:180px">{{ externalSite.siteName }}</th>
        <td>
          <ul class="list-unstyled d-flex align-items-center" style="margin: 0; padding: 0.5rem 0;">
            <li><span class="me-2">ID：</span><input type="text" v-model="externalSite.id" style="width: 180px;"></li>
            <li><span class="ms-4 me-2">PASS：</span><input type="text" v-model="externalSite.pass" style="width: 180px;"></li>
            <li><span class="ms-4 me-2">ログインURL：</span><input type="text" v-model="externalSite.loginUrl" style="width: 400px;"></li>
            <li><button type="button" class="btn btn-success ms-4" @click="registerPass(index)" style="width: 80px;" :disabled="externalSite.registrationText === '認証中'">{{ externalSite.registrationText }}</button></li>
          </ul>
          <p class="text-end" :class="{'text-primary': externalSite.auth === '認証確認済', 'text-danger': externalSite.auth === '認証確認出来ませんでした。入力内容に間違いがないか見直してください'}" style="font-size: 0.8em; margin-bottom: 0;">{{ externalSite.auth }}</p>
        </td>
    </tr>
  </tbody>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { db } from '../firebase_settings/index.js';
import { update, ref as dbRef, onValue } from "firebase/database";
import { externalSites } from './Composable/externalSites.js';
import { useUserStore } from '../store/useUserStore.js';

const userStore = useUserStore();

// externalSitesをreactiveにする
const reactiveSites = ref(externalSites.map((site) => ({
  ...site,
  id: '', // 初期値を空文字に設定
  pass: '',
  loginUrl: '',
  auth: '',
  registrationText: '',
})));


const siteDetails = () => {
  if (!userStore.accountKey) return;
  
  reactiveSites.value.forEach(site => {
    const siteName = site.name;
    const idPassRef = dbRef(db, `users/${userStore.accountKey}/id_pass/${siteName}`);
    const buttonStateRef = dbRef(db, `users/${userStore.accountKey}/id_pass/${siteName}/auth`);

    //  登録されている値の表示
    onValue(idPassRef, (snapshot) => { // onValue を使用してリアルタイム更新を監視
      const idPassData = snapshot.val();
      site.id = idPassData?.login_items?.id || '';
      site.pass = idPassData?.login_items?.pass || '';
      site.loginUrl = idPassData?.login_items?.loginUrl || '';

    });

    //  ボタン制御
    onValue(buttonStateRef, (snapshot) => {
      const buttonSituation = snapshot.val();
      site.auth = buttonSituation;
      site.registrationText = buttonSituation === '認証中' ? '認証中' : '登録';

    });
  });
}

// 登録
const registerPass = async (index)=> {
  const externalSite = reactiveSites.value[index];
  await update(dbRef(db, `users/${userStore.accountKey}/id_pass/${externalSite.name}/`), {
    login_items: {
      id: externalSite.id,
      pass: externalSite.pass,
      loginUrl: externalSite.loginUrl,

    },
  });

  try {
    await fetch(`${userStore.API_BASE_URL}/authentications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    body: JSON.stringify({accountKey: userStore.accountKey, siteName: externalSite.name}),

    });
  } catch (error) {
    console.error(error.message);
  
  }
}

onMounted(() => {
  siteDetails();
});
</script>