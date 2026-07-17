## Context

`AlertsPage` 已用 `notification.isRead` 控制 `.alerts-item--unread` 與 `.notification-icon--read`，但目前未讀僅多一條左邊框，訊息文字不分狀態，也沒有提示點。整列 click／Enter／Space 會呼叫既有 mark-as-read，樣式必須直接由同一個 `isRead` 狀態衍生。

## Goals / Non-Goals

**Goals:**

- 未讀與已讀在背景、邊框、圖示、文字粗細與提示點上可辨識。
- 狀態切換沿用既有 `isRead`，不建立重複資料來源。
- 通知列維持方角與紙張感，動畫只做顏色切換與提示點脈衝。
- reduced motion 時停用提示點脈衝。

**Non-Goals:**

- 不新增提示點的獨立點擊行為。
- 不加入圓角、卡片浮起、縮放或額外位移。
- 不修改通知 API、store、載入動畫、導頁、好友操作或 swipe dismissal。

## Decisions

### isRead 單一狀態驅動整組視覺

未讀列沿用 `.alerts-item--unread`，已讀列沿用缺少該 class 的 default state 與既有 `.notification-icon--read`。提示點只在 `!notification.isRead` 時渲染並設為 `aria-hidden`，避免產生第二個互動入口或重複的可存取語意。

### 方角紙張狀態與平滑顏色切換

`.alerts-item` 明確設定 `border-radius: 0`。已讀預設使用 `var(--bujo-surface)`、line border、muted-strong 500 weight message 與 muted icon；未讀使用 accent 與 surface 的淡綠混色、accent 邊框、700 weight ink message，以及 accent icon。背景、邊框、文字與圖示使用 450ms color transition，不套用 transform 或 shadow 動畫。

### 未讀提示點遵守 reduced motion

提示點為 9px accent 方點，維持 BuJo 方角語言，使用 2.4s opacity pulse。reduced motion 時保留提示點但設為 `animation: none`，狀態仍可由背景、邊框、文字和圖示辨識。

## Implementation Contract

- Behavior：未讀列呈現淡綠背景、accent 邊框與圖示、深色粗體訊息及右側 9px 方形提示點；已讀列呈現灰白紙張底、line border、較淡中等字重訊息、muted icon，且沒有提示點。
- Transition：既有 mark-as-read 成功改變 `isRead` 後，背景、邊框、文字與圖示以 450ms 顏色 transition 切換；不得新增位移、縮放或 shadow 動畫。
- Shape：通知項目始終 `border-radius: 0`，提示點也不得使用圓角。
- Accessibility：提示點 `aria-hidden` 且不可點擊；reduced motion 時提示點保留但不 pulse。
- Acceptance：Vitest 驗證未讀／已讀 DOM class 與提示點、click 後提示點消失與已讀 class、CSS source 中方角／狀態／pulse／reduced-motion 規則，並通過完整測試、lint、format、build。
- In scope：`AlertsPage` 通知列的狀態 markup、scoped CSS 與對應測試。
- Out of scope：API、Pinia、載入動畫、導頁、好友 action、dismissal gesture 與其他頁面。

## Risks / Trade-offs

- [淡綠背景與 hover 規則互相覆蓋] → 為 unread hover 提供同色系稍深背景，已讀維持既有 hover。
- [提示點被誤認成按鈕] → 使用非互動 span、aria-hidden，不加入 title、role 或事件。
- [狀態動畫造成動態不適] → transition 只改顏色，提示點 pulse 在 reduced motion 下停用。
