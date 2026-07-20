import { createI18n } from 'vue-i18n'
import en from '@/locales/en.json'
import zhTW from '@/locales/zh-TW.json'

export function createTestI18n() {
  return createI18n({
    legacy: false,
    locale: 'zh-TW',
    fallbackLocale: 'en',
    messages: { en, 'zh-TW': zhTW },
  })
}
