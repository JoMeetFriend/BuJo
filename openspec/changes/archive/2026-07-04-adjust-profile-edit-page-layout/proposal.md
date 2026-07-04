## Why

個人編輯頁目前把頭像區、使用者識別資訊與基本資料分散呈現，和新的視覺稿不一致。這次調整讓頁首文案、頭像旁資訊與 BuJo ID 複製入口符合指定版面。

## What Changes

- 個人編輯頁頁首文字改為「個人編輯頁面」。
- 移除頭像區的綠色「頭像」標題列。
- 頭像右側改為三列：使用者名稱、Bujo ID 與圖示複製按鈕、更換頭像按鈕。
- Bujo ID 在個人編輯頁沿用既有帳號彈窗規則：優先取 user.uid，沒有才取 user.id，轉字串後顯示最後五碼，複製時只複製五碼。
- 移除基本資料中的電子郵件只讀列；登入方式區塊不變。
- 更換頭像控制改為使用 `FormData` 呼叫 `PATCH /api/users/me/avatar`，成功後以回傳的 `user.avatar_url` 更新目前登入者頭像。

## Capabilities

### New Capabilities

- `profile-edit-layout`: 個人編輯頁的使用者摘要、Bujo ID 與頭像更換版面呈現。

### Modified Capabilities

- `profile-uid-sharing`: 將既有 Bujo ID 顯示與複製規則套用到個人編輯頁。

## Impact

- Affected specs: profile-edit-layout, profile-uid-sharing
- Affected code:
  - Modified: src/components/ProfileEditPage.vue
  - New: src/__tests__/ProfileEditPage.test.js
  - Removed: none
