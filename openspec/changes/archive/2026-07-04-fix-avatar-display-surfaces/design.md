## Context

後端 `BuJoBackend` 已提供 `PATCH /api/users/me/avatar`，並在 `API_DOCS.md` 與實作中明確回傳 `/uploads/avatars/...` 相對 `avatar_url`。前端目前只有 `ProfileEditPage.vue` 有本地 `toAvatarSrc`，主頁右上角 `CalendarMain.vue`、我的帳號彈窗 `ProfileAccountModal.vue` 仍直接使用 `user.avatar_url`，側欄 `AppSidebar.vue` 則完全不顯示登入者頭像。

## Goals / Non-Goals

**Goals:**

- 修復主頁右上角與我的帳號彈窗在相對 `avatar_url` 下的破圖問題。
- 側欄下方個人帳號按鈕也顯示目前登入者頭像。
- 把 avatar URL 正規化集中到一個前端 helper，避免各元件重複實作。
- 保留沒有頭像時的既有 fallback pixel face。

**Non-Goals:**

- 不修改後端 API、靜態檔服務或 `avatar_url` 儲存格式。
- 不調整好友、活動、通知中的其他使用者頭像資料。
- 不重新設計帳號彈窗、主頁 header 或側欄版面。

## Decisions

### Normalize avatar URLs in a shared helper

新增 `src/utils/avatar.js` 匯出 `toAvatarSrc(url, apiBaseUrl = import.meta.env.VITE_API_URL)`。空值回傳空字串；`http://`、`https://`、`blob:` 原樣回傳；以 `/` 開頭的相對路徑補上 API base URL。替代方案是在每個元件各寫一次轉換邏輯，但目前至少三個入口需要相同行為，重複實作容易再次漏改。

### Apply avatar helper only to current-user account surfaces

本 change 只處理目前登入者帳號入口：主頁右上角、我的帳號彈窗、個人編輯頁、側欄下方帳號按鈕。好友搜尋、好友頁、活動列表的其他使用者頭像不納入，因為它們的資料來源和破圖情境不同，需要另外盤點。

### Preserve existing fallback face behavior

沒有 `avatar_url` 或轉換後為空字串時，元件仍顯示既有 pixel face。這避免沒有頭像的使用者被破圖或空白取代。

## Implementation Contract

新增的 avatar helper MUST 將 `/uploads/avatars/avatar-user.png` 轉成 `${VITE_API_URL}/uploads/avatars/avatar-user.png`，並 MUST 保留 `http://`、`https://`、`blob:` URL 原值。空值、null 或 undefined MUST 轉成空字串。

`CalendarMain.vue` 的主頁右上角帳號按鈕、`ProfileAccountModal.vue` 的彈窗頭像、`ProfileEditPage.vue` 的個人編輯頭像、`AppSidebar.vue` 的側欄下方個人帳號按鈕 MUST 都使用 helper 顯示目前登入者頭像。當登入者沒有可用頭像時，這些入口 MUST 保留既有 fallback pixel face。

`AppSidebar.vue` MUST 從 `authStore.user.avatar_url` 取得頭像並在下方個人帳號按鈕顯示；它不需要改變點擊開啟帳號彈窗的既有流程。

驗收方式：新增 helper unit tests 覆蓋相對路徑、完整 URL、blob URL、空值；更新 `ProfileAccountModal` tests 驗證彈窗會把相對頭像路徑補 API base URL；新增或更新側欄/主頁帳號按鈕相關 component tests，驗證相對頭像路徑會出現在 `<img src>`，且無頭像時 fallback 仍存在。執行 `npm run test:run`、`npm run lint`、`npm run format`。

## Risks / Trade-offs

- [Risk] `VITE_API_URL` 結尾若帶 `/`，和相對路徑直接串接會產生雙斜線 → Mitigation：helper 在串接時移除 API base URL 結尾斜線。
- [Risk] 其他使用者頭像仍可能有相對路徑 → Mitigation：本 change 明確只處理 current-user account surfaces；若後續在好友或活動頭像看到同樣問題，再開獨立 change 擴大範圍。
- [Risk] 測試環境中的 `import.meta.env.VITE_API_URL` 和實際開發環境不同 → Mitigation：helper 支援傳入 `apiBaseUrl`，unit tests 用顯式 base URL 驗證核心邏輯。
