## 1. Time picker dropdown stays within the modal card bounds

- [x] 1.1 在 `src/__tests__/AvailabilityPickerModal.test.js` 撰寫測試，模擬觸發按鈕貼近視窗右緣，斷言算出來的 `left` 會被夾在彈窗卡片（`.bujo-modal-panel`）邊界內，而不是整個瀏覽器視窗邊界內
- [x] 1.2 暫時把 `computePickerPosition()` 的邊界改回整個瀏覽器視窗，確認 1.1 的測試失敗（left 超出彈窗卡片邊界），驗證測試真的有鎖住這個行為
- [x] 1.3 修改 `src/components/AvailabilityPickerModal.vue` 的 `computePickerPosition()`：邊界改用 `triggerEl.closest('.bujo-modal-panel')` 取得的彈窗卡片矩形，找不到時退回整個視窗；`top`/`bottom` 的 CSS 值維持用 `window.innerHeight`/`rect` 計算（永遠相對瀏覽器視窗，不能用彈窗卡片矩形當定位錨點）
- [x] 1.4 還原 1.2 的暫時改動，重新執行測試，確認通過

## 2. Scrolling inside the time picker dropdown does not close it

- [x] 2.1 在 `src/__tests__/AvailabilityPickerModal.test.js` 撰寫兩個測試：在 `.time-picker-panel` 內捲動時選單維持開啟、在選單以外的地方捲動時選單會關閉（用 `attachTo: document.body` 掛載，確保 `window` 的 capture-phase `scroll` 監聽器真的會被觸發）
- [x] 2.2 暫時移除 `handleScrollClose()` 排除 `.time-picker-panel` 的判斷，確認「選單內捲動維持開啟」的測試失敗，驗證測試真的有鎖住這個行為
- [x] 2.3 修改 `src/components/AvailabilityPickerModal.vue` 的 `handleScrollClose(e)`，加上 `if (e.target?.closest?.('.time-picker-panel')) return`，只有捲動事件來源不在選單內部時才關閉
- [x] 2.4 還原 2.2 的暫時改動，重新執行測試，確認通過

## 3. Availability picker restores its default state when reopened

- [x] 3.1 在 `src/__tests__/AvailabilityPickerModal.test.js` 撰寫測試：`fixedDate` 模式下點擊關閉按鈕、`modelValue` 切回 `true` 後，畫面文字不包含「選取日期」，且跟關閉前完全一致
- [x] 3.2 暫時把 `close()` 改回無條件清空 `selectedDates`/`activeDate`，確認 3.1 的測試失敗（出現「← 選取日期」空白畫面），驗證測試真的有鎖住這個行為
- [x] 3.3 修改 `src/components/AvailabilityPickerModal.vue` 的 `close()`，依 `props.fixedDate` 是否存在條件式重設狀態：有值時重設回 `defaultDayValue()`（沿用 `timeWindowStart`/`timeWindowEnd`），沒有值才清空成空物件
- [x] 3.4 還原 3.2 的暫時改動，重新執行測試，確認通過

## 4. 驗證與提交

- [x] 4.1 執行 `npx vitest run src/__tests__/AvailabilityPickerModal.test.js`，確認全部 23 個測試通過
- [x] 4.2 執行 `npx vitest run` 跑完整前端測試套件，確認 138 個測試全數通過、無回歸
- [x] 4.3 Commit `src/components/AvailabilityPickerModal.vue` 與 `src/__tests__/AvailabilityPickerModal.test.js` 的變更
