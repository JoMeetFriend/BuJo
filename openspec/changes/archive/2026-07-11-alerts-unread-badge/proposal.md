## Why

目前使用者只有點進 ALERTS 頁面才能得知是否有新通知（好友邀請、活動更新等），側邊欄與底部導覽列上的 ALERTS 入口沒有任何提示，容易讓使用者錯過重要通知或忘記查看。

## What Changes

- 桌機側邊欄與手機底部導覽列的 ALERTS 圖示新增未讀通知數徽章，未讀數為 0 時不顯示徽章
- 未讀數超過 9 時徽章顯示 `9+`
- 新增 `notificationStore`（Pinia）負責讀取 `/api/notifications` 並計算未讀數量
- App 掛載側邊欄時即抓取一次未讀數
- Alerts 頁面在標記單則已讀或全部已讀成功後，同步更新側邊欄徽章數字，避免頁面間顯示不一致

## Non-Goals

- 不實作即時推播（WebSocket/SSE）更新未讀數，僅在側邊欄元件掛載時抓取一次，其餘時機依賴 Alerts 頁面操作後手動同步
- 不新增或修改後端 API，沿用既有的 `/api/notifications`、`/api/notifications/:id/read`、`/api/notifications/read-all`
- 不處理通知分類篩選、通知偏好設定或跨分頁（tab）同步

## Capabilities

### New Capabilities

- `notification-unread-badge`: 側邊欄與底部導覽列 ALERTS 圖示顯示未讀通知數徽章，並在通知狀態變更時保持同步

### Modified Capabilities

(none)

## Impact

- Affected specs: notification-unread-badge
- Affected code:
  - New: src/stores/notificationStore.js, src/__tests__/notificationStore.test.js
  - Modified: src/components/AppSidebar.vue, src/components/AlertsPage.vue, src/__tests__/AppSidebar.test.js
