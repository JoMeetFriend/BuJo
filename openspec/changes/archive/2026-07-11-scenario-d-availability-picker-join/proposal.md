## Why

情境四（find_date_time）參與者報名 UI 目前完全沒有專屬分支，直接落到跟情境一共用的通用 checkbox list，看不出候選時段的結構，也沒有比照情境三已經做好的文字/狀態顯示模式。這次要把參與者端改成使用 `AvailabilityPickerModal`（左邊日曆選日期、右邊依日期查該天的候選時段窗口、可在窗口內自由選子區間），並把 checkbox 完全移除。

過程中額外確認了兩件事，範圍隨之擴大：
1. 建立者原本可以在同一天開多個候選時段，這個彈性缺乏驗證、造成參與者端「重疊誤判」「窗口歸屬歧義」兩個實際 bug，決定整個拿掉——**每個候選日期只能對應一組時段**。這連帶簡化了 `AvailabilityPickerModal` 的 `dateWindows` 資料形狀（從「一個日期對多個窗口」簡化成「一個日期對一個窗口」），也簡化了建立者端 `EventPage.vue` 的候選時段建立 UI（拿掉「＋新增候選時段」）。
2. BuJo 的核心設計是系統自動幫忙算出大家都可行的時間，不是讓建立者自己看原始資料動腦計算。後端（`BuJoBackend` 同名 change）已經新增情境四的子區間交集運算（比照情境二切格算重疊），`decision_candidates` 也從「只回傳並列最高票」改成回傳完整排名清單。前端原本規劃「不做交集顯示、子區間僅供參考」（見舊版 Non-Goals）已經不成立，這次要把建立者的決策畫面也做完整，情境四要能顯示每個候選時段各自算出的完全重疊/部分重疊窄窗口，並讓建立者從中挑選確認。

## What Changes

- `AvailabilityPickerModal.vue` 新增 `dateWindows` prop（**每個候選日期對應一個窗口物件**，不是陣列），時間面板改成依 `activeDate` 查該日期的單一窗口範圍，取代原本只有一組全域 `timeWindowStart`/`timeWindowEnd` 的限制方式
- 新選到一個有 `dateWindows` 的日期時，自動帶入該窗口的完整範圍當預設子區間（不是「整天有空」），並新增「選取的子區間必須完整落在窗口內」的確認驗證
- `ActivityDetailModal.vue` 新增 `isScenarioDMode`，情境四參與者從加入前到加入後，全程只透過 `AvailabilityPickerModal` 選日期跟時段，**完全不會出現 checkbox**
- 加入前的選項摘要、加入後（voting/confirmed 狀態）的已選時段摘要，比照情境三的模式各自新增對應分支
- 已報名後只用**一顆**按鈕（例如「修改報名時段」）重開 picker，可以同時自由修改日期跟時段
- 送出報名時，把 picker 回傳的 `{date, timeRanges}` 對照 `dateWindows` 反查回對應的 `candidateSlotId`，組成 `candidateSlotRanges` 送給後端 join API
- **新增**：`ActivityDetailModal.vue` 的建立者決策畫面，情境四新增巢狀顯示——每個候選時段底下各自顯示「完全重疊」/「部分重疊」兩區（沿用情境二 `perfectOverlapCandidates`/`partialOverlapCandidates` 的呈現模式），建立者從中選一個窄窗口，`confirmFormation` 送出時帶 `{candidateSlotId, slotStart, slotEnd}`
- **新增**：`EventPage.vue` 建立候選時段的 UI，情境四拿掉「＋新增候選時段」按鈕與對應的刪除按鈕，`candidateSlots` 資料結構從 `[{date, timeSlots: [...]}]` 簡化成 `[{date, startTime, endTime}]`

## Non-Goals

- 不改情境三的決策畫面——後端已經回傳完整排名清單，前端原本就是通用渲染 `activity.decision_candidates` 陣列，不需要額外改動
- 不做「確認成團後依有沒有選到時段給不同通知」的前端顯示——後端本次也沒做，之後另開變更一起處理
- 不重做元件的日曆拖曳選日期機制（`onDayMousedown`/`onDayMouseover`/`canSelectDateKey`），情境四直接沿用 `allowedDates` 限制，跟情境三同一套

## Capabilities

### New Capabilities

