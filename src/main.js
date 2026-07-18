import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createI18n } from 'vue-i18n'
import App from './App.vue'
import router from './router'
import './assets/main.css'

import en from './locales/en.json'
import zhTW from './locales/zh-TW.json'

import { getSafeLocale } from './stores/locale'

const i18n = createI18n({
  legacy: false,
  locale: getSafeLocale(),
  fallbackLocale: 'en',
  messages: {
    en: en,
    'zh-TW': zhTW,
  },
})
const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(i18n)
app.mount('#app')
