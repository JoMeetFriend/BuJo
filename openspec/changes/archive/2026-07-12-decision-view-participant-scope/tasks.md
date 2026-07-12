## 1. 候選項目文字換行改成乾淨版式

- [x] 1.1 `.activity-detail-option` 改成 `flex-wrap: wrap`，`.activity-detail-option-time` 加 `flex: 1 1 auto; min-width: 0`，`.activity-detail-option-right` 加 `margin-left: auto`，讓時間文字太長時整個右側（頭像+比例）乾淨掉到下一行、不擠壓變形（design: 候選項目文字換行改成乾淨版式）。純樣式調整，不新增自動化測試（jsdom 不做實際版面計算，computed style 斷言無法驗證真實換行效果）；改成手動在瀏覽器對三個情境各自的長時間文字候選項目做視覺驗證，並確認 `npx vitest run` 既有測試無回歸

## 2. 狀態徽章文案依角色分流

- [x] 2.1 修改 `statusText` computed：`recruiting`／`voting` 狀態下，非建立者且已報名時回傳「已報名」；`confirmed`／`cancelled` 維持原文字不分角色（design: 狀態徽章文案依角色分流；spec: Status badge text reflects registration status for joined non-creator viewers during in-progress phases）。新增測試涵蓋四種組合：`recruiting`+建立者看到「揪團中」、`recruiting`+已報名非建立者看到「已報名」、`voting`+建立者看到「建立者決選中」、`voting`+已報名非建立者看到「已報名」；並確認 `confirmed`／`cancelled` 不分角色都是原本的文字

## 3. 決選候選清單只渲染給建立者

- [x] 3.1 決選候選清單所在的 `.activity-detail-options` 區塊，`v-if` 新增 `activity.is_creator` 條件（design: 決選候選清單只渲染給建立者；spec: Decision candidate list is rendered only for the activity creator）。新增測試斷言非建立者在 `voting` 狀態下看不到決選候選清單（`.activity-detail-option` 系列元素不存在於該區塊、`decisionSectionLabel` 文字不出現）；建立者不受影響

## 4. 三個唯讀區塊新增 co_participants 頭像列

- [x] 4.1 情境二「你已回報的時間」：新增 `myRangesEntries` computed（直接暴露 `activity.my_ranges`），template 改成走訪這個 computed，每筆同時顯示時間文字與 `co_participants` 頭像列（預設顯示，hover(桌面)/長按(手機) 顯示姓名，複用既有 `openSupportersKey` 機制，key 用該筆 range 的 `start`）（design: 三個唯讀區塊新增 co_participants 頭像列；spec: Read-only selection summaries display co-participant avatars with hover and long-press name reveal）。新增測試斷言頭像預設可見、hover 顯示姓名、`co_participants` 為空陣列時不渲染頭像也不報錯
- [x] 4.2 情境三「你已選擇的日期」：新增 `selectedScenarioCSlots` computed（`activity.candidate_slots` 篩 `is_selected`），template 兩處（recruiting 已報名、voting/confirmed 已報名）都改成走訪這個 computed，每筆同時顯示日期文字與 `co_participants` 頭像列（design: 三個唯讀區塊新增 co_participants 頭像列）。新增測試斷言同上（頭像預設可見、hover 顯示姓名、空陣列不渲染）
- [x] 4.3 情境四「你已選擇的候選時段」：新增 `selectedScenarioDSlots` computed（`activity.candidate_slots` 篩 `is_selected`），template 兩處都改成走訪這個 computed，每筆同時顯示時段文字（`slotText(slot, slot.my_range)`）與 `co_participants` 頭像列（design: 三個唯讀區塊新增 co_participants 頭像列）。新增測試斷言同上

## 5. 收尾：既有測試更新與驗證

- [x] 5.1 更新 `ActivityDetailModal.test.js` 裡所有假設非建立者也能看到完整 `decision_candidates` 的既有測試，改成非建立者的 mock `decision_candidates` 為 `null`；更新所有 `my_ranges`／`candidate_slots` 相關 mock 資料補上 `co_participants: []`（沒有涉及重疊情境的既有測試維持空陣列即可），確保 mock 資料對齊新的後端契約
- [x] 5.2 執行 `npx vitest run` 確認全數通過、無回歸
- [x] 5.3 執行 `npx vite build` 確認無語法錯誤
