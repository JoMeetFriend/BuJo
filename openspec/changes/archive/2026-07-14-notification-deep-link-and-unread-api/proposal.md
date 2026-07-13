## Why

後端 change「activity-line-push-and-formation-ready」（2026-07-13）啟用四種活動通知型別（`formation_ready`、`time_to_pick`、`activity_confirmed`、`activity_cancelled`）並同步發送 LINE 推播。使用者從 LINE 推播回到 App 後，「點通知 → 直達活動」這條路必須是通的，推播才有意義；但前端目前點擊通知只標記已讀、不導頁，且未讀數仍抓整包通知列表自行計算、badge 只在掛載時更新一次。

## What Changes

- 活動類通知（`reference.type === "activity"`）點擊後導向 `/activity?focus=<activityId>`，活動頁掛載時讀取 `focus` query 自動聚焦該活動並展示詳情（重用既有 inline ActivityDetailModal，不新增 route）
- `notificationStore` 的 `fetchUnreadCount` 改用後端專用端點 GET /api/notifications/unread-count（回應格式 `{ "unreadCount": <integer> }`），不再抓整包通知自行計數
- 側邊欄未讀 badge 增加兩個更新時機：頁面 `visibilitychange` 回到可見時、route 切換時，各 refetch 一次未讀數（不做輪詢、不做 WebSocket）
- 測試補齊：四種活動通知型別的文案渲染、activity icon、點擊導頁、可滑動移除；活動頁 focus query 聚焦；badge 的兩個新更新時機

## Capabilities

### New Capabilities

- `notification-activity-deep-link`: 活動類通知點擊後導向對應活動詳情的完整路徑（AlertsPage 點擊行為、`/activity` 的 `focus` query 聚焦行為、依活動狀態呈現對應畫面）

### Modified Capabilities

- `notification-unread-badge`: 未讀數同步需求變更 — 資料來源改為專用 unread-count API；同步時機除掛載外，新增「頁面回到可見」與「route 切換」兩個 refetch 時機

## Impact

- Affected specs: `notification-activity-deep-link`（新增）、`notification-unread-badge`（修改）
- Affected code:
  - New: （無新檔案）
  - Modified:
    - src/stores/notificationStore.js
    - src/components/AlertsPage.vue
    - src/components/ActivityView.vue
    - src/components/AppSidebar.vue
    - src/__tests__/notificationStore.test.js
    - src/__tests__/AlertsPage.test.js
    - src/__tests__/ActivityView.test.js
    - src/__tests__/AppSidebar.test.js
  - Removed: （無）
