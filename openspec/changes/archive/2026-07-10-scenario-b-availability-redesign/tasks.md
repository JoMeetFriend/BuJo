## 1. AvailabilityPickerModal：新增 props 與外殼改用 BaseModal

- [x] 1.1 寫測試：`AvailabilityPickerModal` 傳入 `fixedDate` 時不渲染日曆區塊，只顯示時段選取面板（對應規格 Fixed-date availability picker hides the calendar，設計決策「AvailabilityPickerModal 新增 fixedDate／timeWindowStart／timeWindowEnd props」）
- [x] 1.2 執行測試確認失敗
- [x] 1.3 新增 `fixedDate`/`timeWindowStart`/`timeWindowEnd` props，`fixedDate` 存在時跳過日曆渲染、掛載時將 `activeDate` 固定為 `fixedDate` 並預設整天有空
- [x] 1.4 執行測試確認通過
- [x] 1.5 寫測試：未傳入 `fixedDate` 時日曆與多日期選取行為維持現況不變（對應規格 Fixed-date availability picker hides the calendar 的 opening without a fixed date 情境）
- [x] 1.6 執行測試確認通過（回歸測試，預期本來就會過，用來鎖住現況行為）
- [x] 1.7 寫測試：傳入 `timeWindowStart`/`timeWindowEnd` 時，時間選取下拉選單只列出範圍內的小時（對應規格 Time window constrains selectable hours）
- [x] 1.8 執行測試確認失敗 → 修改 `hourOptions` computed 依 props 過濾 → 執行測試確認通過
- [x] 1.9 Commit
- [x] 1.10 把 `<Teleport><div overlay>...` 手刻外殼替換成 `<BaseModal :isOpen="modelValue" title="選取有空時間" scrollable @close="close">`，原本 header 下方的活動日期範圍提示列與 Body 內容搬進預設 slot，footer 按鈕搬進 `#footer` slot（對應設計決策「AvailabilityPickerModal 外殼改用 BaseModal」）
- [x] 1.11 寫測試：彈窗開啟時按 Escape 會關閉（對應規格 Availability picker uses the shared modal shell）
- [x] 1.12 執行測試確認失敗 → 確認 `BaseModal` 已提供此行為 → 執行測試確認通過
- [x] 1.13 執行既有 `AvailabilityPickerModal.test.js` 全數案例，確認日曆／時段選取／摘要列行為未受外殼替換影響
- [x] 1.14 Commit

## 2. EventPage.vue：情境二表單簡化

- [x] 2.1 移除 `voteSlots`/`voteSlotIdSeq`/`addVoteSlot`/`removeVoteSlot` 與情境二專屬的候選時段模板區塊
- [x] 2.2 新增 `timeWindowStart`/`timeWindowEnd`（reactive，預設 `null`）與對應的選填時間選取器 UI
- [x] 2.3 寫測試：情境二表單只填 `singleDate`（不填時段範圍）送出時，payload 不含 `timeWindowStart`/`timeWindowEnd`/`slots`/`creatorSlotIndexes`（對應規格 Optional time window in scenario B creation form，設計決策「EventPage.vue 情境二表單簡化」）
- [x] 2.4 執行測試確認失敗 → 修改 `doSubmitInternal()` 的 `isScenario2` 分支 → 執行測試確認通過
- [x] 2.5 寫測試：只填時段範圍其中一個欄位時顯示驗證錯誤、不送出（對應規格 Creator sets a partial time window）
- [x] 2.6 執行測試確認失敗 → 實作驗證 → 執行測試確認通過
- [x] 2.7 寫測試：結束時間早於或等於開始時間時顯示驗證錯誤、不送出（對應規格 Creator sets an invalid time window）
- [x] 2.8 執行測試確認失敗 → 實作驗證 → 執行測試確認通過
- [x] 2.9 更新 `scheduleAnchor` 情境二分支為 `{ date: form.singleDate, time: timeWindowStart ?? null }`，更新 `resetForm()` 移除 `voteSlots` 重置、改重置 `timeWindowStart`/`timeWindowEnd`
- [x] 2.10 執行整份 `EventPage.test.js`，確認情境一/三/四無回歸
- [x] 2.11 Commit

## 3. ActivityDetailModal.vue：依 availability_mode 分流報名與決選

- [x] 3.1 寫測試：`availability_mode: 'slot'` 的活動報名與決選畫面行為維持現況不變（回歸測試，對應規格 Slot-mode activities are unaffected）
- [x] 3.2 執行測試確認通過（鎖住現況行為）
- [x] 3.3 寫測試：`availability_mode: 'range'` 的活動點擊「報名參加」會開啟 `AvailabilityPickerModal` 並帶入 `fixedDate`/`timeWindowStart`/`timeWindowEnd`（對應規格 Join flow for range-mode activities opens the availability picker，設計決策「ActivityDetailModal.vue 依 availability_mode 分流」）
- [x] 3.4 執行測試確認失敗 → 在 `handleJoin()` 依 `availability_mode` 分流，`range` 模式改開啟 `AvailabilityPickerModal` → 執行測試確認通過
- [x] 3.5 寫測試：確認彈窗選取後，把 `[{date, allDay, timeRanges}]` 轉成 `{ranges: [{start, end}]}` 呼叫 join API，`allDay` 轉為當日 00:00–23:59 的單一 range（對應規格 Confirming availability submits ranges to the join API）
- [x] 3.6 執行測試確認失敗 → 實作轉換函數 → 執行測試確認通過
- [x] 3.7 寫測試：`range` 模式的決選畫面分別渲染 `decision_candidates.perfect_overlap`／`.partial_overlap` 兩個區塊（對應規格 Two-section decision display for range-mode activities）
- [x] 3.8 執行測試確認失敗 → 實作分區渲染 → 執行測試確認通過
- [x] 3.9 寫測試：`range` 模式確認成團時，`handleConfirmFormation()` 呼叫 `confirm-formation` 帶 `{slotStart, slotEnd}` 而非 `candidateSlotId`（對應規格 Confirmation submits slot start/end for range-mode activities）
- [x] 3.10 執行測試確認失敗 → 實作 → 執行測試確認通過
- [x] 3.11 執行整份 `ActivityDetailModal.test.js`，確認情境一/三/四（`slot` 模式）無回歸
- [x] 3.12 Commit

## 4. 全量回歸

- [x] 4.1 執行 `npm run test`，確認全部既有測試（含情境一/三/四相關）皆通過
