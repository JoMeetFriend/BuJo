## Why

使用滑鼠的使用者目前只能用觸控式左滑手勢移除通知，缺少符合滑鼠操作習慣的明確入口，而且滑鼠拖曳通知列仍會產生不必要的左滑位移。為已讀且可移除的通知加入 hover／focus X，並依實際輸入能力與每次 pointer event 分流，可提升可發現性、避免誤觸，同時讓混合輸入裝置保留手指左滑能力。

## What Changes

- 具備 fine pointer 與 hover 能力的環境，已讀通知在列 hover 或刪除按鈕 keyboard focus 時顯示方角 X 軟刪除按鈕，不再使用 viewport 寬度分類。
- X 使用 32×32px hit area、8px 方角、灰色預設狀態、180ms 淡入上移，按鈕 hover 時以 200ms 轉為淡紅背景與紅色圖示。
- X 的 32×32px 按鈕整體必須相對通知列垂直置中，不受通知列 `align-items: flex-start` 或內容高度影響而靠上。
- 未讀通知維持原本閃爍綠點，不顯示 hover X。
- 待處理的好友邀請只要仍包含 `accept` 或 `reject` action，不論已讀與否都不顯示 X，並繼續禁止左滑刪除；接受或拒絕後才恢復既有可刪除資格。
- X 沿用既有 notification soft-dismiss API、成功收合與失敗復原／錯誤訊息，且不觸發通知標記已讀或活動導頁。
- X 啟動 soft-dismiss 時只垂直收合通知列，水平 offset 與 dismiss progress 維持 0，因此不閃現紅底、進度圓環或垃圾桶；touch 左滑達 65% 時仍維持完整水平移出與進度視覺。
- touch pointer 維持既有左滑刪除；mouse、pen 或未提供 pointer type 時不位移、不顯示滑動進度且不送 dismiss API。
- 非 touch pointer 達到既有 10px／1.25 水平拖曳判定後，消耗該次合成 click，避免標記已讀或導頁；guard 消耗後或下一次正常 pointerdown 後，普通 click 恢復既有行為。
- touch-only 環境不顯示、不預留 X，也不讓 X 進入 tab order。

## Non-Goals

- 不改通知卡片的方角 Modern Paper 外觀、未讀綠點樣式或 touch 左滑進度視覺。
- 不以固定 768px／1024px breakpoint 判斷輸入裝置。
- 不修改後端 API、通知資料格式、路由、Pinia unread-count contract 或資料庫 soft-dismiss 行為。
- 不用額外 CSS 遮蔽 X dismissal 的紅底；視覺差異由共用 dismissal flow 的明確模式與既有 offset/progress 狀態自然產生。
- 不把使用者提供範例的圓角卡片、整列浮起陰影或可點擊綠點搬入 BuJo。

## Capabilities

### New Capabilities

- `notification-hover-dismiss`: fine-hover 輸入環境中已讀通知的 hover／keyboard-focus X 軟刪除入口、只垂直收合的 dismissal 視覺、動畫、資格條件、事件隔離，以及依 pointer type 分流的 touch swipe 與非 touch 拖曳 click guard。

### Modified Capabilities

(none)

## Impact

- Affected specs: notification-hover-dismiss; integrates with notification-swipe-dismiss, alerts-read-state-visuals, notification-activity-deep-link
- Affected code:
  - Modified: src/components/AlertsPage.vue
  - Modified: src/__tests__/AlertsPage.test.js
  - New: openspec/changes/add-notification-hover-dismiss/specs/notification-hover-dismiss/spec.md
  - New: openspec/changes/add-notification-hover-dismiss/design.md
  - New: openspec/changes/add-notification-hover-dismiss/tasks.md
  - Removed: none
