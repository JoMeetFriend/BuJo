import { beforeEach, describe, expect, it, vi } from 'vitest'
import axios from 'axios'
import { useAddressSearch } from '@/composables/useAddressSearch'

vi.mock('axios', () => {
  const apiClient = { get: vi.fn() }
  return { default: { create: vi.fn(() => apiClient), isCancel: vi.fn(() => false) } }
})

const apiClient = axios.create()

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useAddressSearch', () => {
  it('關鍵字少於 2 字時不呼叫 API，清空結果', async () => {
    const { searchResults, searchAddress } = useAddressSearch()

    await searchAddress('台')

    expect(apiClient.get).not.toHaveBeenCalled()
    expect(searchResults.value).toEqual([])
  })

  it('查詢成功時把結果寫入 searchResults', async () => {
    apiClient.get.mockResolvedValue({ data: { results: ['台北車站', '台北 101'] } })
    const { searchResults, searchAddress } = useAddressSearch()

    await searchAddress('台北')

    expect(apiClient.get).toHaveBeenCalledWith('/api/places/autocomplete', {
      params: { q: '台北' },
      signal: expect.any(AbortSignal),
    })
    expect(searchResults.value).toEqual(['台北車站', '台北 101'])
  })

  it('查詢失敗時清空結果並設定 error', async () => {
    apiClient.get.mockRejectedValue(new Error('network error'))
    const { searchResults, error, searchAddress } = useAddressSearch()

    await searchAddress('台北')

    expect(searchResults.value).toEqual([])
    expect(error.value).toBe('地址搜尋發生錯誤')
  })

  it('clearSearch 會清空結果與狀態', async () => {
    apiClient.get.mockResolvedValue({ data: { results: ['台北車站'] } })
    const { searchResults, clearSearch, searchAddress } = useAddressSearch()

    await searchAddress('台北')
    expect(searchResults.value).toEqual(['台北車站'])

    clearSearch()

    expect(searchResults.value).toEqual([])
  })
})
