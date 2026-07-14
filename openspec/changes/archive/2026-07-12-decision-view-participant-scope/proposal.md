## Why

`decision-view-ux-redesign` 讓決選畫面對建立者跟報名者都顯示同一份完整投票明細，實際使用後發現三個體驗問題：(1) 候選項目時間文字太長時換行很醜，三個情境視覺不一致；(2) 頂端狀態徽章文字（「揪團中」「建立者決選中」）不分角色，已報名的參與者看不出「我已經報名了」這個對自己最直接相關的事實；(3) 報名者能看到完整的投票排名跟所有人頭像，資訊量過大，也是資料揭露層級的問題。後端 `decision-view-participant-scope`（BuJoBackend repo）已經完成並驗證：`decision_candidates` 現在只回傳給建立者，非建立者改成在已回報/已選的時段旁邊看到 `co_participants`（跟自己時間重疊的其他真人參與者）。前端這次同步消費新格式，並修正另外兩個純前端的體驗問題。

## What Changes

- 候選項目的 `.activity-detail-option` 改成允許 `flex-wrap`，時間文字太長時，頭像＋比例整個區塊乾淨掉到下一行，不再擠壓變形——情境二／三／四共用同一份 CSS，一次修正三個情境
- 狀態徽章文案依角色分流：`recruiting`／`voting` 狀態下，已報名的非建立者一律顯示「已報名」，不再顯示「揪團中」／「建立者決選中」；`confirmed`／`cancelled` 不分角色維持原文字
- **BREAKING**：決選候選清單（`decisionSectionLabel`／`normalizedDecisionEntries`／`scenarioDCandidateGroups` 那個區塊）改成只有建立者看得到，跟後端 `decision_candidates` 對非建立者回傳 `null` 的新契約對齊
- 既有的三個唯讀區塊（情境二「你已回報的時間」、情境三「你已選擇的日期」、情境四「你已選擇的候選時段」）各自新增頭像列，直接讀後端新回傳的 `co_participants`，頭像預設顯示（不用 hover 才看得到），頭像本身沿用既有 hover(桌面)/長按(手機) 顯示姓名的機制

## Non-Goals

- 不改後端 API（已經在 BuJoBackend repo 完成並驗證，前端只是消費方）
- 不改建立者視角看到的決選清單本身的呈現方式（比例、頭像、前 3 名展開等既有邏輯不變）
- 不改報名／回報流程本身（`join`、`AvailabilityPickerModal`）

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `activity-decision-view`：新增「決選候選清單只回傳給建立者」「唯讀選擇摘要顯示同時段參與者頭像」「狀態徽章文字依角色分流」三個需求

## Impact

- Affected specs: `activity-decision-view`
- Affected code:
  - Modified: src/components/ActivityDetailModal.vue
  - Modified: src/__tests__/ActivityDetailModal.test.js
