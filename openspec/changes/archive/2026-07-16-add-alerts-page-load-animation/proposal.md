## Why

通知頁目前在 API 完成後直接顯示整份清單，缺少能讓內容層次逐步出現的進場回饋。加入克制的首次載入動畫，可在不改變紙張編輯風格與互動契約的前提下，讓頁面載入更自然。

## What Changes

- 首次成功取得通知資料後，通知列以淡入並由下方 10px 復位的方式依序進場。
- 每列動畫為 400ms、間隔 60ms；前 8 列逐步錯開，後續列使用與第 8 列相同的最大延遲。
- 後續重新取得通知資料不重播進場動畫。
- 使用者偏好 reduced motion 時直接顯示通知列，不播放進場動畫。
- 保留載入文字、錯誤／空狀態、已讀、好友操作、活動導頁與左滑刪除行為。

## Capabilities

### New Capabilities

- `alerts-initial-load-animation`: 定義通知頁首次成功載入時的通知列依序進場與 reduced-motion 行為。

### Modified Capabilities

(none)

## Impact

- Affected specs: alerts-initial-load-animation
- Affected code:
  - Modified: src/components/AlertsPage.vue
  - Modified: src/__tests__/AlertsPage.test.js
  - New: openspec/changes/add-alerts-page-load-animation/specs/alerts-initial-load-animation/spec.md
  - New: openspec/changes/add-alerts-page-load-animation/design.md
  - New: openspec/changes/add-alerts-page-load-animation/tasks.md
  - Removed: none
