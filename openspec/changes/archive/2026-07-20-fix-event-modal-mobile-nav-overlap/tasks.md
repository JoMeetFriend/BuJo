## 1. 回歸測試

- [x] 1.1 在 `src/__tests__/BaseModal.test.js` 與 `src/__tests__/EventPage.test.js` 新增失敗測試，覆蓋 `Create-activity modal preserves mobile navigation space`、`Reserved mobile navigation remains interactive`、`Mobile navigation reservation is opt-in`、`Long create-activity form remains accessible`，並以 targeted Vitest 證明現況尚未提供 opt-in class、62px 手機邊界與 EventPage wiring。

## 2. 共用彈窗契約

- [x] 2.1 實作「使用 opt-in reserveMobileNavSpace prop」與「以 overlay 幾何邊界保留 62px」：BaseModal 預設維持滿版，啟用後僅在 640px 以下讓 overlay bottom 為 62px，透過 BaseModal targeted tests 驗證 default、opt-in class、CSS media query 與 overlay click 行為。
- [x] 2.2 實作「保留 scrollable header body footer 結構」及 EventPage wiring：只讓建立活動主表單啟用 `reserve-mobile-nav-space`，緊急確認、成功提示及其他彈窗不啟用，透過 EventPage targeted tests 驗證主表單 footer 留在 scrollable 外殼且後續 dialogs 不受影響。

## 3. 驗證與範圍保護

- [x] 3.1 執行 `npm run test:run -- src/__tests__/BaseModal.test.js src/__tests__/EventPage.test.js`、`npm run lint`、`npm run format`、`npm run build`、`git diff --check`，確認所有驗證通過，且 diff 未修改或納入既有 dirty 的 `src/components/CalendarMain.vue` 與 `src/__tests__/CalendarMain.test.js`。
