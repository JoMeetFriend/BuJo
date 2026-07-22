import { beforeEach, describe, expect, it, vi } from 'vitest'
import axios from 'axios'
import { useUserSearch } from '@/composables/useUserSearch'

vi.mock('axios', () => {
  const apiClient = {
    get: vi.fn(),
    interceptors: { request: { use: vi.fn() } },
  }
  return { default: { create: vi.fn(() => apiClient), isCancel: vi.fn(() => false) } }
})

const apiClient = axios.create()

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useUserSearch', () => {
  it('相對路徑頭像會補上 API base URL，不會被誤判成無頭像', async () => {
    apiClient.get.mockResolvedValue({
      data: [
        { id: 'user-1', display_name: 'Alice', avatar_url: '/uploads/avatars/avatar-user.png' },
      ],
    })

    const { searchResults, searchUsers } = useUserSearch()
    await searchUsers('abc12')

    expect(searchResults.value[0].avatar_url).toBe(
      'http://localhost:3000/uploads/avatars/avatar-user.png',
    )
  })

  it('完整 URL 頭像原樣保留', async () => {
    apiClient.get.mockResolvedValue({
      data: [
        {
          id: 'user-1',
          display_name: 'Bob',
          avatar_url: 'https://res.cloudinary.com/demo/image/upload/avatar.png',
        },
      ],
    })

    const { searchResults, searchUsers } = useUserSearch()
    await searchUsers('abc12')

    expect(searchResults.value[0].avatar_url).toBe(
      'https://res.cloudinary.com/demo/image/upload/avatar.png',
    )
  })

  it('沒有頭像時回傳 null', async () => {
    apiClient.get.mockResolvedValue({
      data: [{ id: 'user-1', display_name: 'Cara', avatar_url: null }],
    })

    const { searchResults, searchUsers } = useUserSearch()
    await searchUsers('abc12')

    expect(searchResults.value[0].avatar_url).toBeNull()
  })
})
