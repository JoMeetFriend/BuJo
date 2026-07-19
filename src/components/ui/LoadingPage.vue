<!-- LoadingPage — 全螢幕載入畫面
  用於 App 尚未就緒（例如登入狀態確認中）時顯示，避免畫面空白一片
  內容：翻頁書本動畫 + 每 1.6 秒輪播一次的提示文案

  用法：
    import LoadingPage from '@/components/ui/LoadingPage.vue'

    <LoadingPage v-if="!authStore.initialized" />
-->

<template>
  <div
    class="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-[var(--bujo-page)]"
  >
    <span class="loader" aria-hidden="true"></span>
    <Transition name="caption-fade" mode="out-in">
      <p :key="captionIndex" class="font-nunito text-sm text-[var(--bujo-muted-strong)]">
        {{ currentCaption }}
      </p>
    </Transition>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const captionKeys = [
  'loading.default',
  'loading.wakingUp',
  'loading.oneMorePage',
  'loading.gotcha',
  'loading.seriously',
  'loading.inkNotDry',
  'loading.organizing',
  'loading.warmingUp',
  'loading.hauling',
  'loading.sprinting',
]

const CAPTION_INTERVAL_MS = 1600

const captionIndex = ref(0)
const currentCaption = computed(() => t(captionKeys[captionIndex.value]))
let captionTimer = null

onMounted(() => {
  captionTimer = setInterval(() => {
    captionIndex.value = (captionIndex.value + 1) % captionKeys.length
  }, CAPTION_INTERVAL_MS)
})

onUnmounted(() => {
  clearInterval(captionTimer)
})
</script>

<style scoped>
.loader {
  --color-1: #979794;
  --color-2: #b5cdde;
  --color-3: #ddd;
  --color-4: rgba(0, 0, 0, 0.25);
  --color-5: #fff;
  --size: 1px;

  width: calc(200 * var(--size));
  height: calc(140 * var(--size));
  background: var(--color-1);
  box-sizing: border-box;
  position: relative;
  border-radius: calc(8 * var(--size));
  perspective: calc(1000 * var(--size));
}

.loader:before {
  content: '';
  position: absolute;
  left: calc(10 * var(--size));
  right: calc(10 * var(--size));
  top: calc(10 * var(--size));
  bottom: calc(10 * var(--size));
  border-radius: calc(8 * var(--size));
  background: var(--color-2) no-repeat;
  background-size: calc(60 * var(--size)) calc(10 * var(--size));
  background-image:
    linear-gradient(var(--color-3) calc(100 * var(--size)), transparent 0),
    linear-gradient(var(--color-3) calc(100 * var(--size)), transparent 0),
    linear-gradient(var(--color-3) calc(100 * var(--size)), transparent 0),
    linear-gradient(var(--color-3) calc(100 * var(--size)), transparent 0),
    linear-gradient(var(--color-3) calc(100 * var(--size)), transparent 0),
    linear-gradient(var(--color-3) calc(100 * var(--size)), transparent 0);

  background-position:
    calc(15 * var(--size)) calc(30 * var(--size)),
    calc(15 * var(--size)) calc(60 * var(--size)),
    calc(15 * var(--size)) calc(90 * var(--size)),
    calc(105 * var(--size)) calc(30 * var(--size)),
    calc(105 * var(--size)) calc(60 * var(--size)),
    calc(105 * var(--size)) calc(90 * var(--size));
  box-shadow: 0 0 calc(10 * var(--size)) var(--color-4);
}

.loader:after {
  content: '';
  position: absolute;
  width: calc(50% - calc(10 * var(--size)));
  right: calc(10 * var(--size));
  top: calc(10 * var(--size));
  bottom: calc(10 * var(--size));
  border-radius: calc(8 * var(--size));
  background: var(--color-5) no-repeat;
  background-size: calc(60 * var(--size)) calc(10 * var(--size));
  background-image:
    linear-gradient(var(--color-3) calc(100 * var(--size)), transparent 0),
    linear-gradient(var(--color-3) calc(100 * var(--size)), transparent 0),
    linear-gradient(var(--color-3) calc(100 * var(--size)), transparent 0);
  background-position:
    50% calc(30 * var(--size)),
    50% calc(60 * var(--size)),
    50% calc(90 * var(--size));
  transform: rotateY(0deg);
  transform-origin: left center;
  animation: paging 1s linear infinite;
}

@keyframes paging {
  to {
    transform: rotateY(-180deg);
  }
}

.caption-fade-enter-active,
.caption-fade-leave-active {
  transition: opacity 0.25s ease;
}

.caption-fade-enter-from,
.caption-fade-leave-to {
  opacity: 0;
}
</style>
