## Why

BuJo 已能透過使用者的 LINE identity 發送個人化 LINE 推播，但目前登入成功後沒有說明「連接 LINE」與「加入官方帳號」是兩個必要步驟；使用帳密或 Google 登入的使用者也缺少可發現的開通入口。需要一個不阻擋主要功能、可略過且可日後補做的 onboarding，讓所有登入方式都能理解並完成 LINE 通知設定。

## What Changes

- 所有既有與新使用者在同一裝置、同一 BuJo 帳號首次進入已登入區域時，顯示一次非阻擋的 LINE 通知引導。
- 依使用者是否已有 LINE identity 顯示不同內容：未連接者先進入既有 LINE 綁定流程；已連接者前往官方帳號加入入口。
- 手機提供 add friend 連結，桌機提供官方帳號 QR code 與連結備援。
- 以版本化、包含 user ID 的 localStorage key 記錄已看過狀態，使用者略過後不在同一裝置重複顯示。
- 在個人編輯頁保留永久的「LINE 通知」設定區塊，讓已略過 onboarding 的使用者仍能連接 LINE 或開啟官方帳號入口。
- 新增公開的前端 add friend URL 與 QR code URL 設定，並在缺少設定時顯示不可用狀態而非空連結。
- 將官方提供的加好友 QR Code 收進前端資產，未設定外部 QR URL 時仍可在桌機 onboarding 顯示可掃描的官方圖；同時把彈窗說明改成較自然、口語的提醒。

## Capabilities

### New Capabilities

- `line-notification-onboarding`: 規範登入後一次性 LINE 通知引導、依 identity 分流、跨裝置邊界、官方帳號入口及個人設定頁永久入口。

### Modified Capabilities

(none)

## Impact

- Affected specs: line-notification-onboarding
- Affected code:
  - New: src/assets/line-gain-friends-qrcode.png, src/components/LineNotificationOnboardingModal.vue, src/components/LineOfficialAccountEntry.vue, src/composables/useLineNotificationOnboarding.js, src/__tests__/App.test.js, src/__tests__/LineNotificationOnboardingModal.test.js, src/__tests__/LineOfficialAccountEntry.test.js, src/__tests__/useLineNotificationOnboarding.test.js
  - Modified: src/App.vue, src/components/ProfileEditPage.vue, src/__tests__/ProfileEditPage.test.js, .env.example, README.md
  - Removed: none
- External dependency: BuJoBackend must continue exposing the authenticated LINE linking route and returning LINE identities from the current-user response. Selecting a stronger OAuth add-friend prompt and improving link-cancellation redirects remain a separate BuJoBackend change.
