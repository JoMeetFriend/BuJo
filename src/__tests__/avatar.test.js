import { describe, expect, test } from 'vitest'
import { toAvatarSrc } from '@/utils/avatar'

describe('toAvatarSrc', () => {
  test('相對後端頭像路徑會補上 API base URL', () => {
    expect(toAvatarSrc('/uploads/avatars/avatar-user.png', 'http://localhost:3000')).toBe(
      'http://localhost:3000/uploads/avatars/avatar-user.png',
    )
  })

  test('API base URL 結尾斜線不會造成雙斜線', () => {
    expect(toAvatarSrc('/uploads/avatars/avatar-user.png', 'http://localhost:3000/')).toBe(
      'http://localhost:3000/uploads/avatars/avatar-user.png',
    )
  })

  test('完整 URL 與 blob URL 會保留原值', () => {
    expect(toAvatarSrc('https://avatar.example.com/photo.png', 'http://localhost:3000')).toBe(
      'https://avatar.example.com/photo.png',
    )
    expect(toAvatarSrc('blob:http://localhost:5173/avatar-preview', 'http://localhost:3000')).toBe(
      'blob:http://localhost:5173/avatar-preview',
    )
  })

  test('空值會回傳空字串', () => {
    expect(toAvatarSrc('', 'http://localhost:3000')).toBe('')
    expect(toAvatarSrc(null, 'http://localhost:3000')).toBe('')
    expect(toAvatarSrc(undefined, 'http://localhost:3000')).toBe('')
  })
})
