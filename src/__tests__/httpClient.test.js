import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import { apiClient, apiFetch } from '@/services/httpClient'

describe('httpClient：Accept-Language 隨目前語言切換', () => {
  const originalLocale = i18n.global.locale.value

  beforeEach(() => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) })
  })

  afterEach(() => {
    i18n.global.locale.value = originalLocale
    vi.restoreAllMocks()
  })

  it('apiFetch 帶目前語言的 Accept-Language header（預設 zh-TW）', async () => {
    i18n.global.locale.value = 'zh-TW'
    await apiFetch('/api/auth/signup', { method: 'POST' })

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/signup'),
      expect.objectContaining({ headers: expect.objectContaining({ 'Accept-Language': 'zh-TW' }) }),
    )
  })

  it('切換到 en 後，apiFetch 的 Accept-Language 跟著變成 en', async () => {
    i18n.global.locale.value = 'en'
    await apiFetch('/api/auth/signup', { method: 'POST' })

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/signup'),
      expect.objectContaining({ headers: expect.objectContaining({ 'Accept-Language': 'en' }) }),
    )
  })

  it('apiFetch 不會覆蓋呼叫端自訂的其他 header', async () => {
    i18n.global.locale.value = 'en'
    await apiFetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/signup'),
      expect.objectContaining({
        headers: { 'Content-Type': 'application/json', 'Accept-Language': 'en' },
      }),
    )
  })

  it('apiClient 的 request 攔截器會依目前語言設定 Accept-Language', () => {
    i18n.global.locale.value = 'en'
    const config = apiClient.interceptors.request.handlers[0].fulfilled({ headers: {} })

    expect(config.headers['Accept-Language']).toBe('en')
  })
})
