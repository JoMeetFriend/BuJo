## 1. 桌機 hover X 實作

- [x] 1.1 在 `src/components/AlertsPage.vue` 落實「以 read state 與既有 canDismiss 決定 X 資格」、「用 CSS hover 與 focus-visible 控制顯示而不建立 hoveredId state」及「桌機顯示 X 並讓手機維持 swipe-only」：Desktop read notifications reveal a hover dismiss control，未讀維持綠點、pending/busy friendship 無 X、desktop eligible row 預留無 layout shift 的 32×32px slot、mobile 無 X；以 `src/__tests__/AlertsPage.test.js` 的 spec state matrix 六列與 desktop/mobile visibility assertions 驗證。
- [x] 1.2 在 `src/components/AlertsPage.vue` 落實「保留參考 X 微互動但不搬入圓角卡片樣式」：Hover dismiss control uses the approved X microinteraction，使用 8px 方角、`#98968a`、180ms opacity/translateY、200ms `rgba(196, 64, 52, 0.12)`／`#c44034` hover 與 reduced-motion 規則，同時維持通知方角且不新增 row lift/shadow；以 `AlertsPage.test.js` DOM class/style contract 與 source assertions 驗證。
- [x] 1.3 在 `src/components/AlertsPage.vue` 落實「以獨立按鈕隔離通知啟用與 pointer gesture」：Hover dismiss activation reuses soft dismissal without activating the row，X 提供 `type="button"` 與 `aria-label="移除通知"`、阻止 click/pointerdown 冒泡、handler 重新檢查 read/canDismiss 並 exactly once 呼叫既有 dismiss flow；以 `AlertsPage.test.js` 驗證成功收合時不呼叫 read API/導頁，HTTP/network failure 時原位保留並顯示「無法移除通知」。

## 2. 回歸與品質驗證

- [x] 2.1 在 `src/__tests__/AlertsPage.test.js` 保留並執行既有 swipe threshold、gesture click guard、dismiss rollback、friendship actions、read-state visuals 與 activity deep-link 測試，並新增 hover X state matrix、keyboard focus、mobile absence、event isolation、exactly-once API 與 failure restore 覆蓋；以 `npm run test:run -- src/__tests__/AlertsPage.test.js` 通過為驗證。
- [x] 2.2 依序執行 `npm run test:run`、`npm run lint`、`npm run format`、`npm run build`，再以 `git diff --check`、scope review、`spectra analyze add-notification-hover-dismiss --json` 與 `spectra validate add-notification-hover-dismiss` 驗證無格式錯誤、無 change-scope 外異動且無 Critical/Warning artifact findings。

## 3. 實際畫面回饋修正

- [x] 3.1 在 `src/components/AlertsPage.vue` 落實「讓 X 控制相對通知列垂直置中」：Hover dismiss control uses the approved X microinteraction 的 32×32px 按鈕整體必須以 `align-self: center` 覆寫 `.alerts-item` 的 `align-items: flex-start`，在單行與多行通知列都保持 row cross-axis 垂直置中；以 `src/__tests__/AlertsPage.test.js` 新增 `align-self: center` source assertion，並以 64px row／32px control 上下各 16px 的 spec example 進行畫面驗收。
- [x] 3.2 執行 `npm run test:run -- src/__tests__/AlertsPage.test.js`、`npm run lint`、`npm run format`、`npm run build`，再以 `git diff --check`、scope review、`spectra analyze add-notification-hover-dismiss --json` 與 `spectra validate add-notification-hover-dismiss` 驗證垂直置中修正未影響原本 hover 動畫、資格保護與 soft-dismiss 行為。

## 4. 依輸入方式分流

- [x] 4.1 在 `src/components/AlertsPage.vue` 落實「依 input capabilities 顯示 X 並讓 touch-only 維持 swipe-only」與 Fine-hover read notifications reveal a hover dismiss control：將 X 顯示條件改為 `(hover: hover) and (pointer: fine)`，使 fine-hover 環境保留 32×32px slot、hover/focus 與垂直置中，touch-only 環境不顯示、不預留且不進入 tab order；以 `src/__tests__/AlertsPage.test.js` 的 fine-hover/touch-only state matrix 與 CSS source assertions 驗證無 viewport breakpoint 分流。
- [x] 4.2 在 `src/components/AlertsPage.vue` 落實「依 pointerType 分流 swipe 與非 touch 拖曳保護」、Pointer input type controls swipe dismissal 與 Non-touch horizontal drag consumes only its synthetic click：只有 `touch` 可更新 offset/progress 並通過 65% soft-dismiss，mouse、pen、空 pointer type 維持零位移與零進度且不送 dismiss API；非 touch 達 10px／1.25 axis lock 後只建立一次性 click guard，該 click 不標記已讀或導頁，消耗後或下一次 pointerdown 清除；以 `AlertsPage.test.js` 覆蓋 mouse/pen/empty pointer、guard 消耗與既有 touch 64%/65%/rollback/unread summary regression。

## 5. 更新後品質驗證

- [x] 5.1 依序執行 `npm run test:run -- src/__tests__/AlertsPage.test.js`、`npm run test:run`、`npm run lint`、`npm run format`、`npm run build`，再以 `git diff --check`、scope review、`spectra analyze add-notification-hover-dismiss --json` 與 `spectra validate add-notification-hover-dismiss` 驗證依輸入方式分流沒有改動 API、路由、通知資料格式、65% threshold、未讀綠點或後端 soft-dismiss。

## 6. 修復 X 軟刪除閃現滑動樣式

- [x] 6.1 在 `src/components/AlertsPage.vue` 落實「以明確 dismissal visual mode 分開 X 收合與 touch swipe」與 Hover dismiss activation reuses soft dismissal without activating the row：共用 `dismissNotification` 接受 `swipe`／`collapse` mode，X pending 期間維持 `translateX(0px)`、`--dismiss-progress: 0`、ring `stroke-dashoffset: 100` 並只讓 shell 垂直收合，touch 65% dismissal 則維持水平移至 `-width` 與 100% 紅色進度 affordance；在 `src/__tests__/AlertsPage.test.js` 以可控 pending request 驗證中間狀態、exactly-once API、X 不標記已讀／不導頁、failure rollback，以及 touch dismissal 的水平移出、完整進度與 unread summary。
- [x] 6.2 依序執行 `npm run test:run -- src/__tests__/AlertsPage.test.js`、`npm run test:run`、`npm run lint`、`npm run format`、`npm run build`，再以 `git diff --check`、scope review、`spectra analyze add-notification-hover-dismiss --json` 與 `spectra validate add-notification-hover-dismiss` 驗證本次修復只涉及 `AlertsPage.vue`、`AlertsPage.test.js` 與本 change artifacts，且未改動 API、store contract、65% threshold、touch gesture、通知資料格式或路由。
