## Context

登入成功後，帳密與 Google 流程會進入受保護頁面，LINE OAuth callback 也會在前端認證守衛確認 cookie 後進入已登入區域。`authStore.user.identities` 已能辨識使用者是否有 LINE identity，但前端沒有官方帳號好友狀態，也沒有 onboarding 持久化欄位。個人編輯頁已有登入方式管理，是 onboarding 關閉後最自然的永久 fallback。

本 change 只修改 BuJo 前端。BuJoBackend 既有 `/api/auth/line/link` 與 `/api/auth/me` 是必要外部契約；`bot_prompt` 強度與 OAuth 取消導向屬於後端後續 change。

## Goals / Non-Goals

**Goals:**

- 對所有既有與新使用者提供一次、可略過、不阻擋功能的 LINE 通知引導。
- 依 LINE identity 狀態提供正確下一步，並避免把「已連接 LINE」誤寫成「已加入官方帳號」。
- 讓手機可開啟 add friend URL、桌機可掃 QR code，且設定缺失時不產生壞連結或壞圖片。
- 在個人編輯頁保留永久入口，讓略過或稍後改變主意的使用者仍能完成設定。

**Non-Goals:**

- 不追蹤、儲存或顯示 LINE 官方帳號 friend、blocked 或 unfollow 狀態。
- 不新增後端 endpoint、資料表、webhook、Messaging API account linking 或通知偏好控制。
- 不修改 LINE 推播發送條件、訊息內容或站內通知。
- 不在本 change 調整 BuJoBackend 的 `bot_prompt` 或 OAuth callback redirect。

## Decisions

### Global authenticated onboarding owned by App

`App.vue` 在認證已初始化、使用者有穩定 ID、且目前位於需要登入的主要區域時掛載專用 `LineNotificationOnboardingModal`。登入頁、註冊頁、landing page、未登入狀態與認證初始化期間不得顯示。選擇全域 shell 而非只放日曆元件，避免 OAuth callback 或未來登入後預設路由改變時漏掉引導。

Modal 為非阻擋 onboarding：提供主要動作、`稍後再說` 與可存取的關閉控制；關閉後立即回到原頁，不改變路由或認證狀態。

### Versioned per-user client persistence

以 `useLineNotificationOnboarding` composable 集中持有顯示判斷、session fallback 與完成動作，避免 `App.vue` 和 modal 各自寫一套 persistence。composable 使用 `bujo:line-notification-guide:v1:<userId>` 作為 localStorage key，值固定為 `seen`。不同 user ID 互不影響；未來若需重新提示，必須升版 key，而不是清除所有 localStorage。刪除此 composable 會失去 per-user key、storage 例外處理與同 session 去重，因此它不是單純轉呼叫的 wrapper。

按關閉、`稍後再說`、LINE 綁定 CTA 或官方帳號 CTA 時都先寫入 `seen`，再執行後續動作，避免外部跳轉返回後立刻重複出現。localStorage 讀寫必須包在錯誤處理中；被瀏覽器封鎖時使用目前 SPA session 的記憶狀態避免同頁重複顯示，但重新載入後允許再次顯示。

### Identity-aware CTA without friendship claims

使用 `authStore.user.identities` 中是否存在 `provider === 'line'` 分流：

- 尚未連接 LINE：顯示「用 LINE 收到揪團提醒」，主要 CTA 導向既有 `/api/auth/line/link`。
- 已連接 LINE：顯示「確認 LINE 通知設定」，主要內容引導加入或解除封鎖官方帳號。

前端沒有官方帳號好友狀態，因此任何 badge、成功訊息與說明都不得宣稱「已加入官方帳號」、「推播已開啟」或同義的已完成狀態。LINE identity 陣列缺失或不是陣列時一律視為尚未連接，避免執行期錯誤。

### Responsive add-friend link and QR configuration

新增 `VITE_LINE_OFFICIAL_ACCOUNT_ADD_FRIEND_URL` 與 `VITE_LINE_OFFICIAL_ACCOUNT_QR_CODE_URL`。兩者都是公開值，不得放入 Messaging API token 或其他 secret。`LineOfficialAccountEntry` 集中封裝 responsive QR／link、圖片錯誤與缺少設定的 fail-soft 行為，讓 onboarding modal 與個人設定共用同一份入口契約；刪除此元件會使兩個 consumer 失去一致的外部入口與錯誤處理。

