## 1. 通知資料契約

- [x] 1.1 依「保留並正規化通知 actor 契約」更新 `normalizeNotification`，讓有效 actor 收斂為 `{ id, displayName, avatarUrl }`、無效或缺少 actor 收斂為 `null`；以 `src/__tests__/AlertsPage.test.js` 的 response normalization 測試驗證介面形狀與安全 fallback。

## 2. 好友通知頭像呈現

- [x] 2.1 依「好友通知以 actor 頭像取代通用圖示」實作 Friend notifications display the actor avatar 與 Friend notification avatar URLs use shared normalization：僅兩種好友通知使用 `toAvatarSrc` 顯示 40×40 方形行為者頭像，相對與絕對 URL 皆符合契約；以 AlertsPage targeted tests 驗證 requester、receiver 與兩種 URL。
- [x] 2.2 依「缺圖與載入錯誤共用既有 fallback」實作 Unavailable actor avatars fall back safely：actor、avatarUrl 或正規化來源缺少及 image error 時不顯示 broken image，改用既有好友圖示；以缺圖與 `error` event 的 AlertsPage targeted tests 驗證。

## 3. 回歸與完整驗證

- [x] 3.1 驗證 Existing notification behavior remains unchanged：活動與一般通知圖示、已讀視覺、接受／拒絕、導頁、swipe 與 hover dismissal 均不受影響；執行 `npm run test:run -- src/__tests__/AlertsPage.test.js`、`npm run test:run`、`npm run lint`、`npm run format`、`npm run build` 與 `git diff --check`，所有命令必須成功。
