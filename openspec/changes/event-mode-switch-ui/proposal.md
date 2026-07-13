## Why

建立活動表單目前用兩組文字按鈕切換日期與時間模式，選項文字與旁邊說明重複，畫面也比實際決策更重。改成無文字 switch 後，使用者可以用更直覺的「已確定 / 未確定」狀態切換，並由短提示與整體說明補足語意。

## What Changes

- 將 EventPage 的日期模式與時間模式二選一按鈕改為 switch row：左側問題標題、中間目前狀態提示、右側無文字 switch
- switch checked=true 代表已確定，日期對應 dateMode fixed，時間對應 timeMode fixed
- switch checked=false 代表未確定，日期對應 dateMode range，時間對應 timeMode vote
- switch checked 啟用色使用 #a8d0d1，unchecked 使用低彩度淡灰綠，兩種狀態不使用黑色邊框
- 更新短提示文案與整體情境說明文案，且文案不使用句號
- 補上 EventPage 測試，覆蓋預設狀態、切換狀態、切回狀態與文案句號限制

## Non-Goals

- 不修改 BuJoBackend
- 不修改建立活動 payload、後端 API、deadline 計算、活動情境判斷或核心建立活動邏輯
- 不混入其他 EventPage 重構或視覺改版

## Capabilities

### New Capabilities

- `activity-schedule-mode-switch`: 建立活動表單的日期與時間模式切換 UI、狀態文案與可及性行為

### Modified Capabilities

(none)

## Impact

- Affected specs: activity-schedule-mode-switch
- Affected code:
  - Modified: src/components/EventPage.vue
  - Modified: src/__tests__/EventPage.test.js
  - New: openspec/changes/event-mode-switch-ui/specs/activity-schedule-mode-switch/spec.md
  - Removed: (none)
