## Problem

使用者上傳頭像後，後端依 API 文件與實作回傳 `/uploads/avatars/...` 相對路徑，但主頁右上角帳號按鈕與「我的帳號」彈窗直接把 `avatar_url` 放進 `<img src>`，導致瀏覽器向前端 Vite origin 請求圖片而破圖。側欄下方個人帳號按鈕目前也沒有顯示登入者頭像，只顯示 fallback pixel face。

## Root Cause

- 後端 `PATCH /api/users/me/avatar` 會回傳相對 `avatar_url`，且此行為是既定 API contract。
- 前端只有個人編輯頁局部處理相對 `avatar_url`，其他使用者頭像入口沒有共用轉換邏輯。
- `AppSidebar.vue` 的個人帳號按鈕未讀取 `authStore.user.avatar_url`。

## Proposed Solution

- 新增共用 avatar source helper，將空值、完整 URL、blob URL、以及 `/uploads/...` 相對路徑轉成可直接給 `<img src>` 使用的值。
- 主頁右上角帳號按鈕、我的帳號彈窗、個人編輯頁改用同一個 helper 顯示目前登入者頭像。
- 側欄下方個人帳號按鈕也顯示登入者頭像；沒有頭像時保留現有 fallback pixel face。
- 補測試覆蓋相對 avatar_url 轉完整 URL、完整 URL 原樣保留、無頭像時 fallback 仍可見，以及側欄會使用登入者頭像。

## Non-Goals

- 不修改後端 avatar API 或 `avatar_url` 儲存格式。
- 不變更好友、活動、通知列表中的他人頭像資料流。
- 不重新設計帳號彈窗或側欄版面，只修正圖片來源與 fallback 行為。

## Success Criteria

- 當登入者 `avatar_url` 是 `/uploads/avatars/avatar-user.png` 時，主頁右上角、我的帳號彈窗、個人編輯頁與側欄帳號按鈕都使用 `${VITE_API_URL}/uploads/avatars/avatar-user.png` 顯示圖片。
- 當登入者 `avatar_url` 已是 `http` 或 `https` URL 時，前端保持原值。
- 當登入者沒有 `avatar_url` 時，既有 fallback pixel face 繼續顯示。

## Capabilities

### New Capabilities

- `avatar-display`: 使用者頭像在前端各帳號入口的一致顯示與 URL 正規化。

### Modified Capabilities

(none)

## Impact

- Affected specs: avatar-display
- Affected code:
  - New: src/utils/avatar.js
  - New: src/__tests__/avatar.test.js
  - Modified: src/components/CalendarMain.vue
  - Modified: src/components/ProfileAccountModal.vue
  - Modified: src/components/ProfileEditPage.vue
  - Modified: src/components/AppSidebar.vue
  - Modified: src/__tests__/ProfileAccountModal.test.js
  - New: src/__tests__/AppSidebar.test.js
  - Removed: none
