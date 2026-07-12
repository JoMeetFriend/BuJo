## Context

`AvailabilityPickerModal.vue` 的時間選取下拉選單先前已經歷過一輪 `position: fixed` + `getBoundingClientRect()` 的定位重寫，改善了選單被祖先層 `overflow` 裁切的問題。這次使用者在實機測試（桌機、手機）後又回報 3 個新問題，都是那次重寫沒有涵蓋到的情境：選單邊界誤用整個瀏覽器視窗、捲動事件沒有區分選單自己內部跟外部背景、以及彈窗關閉重開後的狀態沒有正確還原。

`EventPage.vue` 有另一套獨立的下拉選單模式（`pickerPanelClass`，約 7 處使用），跟這次修的 `AvailabilityPickerModal.vue` 定位邏輯相似但完全分開實作，這次不動它。

## Goals / Non-Goals

**Goals:**

- 下拉選單的水平/垂直邊界要以彈窗卡片本身為準，不能超出卡片飄在背景上
- 使用者在選單自己的選項列表捲動時，選單要維持開啟
- 彈窗關閉後重新開啟，`fixedDate` 模式要回到該日期的預設時段，不能卡在空白的「選取日期」畫面

**Non-Goals:**

- 不重構或抽出共用的定位 composable——`EventPage.vue` 的 `pickerPanelClass` 下拉選單維持現狀，不套用這次的邊界計算邏輯
- 不改動選單本身的選項過濾邏輯（開始時間排除已過去時段、結束時間自動帶入 +1 小時等），這些已經在先前的變更中完成
- 不新增選單的即時重新定位（例如背景捲動時跟著移動），維持既有的「捲動背景就直接關閉選單」簡化行為

## Decisions

### 定位邊界改用觸發按鈕所在的彈窗卡片（`.bujo-modal-panel`），不是整個瀏覽器視窗

`computePickerPosition()` 原本用 `window.innerWidth`/`window.innerHeight` 當邊界計算「往上或往下展開」跟「水平夾住」。這在彈窗變成緊湊版面（`fixedDate` 模式，寬度縮到 440px）之後會失真：選單雖然沒有超出瀏覽器視窗，但會超出彈窗卡片本身，視覺上像是飄在卡片外面。改成用 `triggerEl.closest('.bujo-modal-panel')` 取得彈窗卡片（`BaseModal.vue` 非 `bare` 模式下固定會有這個 scoped class）的 `getBoundingClientRect()` 當邊界，找不到時（理論上不會發生）退回整個視窗當邊界。

**替代方案考慮過**：讓 `AvailabilityPickerModal.vue` 自己記錄外層卡片的 ref 再傳進 `computePickerPosition`。放棄是因為 `BaseModal.vue` 已經有現成的 `.bujo-modal-panel` class 可以直接用 `closest()` 找到，不需要額外傳遞 ref、減少元件間的耦合面。

### `position: fixed` 的 `top`/`bottom` 座標永遠相對瀏覽器視窗，不能拿 boundary 當定位錨點

實作過程中第一版曾經把往上展開時的 `bottom` 值寫成 `boundary.bottom - rect.top + TRIGGER_GAP`——這是錯的，因為 CSS `position: fixed` 的 `top`/`bottom`/`left`/`right` 一律相對瀏覽器視窗本身，不是相對任何祖先元素的矩形，即使那個祖先本身沒有建立 containing block 也一樣。`boundary`（彈窗卡片矩形）只能拿來判斷「空間夠不夠、要不要翻面」跟算 `maxHeight`，`top`/`bottom` 的實際數值一定要用 `window.innerHeight - rect.top + TRIGGER_GAP`（`rect` 是觸發按鈕自己的視窗座標）。這個錯誤在寫完當下就自己發現並修正，沒有進到測試階段。

### 捲動關閉的判斷排除選單自己的 `.time-picker-panel`

`handleScrollClose(e)` 掛在 `window` 上並使用 capture phase（`scroll` 事件不會冒泡，但 capture phase 的監聽器仍會在事件到達實際捲動的元素之前被觸發）。選單本身的選項列表也是 `overflow-y-auto` 可捲動容器，使用者在裡面捲動選小時選項時，`e.target` 會是選單內部的可捲動 div，如果不排除就會被誤判成「使用者在捲背景」而整個關掉選單。修正是在 `handleScrollClose` 一開始加上 `if (e.target?.closest?.('.time-picker-panel')) return`，只有捲動事件的來源不在選單內部時才關閉。

### `close()` 依 `props.fixedDate` 條件式重設狀態

`AvailabilityPickerModal` 的元件實例在 `v-model` 切換顯示/隱藏時不會重新掛載（`BaseModal.vue` 用 `<Teleport>` + 內部 `v-if`，父層只是切換 prop），所以 `setup()` 裡初始化的 `ref` 不會在「重新打開」時重新執行。原本的 `close()` 無條件把 `selectedDates`/`activeDate` 清空，這在有日曆可以重新選日期的情境下沒問題，但 `fixedDate` 模式完全沒有日曆，清空後畫面會卡在「← 選取日期」這個死路，使用者無法再選任何時段。修正是讓 `close()` 判斷 `props.fixedDate`：有值時重設回跟第一次掛載時一樣的預設時段（沿用 `defaultDayValue()`，會依 `timeWindowStart`/`timeWindowEnd` 決定是「整天有空」還是特定範圍），沒有值（一般日曆模式）才清空成空物件。

## Risks / Trade-offs

- **[Risk]** `.bujo-modal-panel` 是 `BaseModal.vue` 的 scoped class，如果未來重構 `BaseModal.vue` 改掉這個 class 名稱，`computePickerPosition()` 的 `closest()` 查找會失敗並悄悄退回整個視窗當邊界，不會直接報錯。→ **Mitigation**：已有測試鎖定「邊界是彈窗卡片，不是整個視窗」的行為（`AvailabilityPickerModal.test.js` 的水平夾住測試），`BaseModal.vue` 若真的改掉 class 名稱，這個測試會失敗提早發現。
- **[Risk]** 捲動關閉判斷用 `e.target?.closest?.('.time-picker-panel')`，如果未來選單內部結構改變導致選項按鈕不再是 `.time-picker-panel` 的子節點，排除規則會失效。→ **Mitigation**：`.time-picker-panel` 這個 class 直接掛在面板容器 `<div>` 本身（不是內部按鈕），只要面板容器結構不變就不受影響；已有測試覆蓋這個行為。
- **[Trade-off]** `EventPage.vue` 的 `pickerPanelClass` 下拉選單目前沒有套用同樣的邊界/捲動修正，未來如果它也出現一樣的問題，需要另外處理（見下方 Future Work）。

## Future Work（out of scope，這次不做）

`EventPage.vue` 有一套幾乎一樣但獨立實作的下拉選單模式（`pickerPanelClass`，約 7 處使用），目前用 `max-sm:static max-sm:mt-1` 這種手機版退回方案，沒有套用這次寫的邊界計算/捲動排除邏輯。這次修正的範圍明確只限 `AvailabilityPickerModal.vue`。未來如果 `EventPage.vue` 的下拉選單也出現類似的超出邊界或捲動誤關問題，可以考慮把 `computePickerPosition()`/`updatePickerPosition()`/`handleScrollClose()` 抽成共用的 composable（例如 `useDropdownPosition`）給兩邊重用，但這次不做，避免範圍蔓延。
