## 1. 測試

- [x] 1.1 新增 `src/__tests__/ProfileEditPage.test.js` 驗證 `Profile edit page shows avatar summary`、`Profile edit page removes obsolete section labels`、`Existing profile edit controls remain available` 與 `Copy shareable BuJo ID code from profile edit page`：測試需覆蓋頁首文字、名稱、Bujo ID uid/id 推導、無 id 隱藏、複製五碼、`更換頭像` 按鈕、電子郵件列移除；用 `npm run test:run -- src/__tests__/ProfileEditPage.test.js` 驗證。

## 2. 個人編輯頁實作

- [x] 2.1 在 `src/components/ProfileEditPage.vue` 依 `Reuse Bujo ID derivation in ProfileEditPage` 與 `Keep avatar upload as local preview only` 實作頭像旁三列摘要：顯示使用者名稱、`Bujo ID: <code>` 與 icon-only 複製控制、文字為 `更換頭像` 的檔案控制，且保留本地頭像預覽；用 `npm run test:run -- src/__tests__/ProfileEditPage.test.js` 驗證。
- [x] 2.2 在 `src/components/ProfileEditPage.vue` 依 `Remove only the basic-data email row` 實作版面移除：頁首改為 `個人編輯頁面`、移除頭像 header、移除基本資料電子郵件只讀列，並保留修改顯示名稱、取消、儲存變更與已連接的登入方式；用 `npm run test:run -- src/__tests__/ProfileEditPage.test.js` 驗證。

## 3. 驗證

- [x] 3.1 完成全專案驗證，確認 ProfileEditPage 變更符合 specs 與格式規則；用 `spectra analyze adjust-profile-edit-page-layout --json`、`spectra validate adjust-profile-edit-page-layout`、`npm run test:run`、`npm run lint`、`npm run format` 驗證。

## 4. 頭像上傳

- [x] 4.1 更新 `src/__tests__/ProfileEditPage.test.js` 驗證 `Profile edit page uploads avatar`：成功上傳時使用 `PATCH /api/users/me/avatar`、`credentials: include`、`FormData` 欄位 `avatar`、不設定 `Content-Type`，並更新 `authStore.user.avatar_url`；格式錯誤、超過 2MB、後端 message 錯誤都會顯示對應訊息；用 `npm run test:run -- src/__tests__/ProfileEditPage.test.js` 驗證。
- [x] 4.2 更新 `src/components/ProfileEditPage.vue` 實作 `Upload avatar through authenticated multipart request`：選檔後驗證 JPG/PNG/WebP 與 2MB 限制，成功時 merge response user 到 auth store 並顯示新頭像，後端相對 `avatar_url` 用 `VITE_API_URL` 補完整來源；用 `npm run test:run -- src/__tests__/ProfileEditPage.test.js` 驗證。
- [x] 4.3 完成追加驗證，確認頭像上傳規格、測試與格式規則一致；用 `spectra analyze adjust-profile-edit-page-layout --json`、`spectra validate adjust-profile-edit-page-layout`、`npm run test:run`、`npm run lint`、`npm run format` 驗證。
