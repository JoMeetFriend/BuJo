## 1. `EventPage.vue`：截止時間顯示與智慧預設演算法

- [x] 1.1 拿掉現行「依有效性過濾/隱藏預設清單」的舊行為與「Same-day schedule correction applies immediately on mount」的掛載時單位修正邏輯，改成 5 個預設（1天前／12小時前／3小時前／1小時前／30分鐘前）永遠全部顯示、永遠可點選，不因活動時間遠近而增減選項（design: 行為：建立表單底部的截止時間顯示；spec: Deadline offset is selected from a fixed preset list；spec: Same-day schedule correction applies immediately on mount）。以 `npx vitest run` 新增測試涵蓋「無論活動多近，5 個預設都同時顯示」案例
- [x] 1.2 實作智慧預設演算法：預設值不再選「還有效的最大偏移量」，改成固定先試 3 小時前，算出的報名截止時間距今 <30 分鐘才依序降級試 1 小時前、30 分鐘前，全部不安全則報名截止時間等於決策硬截止時間本身（無報名緩衝）；不自動選中 12 小時前/1 天前（僅供手動選擇）；不分「當天/非當天」兩套判斷邏輯，只比較實際時間差（design: 智慧預設演算法：固定目標值 + 單向降級，取代「永遠選最大有效偏移量」；design: 行為：智慧預設演算法的計算結果；spec: Default preset selection，含 lead-time 對照表範例）。新增測試涵蓋演算法在 5 種前置時間（10天/5小時/2小時/45分鐘/20分鐘）下各自選中的預設是否正確
- [x] 1.3 新增底部兩行常駐顯示取代現行「調整列 vs 黃色警示框」互斥關係：第一行顯示報名截止時間（可調）＋對應正常/警示文案，第二行顯示決策硬截止時間（不可調，樣式較淡）＋對應正常/警示文案，兩行各自獨立依「距今 ≤30 分鐘」判斷是否套用警示樣式（design: 兩個獨立時間點的常駐顯示，取代「調整列 vs 警示框」互斥關係；spec: Two persistent deadline lines replace the mutually-exclusive adjust-row/warning-banner，含逐字文案）。新增測試涵蓋四種組合（兩行皆正常／僅第一行警示／僅第二行警示／兩行皆警示）
- [x] 1.4 把第一行的「調整」入口從獨立按鈕改成直接點文字裡的偏移量數字（例如「3 小時前」的「3」）觸發預設編輯器，數字本身有底線/強調色標示，可點擊熱區延伸到數字視覺邊界以外（padding 到「小時前」幾個字），確保有效觸控熱區 ≥44×44px（spec: Report-cutoff line's preset adjustment is triggered by clicking the offset number inline）。新增測試驗證點擊偏移量數字會開啟預設編輯器
- [x] 1.5 新增第三行候選日提醒，只在情境三（`find_date`）／情境四（`find_date_time`）、且使用者已選的任一候選日距今 ≤1 小時才渲染，情境三／四共用同一份文案，情境一／二在任何情況下都不渲染這一行（spec: Third line for near-term candidate date reminder in scenario C and D）。新增測試涵蓋四情境各自的渲染/不渲染條件
- [x] 1.6 把 `isUrgent` 的判斷依據從「活動本身（schedule anchor）距今 ≤1 小時」改成「算出來的報名截止時間或決策硬截止時間距今 ≤30 分鐘」（design: `isUrgent` 判斷依據改為「算出來的截止時間距今多久」；spec: `isUrgent` reflects computed deadline proximity, not schedule-anchor proximity）。新增測試驗證「活動距今 >1 小時、但算出來的報名截止時間距今 ≤30 分鐘」時仍會被判定為 urgent 狀態
- [x] 1.7 把二次確認 modal（`showUrgentConfirm`）的觸發條件從「活動距今 ≤1 小時」改成「決策硬截止時間本身距今 ≤30 分鐘」（即智慧預設演算法五層都無法提供安全緩衝時），文案更新為「活動即將開始，這次建立將不會有任何報名緩衝時間，送出後請立即到活動頁面手動確認成團」；決策硬截止時間距今 >30 分鐘時即使報名截止時間本身在警示樣式，送出也不攔截，維持既有「computed 報名截止時間不在未來則阻擋送出」的驗證安全網不變（design: 二次確認 modal 觸發範圍縮小到「連降級 fallback 都救不了」的極端情況；design: 行為：二次確認 modal；spec: Confirmation gate for near-zero decision buffer；spec: Form blocks submission when the computed deadline is not in the future）。新增測試涵蓋「決策硬截止時間距今 ≤30 分鐘才跳確認 modal」與「僅報名截止時間警示但決策硬截止時間安全時直接送出不跳 modal」兩種案例
- [x] 1.8 新增情境二（`dateMode: 'fixed'`, `timeMode: 'vote'`）時間窗必填即時驗證，比照情境一 `timeError` 模式（未設定開始/結束時間立即顯示行內錯誤並阻擋送出，捲動至該欄位），時間窗從選填（Optional time window in scenario B creation form）改為必填（design: 情境二時間窗從「選填」改為「必填」；design: 行為：情境二時間窗必填驗證；spec: Time window is required in scenario B creation form）。新增測試涵蓋「完全未設定時間窗」「只設定其中一個」「結束時間不晚於開始時間」三種阻擋情況，以及「完整合法時間窗」的通過情況

