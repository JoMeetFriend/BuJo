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
