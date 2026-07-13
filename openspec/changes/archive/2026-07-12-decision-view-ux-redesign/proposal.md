## Why

創建者的決策/投票畫面目前把情境二／四的重疊結果拆成「完全重疊」「部分重疊」兩個分類，且情境二／四的後端切格結果沒有合併，一段連續的可用時間會被拆成好幾筆幾乎相同的列（測試中觀察過 `partial_overlap` 一次回傳 19 筆），造成畫面資訊過載、語意難懂。後端 `decision-view-ux-redesign`（BuJoBackend repo）已經完成並驗證：改成後端合併相鄰同票數同支持者的區段、回傳單一排序陣列（情境四是候選時段外層＋內層 `segments`）、每筆帶 `is_unanimous`／`supporters`。前端需要同步改成消費這個新格式，並落實使用者在腦力激盪階段核准的呈現方式：比例＋頭像、預設前 3 名＋漸進展開、情境一補上已報名人數與頭像的可見性。

## What Changes

- **BREAKING**：`ActivityDetailModal.vue` 不再讀取 `decision_candidates.perfect_overlap`／`partial_overlap`，情境二／三改成讀取單一排序陣列，情境四改成讀取候選時段陣列＋內層 `segments`（對齊 BuJoBackend `decision-view-ux-redesign` 已完成的 API 變更）
- 移除「完全重疊」「部分重疊」兩個分類標題，改成單一依支持度排序的清單，每筆顯示時間範圍與「X/Y 人」比例文字（Y 依情境使用真人送出者去重數或真人參與者數，跟後端 `is_unanimous` 分母一致，皆不含建立者）
- 每筆新增支持者頭像顯示，桌面版滑鼠 hover、行動裝置長按觸發顯示支持者姓名清單的提示框
- 清單預設只顯示前 3 筆，超過 3 筆時顯示「顯示更多」按鈕，每次點擊只多展開 3 筆（不會一次全部展開），符合使用者明確要求的「不需要一次接受過多資訊」設計理念
- 情境四維持「候選時段」外層分組（不同候選日期/窗口不能合併），只有內層的支持度清單套用上述新的統一呈現方式（比例、頭像、前 3+展開）
- 查證並確認情境一（`fixed`，免投票）建立者已能看到已報名人數與頭像（`activity-detail-join` 區塊程式碼層級沒有被任何情境判斷式包住），新增元件測試把這個既有行為鎖進回歸測試；若測試意外失敗才視情況修正

## Non-Goals

（design.md 會涵蓋，此處留空）

## Capabilities

### New Capabilities

- `activity-decision-view`：`ActivityDetailModal.vue` 決策/投票畫面的候選項目呈現方式——統一的排序清單格式、比例＋頭像顯示、前 3 名漸進展開、情境四候選時段分組、情境一已報名人數/頭像可見性

### Modified Capabilities

（無——三個既有 scenario spec 涵蓋的是報名/回報流程本身，不是決策畫面的呈現邏輯，這次不動它們的既有需求文字）

## Impact

- Affected specs: `activity-decision-view`（新增）
- Affected code:
  - Modified: src/components/ActivityDetailModal.vue
  - Modified: src/__tests__/ActivityDetailModal.test.js
