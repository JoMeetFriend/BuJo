## 1. isSameDay watcher 立即生效

- [x] 1.1 寫測試：情境二表單掛載時 `singleDate` 已經是今天，掛載後 `deadline.unit` 應立即是 `'hour'`，不需要先觸發日期變更（對應規格 Same-day schedule correction applies immediately on mount）
- [x] 1.2 執行測試確認失敗
- [x] 1.3 為 `watch(isSameDay, (val) => {...})` 加上 `{ immediate: true }`
- [x] 1.4 執行測試確認通過
- [x] 1.5 執行既有情境一/三/四相關表單測試，確認加上 `immediate: true` 沒有造成非當天情境的非預期行為（例如掛載當下把非當天活動誤切成小時單位）
- [x] 1.6 Commit

## 2. 流團設定改用固定預設選項

- [x] 2.1 寫測試：新增一個純函數（例如 `getValidDeadlinePresets(anchorDate, anchorTime)`），輸入固定的五個候選（1 天前/12 小時前/3 小時前/1 小時前/30 分鐘前），只回傳套用在目前 `scheduleAnchor` 上仍然晚於現在的選項，依「提前量」由大到小排序（對應規格 Deadline offset is selected from a fixed preset list）
- [x] 2.2 執行測試確認失敗
- [x] 2.3 實作 `getValidDeadlinePresets()`，涵蓋 Example 表格四種狀況（2 天／6 小時／45 分鐘／20 分鐘的前置時間分別對應到的可選清單）
- [x] 2.4 執行測試確認通過
- [x] 2.5 寫測試：`scheduleAnchor` 改變時，若目前選中的預設不再是有效清單裡的選項，自動改選清單中最大（最早）的有效選項；若尚未選過，預設就選最大的有效選項（對應規格 Default preset selection）
- [x] 2.6 執行測試確認失敗 → 實作 → 執行測試確認通過
- [x] 2.7 把流團設定 UI 從「數字輸入 + 天/小時下拉選單」換成一排預設選項按鈕，讀 `getValidDeadlinePresets()` 的結果渲染，移除自訂數字輸入欄位；一行摘要顯示（例如「流團時間：2026/07/10（活動前 1 天）」）改用選中預設的標籤組字，位置維持在備註欄位下方不變
- [x] 2.8 執行整份 `EventPage.test.js`，確認情境一/二/三/四畫面渲染與既有的「當天活動距今 ≤ 1 小時」緊急流程（隱藏流團設定區塊）不受影響
- [x] 2.9 Commit

## 3. 送出前驗證 deadline 是否仍在未來

- [x] 3.1 寫測試：`doSubmitInternal()` 計算出的 `deadlineISO` 已經不晚於現在時，設定 `submitError` 並中止送出、不呼叫建立活動 API（對應規格 Computed deadline is already in the past）
- [x] 3.2 執行測試確認失敗
- [x] 3.3 實作規格「Form blocks submission when the computed deadline is not in the future」：在 `doSubmitInternal()` 算出 `deadlineISO` 後新增驗證：`!deadlineISO || new Date(deadlineISO) <= new Date()` 時設定 `submitError`（提示調整流團設定或活動時間）並 `return`
- [x] 3.4 執行測試確認通過
- [x] 3.5 寫測試：`deadlineISO` 為 `null` 時同樣中止送出並顯示錯誤（對應規格 Computed deadline cannot be resolved）
- [x] 3.6 執行測試確認通過（沿用 3.3 的驗證邏輯，預期直接通過）
- [x] 3.7 寫測試：合法未來的 `deadlineISO` 仍正常送出（對應規格 Computed deadline is a valid future time）
- [x] 3.8 執行測試確認通過（回歸測試，鎖住現況行為）
- [x] 3.9 執行整份 `EventPage.test.js`，確認情境一/二/三/四建立活動流程無回歸
- [x] 3.10 Commit

## 4. 情境二/三/四的開始時間選單排除已過去時段

