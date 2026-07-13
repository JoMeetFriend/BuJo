## Why

情境二（日期固定・時間讓大家選）目前用「勾選創建者手動列出的候選時段」報名，跟參與者實際想表達「我這幾段時間有空」不符。後端 `BuJoBackend` 同名 change 已把資料模型與 API 換成「參與者自由回報可用時間」，前端要跟著改報名 UI，並在同一批改動中把 `AvailabilityPickerModal.vue` 的外殼換成專案共用的 `BaseModal`（現況是手刻 overlay/header，缺 ESC 關閉與無障礙屬性，跟其他彈窗不一致）。

## What Changes

- **BREAKING**：情境二建立活動表單移除「候選時段（時段1/時段2…）」欄位，改成選填的「時段範圍」（開始/結束時間），移除建立者自選方便時段的邏輯
- 情境二建立活動送出的 payload 從 `{singleDate, slots, creatorSlotIndexes}` 改為 `{singleDate, timeWindowStart, timeWindowEnd}`
- `AvailabilityPickerModal.vue` 新增 `fixedDate`／`timeWindowStart`／`timeWindowEnd` props：設定 `fixedDate` 時隱藏左側日曆，只顯示該日期的時間選取面板（日曆邏輯不變，供情境三／四未來沿用）；時間選取器的可選範圍受 `timeWindowStart`/`timeWindowEnd` 限制
- `AvailabilityPickerModal.vue` 外殼改用共用的 `BaseModal`（`scrollable` + `footer` slot），取得 ESC 關閉、正確的 z-index、ARIA `dialog`/`aria-modal`/`aria-labelledby`，統一 header/footer 間距與關閉按鈕樣式；日曆與時段選取的內部邏輯不變
- `ActivityDetailModal.vue` 情境二（`availability_mode === 'range'`）的報名流程：點「報名參加」改為開啟 `AvailabilityPickerModal`（帶入 `fixedDate`/`timeWindowStart`/`timeWindowEnd`），確認後把彈窗回傳的結果轉成 `{ranges: [{start, end}]}` 呼叫 `POST /:id/join`；原本的 checkbox 候選時段清單只保留給 `availability_mode === 'slot'` 的情境一/三/四使用
- `ActivityDetailModal.vue` 的建立者決選畫面改讀 `decision_candidates.perfect_overlap`／`decision_candidates.partial_overlap`（`availability_mode === 'range'` 時），並用 `{slotStart, slotEnd}` 呼叫 `POST /:id/confirm-formation`；`availability_mode === 'slot'` 的情境維持現行扁平陣列與 `candidateSlotId` 呼叫方式不變

## Capabilities

### New Capabilities

- `scenario-b-availability-reporting`：情境二活動的建立者可選填時段範圍限制參與者的可回報時間；參與者透過共用彈窗元件自由回報一段或多段可用時間；建立者可看到依重疊人數分兩區排序的候選時段並確認成團。

## Impact

- Affected code:
  - Modified: `src/components/EventPage.vue`（情境二表單區塊與 `doSubmitInternal`/`scheduleAnchor`/`resetForm`）、`src/components/AvailabilityPickerModal.vue`（改用 `BaseModal`、新增 props）、`src/components/ActivityDetailModal.vue`（報名與決選流程分流）
  - New: 無新檔案，皆為既有元件修改
- Affected specs: `scenario-b-availability-reporting`（新增）
- 對應後端 change：`BuJoBackend` repo 的 `scenario-b-availability-redesign`（需先完成／同步部署，否則前端呼叫的 API 形狀不存在）
- 既有測試 `src/__tests__/EventPage.test.js`、`AvailabilityPickerModal.test.js`、`ActivityDetailModal.test.js` 中涉及情境二的案例需要一併更新
