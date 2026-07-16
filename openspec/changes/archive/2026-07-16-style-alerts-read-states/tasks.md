## 1. 狀態視覺測試

- [x] 1.1 在 `src/__tests__/AlertsPage.test.js` 為 `Read and unread notifications have distinct square visual states` 與「isRead 單一狀態驅動整組視覺」新增混合已讀／未讀測試，驗證只有未讀列具有 unread class、方形提示點與 accent icon，已讀列使用 muted icon 且沒有提示點；以 targeted Vitest 確認測試能重現缺少行為。
- [x] 1.2 新增點擊未讀列後對 `Marking a notification read updates its visual state` 的測試，驗證既有 PATCH 成功後 unread class 與提示點消失；以 targeted Vitest 確認狀態直接跟隨 `notification.isRead`。

## 2. 方角狀態樣式實作

- [x] 2.1 在 `src/components/AlertsPage.vue` 依「方角紙張狀態與平滑顏色切換」實作方角已讀／未讀背景、邊框、訊息與圖示樣式，以及 450ms 純色彩 transition，並加入非互動 `aria-hidden` 方形提示點；以 targeted Vitest 與 source assertions 驗證 `Read and unread notifications have distinct square visual states` 與 `Marking a notification read updates its visual state`。
- [x] 2.2 依「未讀提示點遵守 reduced motion」實作 9px、2.4s opacity pulse，並在既有 media query 停用 pulse，使 `Unread indicator motion respects reduced motion` 成立；以 source assertion、targeted Vitest 驗證，並確認載入與 swipe reduced-motion 規則保持不變。

## 3. 完整驗證

- [x] 3.1 執行 `npm run test:run`、`npm run lint`、針對本次兩個 src 檔案執行 Prettier、`npm run build` 與 `git diff --check`，確認變更只涵蓋通知讀取狀態視覺、測試與本 Spectra change artifacts。
