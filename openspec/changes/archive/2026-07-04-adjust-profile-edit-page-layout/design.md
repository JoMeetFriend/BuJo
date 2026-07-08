## Context

`ProfileEditPage.vue` 目前已從 Pinia auth store 取得 `authStore.user`，並在頁面內處理本地頭像預覽、帳號連接與登入方式管理。既有 `ProfileAccountModal.vue` 已定義 Bujo ID 顯示與複製規則，這次個人編輯頁要沿用相同資料來源與互動。

## Goals / Non-Goals

**Goals:**

- 個人編輯頁符合指定視覺稿：頁首文案、頭像旁三列資訊、移除電子郵件只讀列。
- 在個人編輯頁提供和帳號彈窗一致的 Bujo ID 顯示與複製行為。
- 保留登入方式連接/解除連接與儲存/取消控制，並把更換頭像接到後端上傳 API。

**Non-Goals:**

- 不修改 auth store、路由守衛、後端 API 或登入方式管理流程。
- 不移除登入方式區塊中的 email 或 provider 狀態文字。

## Decisions

### Reuse Bujo ID derivation in ProfileEditPage

個人編輯頁直接用 `authStore.user?.uid ?? authStore.user?.id` 取來源、轉字串後取最後五碼，和帳號彈窗一致。替代方案是只顯示後端提供的新欄位，但目前 store 沒有此欄位，會擴大 API scope。

### Upload avatar through authenticated multipart request

更換頭像按鈕沿用既有 file input，但 `handleAvatarChange` 會建立 `FormData`，用欄位 `avatar` 呼叫 `PATCH /api/users/me/avatar`，並帶 `credentials: 'include'`。請求不設定 `Content-Type`，讓瀏覽器自動產生 multipart boundary。成功後把回傳 `user` merge 回 `authStore.user`，並用 `user.avatar_url` 更新畫面。替代方案是只做本地預覽，但後端 API 已完成，使用者需要跨頁與重新整理後仍保留頭像。

### Remove only the basic-data email row

移除基本資料區塊的電子郵件只讀列；登入方式卡片仍保留 local/google email 顯示，因為那是帳號連接狀態的一部分。

## Implementation Contract

個人編輯頁載入登入使用者後，使用者可在頭像右側看到顯示名稱、`Bujo ID: <code>` 與圖示複製按鈕，以及文字為「更換頭像」的檔案選擇控制。`<code>` MUST 由 `uid` 優先、否則 `id` 推導，轉字串後取最後五碼；複製按鈕 MUST 呼叫 `navigator.clipboard.writeText` 且只寫入五碼。當沒有 `uid` 和 `id` 時，Bujo ID 列與複製按鈕 MUST 隱藏。

使用者選擇 JPG、PNG 或 WebP 且大小不超過 2MB 的圖片時，前端 MUST 用 `FormData` 欄位 `avatar` 上傳到 `PATCH /api/users/me/avatar`，請求 MUST 包含 `credentials: 'include'`，且 MUST NOT 手動設定 `Content-Type` header。成功回應中的 `user.avatar_url` MUST merge 回目前登入者資料並更新頭像顯示；相對路徑圖片顯示時 MUST 使用 API base URL 組成完整圖片來源。若檔案格式或大小不符，前端 MUST 不送出請求並顯示錯誤；若後端回傳 `{ "message": "錯誤訊息" }`，前端 MUST 顯示該訊息。

頁面頂端 MUST 顯示「個人編輯頁面」，頭像區 MUST NOT 顯示獨立的「頭像」標題列。基本資料區 MUST NOT 顯示電子郵件只讀列；修改顯示名稱欄位、取消/儲存按鈕、登入方式區塊與連接/解除連接行為 MUST 保留。

驗收方式：新增 `ProfileEditPage` component tests 覆蓋頁首、頭像旁資訊、Bujo ID 推導與複製、按鈕文字、電子郵件列移除、頭像上傳成功、格式與大小限制、後端錯誤訊息；並執行 `npm run test:run`、`npm run lint`、`npm run format`。

## Risks / Trade-offs

- [Risk] `ProfileEditPage` 與 `ProfileAccountModal` 各自實作 Bujo ID 推導可能日後分岔 → Mitigation：測試使用和帳號彈窗相同的 uid/id 範例與 copy expectation。
- [Risk] 測試 mount 元件時 onMounted 會注入 Google SDK script → Mitigation：在測試中提供 `window.google.accounts.id.initialize` stub。
- [Risk] 後端回傳相對 `avatar_url`，前端直接放到 `img.src` 會指向 Vite origin → Mitigation：ProfileEditPage 顯示頭像時將相對路徑補上 `VITE_API_URL`。
