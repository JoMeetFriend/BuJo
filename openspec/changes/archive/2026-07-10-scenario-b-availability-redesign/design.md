## Context

情境二目前在 `EventPage.vue`（`dateMode === 'fixed' && timeMode === 'vote'`）用「候選時段」清單（`voteSlots`）讓創建者手動列出幾個時段選項，`ActivityDetailModal.vue` 用 checkbox 讓參與者從中勾選。`AvailabilityPickerModal.vue` 元件雖然存在、支援日曆＋時段的自由回報介面，但目前完全沒有被任何報名流程呼叫，只在 `AvailabilityPickerPreview.vue` 跟獨立測試裡用到。

後端 `BuJoBackend` 同名 change 把情境二的資料模型換成「參與者自由回報時間，系統算重疊排序」，`POST /:id/join` body 改為 `{ranges}`，`GET /:id` 新增 `availability_mode` 欄位，`decision_candidates` 在 range 模式時是 `{perfect_overlap, partial_overlap}` 物件而非扁平陣列。前端要接上這個新的 API 形狀，並把 `AvailabilityPickerModal` 真正接進報名流程。

## Goals / Non-Goals

**Goals:**

- 情境二建立活動表單改成「固定日期 + 選填時段範圍」，不再需要創建者手動列候選時段
- `AvailabilityPickerModal` 在情境二下隱藏日曆、只顯示時段選取，日曆邏輯保留給情境三/四未來使用
- `AvailabilityPickerModal` 外殼改用 `BaseModal`，修正 ESC 關閉／ARIA／z-index 與其他彈窗不一致的問題
- `ActivityDetailModal` 依 `availability_mode` 分流：`range` 模式走新的自由回報流程，`slot` 模式（情境一/三/四）維持現行 checkbox 流程不變

**Non-Goals:**

- 不支援情境二多天固定日期範圍（僅單一固定日期，跟後端 change 範圍一致）
- 不開放使用者自訂重疊排序間隔顯示（純粹顯示後端算好的結果）
- 不改動情境一/三/四目前的候選時段 checkbox UI
- 不做 `AvailabilityPickerPreview.vue`（獨立預覽/展示用元件）的清理，超出此次範圍

## Decisions

### AvailabilityPickerModal 新增 fixedDate／timeWindowStart／timeWindowEnd props

```js
const props = defineProps({
  modelValue: Boolean,
  rangeStart: { type: String, default: '2026-07-10' },
  rangeEnd: { type: String, default: '2026-07-16' },
  fixedDate: { type: String, default: null }, // 'YYYY-MM-DD'；設定後隱藏日曆，只顯示這一天的時段選取
  timeWindowStart: { type: String, default: null }, // 'HH:mm'；限制時間選取器可選範圍
  timeWindowEnd: { type: String, default: null },
})
```

`fixedDate` 設定時：日曆區塊（`<div class="border-b md:border-b-0 md:border-r ...">` 那塊）不渲染，改顯示靜態日期標題；`activeDate` 直接固定等於 `fixedDate`，元件掛載時就把它加進 `selectedDates`（預設整天有空，對應目前 `isAllDay` 的邏輯不變）。`timeWindowStart`/`timeWindowEnd` 設定時，`hourOptions` 這個 computed 改為過濾在範圍內的選項，沒設就是現行的全 24 小時清單。日曆的多日期選取邏輯（`onDayMousedown`/`onDayMouseover`/`dayClass`）完全不動，只是在 `fixedDate` 模式下不會被觸發。

### AvailabilityPickerModal 外殼改用 BaseModal

現行的 `<Teleport><div overlay><div panel><header>...` 手刻結構整段替換成：

```html
<BaseModal :isOpen="modelValue" title="選取有空時間" scrollable @close="close">
  <!-- 原本 header 底下的「活動日期範圍」提示列 + Body 內容搬進預設 slot -->
  <template #footer>
    <PixelButton variant="white" type="button" @click="close">取消</PixelButton>
    <PixelButton type="button" @click="handleConfirm">確認報名</PixelButton>
  </template>
</BaseModal>
```

日曆／時段選取／摘要列的所有內部邏輯與樣式不變，只是外層容器換掉。取得：ESC 關閉、`z-[80]`（跟其他彈窗一致）、`role="dialog"`／`aria-modal`／`aria-labelledby`、統一的 header/footer 間距。

