## Problem

活動索引頁在窄且矮的手機 viewport 中，前景活動詳情卡會超出中間舞台並覆蓋下方活動小卡，使用者無法穩定瀏覽頁面內容。

## Root Cause

手機版頁面固定為 `100dvh` 且隱藏頁面溢位，但活動詳情卡的最大高度下限固定為 340px；同時舞台允許可見溢位，下方小卡列又保留固定高度與上方間距。短螢幕剩餘空間小於卡片高度時，詳情卡便跨出網格列並蓋住小卡。

## Proposed Solution

- 讓手機版活動詳情卡的高度上限可由活動頁舞台提供的可用高度控制。
- 短螢幕時壓縮舞台上下留白與小卡列間距，詳情內容超過高度時維持卡內垂直捲動。
- 補上樣式契約測試，驗證活動頁有提供可用高度約束且詳情卡使用該約束。

## Non-Goals

- 不調整活動資料、篩選、建立、報名或成團流程。
- 不變更桌面版活動卡視覺尺寸。
- 不重做活動頁整體版型。

## Success Criteria

- 窄且矮的手機 viewport 中，活動詳情卡不再覆蓋下方活動小卡列。
- 詳情內容過長時可在卡片內捲動，頁面底部導覽仍保持可見。
- 既有活動頁與詳情功能測試、lint、format 及 build 通過。

## Capabilities

### New Capabilities

- `activity-page-responsive-layout`: 活動索引頁在手機與短螢幕下約束詳情卡高度並避免卡片互相覆蓋。

### Modified Capabilities

(none)

## Impact

- Affected code:
  - Modified: `src/components/ActivityView.vue`
  - Modified: `src/components/ActivityDetailModal.vue`
  - Modified: `src/__tests__/ActivityView.test.js`
  - Modified: `src/__tests__/ActivityDetailModal.test.js`
  - New: `openspec/changes/fix-activity-page-short-screen-overflow/specs/activity-page-responsive-layout/spec.md`
  - New: `openspec/changes/fix-activity-page-short-screen-overflow/design.md`
  - New: `openspec/changes/fix-activity-page-short-screen-overflow/tasks.md`
  - Removed: (none)
