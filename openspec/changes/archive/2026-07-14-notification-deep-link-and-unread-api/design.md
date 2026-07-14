## Context

後端已為四種活動通知型別（`formation_ready`、`time_to_pick`、`activity_confirmed`、`activity_cancelled`）提供站內通知與 LINE 推播，每筆通知帶 `reference: { type: "activity", id, status }`。前端現況：

- AlertsPage 渲染直接吃後端 `message`/`category`，四種新型別無需改渲染即可正確顯示；activity icon 樣式已存在；四種型別皆無 accept/reject actions，既有 `canDismiss` 邏輯已允許滑動移除。
- `handleNotificationClick` 只呼叫 `markAsRead`，AlertsPage 完全未使用 vue-router。
- 路由僅有 `/activity` 一條（name: `activity`），活動詳情由 ActivityView 內 inline 渲染的 ActivityDetailModal 呈現；modal 以 `activityId` prop 自行 fetch 活動資料（watch immediate），並已依活動 `status`（recruiting / voting / confirmed / cancelled）與角色（is_creator / has_joined）分流畫面與操作按鈕。
- ActivityView 以 `selectedFeaturedActivityId` ref 決定聚焦活動，`featuredActivity` computed 在 `filteredActivities` 中比對，預設 filter 為 `all`（回傳全部活動），找不到時 fallback 第一筆。
- `notificationStore.fetchUnreadCount` 抓整包 GET /api/notifications 自行計數；後端已有專用 GET /api/notifications/unread-count 未使用。
- AppSidebar（桌面側欄與手機底欄同一元件）只在 onMounted 抓一次未讀數。

## Goals / Non-Goals

**Goals:**

- 活動類通知點擊後直達對應活動詳情，且依活動狀態呈現正確畫面（決選/確認操作 vs 純結果）
- 未讀數改用專用 unread-count API，減少不必要的整包傳輸
- 使用者從 LINE 回到已開啟的分頁或在 App 內換頁時，badge 反映最新未讀數

**Non-Goals:**

- 通知偏好設定 UI（關閉特定型別 LINE 推播）— 後端偏好 API 尚未實作
- LINE 綁定流程 — 已存在（LINE Login），不動
- LINE 推播發送 — 純後端 side effect
- 未讀數輪詢或 WebSocket 即時推送 — 超出需求
- 新增活動詳情獨立 route（`/activity/:id`）— 見 Decisions

## Decisions

### 以 focus query 參數重用既有活動頁，不新增詳情 route

導頁入口採 `/activity?focus=<activityId>`：ActivityView 掛載時讀取 `route.query.focus`，寫入既有的 `selectedFeaturedActivityId` ref，後續交給既有 `featuredActivity` computed 與 inline ActivityDetailModal（自帶 fetch）完成展示。

- 為什麼不加 `/activity/:id` route：詳情呈現已完全由 ActivityView 內嵌 modal 承擔，新 route 需要另建頁面骨架或重複掛 modal，改動面大且與現有「列表 + 聚焦卡片」互動模型衝突。
- query 讀取模式在專案已有先例（ProfileEditPage 讀 `route.query.linked`、LoginView 讀 `route.query.error`）。
- `focus` 不在讀取後清除：保留 URL 作為可分享/可重整的 deep link；使用者點選其他活動卡片時 `selectedFeaturedActivityId` 會覆蓋聚焦，殘留的 query 無副作用（僅掛載時讀取一次）。

### AlertsPage 點擊分流：activity reference 導頁，其餘維持原行為

`handleNotificationClick` 在既有 swipe 防護判斷之後：若 `notification.reference?.type === 'activity'` 且 `reference.id` 存在 → 呼叫 `markAsRead(notification)` 後 `router.push({ path: '/activity', query: { focus: String(reference.id) } })`；markAsRead 失敗不阻擋導頁（標記失敗屬次要，導頁是主要意圖）。其他通知（好友類、無 reference）維持現狀只 markAsRead。

- 活動狀態畫面對齊不需前端額外分流：ActivityDetailModal 已依 status 分流 — creator + voting 見「確認此時段成團」、confirmed / cancelled 無任何操作按鈕（純結果畫面）。formation_ready 發生時活動可能仍為 recruiting（requires_voting），creator 會見「提前成團」按鈕，亦符合「確認成團」語意。

### 未讀數改用專用 API

