## Context

建立揪團活動彈窗（`EventPage.vue`）原本有三行截止時間相關文字，由 `activity-deadline-validation` 這個既有 spec 詳細規範（「Two persistent deadline lines」「Third line for near-term candidate date reminder」等 requirement）。這三行固定顯示在表單最下方（備註欄位裡），跟四個情境（日期時間都固定／日期固定時間投票／候選日期統一時間／候選日期各自時段）各自的日期時間選擇區塊在畫面上距離很遠，語意上卻緊密相關。同時第一行的警示樣式沿用一個沒有經過設計系統的硬編碼紅色 `#dc2626`，跟整個 BuJo 柔霧色調（`--bujo-accent` 鼠尾草綠、`--bujo-card-blue` 霧藍等）不協調。

## Goals / Non-Goals

**Goals:**

- 精簡顯示內容：三行降成一行，只保留報名截止提醒
- 提醒位置貼近語意相關的日期時間選擇區塊，而不是固定在表單最下方
- 警示樣式改用專案既有設計 token（`--bujo-notification`），視覺上跟整體風格一致
- 避免四個情境各自複製貼上重複模板

**Non-Goals:**

- 不處理既有的 Vue computed 快取即時性問題（見下方風險章節）
- 不擴大到 `ActivityDetailModal.vue`／`AvailabilityPickerModal.vue`——這兩個檔案目前沒有實作這個模式，`activity-deadline-validation` spec 裡引用到這兩個檔案跟已被刪除的 `UrgentStartWarning.vue` 的 `@trace` metadata 是更早之前改動留下的過期紀錄，不在這次處理範圍
- 不改變送出前的驗證邏輯（截止時間必須晚於現在、決策硬截止時間 ≤30 分鐘攔截送出的判斷條件本身）

## Decisions

### 移除第二、三行，二次確認彈窗維持不變只改文字

第二行（決策硬截止時間常駐文字）跟第三行（候選日提醒）整行移除。決策硬截止時間距今 ≤30 分鐘攔截送出的二次確認彈窗（`showUrgentConfirm`/`confirmUrgentSubmit`/`submitForm` 攔截邏輯）保留不動，只改彈窗顯示的文字內容，從一段長文案改成兩行（「距離活動開始只剩 {X} 分鐘」+「確定要建立活動嗎？」）。

### 提醒搬到各情境區塊內部，抽成獨立元件 `ReportCutoffReminder.vue`

四個情境各自的日期時間選擇區塊下面都要接一份報名截止提醒。避免 4 處重複模板，抽成 `src/components/ReportCutoffReminder.vue`，純顯示 + 事件轉發（`toggle-editor`/`select-preset` 兩個 emit），狀態邏輯（`isReportCutoffWarning`、`showDeadlineEditor`、`selectedDeadlinePresetKey` 等）全部留在 `EventPage.vue`，元件本身不持有狀態。

**實作陷阱（記錄給之後維護者參考）**：一開始把元件插在情境的 `v-if`/`v-else-if`/`v-else` 區塊「之後」（當作兄弟元素），這樣會打斷 Vue 的條件鏈，導致 `v-else-if`/`v-else` 找不到對應的 `v-if`，編譯直接報錯（`v-else-if has no adjacent v-if`）。正確做法是把元件放在各情境 `<div>` 內部的最後一個子元素，維持 `v-if`/`v-else-if`/`v-else` 三者互為直接兄弟元素不被打斷。

### 警示樣式改用既有設計 token，不新增自訂顏色

原本的 `text-[#dc2626]` 改成 `text-[var(--bujo-notification)]`（專案既有磚紅色 token，已用於 `AppSidebar.vue`、`CalendarMain.vue` 的通知類 UI）。加 `ClockIcon`（`@heroicons/vue/24/outline`，全站既有圖示風格，其他頁面如 `AlertsPage.vue`／`ProfileEditPage.vue` 都用 outline 變體），不使用文字符號（⚠）避免跟表單驗證錯誤的既有符號混淆。倒數數字用 `--bujo-font-meta`（等寬字體）強調，比照既有的 `reportCutoffOffsetParts` 數字特別處理的先例。

