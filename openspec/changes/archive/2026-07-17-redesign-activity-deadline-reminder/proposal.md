## Why

建立揪團活動彈窗底部原本常駐/條件顯示三行截止時間相關文字（報名截止、決策硬截止、候選日提醒），資訊量偏多、位置跟語意脫節（固定在表單最下方，不是緊鄰相關的日期時間欄位），且警示文字/樣式是硬套的通用紅色，跟整個 BuJo 柔霧色調的設計系統不搭。這次重新設計，簡化成一行常駐提示、位置改到跟它語意相關的日期時間選擇區塊下方、警示樣式改用專案既有的設計 token，讓資訊更聚焦、視覺更一致。

## What Changes

- **BREAKING（對使用者可見的行為變更）**：移除底部第二行（決策硬截止時間常駐文字）跟第三行（情境三/四專屬的候選日提醒），只保留第一行報名截止時間常駐顯示。決策硬截止時間距今 ≤30 分鐘時攔截送出的二次確認彈窗機制維持不變，但畫面上不再有任何文字預告這個機制的存在
- 二次確認彈窗文字從一段長文案改成兩行：「距離活動開始只剩 {X} 分鐘」+「確定要建立活動嗎？」，{X} 沿用既有的 `minutesUntilCeiling` 計算邏輯
- 第一行報名截止提醒的位置從固定顯示在表單最下方（備註欄位裡），改成跟著各情境自己的日期時間選擇區塊——四個情境（日期時間都固定／日期固定時間投票／候選日期統一時間／候選日期各自時段）各自的日期時間區塊下面都接一份，畫面上同一時間只會顯示一份（四情境互斥）
- 第一行警示狀態的文字從「報名開放到 {絕對時間}——活動快開始了，已經沒有緩衝時間」改成倒數形式「距離報名截止僅剩 {X} 分鐘！」，{X} 是新的「距報名截止時間還有幾分鐘」計算邏輯（跟既有的決策硬截止版本同公式，換一個基準時間）
- 第一行警示樣式從硬套的紅色（`#dc2626`）改成專案既有的 `--bujo-notification` 設計 token（磚紅色），並加上時鐘圖示（`ClockIcon`），跟全站既有圖示風格一致

## Non-Goals

- 不處理已知的 Vue computed 快取/即時性問題（見 design.md 的已知風險章節）——這是既有架構問題，不是這次改動範圍
- 不擴大到 `ActivityDetailModal.vue`／`AvailabilityPickerModal.vue`——確認過這兩個檔案目前完全沒有實作這個截止時間提示的樣式（`activity-deadline-validation` spec 裡的既有 `@trace` metadata 引用到這兩個檔案跟已經被刪除的 `UrgentStartWarning.vue`，是更早之前改動留下的過期紀錄，這次不處理、不修正）
- 不改變任何送出前的驗證邏輯本身（截止時間必須晚於現在、決策硬截止時間 ≤30 分鐘攔截送出）——這些邏輯全部維持不變，只改文字/樣式/位置

## Capabilities

### Modified Capabilities

- `activity-deadline-validation`：截止時間提醒的顯示行數（三行→一行）、顯示位置（表單最下方→各情境日期時間區塊下方）、二次確認彈窗文案、警示狀態文字與樣式全部改變

## Impact

- Affected specs: `activity-deadline-validation`
- Affected code:
  - New: `src/components/ReportCutoffReminder.vue`
  - Modified: `src/components/EventPage.vue`, `src/__tests__/EventPage.test.js`
