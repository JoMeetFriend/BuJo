<template>
  <div class="min-h-screen flex flex-col justify-center items-center px-4 py-12 relative">
    <button
      class="absolute top-3 right-3 px-3 py-1 rounded border border-[var(--bujo-line)] bg-[var(--bujo-surface)] text-xs font-semibold text-[var(--bujo-ink)] cursor-pointer transition-colors hover:bg-[var(--bujo-line-soft)]"
      @click="toggleLanguage"
    >
      {{ locale === 'zh-TW' ? t('common.langEn') : t('common.langZhTw') }}
    </button>

    <div class="text-center">
      <h1 class="text-7xl md:text-9xl font-bold text-brand-text font-doto">404</h1>

      <h2 class="mt-6 text-3xl font-bold text-brand-text tracking-tight sm:text-4xl">
        {{ t('notFound.title') }}
      </h2>

      <p class="mt-4 text-base leading-7 text-brand-text">
        {{ t('notFound.message') }}
      </p>

      <div class="mt-6 flex items-center justify-center">
        <PixelButton @click="$router.push('/')">{{ t('notFound.backHome') }}</PixelButton>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { useLocaleStore } from '@/stores/locale'
import PixelButton from './ui/PixelButton.vue'

const { t, locale } = useI18n()
const localeStore = useLocaleStore()

function toggleLanguage() {
  const newLocale = locale.value === 'zh-TW' ? 'en' : 'zh-TW'
  localeStore.setLocale(newLocale, { global: { locale } })
}
</script>