## Implementation Contract

**Behavior**：
- 建立活動彈窗底部只剩一行報名截止提醒，跟在當前使用中的情境日期時間選擇區塊之後
- 一般狀態：「報名開放到 {報名截止時間}（{偏移量} 截止）」，偏移量數字可點擊展開流團編輯器
- 警示狀態（報名截止時間距今 ≤30 分鐘，或智慧預設演算法降級到無安全偏移量）：磚紅色「⏰ 距離報名截止僅剩 {X} 分鐘！」
- 決策硬截止時間距今 ≤30 分鐘時，送出仍會先跳二次確認彈窗（機制不變），彈窗文字改成「距離活動開始只剩 {X} 分鐘」+「確定要建立活動嗎？」

**Interface / data shape**：
- 新增元件 `src/components/ReportCutoffReminder.vue`，props：`isWarning`（Boolean）、`remainingMinutes`（Number）、`timeLabel`（String）、`offsetParts`（Object `{number, unit}`）、`showEditor`（Boolean）、`presets`（Array）、`selectedPresetKey`（String）；emits：`toggle-editor`、`select-preset`
- `EventPage.vue` 新增 `minutesUntilVoteDeadline` computed（邏輯比照既有 `minutesUntilCeiling`，基準換成 `voteDeadlineDate`）
- 移除 `EventPage.vue` 的 `scheduleCeilingLineText`、`candidateDateReminderText`、`reportCutoffWarningText` 三個 computed（不再需要）

**Failure modes**：無新增錯誤處理路徑，維持既有的送出前驗證（截止時間必須晚於現在時才允許送出）不變。

**Acceptance criteria**：
- `npx vitest run` 全數通過（`EventPage.test.js` 涵蓋四情境各自渲染提醒、警示樣式獨立判斷、二次確認彈窗攔截行為）
- `npx vite build` 無編譯錯誤
- 手動於瀏覽器切換四個情境，確認提醒正確渲染在各自日期時間區塊下方且只出現一次；把報名截止時間逼近到 ≤30 分鐘，確認警示文字「距離報名截止僅剩 {X} 分鐘！」正確顯示（磚紅色+時鐘圖示）；把決策硬截止時間逼近到 ≤30 分鐘，確認二次確認彈窗照常跳出且文字正確

**Scope boundaries**：範圍限定在 `EventPage.vue` 的截止時間提醒 UI；不包含 `ActivityDetailModal.vue`／`AvailabilityPickerModal.vue`；不包含送出前驗證邏輯本身的變動；不包含下方風險章節提到的 computed 即時性問題。

## Risks / Trade-offs

- [Risk] `isReportCutoffWarning`、`isScheduleCeilingWarning`、`minutesUntilCeiling`、`minutesUntilVoteDeadline` 都是 Vue computed，沒有 `setInterval` 驅動，只有在使用者觸碰到相關表單欄位（日期/時間/preset）時才會重新計算，不會隨真實時間流逝自動 tick。新增的「距離報名截止僅剩 {X} 分鐘！」倒數文字因此不是真正即時倒數，可能顯示凍結的舊值；更值得注意的是既有的二次確認彈窗攔截邏輯（送出前的安全檢查）理論上也可能受同樣的快取機制影響——使用者長時間停留表單、只改動非時間相關欄位時，送出當下的安全判斷可能用到過期的快取值而非即時重算的結果 → Mitigation：這次不處理，記錄為已知風險，留待後續評估是否需要加 `setInterval` 或改用其他機制強制定期重新計算
- [Risk] `activity-deadline-validation` spec 既有的 `@trace` metadata 引用到 `ActivityDetailModal.vue`／`AvailabilityPickerModal.vue`／已刪除的 `UrgentStartWarning.vue`，但這三者目前都沒有實作這個模式（已用 grep 確認） → Mitigation：這是更早之前的變更留下的過期紀錄，這次的 spec delta 不會延續引用這些檔案，維持現狀不修正舊 trace，避免範圍擴大
