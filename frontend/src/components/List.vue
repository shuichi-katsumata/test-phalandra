<template>
  <ul class="list-group list-group-flush">
    <li class="list-group-item" style="padding:0.5rem 0;" v-for="list in lists" :key="list.name">
      <router-link :to="list.link" class="menu-btn text-decoration-none text-reset">
        <div class="btn-outline pt-2 ps-4 pb-2 d-flex">
          <span class="me-2 material-symbols-outlined" :style="{ color: list.color }">{{ list.material_icons }}</span>
          <span> {{ list.name }} </span>
        </div>
      </router-link>
    </li>
  </ul>
</template>

<script setup>
  import { reactive } from 'vue';

  const lists = reactive([
    {
      color: 'darkorange',
      material_icons: 'vpn_key',
      name: 'ID・PASS登録',
      link: '/idsettings',
    },
    // {
    //   color: 'crimson',
    //   material_icons: 'mode_heat',
    //   name: '即姫・接客一括更新',
    //   link: '/sokuhime',
    // },
    {
      color: 'deeppink',
      material_icons: 'face',
      name: 'キャスト一覧',
      link: '/girls_list',
    },
    {
      color: 'blueviolet',
      material_icons: 'send',
      name: '写メ日記転送設定',
      link: '/diary_address',
    },
    {
      color: 'darkgreen',
      material_icons: 'calendar_month',
      name: '出勤管理',
      link: '/shedule_list',
    },
    {
      material_icons: 'playlist_add_check',
      name: 'キャスト情報更新結果',
      link: '/add_girl_logs',
    },
    {
      material_icons: 'playlist_add_check',
      name: '出勤情報更新結果',
      link: '/schedule_logs',
    },
  ]);
</script>