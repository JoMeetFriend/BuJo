## Context

`AlertsPage.vue` 已用 `notification.isRead` 呈現未讀綠點，並以 `canDismiss(notification)` 阻擋仍含 `accept`／`reject` action 或正在處理好友操作的通知。左滑刪除目前統一走 `PATCH /api/notifications/:id/dismiss`、成功後收合移除、失敗時復位並顯示「無法移除通知」。滑鼠使用者缺少可發現的刪除入口，而且現有 pointer gesture 未依輸入方式分流，使滑鼠拖曳也會位移通知列。使用者提供的視覺參考定義了 32×32px 方角 X、180ms 淡入上移與灰轉紅 hover 狀態。第一次實際畫面驗收顯示，X 圖示在按鈕內部已置中，但整個按鈕被通知列的 `align-items: flex-start` 對齊到頂部，需要額外定義 row-axis 垂直置中。

## Goals / Non-Goals

**Goals:**

- 為具備 fine pointer 與 hover 能力的環境中，已讀且可移除的通知提供 hover／keyboard-focus X。
- 未讀綠點與待處理好友邀請的優先級高於刪除入口。
- X 與左滑共用 eligibility、soft-dismiss API、收合及錯誤復原語意。
- 套用參考 X 的尺寸、顏色與動畫，但維持 BuJo Modern Paper 方角通知列。
- 讓 X 按鈕整體在不同通知列高度中都相對 row cross-axis 垂直置中。
- 依每次 pointer event 的 `pointerType` 分流：touch 保留完整左滑，其他輸入只保留拖曳 click guard。
- 區分 X 與 touch swipe 的 dismissal 視覺：X 只垂直收合，touch swipe 保留水平移出與紅色進度 affordance。

**Non-Goals:**

- 不修改後端、通知資料 shape、router、unread store 或資料庫。
- 不更動未讀綠點、左滑 65% threshold、紅色背景與圓環進度。
- 不以 viewport breakpoint 判斷滑鼠、觸控或混合輸入裝置。
- 不加入圓角卡片、整列浮起陰影或可點擊未讀綠點。
- 不以 CSS 另行隱藏 X dismissal 的紅底、圓環或垃圾桶，也不改 220ms 等待、65% threshold 或 API/store contract。

## Decisions

### 以 read state 與既有 canDismiss 決定 X 資格

X 的 render eligibility 為 `notification.isRead && canDismiss(notification)`。這直接重用好友 action 與 busy state 保護，避免 hover 與 swipe 產生兩套規則。未讀通知無論 hover 與否都只保留現有綠點；好友邀請在 action 消失前，即使已讀也沒有 X。

### 用 CSS hover 與 focus-visible 控制顯示而不建立 hoveredId state

符合資格的按鈕保持在 desktop row layout 中，以 32×32px 固定空間避免 hover 時文字跳動；平常以 opacity 0、向下位移 10px 且不可點擊，row hover、row focus-within 或按鈕 focus-visible 時轉為可見並可互動。這比在 mouseenter／mouseleave 建立 Vue hoveredId state 更簡單，也讓 keyboard focus 與滑鼠共享視覺狀態。

### 保留參考 X 微互動但不搬入圓角卡片樣式

X 使用 8px 方角、預設 `#98968a`、180ms opacity／translate transition；按鈕自身 hover 使用 200ms 轉為 `rgba(196, 64, 52, 0.12)` 背景及 `#c44034` 圖示。通知列本身維持現有方角 paper surface，不加入參考的 14px 圓角、上浮或陰影。reduced-motion 下 X 位移動畫停用或縮短至 1ms。

### 以獨立按鈕隔離通知啟用與 pointer gesture

X 使用語意化 `button type="button"`、`aria-label="移除通知"`，並阻止 click 與 pointerdown 冒泡。handler 執行時再次檢查 read state 與 `canDismiss`，避免非同步狀態改變造成競態；通過後準備既有 swipe state 所需列寬並呼叫共用 dismissal flow，因此不觸發 mark-as-read、activity deep-link 或 swipe click guard。

### 依 input capabilities 顯示 X 並讓 touch-only 維持 swipe-only

X 的 hover/focus affordance 只在 `(hover: hover) and (pointer: fine)` media query 中顯示與預留 32×32px slot；touch-only 環境不佔 layout、不進入 tab order，仍只使用既有 swipe gesture。具備 fine pointer 的 keyboard 使用者可 tab 到 X，focus-visible 時即使滑鼠未 hover 也看得到。這避免橫向平板或縮小的桌機視窗因寬度被錯誤分類。

### 依 pointerType 分流 swipe 與非 touch 拖曳保護

`startSwipe` 以每次 pointer event 的 `pointerType` 決定 gesture mode，只有明確的 `touch` 啟用 offset、progress、65% threshold、soft-dismiss 與 rollback；`mouse`、`pen` 或空字串只追蹤起點、pointer id 與 axis lock。非 touch 輸入達到既有 `10px` lock distance 且 `abs(deltaX) > abs(deltaY) * 1.25` 時設定一次性 click guard，但 offset 保持 0，pointerup 絕不呼叫 dismissal。guard 由該次合成 pointer click 消耗；若瀏覽器未合成 click，下一次正常 pointerdown 先清除過期 guard，讓後續 click 恢復既有 mark-as-read 與導頁。

### 讓 X 控制相對通知列垂直置中

`.alerts-item` 為了讓圖示與文字從頂部對齊而使用 `align-items: flex-start`，因此 X 按鈕必須在自身 flex item 上覆寫 cross-axis 對齊為置中，而不是只依靠按鈕內部的 `align-items` 與 `justify-content`。使用 `align-self: center` 可在不改動整列對齊與其他元素的情況下，讓 32×32px 按鈕依通知列實際高度置中。

