## Context

`ActivityDetailModal.vue` 目前用兩個獨立的 computed（`perfectOverlapCandidates`／`partialOverlapCandidates`）讀取情境二 `decision_candidates.perfect_overlap`／`partial_overlap`，用 `scenarioDCandidateGroups` 讀取情境四每個候選時段底下巢狀的 `perfect_overlap`／`partial_overlap`，模板裡各自渲染「完全重疊」「部分重疊」兩個分類標題。BuJoBackend repo 的 `decision-view-ux-redesign` change 已經完成並在本機驗證過：情境二／三改成回傳單一排序陣列（每筆帶 `is_unanimous`／`supporters`），情境四改成「候選時段外層陣列＋內層 `segments` 單一陣列」，不再有 `perfect_overlap`／`partial_overlap` 這兩個鍵名，且相鄰同票數同支持者的切格區段已經在後端合併。前端需要同步改成消費新格式，並落實使用者在腦力激盪階段核准的呈現方式。

情境一（`fixed`，免投票）的已報名人數／頭像顯示區塊（`activity-detail-join`，模板第 123-161 行）程式碼層級檢查後沒有被任何 `requires_voting`／`schedule_variant` 判斷式包住，是所有情境共用的一段，理論上情境一建立者已經看得到。這次會新增一則元件測試鎖定這個既有行為，作為回歸保護；若測試意外失敗才視情況修正。

## Goals / Non-Goals

**Goals:**

- `ActivityDetailModal.vue` 改成消費新的 API 格式：情境二／三是單一排序陣列，情境四是候選時段陣列＋內層 `segments`
- 移除「完全重疊」「部分重疊」分類標題，改成單一依支持度排序的清單，每筆顯示「X/Y 人」比例與支持者頭像
- 頭像 hover（桌面）／長按（行動裝置）顯示支持者姓名清單
- 清單預設顯示前 3 筆，超過 3 筆時提供「顯示更多」按鈕，每次點擊只多展開 3 筆
- 情境四維持候選時段外層分組，只有內層支持度清單套用上述新呈現方式
- 新增元件測試鎖定情境一已報名人數／頭像的既有可見行為

**Non-Goals:**

- 不改後端 API（已經在 BuJoBackend repo 完成並驗證，前端只是消費方）
- 不改情境一的樣板／邏輯，除非新增的測試證實有缺陷
- 不改報名／回報流程本身（`join`、`AvailabilityPickerModal`）——只改決策／投票畫面的呈現
- 不重新設計卡片視覺風格，沿用既有的 `activity-detail-*` CSS class 命名慣例與配色

## Decisions

### 統一的決策項目正規化

新增一個共用的正規化函式／computed，把三種情境的 API 資料轉成同一種 UI 用的 segment 形狀：

```js
{
  id: string,              // 後端回傳的 id（情境二/四內層是 temp- 前綴，情境三/四外層是真實 slot id）
  radioId: string,         // 用於 v-model 綁定；情境二/三直接沿用 id；情境四是 `${candidateSlotId}::${id}`，避免跨候選時段撞號
  slot_start: string,
  slot_end: string,
  count: number,
  is_unanimous: boolean,
  supporters: Array<{ user_id, display_name, avatar_url }>,
}
```

情境二／三：`activity.decision_candidates` 直接 map 成這個形狀（`radioId === id`）。
情境四：`scenarioDCandidateGroups` 保留候選時段外層分組，但內層改成單一 `segments` 陣列（取代原本的 `perfect`／`partial` 兩個子陣列），每個 segment 一樣是上面的統一形狀，`radioId` 組法沿用既有的 `${candidateSlotId}::${segmentId}` 慣例。

### 投票分母的推導

API 只回傳 `is_unanimous`（布林值），沒有直接回傳分母數字，但「X/Y 人」比例文字需要分母。分母 `votingDenominator` 用 `Math.max(0, (activity.participants?.length ?? 0) - 1)` 推導（參與者總數扣掉建立者）。這個推導在三個情境下都跟後端 `is_unanimous` 的分母一致：情境二 `joinActivity` 要求非空 `ranges` 才能成功報名（見 `scenario-b-availability-reporting` spec），情境三／四 `joinActivity` 要求 `candidateSlotIds` 非空，所以每個已報名的非建立者參與者必然都對應到後端分母裡的一個真人投票者，兩邊算出來的分母數字會相等。比例文字：`${count}/${votingDenominator}人`；`votingDenominator === 0` 時（目前沒有其他參與者報名）不顯示比例文字，只顯示人數，避免出現「0/0人」。

### 頭像 hover／長按顯示支持者名單

每個 segment 的支持者頭像列新增一個小型彈出名單，互動方式：
- 桌面：滑鼠 `mouseenter`／`mouseleave` 觸發顯示／隱藏
- 行動裝置：`touchstart` 後啟動 500ms 計時器，時間到才顯示名單；`touchend`／`touchmove` 在計時器觸發前發生則清除計時器、視為一般點擊，不顯示名單（避免跟其他點擊行為，例如選取 radio，互相干擾）

用元件內的一個 `openSupportersKey` ref 記錄目前哪個 segment 的名單是開著的（同一時間只會有一個開著，比照既有 `openChipDate` 的單一展開狀態模式），不需要為每個 segment 各自建立獨立的 ref。

### 前 3 名＋每次多展開 3 筆

每個「清單」（情境二／三各自一個清單；情境四每個候選時段各自一個內層清單）需要各自獨立的展開狀態，因為情境四同時存在多個候選時段。用一個 `reactive({})`（key 是清單自己的識別碼：情境二／三固定用 `'flat'`，情境四用 `candidateSlotId`）記錄每個清單目前展開到第幾筆，預設值 3。「顯示更多」按鈕的 `@click` 把對應 key 的展開數字加 3（不超過清單實際長度），清單長度 ≤ 3 或已展開到底時不顯示按鈕。

