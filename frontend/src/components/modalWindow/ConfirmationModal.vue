<template>
  <div v-show="show">
    <div class="z-2 position-fixed top-0 start-0 h-100 w-100 d-flex items-center justify-content-center" style="background-color: rgba(0,0,0,0.5);">
      <div class="z-3 bg-white .text-secondary w-50 rounded mt-4" style="height: fit-content;">
        <div class="d-flex flex-column p-3">
          <div class="d-flex justify-content-center items-center">
            <p class="fs-5">
              {{ text }}
            </p>
          </div>
          <div class="mt-4 d-flex justify-content-center items-center">
            <button class="btn btn-secondary me-5 fw-bold" style="width: 100px;" @click="$emit('close')">いいえ</button>
            <button :class="buttonClass" style="width: 100px;" @click="executeAction">{{ instruct }}</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
const props = defineProps({
  show: Boolean,
  text: String,
  instruct: String,
  send_completed: Boolean,
  action: Function,
});
const emits = defineEmits(['close', 'save']);
const executeAction = () => {
  if (props.action) {
    props.action();
  }
}
const buttonClass = computed(() => {
  return props.instruct === '削除' ? 'btn btn-danger ms-5 fw-bold' : 'btn btn-primary ms-5 fw-bold';
});
</script>