小型 viewport 以 add friend 連結為主要入口；桌機顯示 QR code 並保留可點擊連結作為鍵盤與無法掃碼時的備援。官方提供的 `L_gainfriends_2dbarcodes_GW.png` 會以 `src/assets/line-gain-friends-qrcode.png` 納入 bundle，作為未設定 `VITE_LINE_OFFICIAL_ACCOUNT_QR_CODE_URL` 時的預設 QR；部署環境仍可用公開 URL 覆寫。add friend URL 缺失時不渲染可點擊空連結；外部 QR 與 bundled QR 都無法載入時隱藏圖片並顯示口語、可理解的替代文字。使用者仍可關閉 modal，其他功能不受影響。

### Bundled official QR fallback and conversational copy

Onboarding 文案以短句、直接稱呼與「囉／沒關係」等自然語氣說明下一步，不使用「確認設定」、「若要收到推播」等系統式措辭。文字仍需清楚區分 LINE identity 與官方帳號好友關係，不得把「已連接 LINE」寫成已成功加入官方帳號。桌機優先呈現官方 QR，手機維持可點擊 add friend 入口，避免在小螢幕顯示需要另一台裝置掃描的圖。

### Permanent settings fallback

`ProfileEditPage` 在既有登入方式區塊之外新增「LINE 通知」區塊：未連接 LINE 時提供綁定 CTA；已連接 LINE 時提供 QR／add friend 入口。此區塊不受 onboarding localStorage key 影響，永遠可被已登入使用者使用。

區塊沿用 Modern Paper 的方角、線框、成熟留白與 ink hierarchy，不新增 generic soft-card 視覺；互動控制須有可讀文字、focus-visible 狀態與替代文字。

## Implementation Contract

- **Behavior:** 符合顯示條件且沒有 `seen` key 的使用者會看到一次 modal；任何離開 modal 的操作都完成本裝置 onboarding 記錄。不同帳號各自判斷。個人編輯頁永久入口始終存在。
- **Interfaces:** 既有 `/api/auth/line/link` 與 `user.identities[].provider` 契約不變；新增兩個 Vite 公開環境變數、一個 bundled 官方 QR 資產與一個版本化 localStorage key，不新增 HTTP API。
- **Failure modes:** localStorage、add friend URL 或 QR 圖片失敗不得阻擋登入、導頁或個人設定；未設定外部 QR 時使用 bundled 官方圖，圖片仍失敗時隱藏圖片並顯示可理解的替代狀態。
- **Acceptance criteria:** 元件測試鎖定顯示條件、identity 分流、持久化、不同 user ID、localStorage 例外、bundled QR fallback、缺少 add friend 設定與 QR 載入失敗；個人設定測試鎖定永久入口；彈窗文字檢查鎖定口語內容；完整測試、lint、format check 與 build 通過。
- **Scope boundaries:** 本 change 僅交付前端引導與公開設定；後端 OAuth prompt、好友狀態確認、webhook、資料模型與推播 delivery 不在 apply 範圍。

## Risks / Trade-offs

- [localStorage 只在單一瀏覽器裝置有效] → key 明確定義為 per-user/per-device，並以永久設定入口補足跨裝置差異。
- [無法知道使用者是否真的加入或封鎖官方帳號] → 使用「加入／確認」措辭，不顯示完成狀態。
- [外部 URL 或 QR 設定錯誤] → 缺值與圖片錯誤採 fail-soft，部署 checklist 要求以實際手機與桌機驗證。
- [所有既有使用者在發布後都會看到一次] → modal 可立即略過且不阻擋主要功能。

## Migration Plan

1. 先在部署環境設定公開 add friend URL 與 QR code URL。
2. 發布前端；現有 localStorage 沒有 v1 key，因此每位使用者會在該裝置下一次進入已登入區域時看到一次。
3. 若需緊急回滾，移除 modal 掛載但保留環境變數不會影響登入與通知；已寫入的 v1 key可安全留存。

## Open Questions

無；後端 OAuth 體驗改善由 BuJoBackend 的獨立 change 決定。
