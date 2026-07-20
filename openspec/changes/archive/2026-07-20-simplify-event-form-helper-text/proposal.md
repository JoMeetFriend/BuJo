## Summary

建立揪團活動彈窗（`EventPage.vue`）移除三處輔助文字：活動名稱欄位的字數上限提示、情境二/三/四的情境說明文字、情境三/四候選日期區塊的欄位標籤。

## Motivation

使用者檢視建立活動表單後，確認這三處輔助文字都是不必要的資訊，希望直接拿掉，讓表單更簡潔。已明確指定三處範圍與對應程式碼位置。

## Proposed Solution

1. **移除「最多 15 字」提示**：`EventPage.vue` 活動名稱欄位下方的 `<span id="event-name-hint">{{ t('event.maxChars', { count: ACTIVITY_TITLE_MAX_LENGTH }) }}</span>` 整個移除；輸入框上對應的 `aria-describedby="event-name-hint"` 屬性一併移除，避免留下指向不存在元素的殘留 aria 屬性。
2. **移除情境說明文字區塊**：`<!-- 情境說明 -->` 註解與 `<div v-if="dateMode !== 'fixed' || timeMode !== 'fixed'">{{ scenarioDescription }}</div>` 整個區塊移除，涵蓋情境二、三、四（情境一的 v-if 條件本來就不會顯示，不受影響）。`scenarioDescription` 這個 computed 在移除模板引用後不再被任何地方使用，一併刪除，不留死程式碼。
3. **移除候選日期區塊標籤**：情境三候選日期區塊最上方的 `<span :class="fieldLabelClass">{{ t('event.candidateDates') }}</span>`（「候選日期」）、情境四候選日期區塊最上方的 `<span :class="fieldLabelClass">{{ t('event.candidateDatesAndTimes') }}</span>`（「候選日期與時段」）都整個移除，緊接在後的月曆導覽、候選日期格子等內容維持不動。

## Non-Goals

- 不修改 `src/locales/zh-TW.json`、`src/locales/en.json` 裡 `event.maxChars`、`event.candidateDates`、`event.candidateDatesAndTimes` 這三個既有 i18n key 的定義本身——這次只移除 `EventPage.vue` 裡的引用點，key 本身保留（避免影響其他可能引用同一個 key 的地方，例如 `event.candidateDates`／`event.candidateDatesAndTimes` 跟 `scenarioC1Title`／`scenarioD1Title` 這兩組 key 內容重複但不確定是否同源，這次不處理 key 層級的整理）
- 不修改情境一到四的其他表單欄位、驗證邏輯、送出流程
- 不影響候選日期月曆本身的互動（選日期、月份導覽、統一時間/候選時段設定等）

## Impact

- Affected specs: `event-form-calendar-grid`（新增一條需求，描述建立活動表單不再顯示這三處輔助文字）
- Affected code:
  - Modified: src/components/EventPage.vue
