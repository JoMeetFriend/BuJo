## 1. 修改 ActivityDetailModal.vue 的候選時段摘要顯示條件

- [x] 1.1 把情境三「你報名的日期」區塊（`isScenarioCMode`）的 v-if 條件從 `isScenarioCMode && activity.has_joined && selectedScenarioCSlots.length && (activity.status === 'voting' || activity.status === 'confirmed')` 改成 `isScenarioCMode && activity.has_joined && !activity.is_creator && selectedScenarioCSlots.length && activity.status === 'voting'`，實現「Scenario C joined state shows selected dates」修改後的規格（成團後不顯示、建立者不顯示）；以 `src/__tests__/ActivityDetailModal.test.js` 驗證：`voting` 狀態下非建立者的已加入參與者仍正常看到日期摘要、`confirmed` 狀態下任何人都看不到、建立者在 `voting` 狀態下看不到。
- [x] 1.2 把情境四「已報名的時段」區塊（`isScenarioDMode`）的 v-if 條件從 `isScenarioDMode && activity.has_joined && (activity.status === 'voting' || activity.status === 'confirmed')` 改成 `isScenarioDMode && activity.has_joined && !activity.is_creator && activity.status === 'voting'`，實現「Scenario D exposes dedicated pre-join and post-join summary text」修改後的規格（成團後不顯示、建立者不顯示）；以 `src/__tests__/ActivityDetailModal.test.js` 驗證：`voting` 狀態下非建立者的已加入參與者仍正常看到候選時段摘要、`confirmed` 狀態下任何人都看不到、建立者在 `voting` 狀態下看不到（不會顯示「尚未選擇候選時段」）。

## 2. 整體驗證

- [x] 2.1 執行 `npx vitest run` 確認全數通過（含 1.1、1.2 新增/更新的測試），執行 `npx vite build` 確認無錯誤，執行 `npx eslint` 確認除既有無關 warning 外無新增問題。
