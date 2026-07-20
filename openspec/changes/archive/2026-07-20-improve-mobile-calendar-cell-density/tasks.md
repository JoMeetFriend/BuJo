## 1. 回歸測試

- [x] 1.1 為 `Compact mobile calendar cell content` 與 `Mobile density changes preserve calendar contracts` 新增 `CalendarMain.test.js` 驗證：多筆活動仍只顯示最早標題及正確 `+N`、單筆不顯示數量、日期格 click/Enter/Space 仍開完整清單，並以 focused Vitest 確認行為契約。

## 2. 手機日期格密度

- [x] 2.1 實作 `Move the mobile additional-event count to the date corner`：僅在 640px 以下讓 `+N` 使用 `top: 4px; right: 4px; bottom: auto`、8px 字級與零 padding，透過 raw SFC 斷言及 320px 手機視覺檢查證明數量不覆蓋活動列。
- [x] 2.2 實作 `Reduce horizontal chrome without reducing title text` 與 `Preserve existing responsive and interaction contracts`：手機活動列表改為 2px 水平 padding，活動條使用 4px dot 欄、3px gap、`1px 3px` padding 與 4px dot，維持 10px 單行截斷標題、六週高度、今日標記、狀態色及桌機樣式，透過 raw SFC 斷言與 CalendarMain focused tests 驗證。

## 3. 整體驗證

- [x] 3.1 執行 `npm run test:run -- src/__tests__/CalendarMain.test.js`、`npm run lint`、`npm run format`、`npm run build` 與 `git diff --check`，並在 390×844、375×667、320×568 驗證日期、今日標記、首筆標題及 `+N` 不重疊；比較既有 dirty 檔案雜湊與 diff，確認 UPCOMING-card、modal 及其測試變更未被覆寫。
