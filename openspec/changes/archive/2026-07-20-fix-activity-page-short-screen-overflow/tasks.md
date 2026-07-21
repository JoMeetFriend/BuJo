## 1. 響應式契約測試

- [x] 1.1 在既有 activity 元件測試中新增樣式契約，覆蓋 `Mobile activity detail respects the stage height`、`Overflowing detail content remains accessible`、`Short screens reduce decorative vertical spacing`，並以 targeted Vitest 確認修正前測試失敗、修正後通過。

## 2. 高度與溢位修正

- [x] 2.1 實作「由活動舞台提供可用高度 CSS 變數」與「短螢幕壓縮裝飾性間距」：手機詳情卡受舞台高度約束、短螢幕壓縮 stage padding、grid gap 與 rail separation，透過 `src/__tests__/ActivityView.test.js` targeted Vitest 驗證活動小卡列不再被高度規則覆蓋。
- [x] 2.2 實作「卡片 body 維持內部捲動」：移除手機詳情卡 340px 最大高度下限並保留 `.activity-detail-body` 的垂直捲動契約，透過 `src/__tests__/ActivityDetailModal.test.js` targeted Vitest 驗證內容可留在受限卡片內存取。

## 3. 完整驗證

- [x] 3.1 執行 `npm run test:run -- src/__tests__/ActivityView.test.js src/__tests__/ActivityDetailModal.test.js`、`npm run lint`、`npm run format` 與 `npm run build`，確認活動功能、程式風格及 production build 均通過，並檢查 diff 未包含範圍外異動。