考慮過的替代方案：只手動幫 `AvailabilityPickerModal` 補齊 ESC 監聽與 ARIA 屬性，不換用 `BaseModal`。放棄理由：等於重新實作 `BaseModal` 已經有的東西，且無法自動享有 `BaseModal` 未來的一致性改動，維護成本更高。

### EventPage.vue 情境二表單簡化

移除 `voteSlots`（候選時段清單 ref 與相關 `addVoteSlot`/`removeVoteSlot`/`selectSlotTime` 邏輯中專屬情境二的部分）、`openSlotPicker` 情境二使用處。新增 `timeWindowStart`/`timeWindowEnd`（reactive，預設 `null`），表單新增一組選填的開始/結束時間選取器（沿用現有 `pickerButtonClass`/`timeOptions` 樣式）。`doSubmitInternal()` 的 `isScenario2` 分支：

- 驗證：`timeWindowStart`/`timeWindowEnd` 皆為選填；若兩者之一有填，另一個也要填，且結束要晚於開始
- payload 改為 `{ ...commonPayload, singleDate: form.singleDate, timeWindowStart, timeWindowEnd }`，移除 `slots`/`creatorSlotIndexes`

`scheduleAnchor` 的情境二分支（原本讀 `voteSlots` 裡最早的開始時間）改為：`{ date: form.singleDate, time: timeWindowStart ?? null }`（沒設時段範圍時錨點時間為 `null`，交由 `computeDeadlineISO`/`isUrgent` 既有邏輯處理「當天無時間」的情況，行為與情境一 allDay 時一致）。`resetForm()` 移除 `voteSlots`/`voteSlotIdSeq` 重置，改重置 `timeWindowStart`/`timeWindowEnd` 為 `null`。

### ActivityDetailModal.vue 依 availability_mode 分流

`fetchActivity()` 取回的 `activity.availability_mode` 用來判斷分支：

- `slot` 模式：現行 checkbox 清單、`candidateSlotIds` 報名、扁平陣列決選清單、`candidateSlotId` 確認成團——完全不動
- `range` 模式：`handleJoin()` 不再直接呼叫 `callAction('join', ...)`，改為開啟 `AvailabilityPickerModal`（傳入 `fixedDate=activity.fixed_date`、`timeWindowStart=activity.time_window_start`、`timeWindowEnd=activity.time_window_end`）；監聽其 `confirm` 事件，把回傳的 `[{date, allDay, timeRanges}]` 攤平轉成 `{ranges: [{start, end}]}`（`allDay` 時整天視為一段 `00:00`–`23:59` 的 range），呼叫 `callAction('join', 'POST', ..., {ranges})`
- 決選畫面讀 `activity.decision_candidates.perfect_overlap`／`.partial_overlap` 兩個陣列分別渲染兩個區塊（對應原本規劃文件的 Section 1／2 UI），`selectedDecisionSlotId` 改存 `temp-` 前綴的識別碼，`handleConfirmFormation()` 對 `range` 模式改傳 `{slotStart, slotEnd}`（從選中項目的 `slot_start`/`slot_end` 取得）而非 `candidateSlotId`

## Risks / Trade-offs

- [風險：`AvailabilityPickerModal` 換用 `BaseModal` 後，`modalBody` 這個 ref 相關的 DOM 操作（若有依賴外層容器結構）可能失效] → 緩解：檢查現行程式碼中 `modalBody` 目前未被實際使用（僅宣告未被讀取），可安全移除或確認無副作用後保留
- [風險：`ActivityDetailModal` 新增對後端 `availability_mode` 欄位的依賴，若後端 change 尚未部署，`activity.availability_mode` 會是 `undefined`] → 緩解：前端分流邏輯以 `activity.availability_mode === 'range'` 明確比對，`undefined` 會自然落入現行 `slot` 分支，不會噴錯，但功能不會生效——需與後端部署順序協調（見 Migration Plan）
- [風險：情境二建立活動表單拿掉 `voteSlots` 後，若使用者是從舊版前端快取或書籤直接呼叫舊 payload 形狀，後端已改成新格式會回 400] → 緩解：屬於預期中的 breaking change，前後端同批部署即可避免

## Migration Plan

1. 待 `BuJoBackend` 的 `scenario-b-availability-redesign` change 完成部署（新 API 形狀已上線）
2. 部署本次前端改動
3. 兩邊部署完成前，情境二建立活動功能會短暫不可用或行為不一致——建議兩邊在同一個維運窗口內接續部署

## Open Questions

（無）
