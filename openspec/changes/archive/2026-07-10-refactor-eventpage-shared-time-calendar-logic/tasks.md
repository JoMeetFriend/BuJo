## 1. 重構前補上安全網測試（在現有程式碼上先確認是綠的）

- [x] 1.1 在 `src/__tests__/EventPage.test.js` 新增測試，斷言 `candidateDateCells`（情境三）裡：`candidateDates` 裡的日期對應格子 `isSelected === true`；今天以前的日期 `isDisabled === true`（對應規格 Calendar grid disables dates before today、Scenario-specific selection state is layered onto the shared grid）
- [x] 1.2 新增測試，斷言 `scenario4DateCells`（情境四）裡：已加入 `candidateSlots` 的日期 `isCandidate === true`；已設定完整 `startTime`/`endTime` 的對應 `isConfigured === true`；`editingSlotDate` 對應的格子 `isEditing === true`（對應規格 Scenario-specific selection state is layered onto the shared grid）
- [x] 1.3 新增測試，斷言任一情境的月曆格子裡，日期等於今天的格子 `isToday === true`，其餘為 `false`（對應規格 Calendar grid marks the current day）
- [x] 1.4 新增測試，分別對 `uniformEndTimeOptions`/`timeWindowEndTimeOptions`/`slotEndTimeOptions` 直接斷言：設定 `startTime` 後，回傳清單不包含該小時或更早的選項
- [x] 1.5 執行 `npx vitest run src/__tests__/EventPage.test.js`，確認在重構前的現有程式碼上，新舊測試全部通過（這是重構沒有改變行為的驗證基準，不是抓 bug 用的 red 狀態）
- [ ] 1.6 Commit（僅測試檔案，尚未重構）

## 2. 時間過濾抽成 excludePastHoursIfToday 跟 excludeNotAfterStart 兩個純函數

- [x] 2.1 在 `src/components/EventPage.vue` 的 `parseHourFromTimeStr` 附近新增 `excludePastHoursIfToday(isTargetToday, options)` 與 `excludeNotAfterStart(startTime, options)` 兩個純函數
- [x] 2.2 把情境一 `startTimeOptions`/`endTimeOptions`、情境二 `timeWindowStartOptions`/`timeWindowEndTimeOptions`、情境三 `uniformStartTimeOptions`/`uniformEndTimeOptions`、情境四 `slotStartTimeOptions`/`slotEndTimeOptions` 改成呼叫這兩個共用函數，保留情境一結束時間過濾額外的跨日守衛（`form.endDate !== form.startDate`），情境四維持吃參數的 plain function 形式，不改成 computed
- [x] 2.3 執行 `npx vitest run src/__tests__/EventPage.test.js`，確認第 1 節新增的測試（含 1.4 的三個結束時間過濾測試）跟所有既有測試斷言結果跟重構前一致
- [ ] 2.4 Commit

## 3. 月曆格子抽成 buildMonthGridCells 純函數，只回傳情境無關的基礎欄位（補上月曆格子規格，不修改時間過濾規格）

- [x] 3.1 在 `src/components/EventPage.vue` 的 `startOfMonth`/`formatDateValue`/`isSameDate` 附近新增 `buildMonthGridCells(month)`，回傳 42 格陣列，每格含 `key`/`date`/`label`/`isCurrentMonth`/`isToday`
- [x] 3.2 把 `dateCells`（情境一/二）、`candidateDateCells`（情境三）、`scenario4DateCells`（情境四）改成呼叫 `buildMonthGridCells(visibleMonth.value)` 再用 `.map()` 疊加各自的 `isSelected`/`isCandidate`/`isEditing`/`isConfigured`/`isDisabled` 欄位，`isDisabled` 沿用 `cell.key` 當日期字串比較（不新增 `dateValue` 欄位）
- [x] 3.3 執行 `npx vitest run src/__tests__/EventPage.test.js`，確認第 1 節新增的測試（含 1.1-1.3 的月曆格子測試）跟所有既有測試斷言結果跟重構前一致
- [ ] 3.4 Commit

## 4. 驗證與提交

- [x] 4.1 執行 `npx vitest run` 跑完整前端測試套件，確認無回歸
- [x] 4.2 執行 `npx vite build`，確認沒有樣板/語法錯誤
- [ ] 4.3 Commit
