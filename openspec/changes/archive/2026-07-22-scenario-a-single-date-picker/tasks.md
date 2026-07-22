## 1. 情境一版面重構：拿掉結束日期選擇器，改為單一日期欄位＋時間範圍

- [x] 1.1 把 `src/components/EventPage.vue` 情境一「開始」列的標籤改成「日期」，只保留日期選擇器，拿掉旁邊的開始時間選擇器按鈕，達成「Scenario A form fields consist of a single date and a start/end time range」——驗證方式：瀏覽器開啟建立揪團表單、切到情境一，確認畫面只有一個標示「日期」的欄位、只有一個日期選擇器
- [x] 1.2 把 `src/components/EventPage.vue` 情境一「結束」列的標籤改成「時間」，整個拿掉這一列的日期選擇器按鈕，改成比照情境二 `timeWindow` 樣式的開始時間-結束時間並排選擇器（套用既有 `excludeNotAfterStart` 讓結束時間只列出晚於開始時間的選項），達成「Scenario A form fields consist of a single date and a start/end time range」——驗證方式：瀏覽器操作情境一，確認「時間」列有開始/結束兩個時間按鈕、中間有「–」分隔，且選了開始時間後結束時間下拉只列出更晚的選項
- [x] 1.3 讓情境一整日模式下「時間」列整個隱藏，沿用現有 `v-if="!form.allDay"`，達成「Scenario A form fields consist of a single date and a start/end time range」的整日情境——驗證方式：瀏覽器情境一勾選「整日」，確認「時間」列消失，只剩「日期」欄位

## 2. 移除獨立 endDate、拿掉跨午夜特例邏輯

- [x] 2.1 把 `src/components/EventPage.vue` 的 `form.endDate` 改成內部固定跟隨 `form.startDate`（不再是使用者可經由日期選擇器獨立編輯的欄位），同時移除原本「開始時間變動時自動把 endDate 推算成隔天」的跨午夜特例 watcher 邏輯，達成「Scenario A's end date always matches its single selected date」——驗證方式：`npx vitest run src/__tests__/EventPage.test.js` 裡新增的斷言確認送出情境一活動時 payload 的 startDate 恆等於 endDate，不論非整日或整日模式
- [x] 2.2 更新 `src/components/EventPage.vue` 的 `dateCells`/`selectDate` 邏輯，移除「情境一結束日期用已選開始日期當下限」這個特殊分支，改成跟其他情境一樣統一用今天當下限，達成「Calendar grid disables dates before today」（移除情境一結束日期特例）——驗證方式：`npx vitest run src/__tests__/EventPage.test.js` 確認情境一唯一的日期欄位下限行為跟情境二 `singleDate` 的日期欄位一致（下限是今天，不是動態的已選開始日期）

## 3. 測試更新與整體驗證

- [x] 3.1 更新 `src/__tests__/EventPage.test.js` 既有斷言：移除對「開始」/「結束」各自獨立日期+時間欄位結構的斷言（例如原本點擊 `event-end-date` 按鈕開日期選單的測試），改成對應新版「日期」單一欄位跟「時間」開始-結束並排欄位的斷言，並新增一則回歸測試釘住 `endTimeUserSet` 相關 watcher 在「手動設定結束時間後、把開始時間調到超過結束時間」時仍會正確自動回填新的預設結束時間——驗證方式：`npx vitest run src/__tests__/EventPage.test.js` 全數通過
- [x] 3.2 執行 `npx vitest run` 確認全專案測試通過、`npx vite build` 確認建置無錯誤，並在瀏覽器完整走一次情境一的建立流程（選日期、選開始/結束時間、勾選整日兩種模式）確認送出的活動時間正確、沒有殘留結束日期選擇器——驗證方式：手動瀏覽器操作 + 上述兩個 CLI 指令皆成功
