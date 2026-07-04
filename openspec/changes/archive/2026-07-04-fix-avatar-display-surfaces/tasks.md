## 1. Avatar URL helper 與測試

- [x] 1.1 新增 `src/utils/avatar.js` 實作 `Normalize avatar URLs in a shared helper`：`toAvatarSrc` 會把 `/uploads/avatars/avatar-user.png` 轉成帶 `VITE_API_URL` 的完整來源，保留 `http://`、`https://`、`blob:`，空值回傳空字串；用新增 `src/__tests__/avatar.test.js` 驗證 `Normalize current-user avatar URL` 的四個 scenario。

## 2. 帳號入口顯示修復

- [x] 2.1 更新 `src/components/CalendarMain.vue` 依 `Current-user account surfaces display avatar consistently` 使用 `toAvatarSrc` 顯示主頁右上角帳號頭像；相對 `avatar_url` 不再破圖，無頭像時保留 fallback；用 component test 或既有測試補充驗證 calendar header account button image source。
- [x] 2.2 更新 `src/components/ProfileAccountModal.vue` 依 `Current-user account surfaces display avatar consistently` 使用 `toAvatarSrc` 顯示我的帳號彈窗頭像；用 `src/__tests__/ProfileAccountModal.test.js` 驗證相對 `avatar_url` 會補 API base URL，無頭像時 fallback 仍存在。
- [x] 2.3 更新 `src/components/ProfileEditPage.vue` 移除本地 avatar URL helper，改用共用 `toAvatarSrc`，確保 profile edit page renders current user avatar；用 `src/__tests__/ProfileEditPage.test.js` 驗證既有頭像上傳與顯示測試仍通過。
- [x] 2.4 更新 `src/components/AppSidebar.vue` 依 `Apply avatar helper only to current-user account surfaces` 與 `Preserve existing fallback face behavior` 在側欄下方個人帳號按鈕顯示登入者頭像，沒有 `avatar_url` 時保留 fallback pixel face；用新增或更新 `AppSidebar` component test 驗證 sidebar account button image source 與 fallback。

## 3. 驗證

- [x] 3.1 完成 Spectra 與前端驗證，確認 `avatar-display` 規格與實作一致；用 `spectra analyze fix-avatar-display-surfaces --json`、`spectra validate fix-avatar-display-surfaces`、`npm run test:run`、`npm run lint`、`npm run format` 驗證。