### 以明確 dismissal visual mode 分開 X 收合與 touch swipe

共用 `dismissNotification(notification, state, visualMode)` 接受 `swipe` 或 `collapse`。touch 達到 65% threshold 時傳入 `swipe`，開始 dismissal 後將 `offset` 設為 `-width`，使既有 progress、紅底、圓環與垃圾桶達到完整狀態；X 傳入 `collapse`，開始 dismissal 時將 `offset` 維持 0，只設定 `dismissing`／`collapsing` 並執行既有高度收合。這保留 exactly-once guard、dismiss API、220ms 等待、成功移除、unread summary 更新與失敗 rollback 的單一路徑，同時讓 progress 由 offset 自然保持 0，不新增 CSS 例外規則。

## Implementation Contract

- Behavior: 未讀通知 SHALL 顯示既有閃爍綠點且 SHALL NOT 顯示 hover X；已讀通知只有在 `canDismiss(notification)` 為 true 時 SHALL 具備 X。
- Behavior: 仍含 `accept` 或 `reject` action、或好友操作 busy 的通知 MUST NOT 顯示 X，並 MUST 維持既有 swipe dismissal 禁止；action 處理完成且刷新後才重新依 read state 取得資格。
- Behavior: fine-hover eligible row hover 或 X keyboard focus SHALL 顯示 X；離開 hover/focus SHALL 隱藏 X且不得造成內容 layout shift。touch-only 環境 SHALL NOT 顯示、預留或 focus X，且 viewport 寬度 SHALL NOT 參與分類。
- Visual: X hit area SHALL 為 32×32px、8px 方角、預設 `#98968a`，且整個按鈕 SHALL 相對通知列 cross-axis 垂直置中；以 180ms 從 opacity 0／translateY(10px) 轉為可見；X hover SHALL 以 200ms 轉為 `rgba(196, 64, 52, 0.12)` 背景與 `#c44034` 圖示。reduced-motion SHALL 移除可見位移或縮短到 1ms。
- Interaction: X SHALL 是 `type="button"` 並具 `aria-label="移除通知"`；click 與 pointerdown SHALL 不冒泡至 notification row。啟用 X SHALL NOT 呼叫 read API或 router navigation。
- Gesture: `pointerType === 'touch'` SHALL 保留既有 10px／1.25 axis lock、位移、進度、65% threshold、soft-dismiss、rollback 與 unread summary 更新。`mouse`、`pen` 或未提供 pointer type SHALL 保持 `translateX(0px)`、零進度且 SHALL NOT 呼叫 dismiss API。
- Gesture guard: 非 touch 橫向拖曳達到 lock 條件後，放開產生的第一個 pointer click SHALL 被消耗且 SHALL NOT 標記已讀或導頁；guard 消耗後的普通 click SHALL 正常運作。若未產生合成 click，下一次 pointerdown SHALL 清除過期 guard。
- Dismissal: X SHALL 呼叫既有 `PATCH /api/notifications/:id/dismiss` exactly once；成功 SHALL 使用既有收合移除與 unread summary 更新，失敗 SHALL 保留通知並顯示「無法移除通知」。
- Dismissal visual mode: X SHALL 使用 `collapse` mode，在 220ms pending 階段維持 `translateX(0px)`、`--dismiss-progress: 0` 與 progress ring `stroke-dashoffset: 100`，同時 shell SHALL 進入垂直收合；touch 65% dismissal SHALL 使用 `swipe` mode，水平移至 `-width` 並維持既有 100% 紅底、圓環與垃圾桶視覺。
- Scope: 僅修改 `src/components/AlertsPage.vue`、`src/__tests__/AlertsPage.test.js` 與本 change artifacts；不修改 stores、router、其他元件或後端。
- Acceptance: `src/__tests__/AlertsPage.test.js` SHALL 覆蓋 fine-hover/touch-only state matrix、keyboard focus、event isolation、X pending 期間零水平位移／零進度／垂直收合、exactly-once API、failure restore、mouse/pen/empty pointer drag guard，以及 touch 65% 的完整水平移出／100% 進度／unread summary 與既有 friend/deep-link regression；完成 targeted test、full test、lint、format、build、`git diff --check`、scope review、Spectra analyze 與 validation。

## Risks / Trade-offs

- [Risk] hover 顯示時新增按鈕造成文字寬度跳動 → desktop eligible row 預留固定 32×32px slot，只轉 opacity／transform。
- [Risk] X click 同時導頁或啟動 swipe → click.stop、pointerdown.stop，並以測試驗證 read API 與 router 均未觸發。
- [Risk] hover 與 swipe eligibility 漂移 → 兩者共用 `canDismiss(notification)` 且 handler 再檢查。
- [Risk] animation 對 reduced-motion 使用者造成干擾 → reduced-motion 規則停用位移並縮短 transition。
- [Risk] 按鈕內部圖示置中被誤當成整個控制置中 → 在 `.alerts-hover-dismiss` flex item 明確設定 row cross-axis 對齊，並以 source assertion 與畫面驗收驗證。
- [Risk] 混合輸入裝置被 viewport 寬度錯分 → CSS 以 hover/pointer capabilities 決定 X，gesture 逐次讀取 pointer event 的實際 `pointerType`。
- [Risk] 滑鼠拖曳放開後瀏覽器合成 click 導致誤讀或誤導頁 → 沿用 axis lock 建立一次性 guard，並在下一次 pointerdown 清除未被消耗的過期 guard。
- [Risk] 共用 dismissal flow 讓 X 誤套 swipe 終點視覺 → 由呼叫端傳入明確 `collapse`／`swipe` mode，progress 繼續只由 offset 推導，並以 pending 中間狀態測試鎖定。
