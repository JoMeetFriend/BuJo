## Why

使用者目前是透過 BuJo 使用者識別碼的後五碼來分享與搜尋好友。現有個人帳號彈窗在顯示名稱下方顯示 email，使用者沒有明確入口可以看到或複製要分享給別人的五碼代碼。

## What Changes

- 在個人帳號彈窗的顯示名稱下方顯示 `Bujo ID: <後五碼>`，讓使用者清楚知道這組五碼是 BuJo ID。
- 在五碼代碼右側加入複製操作，且只複製這五碼，對齊現有好友搜尋輸入規則。
- 複製操作在視覺上使用圖示按鈕，不顯示「複製」文字；按鈕仍需保留可存取名稱，讓測試與輔助工具可以辨識。
- 取值時優先使用 `user.uid`，沒有時 fallback 到 `user.id`，讓目前前端資料形狀與未來明確 uid 欄位都能支援。
- 顯示複製成功或失敗的回饋，同時保留既有個人編輯與登出操作。

## Capabilities

### New Capabilities

- profile-uid-sharing: 個人帳號彈窗顯示登入使用者可分享的五碼 BuJo ID，並允許使用者複製該代碼。

### Modified Capabilities

(none)

## Impact

- Affected specs: profile-uid-sharing
- Affected code:
  - New: src/__tests__/ProfileAccountModal.test.js
  - Modified: src/components/ProfileAccountModal.vue
  - Removed: none
- APIs: 不變更前端 API contract；彈窗讀取既有 `authStore.user` 物件。
- Dependencies: 不新增 runtime dependency。
