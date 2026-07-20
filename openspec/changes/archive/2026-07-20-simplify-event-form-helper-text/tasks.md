## 1. 移除三處輔助文字

- [x] 1.1 在 `EventPage.vue` 移除活動名稱欄位下方 `<span id="event-name-hint">{{ t('event.maxChars', ...) }}</span>` 整個元素，並移除輸入框上對應的 `aria-describedby="event-name-hint"` 屬性，實現「Create-activity form omits secondary helper text」對應的「Activity name field has no character-limit hint」；以瀏覽器手動驗證活動名稱欄位下方不再顯示「最多 15 字」文字。
- [x] 1.2 在 `EventPage.vue` 移除 `<!-- 情境說明 -->` 註解與 `<div v-if="dateMode !== 'fixed' || timeMode !== 'fixed'">{{ scenarioDescription }}</div>` 整個區塊，並刪除已無其他引用處的 `scenarioDescription` computed，實現「No schedule-summary description for scenarios B, C, or D」；以瀏覽器手動驗證切到情境二、三、四都不再顯示情境說明文字，並確認 `npx eslint` 沒有回報 `scenarioDescription` 未使用的警告（代表已完整清除）。
- [x] 1.3 在 `EventPage.vue` 移除情境三候選日期區塊的 `<span :class="fieldLabelClass">{{ t('event.candidateDates') }}</span>` 標籤，實現「Candidate-date section has no field label in scenario C」；以瀏覽器手動驗證情境三的候選日期區塊最上方不再顯示「候選日期」文字，月曆導覽與候選日期格子維持正常運作。
- [x] 1.4 在 `EventPage.vue` 移除情境四候選日期區塊的 `<span :class="fieldLabelClass">{{ t('event.candidateDatesAndTimes') }}</span>` 標籤，實現「Candidate-date section has no field label in scenario D」；以瀏覽器手動驗證情境四的候選日期區塊最上方不再顯示「候選日期與時段」文字，月曆導覽與候選時段設定維持正常運作。

## 2. 整體驗證

- [x] 2.1 執行 `npx vitest run` 確認全數通過（若既有測試斷言了這三處被移除的文字，需要一併更新該測試以反映新行為），執行 `npx vite build` 確認無錯誤，執行 `npx eslint` 確認除既有無關 warning 外無新增問題。
