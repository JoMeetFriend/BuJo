## Why

建立活動表單目前用兩組文字按鈕切換日期與時間模式，選項文字與旁邊說明重複，畫面也比實際決策更重。改成無文字 switch 後，使用者可以用更直覺的「已確定 / 未確定」狀態切換，並由短提示與必要情境說明補足語意。

後續 UI 檢查也發現，日期時間區若使用通用 soft-card / helper-strip 語言會偏離 BuJo 的紙面活動單個性；此外，人數上限若未提示「含自己」，創建者可能設定為 1 人，導致活動建立後無法再被其他人報名。

## What Changes

- 將 EventPage 的日期模式與時間模式二選一按鈕改為 switch row：左側問題標題、中間目前狀態提示、右側無文字 switch
- switch checked=true 代表已確定，日期對應 dateMode fixed，時間對應 timeMode fixed
- switch checked=false 代表未確定，日期對應 dateMode range，時間對應 timeMode vote
- switch checked 啟用色使用 #a8d0d1，unchecked 使用低彩度淡灰綠，兩種狀態不使用黑色邊框
- 更新短提示文案與整體情境說明文案，且文案不使用句號；fixed + fixed 時不顯示整體情境說明，降低重複資訊
- 調整日期時間區為 BuJo Modern Paper / 紙面表單視覺語言，避免 generic AI/SaaS soft-card 感
- 人數上限欄位新增「含自己」提示；若使用者有填人數上限，前端最小值為 2，清空仍代表不限
- 收斂視覺規範：`BuJo_Visual_Specification_v1.md` 重新成為唯一 active 視覺規範，並補入 Modern Paper、spacing、padding、typography hierarchy 與 ink/color scale 校正
- 補上 EventPage 測試，覆蓋預設狀態、切換狀態、切回狀態、文案句號限制與人數上限最小值

## Non-Goals

- 不修改 BuJoBackend
- 不修改建立活動 payload、後端 API、deadline 計算、活動情境判斷或核心建立活動邏輯
- 不改活動詳情頁、報名流程或後端人數上限判斷

## Capabilities

### New Capabilities

- `activity-schedule-mode-switch`: 建立活動表單的日期與時間模式切換 UI、狀態文案與可及性行為
- `activity-limit-input-guidance`: 建立活動表單的人數上限提示與前端最小值防呆

### Modified Capabilities

(none)

## Impact

- Affected specs: activity-schedule-mode-switch
- Affected code:
  - Modified: src/components/EventPage.vue
  - Modified: src/__tests__/EventPage.test.js
  - Modified: BuJo_Visual_Specification_v1.md
  - Modified: AGENTS.md
  - Modified: src/components/ui/PixelButton.vue
  - New: openspec/changes/event-mode-switch-ui/specs/activity-schedule-mode-switch/spec.md
  - New: openspec/changes/event-mode-switch-ui/specs/activity-limit-input-guidance/spec.md
  - Removed: (none)
