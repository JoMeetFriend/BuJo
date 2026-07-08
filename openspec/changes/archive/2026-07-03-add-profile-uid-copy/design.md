## Context

個人帳號彈窗由 auth store 提供的登入使用者物件渲染。現有彈窗顯示 `display_name` 與 email，但好友搜尋流程已要求使用者輸入五碼十六進位 BuJo ID。前端 mock 與既有測試目前使用 `user.id`；未來後端回傳可以明確提供 `user.uid`。

## Goals / Non-Goals

**Goals:**

- 當登入使用者有 `user.uid` 或 `user.id` 時，在個人帳號彈窗以 `Bujo ID: <後五碼>` 顯示可分享的 BuJo ID。
- 讓使用者能透過代碼旁的圖示按鈕精準複製該五碼代碼，視覺上不顯示「複製」文字。
- 保留既有個人編輯與登出操作不變。
- 用 component-level tests 覆蓋顯示、複製成功、複製失敗與缺少識別碼狀態。

**Non-Goals:**

- 不變更好友搜尋輸入驗證或可接受格式。
- 不變更 `authStore`、route guards 或後端 API contracts。
- 不把 email 作為此彈窗的好友分享識別碼。
- 不為 clipboard 回饋新增全域 toast 系統或新 dependency。

## Decisions

### 優先從 uid 其次從 id 取得分享代碼

使用 `user.uid` 與 `user.id` 中第一個可用值，轉成字串後取最後五個字元作為可見分享代碼。這能維持目前前端資料形狀相容性，同時讓未來明確的 `uid` 欄位優先。

曾考慮只使用 `user.id`。這能搭配目前 mock 運作，但如果後端未來為好友搜尋引入 `user.uid`，前端仍需要再改一次。

### 只複製五碼分享代碼

複製操作只複製推導出的五碼代碼，不包含標籤文字或完整識別碼。這符合現有好友搜尋行為，該輸入只接受剛好五個十六進位字元。

曾考慮複製像 `BuJo ID: d5e6f` 這類帶標籤文字。它在聊天中更清楚，但無法直接貼進目前好友搜尋輸入。

### 複製控制使用圖示按鈕

五碼代碼右側的複製控制在視覺上使用圖示按鈕，不顯示「複製」文字，讓帳號列更接近工具型操作。按鈕仍保留 `aria-label` 或等效 accessible name，例如「複製 BuJo ID」，並在複製後於按鈕右側用既有本地回饋顯示成功或失敗狀態。

曾考慮保留文字按鈕。它較直覺，但使用者已要求改為圖示；若完全移除 accessible name，測試與輔助工具會失去穩定辨識方式。

### 將回饋保留在彈窗列內

彈窗在本地保存簡單的複製狀態，並在成功或失敗後更新複製按鈕或旁邊的狀態文字。clipboard 呼叫失敗時仍保留代碼可見，讓使用者可以手動選取或重新輸入。

曾考慮導入共用 toast 或通知機制。這超出此彈窗變更範圍，也會碰到不相關的 UI 基礎設施。

## Implementation Contract

Behavior: 當個人帳號彈窗收到含有 `uid` 或 `id` 的 user 物件時，彈窗會顯示使用者顯示名稱，並在下方以 `Bujo ID: <後五碼>` 顯示 BuJo ID。該代碼列右側會出現圖示複製按鈕，按鈕本身不顯示「複製」文字，但提供可存取名稱。啟用按鈕時只會把後五碼代碼複製到 clipboard，不包含 `Bujo ID:` 標籤，接著在圖示按鈕右側顯示複製成功回饋。如果 clipboard write reject，或 `navigator.clipboard` 不可用，彈窗會在圖示按鈕右側顯示失敗回饋並保持代碼可見。

Interface and data shape: `ProfileAccountModal` 維持接收 `user` prop 物件。分享代碼推導先讀 `user.uid`，再讀 `user.id`，並使用 `String(value).slice(-5)`。複製控制使用既有圖示或專案可用的 inline/icon 元素，並保留 `aria-label="複製 BuJo ID"` 或等效 accessible name。不新增事件；close 與 logout 行為不變。

Failure modes: 如果 `uid` 與 `id` 都不存在，彈窗不渲染 BuJo ID 列或複製按鈕。如果 clipboard 操作失敗，彈窗不 throw、不關閉，只顯示本地失敗狀態。

Acceptance criteria: component test 掛載帶有 `id` 且結尾為 `d5e6f` 的 `ProfileAccountModal`，並驗證 `Bujo ID: d5e6f` 可見。component test stub `navigator.clipboard.writeText`，並驗證點擊圖示複製按鈕會寫入 `d5e6f`。component test 驗證複製按鈕沒有可見「複製」文字，但仍可透過 accessible name 找到，且成功回饋顯示在該按鈕右側。component test 驗證缺少 `uid` 與 `id` 時隱藏複製按鈕。component test 驗證 clipboard write reject 時顯示失敗回饋。實作後 repository 通過 `npm run test:run`、`npm run lint` 與 `npm run format`。

Scope boundaries: 此變更只限於 `ProfileAccountModal` 與其 component test。不修改好友搜尋、認證 API 呼叫、個人編輯、登出或全域通知模式。

## Risks / Trade-offs

- [Risk] 後端回傳的 `id` 最後五碼不是可搜尋的好友代碼。-> Mitigation: 有 `user.uid` 時優先使用，並在測試中記錄 fallback 假設。
- [Risk] 瀏覽器在不安全 context 或測試中拒絕 clipboard 存取。-> Mitigation: feature-detect `navigator.clipboard.writeText`，並在不破壞彈窗的情況下顯示本地失敗回饋。
- [Risk] 複製回饋可能造成彈窗 layout shift。-> Mitigation: 使用精簡 inline 回饋與穩定按鈕尺寸，讓帳號列維持視覺一致。