- [x] 4.1 實作規格「Start-time pickers exclude hours already past for the relevant date」：寫測試，新增 `timeWindowStartOptions` computed，`singleDate` 等於今天時排除已過去的小時，否則回傳完整 `timeOptions`（對應規格 Scenario B time window start excludes past hours when the date is today）
- [x] 4.2 執行測試確認失敗
- [x] 4.3 實作 `timeWindowStartOptions`，並把情境二時段範圍開始時間選單（目前 `v-for="time in timeOptions"`，`EventPage.vue:402`）改讀這個 computed
- [x] 4.4 執行測試確認通過
- [x] 4.5 寫測試：新增 `uniformStartTimeOptions` computed，今天的日期存在於 `candidateDates` 時排除已過去的小時，否則回傳完整清單（對應規格 Scenario C uniform start time excludes past hours when today is among the selected candidate dates）
- [x] 4.6 執行測試確認失敗 → 實作 `uniformStartTimeOptions`，並把情境三統一開始時間選單（`EventPage.vue:554`）改讀這個 computed → 執行測試確認通過
- [x] 4.7 寫測試：新增 `slotStartTimeOptions(date)` 函數（比照既有的 `slotEndTimeOptions(slot)` 寫法），傳入該候選時段自己的日期，等於今天時排除已過去的小時，不受其他候選時段的日期影響（對應規格 Scenario D per-slot start time excludes past hours only for that slot's own date）
- [x] 4.8 執行測試確認失敗 → 實作 `slotStartTimeOptions()`，並把情境四候選時段開始時間選單（`EventPage.vue:717`）改讀這個函數（傳入 `editingSlot.date`）→ 執行測試確認通過
- [x] 4.9 驗證規格「End-time-after-start-time behavior is unchanged」：執行整份 `EventPage.test.js`，確認結束時間晚於開始時間的既有過濾（`endTimeOptions`/`timeWindowEndTimeOptions`/`uniformEndTimeOptions`/`slotEndTimeOptions`）不受影響，情境一開始時間選單行為也無回歸
- [x] 4.10 Commit

## 5. AvailabilityPickerModal 開始/結束時間選單互相過濾

- [x] 5.1 實作規格「AvailabilityPickerModal end-time options exclude hours not after the range's start time」：寫測試，結束時間下拉選單排除「等於或早於該筆 range 已選開始時間」的選項，疊加在既有的 `timeWindowStart`/`timeWindowEnd` 過濾之上
- [x] 5.2 執行測試確認失敗
- [x] 5.3 新增 `endHourOptionsFor(range)` 函數，以 `hourOptions.value` 為基礎再過濾 `opt.value > range.from`（`range.from` 未設定時回傳未額外過濾的 `hourOptions.value`），把結束時間選單（`AvailabilityPickerModal.vue:144`）從 `v-for="opt in hourOptions"` 改成 `v-for="opt in endHourOptionsFor(range)"`
- [x] 5.4 執行測試確認通過
- [x] 5.5 寫測試：同一天同時編輯兩筆 range，各自的結束時間選單只依自己的開始時間過濾，不受另一筆影響（對應規格 Each range's end-time filtering is independent）
- [x] 5.6 執行測試確認通過（沿用 5.3 的 per-range 參數設計，預期直接通過）
- [x] 5.7 實作規格「AvailabilityPickerModal start-time options exclude hours already past for today」：寫測試，`activeDate` 等於今天時，開始時間下拉選單排除已過去的小時
- [x] 5.8 執行測試確認失敗
- [x] 5.9 新增 `startHourOptions` computed，以 `hourOptions.value` 為基礎，`activeDate.value` 等於今天時再過濾掉不晚於目前小時的選項，把開始時間選單（`AvailabilityPickerModal.vue:111`）從 `v-for="opt in hourOptions"` 改成 `v-for="opt in startHourOptions"`
- [x] 5.10 執行測試確認通過
- [x] 5.11 執行整份 `AvailabilityPickerModal.test.js`，確認既有的 `timeWindowStart`/`timeWindowEnd` 過濾、fixedDate 隱藏日曆、BaseModal 外殼相關測試都無回歸
- [x] 5.12 Commit