### confirmFormation 送出邏輯改用單一陣列查找

`handleConfirmFormation` 的 `isRangeMode` 分支不再用 `[...perfectOverlapCandidates, ...partialOverlapCandidates]` 兩個陣列相加後查找，改成直接在新的單一正規化陣列裡用 `radioId`／`id` 查找。`isScenarioDMode` 分支的查找邏輯（先找 group 再找 segment）不變，只是 group 內層改成單一 `segments` 陣列，`[...group.perfect, ...group.partial]` 改成 `group.segments`。

### 自動預選最高票邏輯的情境二排除条件移除

`fetchActivity` 裡 `soleLeaderId` 的自動預選目前用 `Array.isArray(decisionCandidates) && !isScenarioDMode` 判斷是否適用——這個條件原本是為了排除情境二的 `{perfect_overlap, partial_overlap}` 物件格式（`Array.isArray` 對物件會是 `false`，天然被排除）。新格式下情境二也是扁平陣列，`Array.isArray` 會是 `true`，所以情境二現在也會被自動預選最高票——這跟情境三的既有行為一致（單一候選領先時直接預選，讓建立者少點一次），是這次格式統一後合理的行為延伸，不需要額外排除。情境四維持排除（巢狀結構意義不明確，不自動選）。

## Implementation Contract

**行為**：建立者（與參與者，唯讀）在情境二／三／四的決策畫面看到依支持度排序的單一清單（情境四外層仍依候選時段分組），每筆顯示時間範圍、「X/Y 人」比例、支持者頭像；不再看到「完全重疊」「部分重疊」分類標題。清單預設只顯示前 3 筆，超過 3 筆時顯示「顯示更多」按鈕，每次點擊多顯示 3 筆，不會一次全部展開。頭像 hover（桌面）／長按（行動裝置）顯示支持者姓名清單。情境一建立者一如既往能看到已報名人數與頭像（既有行為，這次新增測試鎖定，不修改實作）。

**介面／資料形狀**：
- 新增一個正規化 computed／函式，把 `activity.decision_candidates`（情境二／三）與 `scenarioDCandidateGroups` 的內層（情境四）都轉成統一的 `{id, radioId, slot_start, slot_end, count, is_unanimous, supporters}` 形狀，取代 `perfectOverlapCandidates`／`partialOverlapCandidates` 兩個 computed
- 新增展開狀態的 `reactive` 物件（key 為清單識別碼，value 為目前展開筆數，預設 3）
- 新增 `openSupportersKey` ref，記錄目前開著的支持者名單彈出框對應哪個 segment

**失敗模式**：`handleConfirmFormation` 在正規化陣列裡找不到對應 `radioId` 時維持現狀（`return`，不送出請求，不新增錯誤訊息分支）；`supporters` 為空陣列時不渲染頭像列，不報錯；`votingDenominator === 0` 時不顯示比例文字（只顯示人數），不顯示「0/0人」或發生除以零的顯示異常。

**驗收標準**：
- `ActivityDetailModal.test.js` 新增／更新測試涵蓋：情境二／三／四正確渲染新的單一陣列／`segments` 格式；「X/Y 人」比例文字正確（含分母為 0 時的特殊處理）；預設只顯示前 3 筆，「顯示更多」每次只多顯示 3 筆，展開到底時按鈕消失；頭像 hover（桌面事件）／長按（行動裝置，用 fake timers 模擬 500ms 閾值）顯示支持者名單，短按不顯示；`handleConfirmFormation` 三個分支（range／find_date／find_date_time）送出正確的 `slotStart`／`slotEnd`（情境四含 `candidateSlotId`）
- 新增一則情境一測試，斷言 `activity-detail-join` 區塊在 `fixed` 情境下正確渲染 `current_count`／`participants` 頭像，作為既有行為的回歸鎖定
- `npx vitest run` 全數通過

**範圍邊界**：只改 `ActivityDetailModal.vue` 內決策清單的渲染與對應的 computed／handler，以及 `ActivityDetailModal.test.js`；不改 `AvailabilityPickerModal.vue`、`EventPage.vue`、`DateEventsModal.vue`；不改後端 API；不改情境一以外任何非決策相關的樣板；不重新設計卡片視覺風格。

## Risks / Trade-offs

- **[Risk]** 分母用 `participants.length - 1` 前端推導，不是後端直接回傳的數字，若後端未來調整 `is_unanimous` 分母的定義卻沒同步回傳明確的分母欄位，前端會跟後端不一致 → **Mitigation**：新增測試明確驗證「當 `count === votingDenominator` 時，該筆的 `is_unanimous` 也必須是 `true`」，用這個交叉驗證及早抓到分母算法跟後端脫節的情況
- **[Risk]** 長按（500ms 閾值）在測試環境用 fake timers 模擬，跟真實觸控裝置的時序可能有落差 → **Mitigation**：測試同時涵蓋「閾值前放開不顯示」「閾值後放開已顯示」兩種情況，涵蓋主要的時序邊界
- **[Risk]** 展開狀態用清單識別碼當 key（情境四用 `candidateSlotId`），如果同一個活動反覆重新整理／切換，key 沒有正確重置會殘留舊活動的展開狀態 → **Mitigation**：比照既有 `candidateChipsExpanded`／`openChipDate` 的作法，在 `resetPanel()`／`fetchActivity()` 開頭重置展開狀態物件

## Migration Plan

前端這次改動要跟 BuJoBackend `decision-view-ux-redesign`（已完成並驗證）同時部署，因為讀取的是新的 API 格式，跟舊格式不相容，不需要向下相容層（專案還在開發階段）。
