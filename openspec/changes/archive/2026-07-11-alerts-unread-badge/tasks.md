## 1. Notification Store

- [x] 1.1 建立 `notificationStore`（Pinia），提供 `unreadCount` 狀態與 `fetchUnreadCount()`／`setUnreadCount()` 方法，`fetchUnreadCount()` 呼叫 `/api/notifications` 並計算 `isRead === false` 的數量寫入 `unreadCount`；驗證：執行 `src/__tests__/notificationStore.test.js`，成功／失敗／非陣列回傳／`setUnreadCount` 邊界（不低於 0）等測試全數通過

## 2. Sidebar unread notification badge

- [x] 2.1 `AppSidebar.vue` 在元件掛載時呼叫 `notificationStore.fetchUnreadCount()`，並在桌機側邊欄與手機底部導覽列的 ALERTS 圖示旁渲染未讀數徽章；未讀數為 0 時不顯示徽章（對應 Requirement: Sidebar unread notification badge）；驗證：執行 `src/__tests__/AppSidebar.test.js` 中「沒有未讀通知時不顯示 ALERTS 未讀數徽章」與「有未讀通知時 ALERTS 圖示會顯示未讀數徽章」兩項測試皆通過

## 3. Badge count cap

- [x] 3.1 徽章文字計算邏輯（`alertBadgeText`）在未讀數大於 9 時顯示 `9+`，其餘情況顯示實際數字（對應 Requirement: Badge count cap）；驗證：執行 `src/__tests__/AppSidebar.test.js` 中「未讀通知數超過 9 則時徽章顯示 9+」測試通過

## 4. Unread count synchronization

- [x] 4.1 `AlertsPage.vue` 的 `fetchNotifications()` 完成後，將剛取得的通知列表計算出的未讀數同步寫入 `notificationStore`（對應 Requirement: Unread count synchronization）；驗證：於瀏覽器手動操作，重新整理 Alerts 頁面後側邊欄徽章數字與頁面內「N 則未讀」文字一致
- [x] 4.2 `markAsRead()` 成功將單則通知標記已讀後，呼叫 `notificationStore.setUnreadCount(notificationStore.unreadCount - 1)`（對應 Requirement: Unread count synchronization）；驗證：於瀏覽器手動點擊 Alerts 頁面單則未讀通知，側邊欄 ALERTS 徽章數字即時減少 1
- [x] 4.3 `markAllAsRead()` 成功後呼叫 `notificationStore.setUnreadCount(0)`（對應 Requirement: Unread count synchronization）；驗證：於瀏覽器手動點擊「全部已讀」按鈕，側邊欄 ALERTS 徽章消失
