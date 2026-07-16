## 1. Gesture guard 實作

- [x] 1.1 在 `src/components/AlertsPage.vue` 落實「以一次性 gesture click guard 取代固定抑制時間」與「下一次 pointerdown 清除未被合成 click 消耗的 guard」：Horizontal drag suppresses exactly its next pointer click，水平鎖定後即使 pointerup、pointercancel 或未達 65% 復位也保留 guard，受阻 click 消耗 guard，新 pointerdown 清除過期 guard；以 `src/__tests__/AlertsPage.test.js` 的超過 250ms 慢速左滑測試驗證 read、dismiss 與 router 均符合 contract。
- [x] 1.2 在 `src/components/AlertsPage.vue` 落實「將 pointer guard 與通知啟用來源分離」：Activity notification click navigates to the referenced activity，僅 pointer click 檢查一次性 guard，Enter 與 Space 仍標記已讀並導向 activity focus route；以 `src/__tests__/AlertsPage.test.js` 的 guarded click、下一次正常 click、Enter 與 Space 測試驗證。

## 2. 狀態轉移與回歸驗證

- [x] 2.1 依「以慢速拖曳與後續啟用測試鎖定狀態轉移」補齊 `src/__tests__/AlertsPage.test.js`，覆蓋慢速未達門檻復位、guard 僅消耗一次、無合成 click 時下一次 pointerdown 清除 guard，並保留 swipe threshold、dismiss rollback、好友操作與 activity deep-link 測試；先執行 `npm run test:run -- src/__tests__/AlertsPage.test.js`。
- [x] 2.2 完成整體品質驗證，依序執行 `npm run test:run`、`npm run lint`、`npm run format`、`npm run build`，並以 `git diff --check` 與 `spectra analyze fix-notification-swipe-click-through --json` 確認無格式錯誤或 Critical/Warning artifact findings。
