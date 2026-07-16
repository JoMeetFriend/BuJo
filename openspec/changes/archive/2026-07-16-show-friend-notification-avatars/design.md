## Context

`AlertsPage` 目前把 `GET /api/notifications` 的 response 正規化成畫面模型，並已讓兩種好友通知以 actor 頭像取代通用好友圖示。BuJoBackend 將進一步讓 `activity_created` 以非破壞性欄位提供 `activity.creator`；前端已有 `toAvatarSrc`、40×40 方形頭像與逐筆 image error 狀態，因此不需要新增頭像工具、額外使用者查詢或另一套錯誤處理。

## Goals / Non-Goals

**Goals:**

- 讓收到邀請與邀請被接受通知顯示正確行為者的方形頭像。
- 讓 `activity_created` 顯示活動建立者的方形頭像。
- 在 actor、avatar URL 缺少或圖片載入失敗時維持該通知既有圖示。
- 保留所有既有通知狀態、互動、一般通知與其他活動生命週期通知圖示。

**Non-Goals:**

- 不解析通知文案推測行為者，也不新增前端查詢。
- 不顯示 actor 的 display name，不改寫通知 message。
- 不將頭像改為圓形，不調整通知列布局以外的視覺。
- 不新增 API endpoint、資料表、migration 或套件。
- 不讓 `formation_ready`、`time_to_pick`、`activity_confirmed` 或 `activity_cancelled` 顯示 actor 頭像。

## Decisions

### 保留並正規化通知 actor 契約

`normalizeNotification` 保留 `actor`，有效資料形狀為 `{ id, displayName, avatarUrl }`，其餘情況收斂為 `null`。這避免 UI 直接依賴未驗證的巢狀 response，也讓後端 friendship 不存在時的 `actor: null` 能安全處理。替代方案是保留整個原始物件，但會讓畫面模型夾帶不必要欄位。

### 好友通知以 actor 頭像取代通用圖示

僅 `friend_request_created` 與 `friend_request_accepted` 在 `actor.avatarUrl` 可用時渲染 40×40 方形圖片，圖片來源交由既有 `toAvatarSrc`。其他 category 與 type 沿用目前 CSS 圖示。替代方案是所有 friend category 都嘗試顯示 actor，但這會讓未知好友通知行為不明確。

### 活動建立通知擴充明確類型 allowlist

將既有好友通知 allowlist 更名為 `ACTOR_AVATAR_NOTIFICATION_TYPES`，並加入 `activity_created`。只有 allowlist 內的通知會嘗試以既有 `toAvatarSrc` 與 40×40 方形圖片顯示 actor；`formation_ready`、`time_to_pick`、`activity_confirmed`、`activity_cancelled` 與一般通知即使意外收到 actor，也維持原有 category icon。替代方案是依 `category: "activity"` 顯示 actor，但會誤改所有活動生命週期通知的既定視覺。

### 缺圖與載入錯誤共用既有 fallback

每筆通知的 image error 狀態以 notification id 記錄；缺少 actor、空 avatar URL、正規化後無來源或 `error` 事件發生時，不渲染圖片並回到該通知原有的 friend 或 activity icon。重新取得通知清單時，已失敗 id 的狀態不影響其他通知。這比顯示另一個新 placeholder 更能維持現有視覺語言。

## Implementation Contract

- Behavior: `friend_request_created` 顯示 requester 頭像，`friend_request_accepted` 顯示 receiver 頭像，`activity_created` 顯示 activity creator 頭像；圖片維持 40×40 方形 paper 風格。其他活動生命週期與一般通知仍顯示既有 category icon。
- Interface: 前端接受每筆通知的 `actor: { id: string, displayName: string, avatarUrl: string | null } | null`。`normalizeNotification` 必須保留經收斂的 actor，不能從 message 推導 actor。
- URL handling: `/uploads/...` 必須透過 `toAvatarSrc` 加上 `VITE_API_URL`；HTTP(S) URL 必須保持原值。
- Failure modes: actor 為 `null`、avatarUrl 為空、正規化結果為空或圖片觸發 `error` 時，畫面必須靜默顯示該通知原有圖示，且不得出現 broken image。
- Acceptance criteria: `src/__tests__/AlertsPage.test.js` 覆蓋兩種好友通知與 `activity_created`、相對與絕對 URL、缺圖與 image error fallback、其他活動通知 icon regression；targeted test、全套測試、lint、format、build 與 `git diff --check` 通過。
- In scope: `AlertsPage` 的 response normalization、明確 actor avatar type allowlist、好友與活動建立通知 icon rendering、局部失敗狀態與對應測試。
- Out of scope: 後端程式碼實作、schema、migration、通知文案、display name 額外渲染、接受／拒絕、已讀、導頁、swipe、X dismissal 與其他通知的行為變更。

## Risks / Trade-offs

- [後端尚未部署 actor 欄位時前端沒有頭像] → `actor: null` 路徑保留好友圖示，使前端可先部署且向後相容。
- [後端尚未為 `activity_created` 提供 creator actor] → 前端沿用 activity icon，使前後端可先後部署而不產生 broken image。
- [同一圖片 URL 暫時性載入失敗] → fallback 狀態按 notification id 隔離；重新掛載或刷新頁面可再次嘗試載入。
- [後端回傳非預期 actor 形狀] → normalization 將其收斂為 `null`，避免 template 例外。
