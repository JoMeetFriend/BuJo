## Why

現在的時間選取器（建立活動的時間選單、活動時間的顯示）一律用「上午/下午」中文格式，其中「上午 12:00」代表午夜、「下午 12:00」代表中午，這個對應在使用者截圖回報中被證實容易搞混（見附圖：下拉選單顯示「上午 12:00、上午 1:00、上午 2:00...」）。改成 24 小時制（00:00~23:00）能消除這個歧義。同時，格式化/解析這個時間字串的邏輯目前在前端 3 個元件（EventPage.vue、AvailabilityPickerModal.vue、ActivityDetailModal.vue）各自獨立實作、完全沒有共用，改格式的同時一併整併，避免以後再改格式時漏改其中一處。

這個變更橫跨前後端兩個獨立的 git repo（BuJo 前端、BuJoBackend 後端），Spectra 的 change 追蹤是 per-repo 的，所以拆成兩個獨立 change：**這份 proposal 只涵蓋前端範圍**，後端（`formatTime`/`parseDateTime` 雙格式相容）由 `BuJoBackend` repo 裡對應的 `time-picker-24-hour-format` change 追蹤。

## What Changes

- 時間字串格式從「上午/下午 H:MM」改成 24 小時制零填充格式「HH:00」（例如 `09:00`、`23:00`），前端涵蓋範圍：
  - `EventPage.vue`：時間選項產生（`createTimeOptions`）、輸入解析（`parseHourFromTimeStr`、`parseDateTimeValue`）
  - `AvailabilityPickerModal.vue`：2 處顯示格式化
  - `ActivityDetailModal.vue`：1 處顯示格式化
- **BREAKING（跨 repo 協調）**：建立活動時前端送出的時間字串格式改變，依賴後端（`BuJoBackend` 的對應 change）先完成雙格式相容部署，前端才能切換成只送新格式——部署順序見 design.md 的 Migration Plan
- 前端 3 處重複實作的格式化/解析邏輯，整併成一個共用工具模組（`src/utils/timeFormat.js`），三個元件都改成 import 共用函式，不再各自維護一份
- 新增往返一致性測試：對 0~23 每個小時，斷言「格式化後再解析回來」等於原始小時數字
- 前後端測試改用同一組字面值 fixture 互相校驗格式一致（前端這邊斷言 `createTimeOptions()[9] === '09:00'`；後端對應的斷言在 `BuJoBackend` 的 change 裡）
- 既有的情境限制邏輯（`excludePastHoursIfToday`、`excludeNotAfterStart`、`isTodayLockedForCandidateDate` 等）不需要修改：這些函式都是透過 `parseHourFromTimeStr` 轉成小時數字後才比較，跟字串格式本身無關
- 約 120 處測試斷言字面值需要對應更新（`EventPage.test.js`、`AvailabilityPickerModal.test.js`、`ActivityDetailModal.test.js` 這 3 個前端測試檔；後端 2 個測試檔在 `BuJoBackend` 的 change 裡處理）

## Non-Goals

- 不新增「24:00」這個獨立可選值（代表「這一天結束」的第 25 個選項）——目前系統沒有這個概念，這次純粹是格式轉換，不是新增時間值語意
- 不涉及資料庫遷移——時間一律以 `Date` 欄位儲存，資料庫從未存過「上午/下午」文字，既有活動資料不受影響
- 不改變任何情境（A/B/C/D）的時間篩選規則或候選時段判斷邏輯，只改字串的顯示與解析格式；既有情境篩選相關的既有 spec 規格不需要異動（篩選邏輯比較的是解析後的小時數字，不是原始字串，不受格式改變影響）
- 不包含後端 `formatTime`/`parseDateTime` 的實作——由 `BuJoBackend` repo 的對應 change 負責，兩者部署順序上有依賴關係（後端先支援雙格式，前端才能切換），但作為兩個獨立的 Spectra change 追蹤

## Capabilities

### New Capabilities

- `time-display-format`：定義前端時間選取器與時間顯示一律採用 24 小時制零填充格式（`HH:00`），以及前端共用格式化工具的規範

### Modified Capabilities

(無)

## Impact

- Affected specs: `time-display-format`（新增）
- Affected code:
  - New: `src/utils/timeFormat.js`
  - Modified:
    - `src/components/EventPage.vue`
    - `src/components/AvailabilityPickerModal.vue`
    - `src/components/ActivityDetailModal.vue`
    - `src/__tests__/EventPage.test.js`
    - `src/__tests__/AvailabilityPickerModal.test.js`
    - `src/__tests__/ActivityDetailModal.test.js`
