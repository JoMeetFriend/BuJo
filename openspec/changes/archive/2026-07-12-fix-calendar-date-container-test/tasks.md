## 1. Calendar date container assertion

- [x] 1.1 實作 requirement「Calendar date container test matches the implemented class contract」：在 `src/__tests__/CalendarMain.test.js` 將日期容器 source assertion 更新為完整 class `w-full p-1 leading-none md:p-1.5`，且不修改 `src/components/CalendarMain.vue`；以 targeted CalendarMain test 驗證斷言通過。

## 2. 驗證

- [x] 2.1 執行 `npm run test:run -- src/__tests__/CalendarMain.test.js`、`npm run test:run` 與 `npm run build`，確認目標測試、完整 Vitest 與 production build 通過；以 `git diff --check` 確認僅修改 CalendarMain test 與本 change artifacts。