- `scenario-d-availability-picker-join`: 情境四參與者透過 `AvailabilityPickerModal` 選日期+單一候選時段窗口內子區間完成報名/修改（全程不使用 checkbox），建立者決策畫面能看到每個候選時段的交集運算結果並自由選擇確認，`EventPage.vue` 候選時段建立限制成一天一組時段

### Modified Capabilities

(none)

## Impact

- `src/components/AvailabilityPickerModal.vue`：`dateWindows` prop 改成單一物件形狀、`hourOptions` 依日期查單一窗口、`defaultDayValue`/`isAllDay` 的 dateWindows 分支、`handleConfirm` 的窗口 fit 驗證
- `src/components/ActivityDetailModal.vue`：新增 `isScenarioDMode`、`scenarioDDateWindows`、`scenarioDAvailableCandidateDates`、`scenarioDInitialRanges`、`openScenarioDPicker`、`handleScenarioDConfirm`，以及對應的模板分支（加入前/加入後摘要、單一修改按鈕、情境四巢狀決策畫面、`confirmFormation` 送出邏輯）
- `src/components/EventPage.vue`：移除 `addCandidateTimeSlot`/`removeCandidateTimeSlot`、「＋新增候選時段」按鈕，`candidateSlots` 資料結構簡化
- `src/__tests__/ActivityDetailModal.test.js`、`AvailabilityPickerModal.test.js`、`EventPage.test.js`（若存在）：新增/更新對應測試

## Addendum：跨情境 UI 配色一致性修復（與情境四主題無直接關聯，經使用者確認併入本 change）

### Why

在情境四參與者/建立者 UI 完成、走完整流程手動測試時，額外發現一系列跨情境共用的視覺一致性問題與既有 bug：
1. 「已選日期」在不同情境的日曆上顯示三種不同顏色（`AvailabilityPickerModal.vue` 綠色、`EventPage.vue` 情境一黑色、情境三/四黃色），根因是四個各自獨立維護顏色的函式，沒有共用同一份定義
2. `EventPage.vue` 六個時間選取下拉選單，選中的時間文字完全看不見——base class 固定套用深色文字，選中狀態疊加另一個文字顏色 class，兩者同時存在時被 Tailwind 產生的樣式表順序覆蓋，變成深色文字疊深色背景
3. `DateEventsModal.vue`（月曆點日期彈窗）空狀態的新增行程只有純文字提示「點右上角 ＋ 新增」，沒有對應的可點擊元件在該位置
4. `DateEventsModal.vue` 開啟 `ActivityDetailModal.vue` 時，卡片背景色永遠是寫死的預設藍色——依活動狀態（`mine-recruiting`/`mine-confirmed`/`joined`/`recruiting`/`confirmed`/`neutral`）顯示不同顏色的機制只有 `ActivityView.vue` 呼叫時才會生效，因為狀態 class 原本是由呼叫端算好外部綁定的，`DateEventsModal.vue` 這個呼叫路徑完全沒有綁定

### What Changes

- 新增 `--bujo-day-selected: #daebeb` CSS 變數（`src/assets/main.css`），`AvailabilityPickerModal.vue` 的 `dayClass()`、`EventPage.vue` 的 `dateButtonClass()`/`candidateDateButtonClass()`/`scenario4DateButtonClass()`/`scenarioButtonClass()`（日期/時間確定了嗎切換鈕）的「已選」狀態全部改用這個共用變數
- 修復 `EventPage.vue` 六個時間下拉選單與 `AvailabilityPickerModal.vue` 報名時間下拉選單的選中文字不可見問題，統一改成 `bg-[var(--bujo-day-selected)] text-[var(--bujo-ink)]`
- `DateEventsModal.vue`：空狀態新增可點擊的 + 圖示按鈕（置於內文、無邊框、hover 放大），當天已有行程時 + 按鈕維持在標題列原位置
- 把 `ActivityDetailModal.vue` 的卡片狀態色計算搬進元件內部（改用元件自己 fetch 到的 `activity` 物件計算），讓任何呼叫端都會自動套用正確狀態色；同步移除 `ActivityView.vue` 裡外部重複的 `focusCardClass()` function 與綁定

### Impact

