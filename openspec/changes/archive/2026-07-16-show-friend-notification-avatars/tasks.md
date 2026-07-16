## 1. 通知資料契約

- [x] 1.1 依「保留並正規化通知 actor 契約」更新 `normalizeNotification`，讓有效 actor 收斂為 `{ id, displayName, avatarUrl }`、無效或缺少 actor 收斂為 `null`；以 `src/__tests__/AlertsPage.test.js` 的 response normalization 測試驗證介面形狀與安全 fallback。

## 2. 好友通知頭像呈現

- [x] 2.1 依「好友通知以 actor 頭像取代通用圖示」實作 Friend notifications display the actor avatar 與 Friend notification avatar URLs use shared normalization：僅兩種好友通知使用 `toAvatarSrc` 顯示 40×40 方形行為者頭像，相對與絕對 URL 皆符合契約；以 AlertsPage targeted tests 驗證 requester、receiver 與兩種 URL。
- [x] 2.2 依「缺圖與載入錯誤共用既有 fallback」實作 Unavailable actor avatars fall back safely：actor、avatarUrl 或正規化來源缺少及 image error 時不顯示 broken image，改用既有好友圖示；以缺圖與 `error` event 的 AlertsPage targeted tests 驗證。

## 3. 回歸與完整驗證

- [x] 3.1 驗證 Existing notification behavior remains unchanged：活動與一般通知圖示、已讀視覺、接受／拒絕、導頁、swipe 與 hover dismissal 均不受影響；執行 `npm run test:run -- src/__tests__/AlertsPage.test.js`、`npm run test:run`、`npm run lint`、`npm run format`、`npm run build` 與 `git diff --check`，所有命令必須成功。

## 4. 活動建立者頭像

- [x] 4.1 依「活動建立通知擴充明確類型 allowlist」將 allowlist 更名為 `ACTOR_AVATAR_NOTIFICATION_TYPES` 並納入 `activity_created`，完成 Activity-created notifications display the creator avatar：活動建立通知以既有 `toAvatarSrc` 與 image-error 狀態顯示 40×40 方形 creator 頭像，相對與絕對 URL 都符合契約；以 `src/__tests__/AlertsPage.test.js` 的 activity creator avatar cases 驗證。
- [x] 4.2 擴充 Unavailable actor avatars fall back safely：`activity_created` 缺少 actor、`avatarUrl` 為 `null` 或圖片觸發 `error` 時不顯示 broken image，而是回到既有 activity icon；以 actor missing、avatar missing 與 image error 的 AlertsPage targeted tests 驗證。

## 5. 活動通知回歸與完整驗證

- [x] 5.1 驗證 Existing notification behavior remains unchanged：`formation_ready`、`time_to_pick`、`activity_confirmed`、`activity_cancelled` 即使收到 actor 也維持 activity icon，好友頭像、已讀、導頁、swipe 與 hover dismissal regression 持續通過；依序執行 `npm run test:run -- src/__tests__/AlertsPage.test.js`、`npm run test:run`、`npm run lint`、`npm run format`、`npm run build` 與 `git diff --check`，所有命令必須成功。
