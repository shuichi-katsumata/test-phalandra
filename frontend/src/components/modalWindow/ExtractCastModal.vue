<template>
  <div v-show="props.show">
    <div class="z-2 position-fixed top-0 start-0 h-100 w-100 d-flex items-center justify-content-center" style="background-color: rgba(0,0,0,0.5);">
      <div class="z-3 bg-white text-secondary rounded mt-4" style="max-height: 90vh; width: 30%; overflow-y: auto;">
        <div class="d-flex flex-column p-3">
          <div class="d-flex justify-content-center items-center">
            <p class="fs-6">
              {{ props.text }}
            </p>
          </div>
          <ul class="pf-4 px-4" style="background-color: #fffde7;">
            <li v-for="(subText, index) in props.subTexts" :key="index" style="font-size: 12px; color: #8a6d3b;">
              {{ subText }}
            </li>
          </ul>
          
          <div class="bg-light p-3 border-bottom border-top" style="padding: 0; margin: 0 -16px;">
            <div v-if="showCastSelection">
              <p>どの女性を取り込みますか？</p>
              <div class="d-flex justify-content-between align-items-end">
                <div style="position: relative;">
                  <input type="text" :value="props.modelValueA" @input="$emit('update:modelValueA', $event.target.value)" placeholder="女性名で検索" style="width: 230px; padding-left: 30px; font-size: 14px;" class="form-control">
                  <span class="material-symbols-outlined ps-1" style="display: block; position: absolute; top: calc(50% - 12px); color: #7c7d7e;">search</span>
                </div>
                <div v-if="!props.loading">
                  <input type="checkbox" :checked="props.selectAll" @change="toggleAll" class="align-middle me-2">
                  <label class="text-primary" style="font-size: 14px;">全て選択</label>
                </div>
              </div>
            </div>
            <div v-else>
              <p style="margin-bottom: 0; font-size: 14px;">選択した女性の確認</p>
            </div>
          </div>

          <div>
            <div v-if="showCastSelection" style="font-size: 14px;">
              <ul class="list-unstyled">
                <li v-if="props.loading" class="py-1" >
                  <div class="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                  <span>登録されているキャスト情報を読み込み中...</span>
                </li>
                <li v-else v-for="(item, index) in props.filteredCastList" :key="index" class="border-bottom py-1">
                  <label>
                    <input type="checkbox" v-model="selectedCast" :value="item" @change="checkIndividualSelection" class="me-2 align-middle">{{ item }}
                  </label>
                </li>
              </ul>
            </div>
            <div v-else style="font-size: 14px;">
              <ul class="list-unstyled">
                <li v-for="(castName, index) in props.modelValueB" :key="index" class="border-bottom py-1 px-4">
                  {{ castName }}
                </li>
              </ul>
            </div>
          </div>
          <div style="position: relative;">
            <button v-if="props.modelValueB.length > 0 && !props.confirmationClick" class="custom-button d-flex justify-content-start align-items-center" style="width: 60px; position: absolute; top: 0;" @click="goBackSelectedCast">
              <span class="material-symbols-outlined">
                keyboard_backspace
              </span>
              <span style="padding-top: 2px;">戻る</span>
            </button>
            <div class="d-flex justify-content-end items-center">
              <button class="btn btn-secondary fw-bold me-2" style="width: 130px;" @click="closeModalWindow">キャンセル</button>
              <button v-if="props.modelValueB.length === 0" class="btn btn-secondary fw-bold pe-none" style="width: 130px;">{{ props.instruct }}</button>
              <button v-else-if="props.modelValueB.length > 0 && props.confirmationClick" class="btn btn-primary fw-bold" style="width: 130px;" @click="confirmationCastDataAction">{{ props.instruct }}</button>
              <button v-else class="btn btn-danger fw-bold" style="width: 130px;" @click="importCastDataAction">{{ props.instruct }}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({ //  読み取り専用（値を変更するのは親コンポーネントでやる）
  show: Boolean,
  text: String,
  subTexts: Array,
  loading: Boolean,
  modelValueA: String, //  これは親コンポーネントでv-modelとされる（v-modelを使うときに、modelValueという名前を使うことがデフォルトの規約）
  modelValueB: {
    type: Array,
    default: () => [],
  },
  instruct: String,
  cancelAction: Function,
  confirmationAction: Function,
  importAction: Function,
  goBackSelectedAction: Function,
  filteredCastList: Array,
  selectAll: Boolean,
  showCastSelection: Boolean,
  confirmationClick: Boolean,
});

const emits = defineEmits(['update:modelValueA', 'update:modelValueB', 'update:selectAll']);

const selectedCast = ref(props.modelValueB);

//  すべて選択
const toggleAll = () => {
  const newSelectAll = !props.selectAll;  //  現在の状態を反転（つまり真になる）
  emits('update:selectAll', newSelectAll);  //  親コンポーネントに更新を通知
  if (newSelectAll) {
    selectedCast.value = [...props.filteredCastList];
    emits('update:modelValueB', selectedCast.value);
  } else {
    selectedCast.value = [];
    emits('update:modelValueB', selectedCast.value);
  }
}

//  個別に選択
const checkIndividualSelection = () => {
  //  選択されたキャストを親に伝える
  emits('update:modelValueB', selectedCast.value);

  //  全て選択されたかをチェックし、親に伝える
  if (selectedCast.value.length === props.filteredCastList.length) {
    emits('update:selectAll', true);
  } else {
    emits('update:selectAll', false);
  }
}

//  showプロパティが変わったときの処理
watch(() => props.show, (newVal) => {
  if (newVal) {
    selectedCast.value = [];
    emits('update:selectAll', false);
  }
});

//  props.modelValueBが変わった時にselectCastも更新
watch(() => props.modelValueB, (newVal) => {
  selectedCast.value = newVal;
});

const closeModalWindow = () => {
  if (typeof props.cancelAction === 'function') {
    props.cancelAction();
  } else {
    console.warn('props.cancelAction is not a function');
  }
}

const goBackSelectedCast = () => {
  if (typeof props.goBackSelectedAction === 'function') {
    props.goBackSelectedAction();
  } else {
    console.warn('props.goBackSelectedAction is not a function');
  }
}

const confirmationCastDataAction = () => {
  if (typeof props.confirmationAction === 'function') {
    props.confirmationAction();
  } else {
    console.warn('props.confirmationAction is not a function');
  }
}

const importCastDataAction = () => {
  if (typeof props.importAction === 'function') {
    props.importAction();
  } else {
    console.warn('props.importAction is not a function');
  }
}
</script>