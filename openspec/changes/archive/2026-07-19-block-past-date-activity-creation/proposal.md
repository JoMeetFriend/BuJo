## Why

行事曆點擊「已經過去」的日期格子時，開啟的活動列表彈窗（`DateEventsModal.vue`）裡的「+」按鈕沒有檢查日期是否過去，會直接開啟「建立揪團活動」彈窗（`EventPage.vue`）並把過去的日期帶入表單。使用者可以把整張表單填完，途中還會看到「距離報名截止僅剩 X 分鐘！」這類荒謬的警示文字，直到按下「送出揪團」才被攔下。這是純 UX 問題（後端與前端送出前的驗證都已經正確擋下過去日期的活動，不是資料安全漏洞），但讓使用者走到表單填完的最後一步才被拒絕，體驗很差。附帶修正：送出被擋下時顯示的錯誤文案用詞不精確（「流團時間」講錯了實際檢查的對象）、顏色是寫死的 `#dc2626`、圖示是 emoji，跟專案其他地方已經改用設計 token／SVG icon 的慣例不一致。

## What Changes

- 行事曆日期彈窗（`DateEventsModal.vue`）的「+」按鈕，日期已經過去時直接不渲染（兩處：有既有行程時 header 的「+」、空狀態時文字下方的「+」），不是變灰或靜默替換成別的日期
- 空狀態文案依日期是否過去切換：過去日期顯示「這天沒有行程」，今天/未來維持「這天還沒有行程」；文字與「+」按鈕的排版從上下兩行改成同一行（今天/未來日期時，因為過去日期已經沒有「+」可顯示）
- `EventPage.vue` 的 `initialDate` prop watcher 新增防禦性檢查：即使有其他入口把過去日期傳入，也不套用，維持表單預設的今天日期
- 送出前擋下「計算出的報名截止時間不在未來」時顯示的錯誤訊息：文案改成「報名截止時間已經過去，請重新調整活動日期或時間」（用詞對齊表單其他地方已經在用的「報名截止時間」），顏色從寫死的 `#dc2626` 改用 `--bujo-notification` 設計 token，圖示從 `⚠️` emoji 換成 `ExclamationTriangleIcon`（`@heroicons/vue/24/outline`）

## Capabilities

### New Capabilities

- `calendar-day-popup-past-date-guard`: 行事曆日期彈窗與建立活動表單，對「已經過去的日期」的新增入口的防護行為

### Modified Capabilities

- `activity-deadline-validation`: 「Form blocks submission when the computed deadline is not in the future」這條需求的錯誤訊息文案、顏色、圖示規格化（原本只描述行為，沒有規定確切文字/樣式）

## Impact

- Affected specs: `calendar-day-popup-past-date-guard`（新）、`activity-deadline-validation`（改）
- Affected code:
  - Modified: src/components/DateEventsModal.vue
  - Modified: src/components/EventPage.vue
