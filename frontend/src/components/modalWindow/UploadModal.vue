<template>
  <div v-show="show">
    <div class="z-2 position-fixed top-0 start-0 h-100 w-100 d-flex items-center justify-content-center" style="background-color: rgba(0,0,0,0.5);">
      <div class="z-3 bg-white .text-secondary w-50 rounded mt-4" style="height: fit-content;">
        <div class="d-flex flex-column p-3">
          <div class="d-flex justify-content-center items-center">
            <h2 class="fs-3 lh-lg">
              {{ send }}
            </h2>
          </div>
          <div class="bg-secondary rounded mt-3" style="height: 20px;" v-show="progressBar === false">
            <div class="w-100 h2" style="height: 20px;">
              <div class="bg-primary rounded h-100 block" :style="('width:' + successWidth + '%')"></div>
            </div>
          </div>
          <div class="bg-secondary rounded mt-3" style="height: 20px;" v-show="progressBar === true">
            <div class="w-100 h2" style="height: 20px;">
              <div class="bg-primary rounded h-100 block" :style="('width:' + successWidth + '%')"></div>
            </div>
          </div>
          <div class="mt-4 d-flex justify-content-end items-center">
            <button class="btn btn-secondary px-4 py-2 fw-bold" v-show="send_completed === false">完了</button>
            <button class="btn btn-primary px-4 py-2 fw-bold" @click="closeUploadModal" v-show="send_completed === true">完了</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>

const props = defineProps({
  show: Boolean,
  send: String,
  progressBar: Boolean,
  successWidth: Number,
  send_completed: Boolean,
});

const emit = defineEmits(['close']);

const closeUploadModal = ()=> {
  emit('close');
}
</script>