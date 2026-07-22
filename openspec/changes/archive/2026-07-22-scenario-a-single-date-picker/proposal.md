## Why

情境一（`dateMode: 'fixed'`, `timeMode: 'fixed'`）目前的表單同時提供獨立的「開始日期」跟「結束日期」兩個日期選擇器，但情境一的設計定義是單一固定日期、只有時間有範圍。使用者可以透過「結束」列的日期選擇器手動選出跟「開始」不同的日期（整日跟非整日模式都可以），而且只要同時填了結束時間，後端會用這個不同的 endDate 建立真正跨日的候選時段，違反情境一的定義，前端目前沒有任何機制阻止這個操作。

## What Changes

- `EventPage.vue` 情境一（`dateMode==='fixed' && timeMode==='fixed'`）的表單版面重構：
  - 「開始」列改標籤為「日期」，只保留日期選擇器，拿掉旁邊的開始時間選擇器
  - 「結束」列改標籤為「時間」，拿掉日期選擇器，改為比照情境二 `timeWindow` 樣式的「開始時間 – 結束時間」並排時間選擇器，套用既有的 `excludeNotAfterStart`/`isEndAfterStart` 同一天內時間範圍驗證規則
  - 整日模式下「時間」列整個隱藏，沿用現有 `v-if="!form.allDay"` 慣例
  - `form.endDate` 不再是使用者可獨立編輯欄位，內部固定跟隨 `form.startDate`（單一日期概念，比照情境二 `singleDate` 的模式），移除原本「跨午夜自動 +1 天」的特例邏輯
- `EventPage.test.js` 新增/更新對應測試，涵蓋新版面結構與 `form.endDate` 固定跟隨 `form.startDate` 的行為

## Non-Goals

- 不改動情境二/三/四的日期時間選擇邏輯或介面，這三個情境本來就沒有獨立結束日期選擇器這個問題
- 不改動 `ReportCutoffReminder`／報名截止時間相關的計算邏輯（`scheduleAnchor` 只依賴 `form.startDate`/`form.startTime`，不受這次改動影響）
- 不重構「`endTimeUserSet` 兩個獨立 watcher 隱性耦合」這個順便發現的脆弱點的底層架構，只在這次改動範圍內新增回歸測試釘住現有行為，避免範圍擴大成無關的重構
- 後端 `BuJoBackend` 的 `activityController.js` 新增驗證（拒絕 `startDate !== endDate` 的情境一請求）不在這個 change 範圍內——`BuJoBackend` 是獨立的 git repository，需要在該 repo 另外走一次 spectra-propose 協調，這個 change 完成後會另外處理

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `event-form-calendar-grid`: 情境一的日期/時間欄位版面從「開始/結束各自獨立日期+時間」改為「日期（單一）/時間（開始-結束範圍）」，新增描述此版面行為與 `form.endDate` 資料完整性的規格

## Impact

- Affected specs: `event-form-calendar-grid`（修改）
- Affected code:
  - Modified: src/components/EventPage.vue
  - Modified: src/__tests__/EventPage.test.js
