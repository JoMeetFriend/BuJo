## 1. 新增設計 token

- [x] 1.1 在 `src/assets/main.css` 的 `:root` 新增 `--bujo-warning: #dea45b;` 與 `--bujo-danger: #cb635b;` 兩行，`--bujo-notification: #b84a43;` 維持不變，對應設計文件「為什麼是三個 token 而不是一個或兩個」；以 `grep -n "bujo-notification\|bujo-warning\|bujo-danger" src/assets/main.css` 確認三個 token 都存在且 `--bujo-notification` 的值仍是 `#b84a43`。

## 2. 時間性警示改用 `--bujo-warning`

- [x] 2.1 在 `src/components/ReportCutoffReminder.vue` 把警示狀態的 `text-[var(--bujo-notification)]` 改成 `text-[var(--bujo-warning)]`；以瀏覽器手動驗證報名截止警示文字呈現新的琥珀色。

## 3. `EventPage.vue` 改用 `--bujo-danger`

- [x] 3.1 在 `src/components/EventPage.vue` 把地址搜尋錯誤（`text-[#dc2626]`）、時段驗證錯誤的 border 與文字（2 處 `[#dc2626]`）、刪除候選時段的 hover 文字色，全部改成 `var(--bujo-danger)`；以瀏覽器手動驗證這幾處錯誤/hover 狀態呈現新的柔和紅色。
- [x] 3.2 把送出前錯誤訊息容器（第 941 行附近，「報名截止時間已經過去」那則）的 border 與文字從 `var(--bujo-notification)` 改成 `var(--bujo-danger)`，對應設計文件「`EventPage.vue:941` 送出前錯誤訊息改掛 `--bujo-danger`」，滿足「Form blocks submission when the computed deadline is not in the future」修改後的規格；以 `src/__tests__/EventPage.test.js` 既有測試（斷言 `submitError` 文案的那則）確認文字內容不受影響，並以瀏覽器手動驗證錯誤訊息顏色已改變。

## 4. `AvailabilityPickerModal.vue` 改用 `--bujo-danger`

- [x] 4.1 把問題日期標記的 hover border/text、`ring` 樣式、選中狀態的 border/text/background，以及確認錯誤訊息容器的 border 與文字，全部從 `#dc2626` 改成 `var(--bujo-danger)`；以 `src/__tests__/AvailabilityPickerModal.test.js` 確認既有測試通過，並以瀏覽器手動驗證問題日期標記與確認錯誤訊息呈現新顏色。

## 5. `ProfileEditPage.vue` 改用 `--bujo-danger`，登出按鈕統一 hover 寫法

- [x] 5.1 把 bio 錯誤、頭像上傳錯誤、帳號錯誤（2 處）文字從 `#dc2626` 改成 `var(--bujo-danger)`；以 `src/__tests__/ProfileEditPage.test.js` 確認既有測試通過。
- [x] 5.2 把登出按鈕（`.profile-logout-btn`）改成 base 與 hover 都用同一個 `var(--bujo-danger)`，不再用 `#ef4444` 當 hover 專屬色，hover 的淡背景改用 `color-mix(in srgb, var(--bujo-danger) 40%, white)` 取代 `#fef2f2`，對應設計文件「為什麼 `--bujo-danger` 用單一顏色，不做 hover 專屬深/淺色」；以瀏覽器手動驗證登出按鈕 hover 效果跟 `PixelButton.vue` 的 danger variant 視覺一致。

## 6. 登入／註冊／好友功能錯誤訊息改用 `--bujo-danger`

- [x] 6.1 把 `src/components/LoginView.vue`、`src/components/RegisterViews.vue` 的錯誤訊息容器 border 與文字，`src/components/FriendAddModal.vue` 的錯誤文字，`src/components/FriendsPage.vue` 的錯誤文字與刪除好友按鈕 hover 文字色，全部從 `#dc2626` 改成 `var(--bujo-danger)`；以既有測試套件（`LoginView`、`RegisterViews`、`FriendAddModal`、`FriendsPage` 相關 test 檔）確認全數通過。

## 7. 其餘頁面狀態錯誤文字改用 `--bujo-danger`

- [x] 7.1 把 `src/components/AlertsPage.vue` 的 `.alerts-status-text--error`、`src/components/ActivityView.vue` 的 `.activity-state-message--error`、`src/components/CalendarMain.vue` 的 `.calendar-fetch-error`、`src/components/ActivityDetailModal.vue` 的 `.activity-detail-state--error` 與 `.activity-detail-error`，文字色全部從 `#dc2626` 改成 `var(--bujo-danger)`；以相關既有測試套件確認全數通過。

## 8. `PixelButton.vue` danger variant 統一

- [x] 8.1 把 `.bujo-btn--danger:hover` 的 border/text 從 `#dc2626` 改成 `var(--bujo-danger)`，base 狀態的 `--bujo-line`／`--bujo-muted-strong` 維持不變；以瀏覽器手動驗證任一使用 `variant="danger"` 的 `PixelButton`（例如刪除按鈕）hover 時呈現新顏色。

## 9. 整體驗證

- [x] 9.1 執行 `grep -rn "#dc2626\|#ef4444\|#fef2f2" src/` 確認回傳空結果（沒有殘留的寫死顏色），執行 `npx vitest run` 確認全數通過，執行 `npx vite build` 確認無錯誤，執行 `npx eslint` 確認除既有無關 warning 外無新增問題；並以瀏覽器手動驗證未讀數字小圓點跟今天標記圓點的顏色沒有任何變化（`--bujo-notification` 未被改動）。