## 2. `ActivityDetailModal.vue`：actionError 重置與過期候選項目呈現

- [x] 2.1 `fetchActivity(activityId)` 開頭將 `actionError` 重置為空字串，跟既有其他每活動 UI 狀態（候選 chip 展開狀態、頭像彈出框等）走同一個重置時機，確保元件被重用切換到不同活動時不會殘留舊活動的報名錯誤訊息（design: 行為：`ActivityDetailModal.vue` 的 `actionError` 重置；spec: `actionError` resets when switching to a different activity）。新增測試驗證：`actionError` 有值時切換到不同 `activityId`，重新 fetch 後 `actionError` 變回空字串
- [x] 2.2 決選候選清單（情境二／三／四適用，情境一不適用）新增過期候選項目的呈現：已過期項目維持顯示在原本排序位置，套用停用樣式（降低透明度、拿掉點擊/hover 互動）並顯示「已過期」文字標籤；情境三／四以 `slot_start` 判斷過期，情境二以後端 `computeRangeRanking` 回傳的 segment 自身時間範圍起點判斷過期（design: 決選候選清單與 `AvailabilityPickerModal` 的過期狀態呈現：維持顯示＋停用樣式＋非顏色標示；design: 行為：決選候選清單的過期項目呈現；spec: Expired candidate items render as disabled with a non-color label, not hidden）。新增測試涵蓋情境三/四用 `slot_start`、情境二用 segment 起點兩種資料形狀各自的過期判斷，以及未過期項目維持原本互動樣式不受影響

## 3. `AvailabilityPickerModal.vue`：候選日期格子過期停用

- [x] 3.1 新增 `isExpired(key)` 判斷邏輯，依序檢查該日期在 `dateWindows[key].end`（情境四逐日窗口）、全域 `timeWindowStart`/`timeWindowEnd` 中較晚者（情境二/三）、或當天 23:59（前兩者都不存在時）為準；已過期的日期格子不可點擊（不觸發任何選取行為）、套用停用視覺樣式，並額外加上非顏色標示（例如數字加刪除線或角落小圖示），不能只靠灰階顏色區分（design: 決選候選清單與 `AvailabilityPickerModal` 的過期狀態呈現：維持顯示＋停用樣式＋非顏色標示；design: 行為：`AvailabilityPickerModal.vue` 的日期格子過期呈現；spec: AvailabilityPickerModal disables calendar date cells whose entire candidate window has already elapsed）。新增測試涵蓋三種邊界來源（`dateWindows`、全域時間窗、23:59 預設）各自判定過期的案例，以及未過期日期維持可選取不受影響的案例

## 4. 收尾：既有測試更新與驗證

- [x] 4.1 更新 `EventPage.test.js`／`ActivityDetailModal.test.js`／`AvailabilityPickerModal.test.js` 裡所有假設舊行為（例如預設清單會依有效性隱藏選項、`isUrgent` 依活動距今判斷、單一「調整列 vs 黃色框」互斥顯示）的既有測試，改成符合上述新行為的斷言，執行 `npx vitest run` 確認全數通過、無回歸（design: Scope 邊界——僅涵蓋 `EventPage.vue`／`ActivityDetailModal.vue`／`AvailabilityPickerModal.vue`，不含通知功能與後端 API 契約異動）
- [x] 4.2 執行 `npx vite build` 確認無語法錯誤；並在瀏覽器手動驗證：(a) 建立表單在遠期/近期/極端緊迫三種活動時間下，兩行常駐文字與警示樣式的實際顯示效果；(b) 偏移量數字的可點擊熱區在手機尺寸（375px 寬）下是否符合最小觸控熱區；(c) `AvailabilityPickerModal` 過期日期格子的非顏色標示在小螢幕上是否清楚可辨識
