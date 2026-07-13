## 1. 共用 helper：正規化、分母、展開狀態、hover/長按

- [x] 1.1 新增決策項目正規化邏輯，把情境二／三的扁平陣列與情境四每個候選時段的內層資料，統一轉成 `{id, radioId, slot_start, slot_end, count, is_unanimous, supporters}` 形狀；情境二／三的 `radioId === id`，情境四的 `radioId` 是 `${candidateSlotId}::${id}`（design: 統一的決策項目正規化）。用 `ActivityDetailModal.test.js` 新增測試斷言兩種輸入形狀都能正確轉出上述統一形狀與正確的 `radioId`
- [x] 1.2 新增 `votingDenominator` computed（`max(0, activity.participants.length - 1)`）與比例文字 `${count}/${denominator}人`；分母為 0 時只顯示人數，不顯示 `X/0人`（design: 投票分母的推導；spec: Each decision entry displays a support ratio and supporter avatars）。新增測試涵蓋 design.md 範例表的三種情況（count 2/分母 2、count 1/分母 2、分母 0）
- [x] 1.3 新增每個清單獨立的展開狀態（`reactive` 物件，key 為清單識別碼，預設顯示 3 筆），「顯示更多」按鈕每次點擊只多顯示 3 筆、展開到底時按鈕消失、3 筆以下的清單不顯示按鈕（design: 前 3 名＋每次多展開 3 筆；spec: Decision list defaults to showing the top 3 entries with progressive reveal）。新增測試涵蓋 7 筆清單的三個階段（預設 3 筆＋按鈕存在、點擊後 6 筆＋按鈕仍在、再次點擊後 7 筆＋按鈕消失）與 3 筆以下清單無按鈕的情況
- [x] 1.4 新增支持者頭像的 hover（桌面，`mouseenter`/`mouseleave`）／長按（行動裝置，`touchstart` 起算 500ms 未發生 `touchend`/`touchmove` 才顯示）彈出名單，用單一 `openSupportersKey` 記錄目前開啟的是哪一筆（design: 頭像 hover／長按顯示支持者名單；spec: Supporter avatars reveal names on desktop hover and mobile long-press）。用 fake timers 新增測試涵蓋：`mouseenter`/`mouseleave` 顯示/隱藏名單、`touchstart` 後 500ms 內 `touchend` 不顯示、`touchstart` 後滿 500ms 顯示名單

## 2. 情境二（range 模式）決策清單

- [x] 2.1 情境二的決策清單改讀 `activity.decision_candidates`（單一陣列），套用 1.1-1.4 的正規化／比例／頭像／前 3 展開呈現，模板不再渲染「完全重疊」「部分重疊」標題（spec: Decision candidate list renders as a single sorted list without overlap-category headings）。新增測試斷言渲染結果中不存在這兩個標題文字節點
- [x] 2.2 移除 `perfectOverlapCandidates`／`partialOverlapCandidates` 兩個 computed，`handleConfirmFormation` 的 range 模式分支改成在 1.1 的正規化陣列裡用 `radioId` 直接查找對應 segment 後送出 `slotStart`/`slotEnd`（design: confirmFormation 送出邏輯改用單一陣列查找；spec: Confirm-formation submission matches against the unified segment shape）。更新既有的「建立者的決選畫面分別渲染 perfect_overlap／partial_overlap 兩個區塊」「建立者選取 partial_overlap 候選並確認成團」兩則測試（`src/__tests__/ActivityDetailModal.test.js` 第 1454-1494 行）改成斷言新格式與新的查找邏輯

## 3. 情境三（find_date）決策清單

- [x] 3.1 情境三的決策清單套用 1.1-1.4 同一套正規化／比例／頭像／前 3 展開呈現（跟情境二共用同一套渲染邏輯，因為兩者都是扁平陣列）（spec: Decision candidate list renders as a single sorted list without overlap-category headings）。新增測試斷言情境三 `decision_candidates` 每筆的 `supporters` 頭像正確渲染，且比例文字正確

## 4. 情境四（find_date_time）決策清單

- [x] 4.1 `scenarioDCandidateGroups` 的內層改成單一 `segments` 陣列（取代原本的 `perfect`／`partial` 兩個子陣列），外層候選時段分組維持不變，每個候選時段各自獨立套用 1.1-1.4 的呈現（design: 統一的決策項目正規化；spec: Scenario D retains outer candidate-slot grouping with a unified inner segment list）。新增測試斷言兩個候選時段各自有超過 3 筆 `segments` 時，各自獨立顯示「顯示更多」按鈕，展開其中一組不影響另一組目前顯示的筆數
- [x] 4.2 `handleConfirmFormation` 的 `find_date_time` 分支改成在對應候選時段 group 的 `segments` 陣列裡查找 `radioId`（design: confirmFormation 送出邏輯改用單一陣列查找）。更新「兩個候選時段各自有自己的 perfect_overlap/partial_overlap 資料時，決策區塊渲染兩組獨立的巢狀清單」測試（`src/__tests__/ActivityDetailModal.test.js` 第 1122-1218 行）的 mock 資料與斷言，改成新的 `segments` 單一陣列格式

## 5. 自動預選最高票邏輯

- [x] 5.1 `fetchActivity` 的自動預選（`soleLeaderId`）移除排除情境二的條件（新格式下情境二也是扁平陣列，`Array.isArray` 為 `true`，適用跟情境三一致的自動預選行為）（design: 自動預選最高票邏輯的情境二排除条件移除）。新增測試斷言情境二只有一筆票數最高時，`selectedDecisionSlotId` 會自動預選該筆的 `radioId`，票數並列或全部為 0 時不自動預選

## 6. 情境一已報名人數／頭像可見性驗證

- [x] 6.1 新增測試斷言 `schedule_variant: 'fixed'` 的活動載入後，`activity-detail-join` 區塊正確渲染 `已報名 {current_count} / ...` 文字與每個 `activity.participants` 項目的頭像（spec: Fixed-time activities expose participant headcount and avatars to the creator）。若測試通過，確認既有模板不需要修改，把查證結果記錄在 commit/PR 說明裡；若測試意外失敗，修正 `activity-detail-join` 區塊，直到測試通過

## 7. 既有測試格式更新與最終驗證

- [x] 7.1 更新 `src/__tests__/ActivityDetailModal.test.js` 裡所有還在使用舊 `{perfect_overlap, partial_overlap}` 頂層物件格式（情境二 mock，例如第 464、1429-1437 行）與舊巢狀 `perfect_overlap`/`partial_overlap` 子陣列格式（情境四 mock，例如第 731-753、1127-1170 行）的 mock 資料，一併改成新的單一陣列／`segments` 格式，確保 mock 資料本身對齊新的 API 契約，不只是斷言部分改對
- [x] 7.2 執行 `npx vitest run` 跑全套前端測試，確認情境一/二/三/四相關測試沒有因為這次調整而回歸；若有跟這次改動無關的既有失敗，列出檔名不列入回歸判斷
- [x] 7.3 執行 `npx vite build` 確認沒有語法錯誤、建置成功
