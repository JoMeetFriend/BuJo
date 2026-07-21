import { describe, expect, test } from 'vitest'
import alertsPageSource from '@/components/AlertsPage.vue?raw'
import friendsPageSource from '@/components/FriendsPage.vue?raw'
import zhTW from '@/locales/zh-TW.json'

describe('好友與通知頁標題', () => {
  test('主標題不包含「頁面」', () => {
    expect(zhTW.friends.pageTitle).toBe('好友')
    expect(zhTW.alerts.pageTitle).toBe('通知')
  })

  test('不再渲染右側重複小字', () => {
    expect(friendsPageSource).not.toContain("t('friends.subtitle')")
    expect(friendsPageSource).not.toContain('friends-cn-tag')
    expect(alertsPageSource).not.toContain("t('alerts.subtitle')")
    expect(alertsPageSource).not.toContain('alerts-cn-tag')
  })
})
