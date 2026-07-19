## 1. 移除第二、三行常駐文字

- [x] 1.1 刪除 `EventPage.vue` 裡渲染第二行（決策硬截止時間）跟第三行「Third line for near-term candidate date reminder in scenario C and D」（候選日提醒，情境三/四專屬）的模板區塊，只保留第一行——對應設計決策「移除第二、三行，二次確認彈窗維持不變只改文字」（Two persistent deadline lines replace the mutually-exclusive adjust-row/warning-banner）。驗證：`npx vitest run` 全數通過，畫面上只剩一行常駐提示
- [x] 1.2 刪除 `scheduleCeilingLineText`、`candidateDateReminderText` 兩個不再使用的 computed，`isScheduleCeilingWarning`／`withinSafetyBuffer`／二次確認彈窗攔截邏輯維持不動。驗證：`npx vite build` 無編譯錯誤、無未使用變數的 lint 錯誤

## 2. 二次確認彈窗改文案

- [x] 2.1 二次確認彈窗（`showUrgentConfirm`）內文從一段長文案改成兩行「距離活動開始只剩 {X} 分鐘」+「確定要建立活動嗎？」，{X} 沿用既有 `minutesUntilCeiling`（Confirmation gate for near-zero decision buffer）。驗證：`EventPage.test.js` 斷言新文案兩個片段（`距離活動開始只剩`、`確定要建立活動嗎？`）都出現在彈窗內容裡，且攔截送出／不攔截的既有行為斷言（`showUrgentConfirm` true/false、API 呼叫是否發生）維持不變

## 3. 報名截止提醒搬到各情境區塊、抽成獨立元件

- [x] 3.1 新增 `src/components/ReportCutoffReminder.vue`，props 為 `isWarning`/`remainingMinutes`/`timeLabel`/`offsetParts`/`showEditor`/`presets`/`selectedPresetKey`，emits 為 `toggle-editor`/`select-preset`，純顯示＋事件轉發，不持有狀態——對應設計決策「提醒搬到各情境區塊內部，抽成獨立元件 `ReportCutoffReminder.vue`」。驗證：元件檔案存在，`EventPage.vue` 透過 `import ReportCutoffReminder from './ReportCutoffReminder.vue'` 引用
- [x] 3.2 在四個情境（`dateMode==='fixed'&&timeMode==='fixed'`、`fixed`+`vote`、`range`+`fixed`、`range`+`vote`）各自的日期時間選擇區塊「內部最後一個子元素」插入一次 `<ReportCutoffReminder>`（不能插在 v-if/v-else-if/v-else 中間當兄弟元素，會打斷條件鏈導致編譯錯誤）。驗證：`npx vite build` 無編譯錯誤；瀏覽器手動切換四個情境，確認每個情境的日期時間區塊下方都出現提醒且只出現一次

## 4. 報名截止警示文字與樣式重新設計

- [x] 4.1 新增 `minutesUntilVoteDeadline` computed（邏輯比照既有 `minutesUntilCeiling`，基準換成 `voteDeadlineDate`）。驗證：`EventPage.test.js` 新增/更新的警示狀態測試斷言文字包含新計算出的分鐘數
- [x] 4.2 警示狀態文字改成「距離報名截止僅剩 {X} 分鐘！」（Report-cutoff line warning text），移除不再使用的 `reportCutoffWarningText` computed。驗證：`EventPage.test.js` 斷言 `距離報名截止僅剩`、`分鐘！` 都出現在警示狀態下的畫面文字裡
- [x] 4.3 警示樣式從 `text-[#dc2626]` 改成 `text-[var(--bujo-notification)]`，新增 `ClockIcon`（`@heroicons/vue/24/outline`），倒數數字用 `--bujo-font-meta` 等寬字體強調——對應設計決策「警示樣式改用既有設計 token，不新增自訂顏色」。驗證：瀏覽器手動觸發警示狀態（把活動開始時間設在報名截止前 60 分鐘內），截圖確認磚紅色文字＋時鐘圖示＋等寬字體數字正確渲染

## 5. 整體回歸驗證與收尾

- [x] 5.1 執行完整回歸：`npx vitest run`（327/327）、`npx vite build`、`npx eslint`（僅既有跟這次改動無關的 warning）。驗證：全數通過，無新增錯誤或警告
- [x] 5.2 瀏覽器端到端手動驗證：四個情境的提醒位置、二次確認彈窗新文案、警示文字與樣式，逐一截圖確認。驗證：截圖確認畫面渲染符合 design.md 的 Implementation Contract 描述
- [x] 5.3 把 `src/components/EventPage.vue`、`src/components/ReportCutoffReminder.vue`、`src/__tests__/EventPage.test.js` 的改動 commit 到 `feature/time-picker-24-hour-format` 分支。驗證：`git log` 看得到對應的 commit，`git status` 顯示這三個檔案不再是未追蹤/未 staged 狀態
