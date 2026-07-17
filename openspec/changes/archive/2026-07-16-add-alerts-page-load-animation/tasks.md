## 1. 首次載入動畫測試

- [x] 1.1 在 `src/__tests__/AlertsPage.test.js` 新增對 `Notification rows animate after the initial successful load` 與「首次成功載入 ID 集合控制動畫資格」的測試：pending request 時沒有通知列，首次非空 response 後列具有 entering class，第二次成功 fetch 後 class 消失，首次空 response 消耗動畫資格；以 `npm run test:run -- src/__tests__/AlertsPage.test.js` 確認案例先能重現缺少行為。
- [x] 1.2 在同一測試檔新增對 `Initial notification entry is staggered with a bounded delay` 與「外層 shell 使用 CSS keyframes 與封頂錯開延遲」的 9 筆通知案例，斷言 index 0/1/2 為 0ms/60ms/120ms，index 7/8 均為 420ms；以 targeted Vitest 驗證延遲契約。

## 2. 動畫行為實作

- [x] 2.1 在 `src/components/AlertsPage.vue` 依「首次成功載入 ID 集合控制動畫資格」與「外層 shell 使用 CSS keyframes 與封頂錯開延遲」實作首次成功非空資料的 ID 集合、後續成功 fetch 清空資格、400ms 淡入與 translateY(10px) 復位，以及 60ms／420ms 封頂延遲；以 targeted Vitest 證明 `Notification rows animate after the initial successful load` 與 `Initial notification entry is staggered with a bounded delay` 全部通過。
- [x] 2.2 在既有 reduced-motion media query 依「Reduced motion 直接取消進場動畫」加入 entering class 的 `animation: none`，使 `Reduced motion disables initial-load entry animation` 成立且 swipe transition 的 1ms 規則不變；以 source assertion 與 targeted Vitest 驗證。

## 3. 完整驗證

- [x] 3.1 執行 `npm run test:run`、`npm run lint`、`npm run format`、`npm run build` 與 `git diff --check`，確認所有既有通知互動維持通過且變更只涵蓋首次載入動畫、測試與本 Spectra change artifacts。
