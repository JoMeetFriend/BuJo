## Problem

`ActivityDetailModal.vue` 情境三（`isScenarioCMode`，標籤「你報名的日期」，約 188-231 行）跟情境四（`isScenarioDMode`，標籤「已報名的時段」，約 233-276 行）的候選時段摘要區塊，目前的顯示條件是 `activity.has_joined && (activity.status === 'voting' || activity.status === 'confirmed')`。這造成兩個問題：

1. 建立者會誤觸發情境四的區塊，看到「尚未選擇候選時段」這種對他完全沒有意義的文字。
2. 即使排除建立者，`activity.status === 'confirmed'` 時繼續顯示「我當初選了哪個候選」對任何人（含真正的參與者）都已經是過時資訊——活動最終決定的時間已經在卡片上方顯示，不需要保留這個次要資訊。

## Root Cause

- `BuJoBackend` 的 `createActivity`（`activityController.js:174-176`）建立活動時會主動把建立者寫進 `participants` 表（`participants: { create: { user_id: creatorId } }`），這是刻意設計，讓建立者正確算進報名人數與頭像列表（對應前端「人數上限含自己」的提示文字）。這也導致建立者的 `has_joined` 永遠是 `true`，即使他從未透過 `joinActivity` 選過任何候選時段——`joinActivity` 對需要投票的情境強制要求 `candidateSlotIds` 不能是空的，只有建立者這條「活動建立當下自動加入」的路徑繞過這個要求。前端目前把 `has_joined` 當成「這個人選過候選時段」的替代訊號，這個替代關係只對一般參與者成立（因為他們必須經過 `joinActivity` 的選時段檢查），對建立者不成立。
- `activity.status === 'confirmed'` 時繼續顯示候選時段摘要，是既有 spec（`scenario-c-date-picker-join`、`scenario-d-availability-picker-join`）明確要求的行為，不是意外遺留——這次要正式推翻這個決定：已透過 `/spectra-discuss` 討論確認，成團後這個資訊對使用者已經沒有實用價值，維持顯示只是不必要的認知負擔，且情境三本身已經有「候選是空的話整個區塊不渲染」的處理模式（`selectedScenarioCSlots.length` 判斷），情境四當初沒有比照辦理，才會在無選擇時額外跳出「尚未選擇候選時段」的 fallback 文字，兩者本來就該有一致行為。

## Proposed Solution

把情境三、情境四兩個區塊的 v-if 條件，從：

```
isScenarioXMode && activity.has_joined && (activity.status === 'voting' || activity.status === 'confirmed')
```

改成：

```
isScenarioXMode && activity.has_joined && !activity.is_creator && activity.status === 'voting'
```

- 拿掉 `activity.status === 'confirmed'` 這個分支，兩個情境成團後都不再顯示候選時段摘要，只在決策緩衝期（`voting`）顯示
- 新增 `!activity.is_creator`，排除建立者——不論活動狀態為何，建立者永遠不會透過選候選時段的流程加入自己的活動，這個區塊對他永不適用
- `activity.is_creator`、`activity.has_joined` 兩個欄位後端 `getActivity` 早就回傳，純前端條件式調整，不需要新增或修改任何後端邏輯、不動資料庫

## Non-Goals

- 不修改建立者被計入 `participants`／報名人數／頭像列表的既有設計——那是刻意的（對應「人數上限含自己」），維持不動
- 不處理 `decisionCandidates` 在 `activity.status === 'confirmed'` 時於後端 `getActivity` 永遠是 `null`、導致 `candidate_slots[].co_participants` 空陣列的問題——已討論確認不需要修，且這次改動後 `confirmed` 狀態下整個候選時段摘要區塊都不再渲染，不會走到那段程式碼路徑，該問題連帶不再有影響面
- 不新增或修改任何 `BuJoBackend` 程式碼

## Success Criteria

- 情境三、情境四活動成團（`confirmed`）後，任何使用者（含建立者、含真正的參與者）都不再看到候選時段摘要區塊
- 情境四活動在 `voting` 狀態下，建立者看自己的活動不會看到「已報名的時段」／「尚未選擇候選時段」文字
- 情境三、情境四活動在 `voting` 狀態下，真正的參與者（`has_joined = true` 且 `is_creator = false`）仍然正常看到自己選過的候選時段摘要，行為與現在一致

## Impact

- Affected specs: `scenario-c-date-picker-join`（修改「Scenario C joined state shows selected dates」）、`scenario-d-availability-picker-join`（修改「Scenario D exposes dedicated pre-join and post-join summary text」）
- Affected code:
  - Modified: src/components/ActivityDetailModal.vue
