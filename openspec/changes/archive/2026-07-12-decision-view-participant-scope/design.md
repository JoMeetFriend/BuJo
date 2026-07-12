## Context

`ActivityDetailModal.vue` 的 `.activity-detail-option`（決選候選項目列）目前是單行 flex（`justify-content: space-between`），左邊 `.activity-detail-option-time`（radio+時間文字）跟右邊 `.activity-detail-option-right`（頭像+比例）沒有 `flex-wrap`，時間文字一長就把整列擠壞。

`statusText` computed 純粹依 `activity.status` 決定文字（`recruiting: '揪團中'`、`voting: '建立者決選中'`），完全不看瀏覽者的角色/是否已報名。`focusCardClass`（活動列表頁的卡片背景色）已經有「已報名非建立者」跟「陌生人」視覺上區分的先例（`activity-focus-card--joined` vs `--recruiting`），這次要把同樣的角色分流原則延伸到狀態徽章文字上。

後端 `decision-view-participant-scope` 已經完成：`decision_candidates` 現在只有 `is_creator: true` 的回應才有值，非建立者一律是 `null`；情境二的 `my_ranges[]`、情境三/四的 `candidate_slots[]`（已選的項目）各自新增 `co_participants: [{user_id, display_name, avatar_url}]`——跟自己時間有實際重疊的其他真人參與者。

決選候選清單目前渲染在 `activity.requires_voting && ((recruiting && is_creator) || voting)` 這個條件下，橫跨建立者跟非建立者兩種視角。既有的三個唯讀區塊（「你已回報的時間」「你已選擇的日期」「你已選擇的候選時段」）已經各自在 recruiting-已報名 跟 voting/confirmed-已報名 兩處渲染，讀 `my_ranges`／`selectedScenarioCDateLabels`／`selectedScenarioDSlotLabels`。

## Goals / Non-Goals

**Goals:**

- 候選項目文字換行改成乾淨的兩行版式，三個情境（B/C/D）統一
- 狀態徽章文字依角色分流：`recruiting`／`voting` 狀態下，已報名的非建立者顯示「已報名」
- 決選候選清單只渲染給建立者
- 三個既有唯讀區塊新增 `co_participants` 頭像列，預設顯示，hover(桌面)/長按(手機) 顯示姓名（複用既有 `openSupportersKey` 機制）

**Non-Goals:**

- 不改建立者視角看到的決選清單呈現方式（比例、頭像、前 3 名展開）
- 不改報名／回報流程（`join`、`AvailabilityPickerModal`）
- 不改後端 API

## Decisions

### 候選項目文字換行改成乾淨版式

`.activity-detail-option` 改成 `flex-wrap: wrap`，`.activity-detail-option-time` 給 `flex: 1 1 auto; min-width: 0`（允許文字在自己欄位內正常換行），`.activity-detail-option-right` 維持 `margin-left: auto`（空間夠時貼右，換行後自己成一行）。三個情境共用同一份 class，改一次生效。

### 狀態徽章文案依角色分流

`statusText` computed 改成：`recruiting`／`voting` 兩個狀態，非建立者且已報名時統一回傳「已報名」；`confirmed`／`cancelled` 不分角色維持原文字（活動結果對所有人一樣重要，不該被過程性文字蓋掉）。`statusBadgeClass`（徽章背景色）不變，繼續依 `activity.status` 本身決定顏色，只有文字依角色分流。

### 決選候選清單只渲染給建立者

決選候選清單所在的 `.activity-detail-options` 區塊（`v-if="activity.requires_voting && ((recruiting && is_creator) || voting)"`）改成額外加上 `activity.is_creator` 條件——非建立者完全不會渲染這個區塊（不只是不顯示 radio，整個排名清單都不渲染）。`soleLeaderId` 自動預選邏輯不用額外修改：非建立者現在拿到的 `decision_candidates` 是 `null`，`Array.isArray(null)` 為 `false`，既有判斷式自然跳過。

### 三個唯讀區塊新增 co_participants 頭像列

情境二「你已回報的時間」、情境三「你已選擇的日期」、情境四「你已選擇的候選時段」——這三個區塊目前只渲染純文字 `<span>{{ label }}</span>`。這次每一筆改成同時渲染一個頭像列，讀後端新回傳的 `co_participants`：