`notificationStore.fetchUnreadCount` 改打 GET /api/notifications/unread-count，回應 `{ "unreadCount": <integer> }`，直接以 `setUnreadCount(response.data.unreadCount)` 寫入（其內已有 `Math.max(0, ...)` 防衛）。錯誤處理維持現狀：console.error、保留舊值，不對外拋錯。

### Badge 更新時機：visibilitychange 與 route 切換

實作於 AppSidebar（桌面/手機導覽同元件，一處即可）：

- `document` 的 `visibilitychange` listener，`visibilityState === 'visible'` 時 refetch；onUnmounted 移除 listener。
- `watch(() => route.fullPath, ...)` 於 route 切換時 refetch（`useRoute` 已在該元件使用）。
- 不節流：兩個觸發源皆為低頻使用者行為，且端點為輕量 count 查詢。

## Implementation Contract

**行為（使用者可觀察）：**

1. 在通知頁點擊任一 `reference.type === "activity"` 的通知 → 該通知變為已讀、頁面導向 `/activity?focus=<activityId>`、活動頁聚焦該活動並顯示其詳情；活動為 voting 時建立者見決選確認操作、confirmed / cancelled 時只見結果無操作按鈕。
2. 點擊無 activity reference 的通知（如好友邀請）→ 行為與現狀相同，只標記已讀不導頁。
3. `/activity?focus=<id>` 直接開啟（含重新整理）→ 同樣聚焦該活動；若該 id 不在活動列表中 → fallback 聚焦第一筆活動（不報錯、不空白）。
4. 未讀 badge 在三個時機更新：AppSidebar 掛載、瀏覽器分頁回到可見（visibilitychange → visible）、App 內 route 切換。
5. 四種活動通知型別在通知列表正確渲染後端文案、顯示 activity 類 icon、可滑動移除。

**介面 / 資料形狀：**

- GET /api/notifications/unread-count → `{ "unreadCount": <integer> }`；`fetchUnreadCount` 不再呼叫 GET /api/notifications。
- 導頁 query 契約：`focus` 值為活動 id 字串；AlertsPage 端與 ActivityView 端皆以 `String()` 正規化後比對（後端 reference.id 可能為 integer）。
- `notificationStore` 對外介面不變：`unreadCount`、`fetchUnreadCount()`、`setUnreadCount(count)`。

**失敗模式：**

- unread-count 請求失敗（含 401）→ console.error、badge 保留前值，不彈錯誤 UI（與現狀一致）。
- markAsRead 失敗 → 仍導頁；錯誤處理沿用既有 markAsRead 內邏輯。
- focus 目標活動不存在或不可見 → 靜默 fallback 到列表第一筆。

**驗收標準：**

- `npx vitest run` 全綠，含新增案例：notificationStore 新端點三情境（成功 / 格式異常 / 失敗保留舊值）、AlertsPage 四型別渲染 + icon + 點擊導頁（斷言 router currentRoute 之 path 與 query.focus）+ 可滑動移除、ActivityView focus query 聚焦、AppSidebar route 切換與 visibilitychange 後 badge 更新。
- 手動端到端（兩帳號、後端 LINE_PUSH_ENABLED=false）：A 建活動 → B 報名達標 → A badge +1 且見「人數已滿」通知 → 點擊直達確認畫面 → A 確認成團 → B 收「已確認成團」點擊見結果 → A 另建活動手動取消 → B 收「已取消」點擊只見結果無操作。

**範圍邊界：**

- In scope：src/stores/notificationStore.js、src/components/AlertsPage.vue、src/components/ActivityView.vue、src/components/AppSidebar.vue 及其對應四個測試檔。
- Out of scope：ActivityDetailModal 的狀態分流（已存在，僅驗證）、router 路由表、後端任何調整、通知偏好設定、輪詢/WebSocket。

## Risks / Trade-offs

- [cancelled 活動可能不在 GET /api/activities 回應中，focus fallback 到第一筆而非目標活動] → 手動 e2e 階段驗證「已取消」通知路徑；若後端確實排除，另開 change 討論（例如通知點擊改直接以 focus id 餵 modal），本次不擴大範圍。
- [AlertsPage 測試掛載未含 router，加入 useRouter 後既有 27 個測試會因缺 injection 失敗] → 依專案慣例在 mountAlerts 統一加入真實 createMemoryHistory router（AppSidebar.test.js 已有相同模式），一次修好所有掛載點。
- [visibilitychange 與 route 切換可能在同一操作中連續觸發兩次 refetch] → 接受：端點輕量、頻率低，不做去重以維持實作簡單。