- `src/assets/main.css`：新增 `--bujo-day-selected` 變數
- `src/components/AvailabilityPickerModal.vue`：`dayClass()` 已選色、報名時間下拉選單選中色
- `src/components/EventPage.vue`：`dateButtonClass()`/`candidateDateButtonClass()`/`scenario4DateButtonClass()`/`scenarioButtonClass()`/`timeButtonClass()` 及六個時間下拉選單的選中色
- `src/components/DateEventsModal.vue`：空狀態 + 按鈕
- `src/components/ActivityDetailModal.vue`：新增內部 `focusCardClass` computed，根元素套用
- `src/components/ActivityView.vue`：移除重複的 `focusCardClass()` function 與外部綁定
- `src/__tests__/EventPage.test.js`：既有斷言舊顏色 class（`bujo-ink`/`bujo-card-yellow`）字串的測試改成斷言 `bujo-day-selected`

## Addendum 2：情境四子區間顯示失真、修改報名時段遺失資料（與後端 scenario-d-matching-rework 的建立者幽靈投票修復配套）

### Why

手動驗證情境四完整流程時，實測發現兩個資料完整性問題：

1. **「你已選擇的候選時段」顯示的不是參與者實際送出的子區間**：`selectedScenarioDSlotLabels`（`ActivityDetailModal.vue` 740 行）用 `slotText(slot)` 產生顯示文字，但 `slotText()`（880 行）永遠回傳候選時段本身的 `slot_start`~`slot_end`（整個窗口邊界），完全沒有讀 `slot.my_range`（參與者真正選的子區間）。這個函式是從舊版通用 checkbox 清單沿用過來的——舊版「勾選＝整個候選時段都可以」，顯示整個窗口沒問題；情境四改成子區間投票後，這個函式沒有跟著更新，導致參與者不管實際選了窗口內哪一小段，畫面永遠顯示成「選了整個窗口」，跟後端 `my_range` 存的真實資料不符。實測直接查 API 驗證：某參與者 `my_range` 是 02:00-03:00，畫面卻顯示 01:00-06:00。

2. **「修改報名時段」重開 picker 不會預填之前的選擇，確認送出後靜默遺失沒有重新勾選的候選日期**：`AvailabilityPickerModal.vue` 的 `selectedDates`（350 行）用 `ref(initialSelectedDates())` 只在元件**第一次建立時**執行一次，讀取當下的 `props.initialRanges`。但這個元件在 `ActivityDetailModal.vue`（502-519 行）是用 `v-if="(isRangeMode || isScenarioCMode || isScenarioDMode) && activity"` 掛載的——只要 `activity` 有值就會建立，之後單純用 `v-model="showAvailabilityPicker"` 切換顯示/隱藏，**元件實例整個 `ActivityDetailModal` 生命週期只建立一次，不會每次打開重新建立**。如果元件第一次掛載時參與者還沒報名（`initialRanges` 是空的），之後即使成功報名、`activity` 重新 fetch、`scenarioDInitialRanges` 這個 computed 也正確算出新值，`selectedDates` 這個 `ref` 也不會跟著更新——沒有任何 `watch` 監聽 `props.initialRanges` 的變化。使用者點「修改報名時段」看到的永遠是元件第一次掛載當下的舊狀態（通常是空的），這次沒重新勾選的候選日期，確認送出時就會被覆蓋成沒有選。

這兩個問題各自獨立存在，但會疊加放大彼此的影響：使用者看著（顯示錯誤的）「已選 1:00-6:00」去點修改，picker 卻是空的，重新選過一次後，其他沒注意到要重選的日期就默默消失了。

### What Changes

- `slotText()` 新增可選參數，情境四的 `selectedScenarioDSlotLabels` 改成優先讀 `slot.my_range`（有值時顯示子區間），只有 `my_range` 是 null 時才 fallback 顯示整個窗口
- `AvailabilityPickerModal.vue` 新增 `watch(() => props.modelValue, ...)`，`isOpen` 從 false 變 true（每次打開 picker）時重新執行 `initialSelectedDates()`/`initialActiveDate()`，覆蓋 `selectedDates`/`activeDate`，確保每次打開都反映當下最新的 `props.initialRanges`，不是只有元件第一次建立時的快照

### Impact

- `src/components/ActivityDetailModal.vue`：`slotText()`、`selectedScenarioDSlotLabels`
- `src/components/AvailabilityPickerModal.vue`：新增 `modelValue` 的 watch，重新初始化 `selectedDates`/`activeDate`
- `src/__tests__/ActivityDetailModal.test.js`、`AvailabilityPickerModal.test.js`：新增對應測試
