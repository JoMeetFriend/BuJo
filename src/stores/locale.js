import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const ALLOWED_LOCALES = ['zh-TW', 'en']
export const DEFAULT_LOCALE = 'zh-TW'

export const getSafeLocale = () => {
  try {
    const savedLang = localStorage.getItem('user-lang')
    return ALLOWED_LOCALES.includes(savedLang) ? savedLang : DEFAULT_LOCALE
  } catch {
    return DEFAULT_LOCALE
  }
}

export const useLocaleStore = defineStore('locale', () => {
  const currentLocale = ref(getSafeLocale())

  watch(currentLocale, (newLang) => {
    if (ALLOWED_LOCALES.includes(newLang)) {
      try {
        localStorage.setItem('user-lang', newLang)
      } catch (error) {
        console.warn('[Locale Store] 無法寫入 localStorage:', error)
      }
    }
  })

  function setLocale(newLang, i18n) {
    if (!ALLOWED_LOCALES.includes(newLang)) return

    currentLocale.value = newLang
    if (i18n) {
      i18n.global.locale.value = newLang
    }
  }

  return { currentLocale, setLocale }
})
