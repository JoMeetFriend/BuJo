import axios from 'axios'
import i18n from '@/i18n'

const baseURL = import.meta.env.VITE_API_URL

export const apiClient = axios.create({
  baseURL,
  timeout: 5000,
  withCredentials: true,
})

apiClient.interceptors.request.use((config) => {
  config.headers = config.headers || {}
  config.headers['Accept-Language'] = i18n.global.locale.value
  return config
})

export function apiFetch(path, options = {}) {
  return fetch(`${baseURL}${path}`, {
    ...options,
    headers: { ...options.headers, 'Accept-Language': i18n.global.locale.value },
  })
}
