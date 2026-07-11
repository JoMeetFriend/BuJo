## 1. 今日標記實作

- [x] 1.1 在 `src/components/CalendarMain.vue` 完成 Compact current-date marker：今天顯示粉紅圓形日期與「日」、非今天維持一般日期，且今日格不再使用整格專用底色或內框；以元件 DOM 測試與手機 24px／桌面 28px 響應式 CSS 規則檢查驗證，若工作環境提供瀏覽器則另做手動視覺檢查。
- [x] 1.2 在 `src/components/CalendarMain.vue` 完成 Current-date semantics：只有今天的日期格具有 `aria-current="date"`，並以 `CalendarMain.test.js` 的固定日期案例驗證。

## 2. 測試與品質檢查

- [x] 2.1 擴充 `src/__tests__/CalendarMain.test.js`，固定系統日期並驗證今日圓形日期、「日」、`is-today`、`aria-current="date"` 與非今日格不含今日標記；以 `npm run test:run -- src/__tests__/CalendarMain.test.js` 通過驗證。
- [x] 2.2 保留其他頁面仍使用的 `--bujo-today` token，確認 `CalendarMain.vue` 不再引用此 token，並以 `rg -- '--bujo-today' src/components/CalendarMain.vue` 無結果、`npm run format`、`npm run build` 與針對異動元件的 ESLint 檢查驗證；另執行完整 `npm run lint` 並記錄任何既有的 repo lint 錯誤。

## 3. 今日標記視覺修正

- [x] 3.1 修正 `src/components/CalendarMain.vue` 的 Compact current-date marker：移除「日」、將圓形改為由既有通知紅色混合白色的柔和紅色，並讓日期數字維持其他日期相同字級與原始左上位置；以 DOM、CSS 規則與元件測試驗證。
- [x] 3.2 更新 `src/__tests__/CalendarMain.test.js`，驗證今日只有圓形背景、不存在 suffix，且今日與一般日期字級共用基礎規則；以 `npm run test:run -- src/__tests__/CalendarMain.test.js`、Prettier、元件 ESLint 與 `npm run build` 通過驗證。

## 4. 圓形定位修正

- [x] 4.1 修正 Compact current-date marker 的定位基準：今日日期元素使用內容寬度，使圓形偽元素以日期數字中心定位且數字仍位於原本左上位置；先以失敗的 SFC 樣式規則測試重現，再以 `npm run test:run -- src/__tests__/CalendarMain.test.js`、Prettier、元件 ESLint 與 `npm run build` 驗證。

## 5. 內距與 RWD 微調

- [x] 5.1 更新 Compact current-date marker 的響應式尺寸：所有日期在手機使用四邊 4px、桌面使用四邊 6px 的等距內距，今日圓形分別縮為 20px 與 22px；以 `CalendarMain.test.js` 的 SFC 規則測試、`npm run test:run`、Prettier、元件 ESLint 與 `npm run build` 驗證。
