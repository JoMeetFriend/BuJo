## Context

`AlertsPage` 目前直接在每個通知 `li` 上處理 click、Enter 與 Space 以標記已讀，好友邀請內另有接受／拒絕按鈕。通知資料由 `GET /api/notifications` 載入，單筆已讀使用 `PATCH /api/notifications/:id/read`。新互動必須在同一列中協調拖曳、頁面垂直捲動、點擊已讀與內嵌按鈕，且前端不能自行永久記住 dismissal；持久化由 sibling BuJoBackend 負責。

## Goals / Non-Goals

**Goals:**

- 提供明顯且不易誤觸的左滑移除互動，支援 touch、pen 與 mouse。
- 只有達到長距離門檻才送出 dismissal，失敗時回復原列與未讀狀態。
- 保持既有通知已讀、全部已讀與好友邀請操作契約。
- 對 reduced-motion 與輔助科技提供可理解的狀態與名稱。

**Non-Goals:**

- 不在前端 localStorage 或 sessionStorage 保存已滑除 ID。
- 不實作復原、垃圾桶頁、批次滑除或真正刪除通知資料列。
- 不在本 repo 修改 BuJoBackend 的 Prisma schema、migration、route、controller 或 service。
- 不允許仍有 `accept`／`reject` actions 的待處理好友邀請被滑除。

## Decisions

### Pointer Events 與軸向鎖定

每列使用 Pointer Events 統一 touch、pen 與 mouse。pointerdown 記錄起點並 capture pointer；移動至少 10px 且水平位移絕對值大於垂直位移 1.25 倍後才鎖定為水平拖曳。若先判定為垂直手勢，該次互動不再啟動滑除，讓瀏覽器維持正常頁面捲動。只接受向左位移，向右位移固定為 0。

替代方案是同時註冊 touch 與 mouse handlers；這會重複狀態與測試路徑，因此不採用。

### 距離驅動亮紅圓環與提交門檻

內容層的 translateX 跟隨指標並限制在列寬範圍。將左滑距離除以列寬 65% 得到視覺進度並 clamp 在 0–1：進度 0 時垃圾桶背景完全透明，進度增加時以亮紅色 `rgb(239 68 68)` 的 alpha 連續加深。垃圾桶外圍使用 SVG 圓形 pathLength 100，stroke-dashoffset 從 100 線性減至 0，使進度弧由空白逐漸閉合成一圈。位移達列寬 65% 時背景完整亮紅且圓環閉合；放手時也只有進度達 1 才提交 dismissal，因此顏色、圓環終點與刪除門檻是同一狀態。速度不會略過門檻；未達門檻則位移、顏色與圓環一起回到起點。

替代方案是讓垃圾桶在短距離內直接顯示固定紅色，或只用顏色不顯示進度環；這會降低使用者對刪除距離的判斷，因此不採用。依滑動速度觸發或使用較短固定像素門檻也不採用，避免快速捲動誤觸。

### 單列拖曳狀態與事件隔離

頁面同時間只允許一列處於拖曳或 dismissal busy 狀態。拖曳成立後抑制該次 click-to-read；從接受／拒絕按鈕開始的 pointerdown 不啟動滑動。`actions` 含 `accept` 或 `reject` 的通知完全不註冊可用滑除狀態，處理好友邀請並重新 fetch 後，只有 actions 已清空的列才可滑除。

替代方案是待處理邀請也能滑除；這會讓尚未回應的邀請失去主要入口，違反已確認的產品邊界。

### 樂觀滑出與失敗復原

達門檻後保留原陣列索引與原 `isRead`，鎖定該列，播放 translateX 至負列寬及高度／間距收合，同時呼叫 dismiss endpoint。成功後才從 `notifications` 陣列移除。失敗時取消收合、回到 translateX 0、保留原陣列順序與 `isRead`，並使用既有錯誤區顯示「無法移除通知」。這讓動畫即時，但不會在後端失敗時造成前後端狀態分歧。

替代方案是等待 API 成功才播放動畫；網路延遲會使手勢顯得沒有反應，因此不採用。

### Soft-dismiss API 契約

前端呼叫 `PATCH /api/notifications/:id/dismiss`，不傳 request body，沿用 cookie credentials。成功接受 HTTP 200 與 `{ message: "已移除通知" }`。後端必須以已認證 user ID 限制通知所有權，同一次將 `is_read` 設為 true 並寫入 nullable `dismissed_at`；`GET /api/notifications` 必須排除 `dismissed_at` 非 null 的資料。不存在或不屬於使用者回 404，其他失敗回 500。後端仍保留資料列。

替代方案是重用 read endpoint 搭配前端儲存 dismissed IDs；這無法跨裝置一致，也無法讓後端成為唯一資料來源，因此不採用。

### Reduced motion 與垃圾桶語意

透明至亮紅背景、垃圾桶與其進度圓環位於內容層後方；垃圾桶具有「移除通知」的可存取名稱但不是第二個點擊刪除入口，圓環 SVG 對輔助科技隱藏，避免改變長滑確認規則。一般模式使用位移、即時顏色與圓環進度、收合 transition；`prefers-reduced-motion: reduce` 時取消平滑位移並把收合時間縮為接近即時，但距離驅動的顏色、圓環與 65% 門檻保持不變。

## Implementation Contract

- 使用者向左拖曳一般通知時，內容跟隨手勢並露出垃圾桶；背景 alpha 等於左滑距離除以列寬 65% 後 clamp 至 0–1，從完全透明連續加深至 `rgb(239 68 68)`，垃圾桶 SVG 圓環的 dashoffset 同步從 100 降至 0。
- 背景只有在位移達列寬 65% 時成為完整亮紅且圓環閉合；放手位移小於 65% 時列、背景與圓環一起回到原位，不呼叫 API，等於或大於 65% 時每次手勢只呼叫一次 `PATCH /api/notifications/:id/dismiss`。
- 垂直手勢、向右手勢、內嵌按鈕手勢與待處理好友邀請不會啟動 dismissal。
- 成功後該列從渲染陣列移除，`summaryText` 與 `hasUnread` 由剩餘通知重新計算；不另存 dismissed ID。
- 失敗後同一通知以原順序與原 `isRead` 回復，錯誤區顯示「無法移除通知」。404 與 500 都走相同前端復原流程。
- 現有 click／Enter／Space 單筆已讀、全部已讀、接受與拒絕功能保持可用。
- 驗收以 `src/__tests__/AlertsPage.test.js` 覆蓋門檻、軸向鎖定、事件隔離、邀請限制、成功移除與失敗復原；再執行 `npm run test:run`、`npm run lint`、`npm run format` 與 `npm run build`。
- 本 change 的實作範圍只包含 BuJo 前端。BuJoBackend endpoint 與 migration 必須由後端 change 另行交付；在 endpoint 尚未部署時，前端必須呈現失敗復原，不得維持假性隱藏。

## Risks / Trade-offs

- [Risk] 不同寬度通知列使 65% 實際距離差異大 → 使用同一比例同時驅動顏色、圓環與提交門檻，讓每種寬度都有一致的進度語意，並以 component tests 固定 0%、32.5% 與 65% 邊界。
- [Risk] Pointer Events 與 click 同時觸發會誤標已讀 → 水平拖曳成立後設置一次性 click suppression，pointer cancel／up 後完整清理。
- [Risk] 動畫完成與 API response 先後順序不同造成殘留狀態 → dismissal 狀態同時等待動畫與 request，成功才移除，失敗永遠走復原清理。
- [Risk] 前端先部署但後端 endpoint 未部署 → 404／網路失敗均復原通知；發布時先部署後端契約再發布前端。
