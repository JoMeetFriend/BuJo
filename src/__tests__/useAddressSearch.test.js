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
  it('關鍵字少於 2 字時不呼叫 API，清空結果且不算已搜尋過', async () => {
    const { searchResults, hasSearched, searchAddress } = useAddressSearch()

    await searchAddress('台')

    expect(apiClient.get).not.toHaveBeenCalled()
    expect(searchResults.value).toEqual([])
    expect(hasSearched.value).toBe(false)
  })

  it('查詢中 isSearching 為 true，查詢成功後把結果寫入 searchResults 並標記已搜尋過', async () => {
    let resolveGet
    apiClient.get.mockReturnValue(new Promise((resolve) => { resolveGet = resolve }))
    const { searchResults, isSearching, hasSearched, searchAddress } = useAddressSearch()

    const searchPromise = searchAddress('台北')
    await Promise.resolve()
    expect(isSearching.value).toBe(true)

    resolveGet({ data: { results: ['台北車站', '台北 101'] } })
    await searchPromise

    expect(apiClient.get).toHaveBeenCalledWith('/api/places/autocomplete', {
      params: { q: '台北' },
      signal: expect.any(AbortSignal),
    })
    expect(searchResults.value).toEqual(['台北車站', '台北 101'])
    expect(isSearching.value).toBe(false)
    expect(hasSearched.value).toBe(true)
  })

  it('查詢成功但查無結果時 hasSearched 為 true、searchResults 為空陣列', async () => {
    apiClient.get.mockResolvedValue({ data: { results: [] } })
    const { searchResults, hasSearched, searchAddress } = useAddressSearch()

    await searchAddress('查無此地址')

    expect(searchResults.value).toEqual([])
    expect(hasSearched.value).toBe(true)
  })

  it('查詢失敗時清空結果並設定 error', async () => {
    apiClient.get.mockRejectedValue(new Error('network error'))
    const { searchResults, error, hasSearched, searchAddress } = useAddressSearch()

    await searchAddress('台北')

    expect(searchResults.value).toEqual([])
    expect(error.value).toBe('地址搜尋發生錯誤')
    expect(hasSearched.value).toBe(true)
  })

  it('clearSearch 會清空結果與狀態', async () => {
    apiClient.get.mockResolvedValue({ data: { results: ['台北車站'] } })
    const { searchResults, hasSearched, clearSearch, searchAddress } = useAddressSearch()

    await searchAddress('台北')
    expect(searchResults.value).toEqual(['台北車站'])

    clearSearch()

    expect(searchResults.value).toEqual([])
    expect(hasSearched.value).toBe(false)
  })
})
