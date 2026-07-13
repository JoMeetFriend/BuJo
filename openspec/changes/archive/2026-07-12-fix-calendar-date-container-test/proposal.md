## Problem

`CalendarMain.vue` 的日期容器已新增 `leading-none` class，但 component test 仍比對舊的完整 class 字串，導致完整 Vitest 在正確實作下失敗。

## Root Cause

測試斷言未隨既有日期容器的 class 組合更新，將 layout typography class 的存在誤判為頁面行為回歸。

## Proposed Solution

僅更新 `CalendarMain.test.js` 的日期容器 class 斷言，使其完整驗證 `w-full`、`p-1`、`leading-none` 與 `md:p-1.5`。不修改 `CalendarMain.vue`。

## Non-Goals

- 不變更日期容器的功能、class 順序、樣式或 CalendarMain 元件內容。
- 不修改其他測試或處理與此斷言無關的 lint 問題。

## Success Criteria

- 日期容器斷言明確包含 `leading-none`。
- `npm run test:run -- src/__tests__/CalendarMain.test.js` 通過。
- 完整 `npm run test:run` 與 `npm run build` 通過。

## Capabilities

### New Capabilities

- `calendar-date-container-test-contract`: 定義 CalendarMain 日期容器的 component test 必須比對目前完整 class 組合。

### Modified Capabilities

(none)

## Impact

- Affected code:
  - Modified: src/__tests__/CalendarMain.test.js
  - New: (none)
  - Removed: (none)