- 情境二：`myRangesSummaryLabels` 目前是從 `activity.my_ranges` 算出的文字陣列，改成直接在 template 裡走訪 `activity.my_ranges`（而不是先轉成純文字陣列），每筆同時顯示文字跟 `co_participants` 頭像
- 情境三／四：`selectedScenarioCDateLabels`／`selectedScenarioDSlotLabels` 同理，改成直接走訪 `activity.candidate_slots.filter(s => s.is_selected)`，每筆同時顯示文字跟 `co_participants` 頭像

頭像預設直接顯示（不用 hover 才看得到頭像本身），沿用既有 `activity-detail-avatar` 樣式；頭像的 hover(桌面)/長按(手機) 顯示支持者姓名，複用已經存在的 `openSupportersKey`／`handleAvatarTouchStart`／`handleAvatarTouchEnd` 機制，key 用該筆項目自己的識別碼（情境二用 range 的 `start` ISO 字串、情境三/四用 candidate slot 的 `id`），確保跨項目不撞號。

## Implementation Contract

**行為**：非建立者在決選候選清單完全看不到（不再渲染），改成在自己已回報/已選的每一筆項目旁邊，看到跟自己時間重疊的其他真人參與者頭像（預設顯示），hover/長按頭像看得到姓名。建立者的決選清單呈現方式不變。狀態徽章文字：已報名非建立者在 `recruiting`／`voting` 狀態看到「已報名」；建立者跟未報名者維持原文字；`confirmed`／`cancelled` 不分角色維持原文字。候選項目文字太長時，頭像＋比例整齊掉到下一行，不再擠壓變形。

**介面／資料形狀**：`statusText` computed 新增角色分流邏輯；決選清單區塊 `v-if` 新增 `activity.is_creator` 條件；三個唯讀區塊改成直接走訪帶 `co_participants` 的原始資料（`activity.my_ranges`／`activity.candidate_slots`），不再只是純文字標籤陣列。

**失敗模式**：這次不新增任何新的錯誤處理分支，純粹是既有渲染邏輯的調整。`co_participants` 為空陣列時不渲染頭像列，不報錯。

**驗收標準**：
- 新增測試斷言候選項目文字很長時，`.activity-detail-option` 允許 wrap（用 class/style 驗證，不依賴實際渲染寬度）
- 新增測試斷言 `recruiting`／`voting` 狀態下，建立者跟已報名非建立者看到的 `statusText` 不同；`confirmed`／`cancelled` 不分角色相同
- 新增測試斷言非建立者在 `voting` 狀態看不到決選候選清單（`.activity-detail-option` 系列元素不存在於該區塊）；建立者不受影響
- 新增測試斷言三個唯讀區塊正確渲染 `co_participants` 頭像，且 hover/長按顯示姓名
- 更新既有測試裡假設非建立者也能看到完整 `decision_candidates`／舊版 `my_ranges`（無 `co_participants`）格式的 mock 資料
- `npx vitest run` 全數通過，`npx vite build` 無語法錯誤

**範圍邊界**：只改 `ActivityDetailModal.vue` 的樣式、`statusText`、決選清單可見性條件、三個唯讀區塊的渲染邏輯；不改 `AvailabilityPickerModal.vue`、`EventPage.vue`；不改後端。

## Risks / Trade-offs

- **[Risk]** 三個唯讀區塊從「純文字陣列」改成「直接走訪原始資料」，如果沒有同步更新所有既有測試的 mock 資料格式（例如 `my_ranges` 需要 `co_participants` 欄位），既有測試會因為缺欄位而非預期失敗 → **Mitigation**：逐一檢查並更新 `ActivityDetailModal.test.js` 裡所有相關 mock
- **[Risk]** 決選清單改成建立者專屬後，`handleConfirmFormation`／`selectedDecisionSlotId` 等狀態在非建立者視角下理論上不會被觸發，但如果測試沒涵蓋到，可能有殘留的死程式碼路徑不會被發現 → **Mitigation**：新增的「非建立者看不到決選清單」測試同時確認 footer 的「已報名」相關按鈕不受影響

## Migration Plan

跟 BuJoBackend `decision-view-participant-scope`（已完成並驗證）同時部署，因為決選清單可見性跟 `co_participants` 都依賴新的後端回應格式。
