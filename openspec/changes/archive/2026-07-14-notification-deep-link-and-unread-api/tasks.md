## 1. 未讀數改用專用 API

- [x] 1.1 依 design 決策「未讀數改用專用 API」，將 src/stores/notificationStore.js 的 fetchUnreadCount 改為呼叫 GET /api/notifications/unread-count 並以 setUnreadCount(response.data.unreadCount) 寫入；請求失敗（含 401）時保留前值、僅 console.error，不再呼叫 GET /api/notifications 整包計數。行為契約對應 spec「Unread count synchronization」的 Fetch on app load 與 Unread-count request fails 情境。驗證：更新 src/__tests__/notificationStore.test.js 的 fetchUnreadCount 三案例（成功回傳 unreadCount、回應格式異常、請求失敗保留舊值）並以 npx vitest run src/__tests__/notificationStore.test.js 全綠確認。

## 2. 活動通知點擊導頁

- [x] 2.1 為 src/__tests__/AlertsPage.test.js 的 mountAlerts 加入真實 createRouter + createMemoryHistory router（含 /alerts 與 /activity stub 路由，模式參照 AppSidebar.test.js），使 AlertsPage 引入 useRouter 後既有測試不受影響。驗證：npx vitest run src/__tests__/AlertsPage.test.js 既有案例全數維持綠燈。
- [x] 2.2 依 design 決策「AlertsPage 點擊分流：activity reference 導頁，其餘維持原行為」，於 src/components/AlertsPage.vue 的 handleNotificationClick 實作 spec「Activity notification click navigates to the referenced activity」：swipe 防護通過且 notification.reference?.type === 'activity' 且 reference.id 存在時，呼叫 markAsRead 後 router.push({ path: '/activity', query: { focus: String(reference.id) } })，markAsRead 失敗不阻擋導頁；其他通知維持只 markAsRead。驗證：AlertsPage.test.js 新增案例斷言點擊後 router.currentRoute 的 path 為 /activity 且 query.focus 等於 reference.id 字串、markAsRead 失敗仍導頁、非 activity 通知不導頁。
- [x] 2.3 依 design 決策「以 focus query 參數重用既有活動頁，不新增詳情 route」，於 src/components/ActivityView.vue 實作 spec「Activity page focuses the activity given by the focus query parameter」：onMounted 讀取 route.query.focus，存在時以 String() 正規化寫入 selectedFeaturedActivityId；目標不在列表時沿用既有 fallback（第一筆）、無 focus 時行為不變、query 不清除。驗證：src/__tests__/ActivityView.test.js 新增案例 — 掛載於 /activity?focus=<id> 時 featured 為該活動且 ActivityDetailModal 收到正確 activity-id、focus 不存在於列表時 fallback 第一筆。
- [x] 2.4 驗證 spec「Deep-link destination presents a status-appropriate activity view」：手動確認 ActivityDetailModal 既有狀態分流 — 建立者開啟 voting（或 recruiting + requires_voting）活動的 deep link 時見成團確認操作、confirmed / cancelled 活動對所有人只呈現結果且無操作按鈕；若有缺漏的分流才補實作。驗證：以手動操作斷言上述三種狀態畫面，結果記錄於 change 的實作紀錄。

## 3. 活動通知型別渲染測試

- [x] 3.1 為 spec「Activity lifecycle notifications render and dismiss like standard notifications」補測試：src/__tests__/AlertsPage.test.js 新增 formation_ready、time_to_pick、activity_confirmed、activity_cancelled 四型別案例 — 後端 message 文案正確渲染、icon 為 notification-icon--activity、不渲染接受/拒絕按鈕、可完成滑動 dismiss。驗證：npx vitest run src/__tests__/AlertsPage.test.js 全綠。

## 4. Badge 即時性

- [x] 4.1 依 design 決策「Badge 更新時機：visibilitychange 與 route 切換」，於 src/components/AppSidebar.vue 實作 spec「Unread count synchronization」的兩個新 refetch 時機：document visibilitychange 且 visibilityState === 'visible' 時呼叫 fetchUnreadCount（onUnmounted 移除 listener）、watch route.fullPath 變化時呼叫 fetchUnreadCount。驗證：src/__tests__/AppSidebar.test.js 新增兩案例 — router.push 換頁後 badge 反映新 mock 數值、mock document.visibilityState 為 visible 並 dispatch visibilitychange 後 badge 更新。

## 5. 整體驗證

- [x] 5.1 全套測試回歸：npx vitest run 全綠（含既有通知相關 27 案例與本次新增案例），確認無其他元件因 router 或 store 變更受影響。
- [x] 5.2 手動端到端驗證（兩帳號、後端 LINE_PUSH_ENABLED=false）：A 建活動設人數上限 → B 報名達標 → A badge +1 且列表出現「人數已滿，請確認成團」→ A 點擊直達該活動確認畫面並確認成團 → B 收到「已確認成團」點擊見成團結果 → A 另建活動後手動取消 → B 收到「已取消」點擊只見結果無操作；過程中切換分頁再返回，badge 即時更新。驗證：逐步核對上述可觀察行為並記錄結果。
