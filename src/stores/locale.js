import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useLocaleStore = defineStore('locale', () => {
  const currentLocale = ref(localStorage.getItem('user-lang') || 'zh-TW')

  watch(currentLocale, (newLang) => {
    localStorage.setItem('user-lang', newLang)
  })

  function setLocale(newLang, i18n) {
    currentLocale.value = newLang
    if (i18n) {
      i18n.global.locale.value = newLang
    }
  }

  return { currentLocale, setLocale }
})
