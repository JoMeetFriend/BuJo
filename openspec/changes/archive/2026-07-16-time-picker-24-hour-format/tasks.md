## 1. 前端：建立共用時間格式工具模組

- [x] 1.1 新增 `src/utils/timeFormat.js`，匯出 `createTimeOptions`、`formatHourAsTimeString`、`parseHourFromTimeStr`、`parseDateTimeValue`，`createTimeOptions`/`formatHourAsTimeString` 一律輸出「統一時間字串格式為零填充 24 小時制「HH:00」」的格式（前端建立共用工具模組 `src/utils/timeFormat.js`；Frontend time formatting and parsing logic is centralized in a shared utility）。驗證：新增單元測試，`createTimeOptions()[0] === '00:00'`、`createTimeOptions()[23] === '23:00'`，且對 0~23 每個小時 `parseHourFromTimeStr(formatHourAsTimeString(h)) === h`（Time picker options and displayed times use zero-padded 24-hour format；round-trip 一致性）
- [x] 1.2 `EventPage.vue` 的 `createTimeOptions`/`parseHourFromTimeStr`/`parseDateTimeValue` 改成從 `src/utils/timeFormat.js` import，移除檔案內原本的重複實作。驗證：`src/__tests__/EventPage.test.js` 更新時間字面值斷言（`'上午 9:00'` → `'09:00'` 等）後全數通過
- [x] 1.3 `AvailabilityPickerModal.vue` 兩處顯示格式化邏輯改成呼叫共用的 `formatHourAsTimeString`，移除各自的 `const period = hour < 12 ? '上午' : '下午'` 實作。驗證：`src/__tests__/AvailabilityPickerModal.test.js` 更新字面值斷言後全數通過
- [x] 1.4 `ActivityDetailModal.vue` 一處顯示格式化邏輯改成呼叫共用的 `formatHourAsTimeString`，移除原本的重複實作。驗證：`src/__tests__/ActivityDetailModal.test.js` 更新字面值斷言後全數通過

## 2. 情境時間篩選邏輯迴歸驗證

- [x] 2.1 確認 `excludePastHoursIfToday`、`excludeNotAfterStart`、`isTodayLockedForCandidateDate` 等情境篩選函式在新格式下行為不變（Existing scenario-specific time filtering behavior is unaffected by the format change）：不修改這些函式本身的邏輯，只更新呼叫端跟測試斷言用到的時間字面值。驗證：`EventPage.test.js` 裡「今天已過去時段排除」「今天格子鎖定」相關測試案例更新字面值後全數通過，無邏輯改動

## 3. 測試字面值更新與前後端一致性 fixture

- [x] 3.1 把 3 個前端測試檔（`EventPage.test.js`、`AvailabilityPickerModal.test.js`、`ActivityDetailModal.test.js`）裡約 120 處「上午/下午」時間字面值全部改成對應的 24 小時制格式。驗證：`npx vitest run` 全數通過，無殘留的舊格式字面值（`grep -r "上午\|下午" src` 在這 3 個檔案裡歸零）
- [x] 3.2 新增前端這一側的時間字面值 fixture 校驗測試（例如斷言 `createTimeOptions()[9] === '09:00'`），並在任務描述或程式碼註解中標明這個字面值需要跟 `BuJoBackend` 的 change 裡後端 `formatTime` 的對應斷言保持一致。驗證：前端測試通過，字面值與 `BuJoBackend` 對應測試使用相同字串

## 4. 部署與端到端驗證（依賴後端先完成雙格式相容）

- [x] 4.1 確認 `BuJoBackend` repo 的 `time-picker-24-hour-format` change 裡「後端支援雙格式」的部署任務已完成，才進行前端部署（前端切換時機依賴後端先完成雙格式相容部署）。驗證：手動確認後端已上線且能同時解析舊格式與新格式的時間字串（可用一次手動 API 請求測試）
- [x] 4.2 部署前端（改成只送出並顯示新格式），確認整個建立揪團活動流程（情境一到四）在瀏覽器中正常運作，時間選單顯示 `00:00`~`23:00`，活動詳情與報名時間選取彈窗顯示時間也是新格式。驗證：手動在瀏覽器操作至少一個情境（例如情境三候選日期）完整建立一個活動並確認顯示格式正確
- [x] 4.3 執行完整前端回歸：`npx vitest run`、`npx vite build`。驗證：所有測試通過、build 無錯誤，且 4.2 的手動驗證已完成
