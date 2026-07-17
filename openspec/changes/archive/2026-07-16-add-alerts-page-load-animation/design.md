## Context

`AlertsPage` 在掛載時呼叫 `fetchNotifications()`，載入期間顯示「通知讀取中...」，成功後以具穩定 `notification.id` key 的通知列取代空清單。通知列外層目前負責 swipe dismissal 的高度收合，內層 `.alerts-item` 負責水平拖曳；進場效果必須避免與這兩種既有 transition 競爭。

## Goals / Non-Goals

**Goals:**

- 只讓首次成功載入且非空的通知列依序進場。
- 使用外層通知列呈現淡入與垂直位移，不改變內層 swipe transform。
- 限制長清單的最大等待時間並支援 reduced motion。
- 以 Vitest 鎖定載入時機、延遲計算與不重播行為。

**Non-Goals:**

- 不加入 skeleton、spinner、整頁或標題動畫。
- 不改通知 API、normalized data shape、元件 props、空狀態或錯誤訊息。
- 不改已讀、好友邀請、活動 deep link 與 swipe dismissal 契約。

## Decisions

### 首次成功載入 ID 集合控制動畫資格

使用元件內部的 `hasLoadedInitialNotifications` 與 `initialEntryNotificationIds` 狀態。首次成功解析 response 時，若清單非空，將該批通知 ID 寫入集合；後續任何 `fetchNotifications()` 成功時清空集合，因此既有列及新列都不重播。首次成功結果為空時仍完成首次載入標記，未來重新抓取也不播放。

替代方案是單純對所有新建 DOM 列套用 animation，但後續新增通知也會播放，不符合只播放一次的決策；`TransitionGroup` 同樣會對後續插入項目觸發 enter。

### 外層 shell 使用 CSS keyframes 與封頂錯開延遲

`v-for` 同時取得 index，僅符合首次 ID 集合的 `.alerts-swipe-shell` 加上 entering class，並透過 CSS custom property 傳入 `Math.min(index, 7) * 60ms`。keyframes 從 `opacity: 0; transform: translateY(10px)` 到 `opacity: 1; transform: translateY(0)`，時間 400ms、使用專案既有的 `cubic-bezier(0.2, 0.8, 0.2, 1)`。

動畫放在 shell，避免覆蓋 `.alerts-item` 的 swipe transform；max-height dismissal transition 使用不同 CSS property，可維持既有收合行為。第 1 至第 8 列延遲為 0ms 至 420ms，第 9 列起維持 420ms，使整批最晚在約 820ms 完成。

### Reduced motion 直接取消進場動畫

在既有 `prefers-reduced-motion: reduce` media query 內對 entering class 設定 `animation: none`。通知內容立即顯示，既有 swipe transition 的 1ms 規則保持不變。

## Implementation Contract

- Behavior：首次成功取得非空通知清單後，每列由透明、下移 10px 的狀態在 400ms 內回到正常位置與不透明度；前 8 列依 index 每列增加 60ms 延遲，第 9 列起延遲固定為 420ms。
- State：動畫資格只存在於元件內部 ID 集合，不寫入後端資料、Pinia store 或 normalized notification object。首次成功 response 完成後，後續 `fetchNotifications()` 不得再次套用 entering class。
- Failure modes：API 失敗沿用既有錯誤顯示且不播放；首次成功空清單沿用空狀態且消耗首次載入資格；reduced motion 下通知立即出現。
- Acceptance criteria：`src/__tests__/AlertsPage.test.js` 證明 pending request 無通知列、首次完成後存在 entering class與 0/60/120/420ms 延遲、第二次 fetch 後 entering class 消失；既有測試、lint、format 與 build 通過。
- In scope：通知列首次進場的本機狀態、template class/style、CSS keyframes、reduced-motion 規則與對應測試。
- Out of scope：通知資料、API、store 契約、標題與載入／空／錯誤視覺，以及現有互動行為。

## Risks / Trade-offs

- [動畫與 swipe transform 互相覆蓋] → 只在 shell 動畫 transform，內層 item 繼續獨立處理水平位移。
- [大量通知造成過長 stagger] → 第 8 列後固定使用 420ms 延遲。
- [重新抓取資料重播] → 第二次成功 fetch 先清空首次 ID 集合，並以測試驗證。
