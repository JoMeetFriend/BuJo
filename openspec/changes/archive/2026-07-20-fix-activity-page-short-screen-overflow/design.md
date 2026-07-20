## Context

活動索引頁由 `ActivityView.vue` 的三列 grid 組成：頁首、中間詳情舞台、底部活動小卡列。手機版頁面固定為 `100dvh` 並保留底部導覽空間；`ActivityDetailModal.vue` 的詳情卡則自行決定最大高度。兩個元件沒有共享舞台可用高度契約，短螢幕下詳情卡會超出中間列。

## Goals / Non-Goals

**Goals:**

- 讓活動頁舞台明確提供詳情卡可使用的高度上限。
- 讓詳情卡遵守父層高度上限，內容超出時由卡片 body 捲動。
- 在短螢幕進一步降低舞台留白與小卡列間距，維持前後景分層但避免覆蓋。

**Non-Goals:**

- 不修改活動 API、狀態判斷或互動操作。
- 不改動桌面版詳情卡尺寸與底部小卡高度。
- 不讓整個活動頁改成垂直頁面捲動。

## Decisions

### 由活動舞台提供可用高度 CSS 變數

`ActivityView.vue` 在手機 breakpoint 的舞台設定 `--activity-detail-available-height: 100%`，並把詳情卡的 `max-height` 限制為此變數。父層 grid 已知道扣除頁首、底部列、padding 與 gap 後的剩餘高度，因此比在詳情元件內重算 viewport 各區尺寸更可靠。

替代方案是只降低 `clamp()` 的 340px 下限，但固定下限仍無法涵蓋不同頁首換行、safe-area 與裝置高度組合。

### 短螢幕壓縮裝飾性間距

新增同時符合窄寬與短高的 media query，縮小舞台上方 padding、活動小卡列 margin 與頁面 row gap。這些值只負責視覺分層，不承載功能，因此可以在空間不足時縮減。

替代方案是隱藏底部小卡列，但會移除活動切換入口，不符合既有瀏覽行為。

### 卡片 body 維持內部捲動

詳情卡繼續使用 flex column；header/footer 固定，body 使用 `min-height: 0` 與 `overflow-y: auto`。當父層降低卡片最大高度時，內容留在卡片內捲動，不延伸到其他網格列。

## Implementation Contract

- Behavior: 在寬度不超過 900px 的活動頁，詳情卡最大高度 SHALL 受中間舞台實際可用高度約束；當 viewport 高度不超過 700px 時，舞台與小卡列的裝飾性垂直間距 SHALL 壓縮，詳情卡 SHALL NOT 覆蓋活動小卡列。
- Interface: `ActivityView.vue` 透過 scoped descendant 樣式設定活動詳情面板的 `max-height: 100%`；`ActivityDetailModal.vue` 不再以 340px 作為手機最大高度的強制下限。元件 props、事件及 API shape 不變。
- Failure mode: 詳情內容高於可用高度時，`.activity-detail-body` SHALL 垂直捲動；header 與 footer SHALL 保持在卡片內，不得把頁面撐出 `100dvh`。
- Acceptance: ActivityView 與 ActivityDetailModal 的樣式契約測試確認手機高度約束與短螢幕 media query；既有兩個元件測試、lint、format、build 全數通過。
- Scope: 僅修改活動索引頁、活動詳情卡與其測試；不改 API、狀態、文案、桌面版 layout 或底部導覽。

## Risks / Trade-offs

- [Risk] 極矮 viewport 會讓卡片 body 可視內容減少 → 以卡內捲動保留全部內容與操作。
- [Risk] CSS scoped descendant selector 的契約不容易由 jsdom 計算 layout → 以原始 SFC 樣式契約測試鎖定高度來源，並搭配 build 驗證編譯結果。
