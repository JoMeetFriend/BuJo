## 1. 行事曆日期彈窗（`DateEventsModal.vue`）過去日期防護

- [x] 1.1 在 `src/components/DateEventsModal.vue` 新增 `isPastDate` computed（比照 `CalendarMain.vue` 的 `isToday()` 用 local Date 組 `YYYY-MM-DD` 字串比較，不用 `toISOString()`），並讓 header-actions 插槽的「+」（`v-if` 從 `events.length` 改成 `events.length && !isPastDate`）與空狀態的「+」（外層包 `v-if="!isPastDate"`）在過去日期時都不渲染，實現「Date popup hides the add-activity entry point for past dates」，對應設計文件「決策一：過去日期時「+」按鈕直接不渲染（hidden），不是變灰（disabled）或靜默替換成今天」；以新增或更新 `src/__tests__/DateEventsModal.test.js` 驗證：過去日期時兩處「+」皆不存在於 DOM、今天/未來日期時「+」正常存在並能 emit `add`。
- [x] 1.2 在同一個空狀態區塊，依 `isPastDate` 切換文字（過去日期顯示「這天沒有行程」、今天/未來維持「這天還沒有行程」），並把容器從 `flex-col`（文字與「+」上下兩行）改成 `flex`（同一行），實現「Empty-state wording distinguishes past dates from today/future dates」；以 `DateEventsModal.test.js` 驗證兩種日期狀態下的文字內容正確。

## 2. 建立活動表單（`EventPage.vue`）防禦性 initialDate 檢查

- [x] 2.1 在 `src/components/EventPage.vue` 的 `initialDate` prop watcher 中，於套用日期前檢查轉換後的日期字串是否早於 `today`，若是則直接 `return`、不改變 `form.startDate`/`endDate`/`singleDate` 或 `dateMode`/`timeMode`，實現「Create-activity form does not apply a past initial date」，對應設計文件「決策二：`EventPage.vue` 的 `initialDate` watcher 仍加一層防禦性檢查，即使主要修正在 `DateEventsModal.vue`」；以 `src/__tests__/EventPage.test.js` 驗證：`initialDate` 為過去日期時表單維持今天的預設值且模式不被覆蓋，`initialDate` 為今天/未來日期時行為與現有一致（套用日期並切換為情境一）。

## 3. 送出前錯誤訊息文案與樣式更新

- [x] 3.1 在 `src/components/EventPage.vue` 把送出前擋下「計算出的報名截止時間不在未來」時的 `submitError` 文字從「流團時間已經不在未來，請重新調整流團設定或活動時間」改成「報名截止時間已經過去，請重新調整活動日期或時間」，對應設計文件「決策四：錯誤文案把「流團時間」改成「報名截止時間」」，滿足「Form blocks submission when the computed deadline is not in the future」修改後的規格；以 `EventPage.test.js` 驗證觸發此情境時 `submitError` 為新文案。
- [x] 3.2 在同一個 `submitError` 顯示容器，把 `border-[#dc2626]`/`text-[#dc2626]` 改成 `border-[var(--bujo-notification)]`/`text-[var(--bujo-notification)]`，並把 `⚠️` emoji 換成 `ExclamationTriangleIcon`（新增 `import { ExclamationTriangleIcon } from '@heroicons/vue/24/outline'`），對應設計文件「決策三：送出前錯誤訊息換成 `ExclamationTriangleIcon`，不是 `ClockIcon`」；以瀏覽器手動驗證錯誤訊息顏色與 `ReportCutoffReminder.vue` 的警示文字一致、圖示不再是 emoji。

## 4. 整體驗證

- [x] 4.1 執行 `npx vitest run` 確認全數通過（含 1.1、1.2、2.1、3.1 新增/更新的測試），執行 `npx vite build` 確認無錯誤，執行 `npx eslint` 確認除既有無關 warning 外無新增問題。
