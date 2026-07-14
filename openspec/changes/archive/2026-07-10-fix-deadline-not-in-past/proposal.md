## Problem

建立活動表單算出的流團時間（`deadline`）常常在送出當下就已經過期，導致活動一建立就被後端 lazy check 判定 `cancelled`。對應的後端防呆在 `BuJoBackend` repo 同名 change 處理；這裡處理前端本身的成因，並順便把「提前 N 天/小時」這個輸入方式換成不會讓使用者算錯的介面。

## Root Cause

1. `watch(isSameDay, ...)`（`EventPage.vue`）缺少 `{ immediate: true }`：這個 watcher 原本要在「活動是當天」時把流團設定從「天」強制切成「小時」，但如果 `singleDate`/`startDate` 從表單一開始掛載就已經是今天（例如情境二 `form.singleDate` 預設值就是 `today`），`isSameDay` 從掛載起就是 `true`，watcher 只在「值改變」時觸發，永遠不會被呼叫，「天」單位就不會被修正成「小時」
2. `computeDeadlineISO()` 跟 `doSubmitInternal()` 都沒有驗證算出來的 `deadline` 是否還在未來——即使 watcher 正常運作、正確切成「小時」計算，只要「提前 N 天/小時」的錨點時間本身就落在很早（例如當天 00:00），送出當下還是可能已經過期
3. 更根本地說：現行「輸入一個數字 + 選單位（天/小時）」的介面，要求使用者自己心算「這樣設定會不會其實已經過期」，沒有任何欄位驗證是否合理，是導致上述兩個成因會被實際踩到的介面設計問題
4. 活動本身的時間欄位（不是流團設定，是情境二時段範圍開始時間、情境三統一開始時間、情境四各候選時段開始時間）也有同一類問題：情境一的開始時間選單（`startTimeOptions`）已經會排除今天已經過去的時段，但情境二/三/四對應的開始時間選單目前都是用未過濾的完整 `timeOptions`，可以選到已經過去的時間
5. `AvailabilityPickerModal.vue`（參與者報名時的時段選取彈窗，情境二 range 模式報名走這個彈窗）有同樣兩個問題：`hourOptions` 只依 `timeWindowStart`/`timeWindowEnd` 過濾，開始時間跟結束時間共用同一份清單，沒有互相比對——結束時間選單沒有排除「等於或早於已選開始時間」的選項（實測會選到 00:00 當結束時間，比 01:00 的開始時間還早）；開始時間選單也沒有排除今天已經過去的時段

## Proposed Solution

1. 在 `watch(isSameDay, (val) => {...})` 加上 `{ immediate: true }`，確保元件掛載當下就會依目前狀態做一次天/小時單位修正
2. `doSubmitInternal()` 計算出 `deadlineISO` 後，新增驗證：若 `deadlineISO` 為 `null` 或已經不晚於目前時間，設定 `submitError` 並中止送出（比照現有驗證錯誤的處理模式），提示創建者調整流團設定；這是防止時間差（例如選好選項後隔了一段時間才送出）造成邊界情況的最後防線，不是主要防呆手段
3. **把流團設定的輸入方式從「數字 + 天/小時下拉選單」換成一排固定的預設選項**：`1 天前`／`12 小時前`／`3 小時前`／`1 小時前`／`30 分鐘前`，畫面上只顯示／只能點選「套用在目前活動時間上仍然還在未來」的選項，不合理的選項不會出現，不保留自訂數字輸入。預設選中清單中最大（最早）的那個有效選項，行為上盡量貼近現行「提前 1 天」預設的精神。原本的一行摘要顯示（例如「流團時間：2026/07/10（活動前 1 天）」）維持在原本收合的位置不變，只是內容改成套用選中的預設選項算出來的結果。
4. 比照情境一 `startTimeOptions` 的做法，補上情境二時段範圍開始時間、情境三統一開始時間、情境四各候選時段開始時間的「排除今天已過去時段」過濾：情境二／情境三在該情境的日期（`singleDate`／有選到今天的候選日期）等於今天時過濾；情境四依「該候選時段自己的日期」是否為今天分別過濾，不是整份表單共用一個判斷。結束時間「必須晚於開始時間」這件事目前四個情境都已經正確實作，這次不用動。
5. `AvailabilityPickerModal.vue` 新增兩層過濾：結束時間選單依「該筆 range 自己已選的開始時間」過濾（每筆 range 各自獨立，不是整個彈窗共用一個判斷）；開始時間選單依「目前正在編輯的日期（`activeDate`）是否為今天」過濾已過去的時段。兩者都疊加在既有的 `timeWindowStart`/`timeWindowEnd` 過濾之上，不取代它。

## Non-Goals

- 不改變「流團時間 = 活動時間 − 提前量」這個核心計算邏輯本身，只把「提前量」從自由輸入的數字改成固定的預設清單
- 不保留自訂數字輸入作為備用選項
- 不牽動情境二這次重寫的表單邏輯本身，這是四情境共用的既有缺陷與介面調整，獨立於 `scenario-b-availability-redesign` 之外處理
- 不改變流團設定在表單上的位置（維持收合在備註欄位下方，一行摘要 + 展開後才看到選項的漸進式揭露）

## Capabilities

### Modified Capabilities

無。

### New Capabilities

- `activity-deadline-validation`：建立活動表單只提供保證仍在未來的流團時間預設選項供選擇，並在送出前做最後一層驗證，同時修正「當天活動」判斷未即時生效的問題。
- `activity-schedule-time-picker-validation`：情境二／三／四的活動時間選單（時段範圍開始、統一開始時間、各候選時段開始時間）比照情境一，排除已經過去的時段；`AvailabilityPickerModal` 報名彈窗的開始／結束時間選單也一併補上互相過濾與過去時段排除；結束時間晚於開始時間的既有行為維持不變。

## Impact

- Affected code:
  - Modified: `src/components/EventPage.vue`（`watch(isSameDay, ...)`、`doSubmitInternal()`、流團設定 UI 區塊、`timeWindow`／`uniformTime`／候選時段開始時間選單的 computed 過濾邏輯）
  - Modified: `src/components/AvailabilityPickerModal.vue`（`hourOptions` 拆成依情境（開始／結束）分別過濾）
- 對應後端 change：`BuJoBackend` repo 的 `fix-deadline-not-in-past`（伺服器端驗證，防止繞過前端；不受此次前端介面調整影響，後端仍只收一個算好的 `deadline` 時間戳）
