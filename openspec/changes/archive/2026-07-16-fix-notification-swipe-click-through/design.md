## Context

`AlertsPage.vue` 以 Pointer Events 實作通知左滑刪除。現行水平拖曳鎖定時寫入 `performance.now() + 250`，`handleNotificationClick` 再以當下時間判斷是否阻擋；慢速拖曳超過 250ms 後放開，瀏覽器合成 click 會穿透 guard。通知列同時支援 pointer click 與 Enter/Space 啟用，因此修正必須只影響 pointer gesture 後的 click。

## Goals / Non-Goals

**Goals:**

- 將 click 抑制生命週期綁定同一次水平 pointer gesture，而非固定時間。
- 水平拖曳後的第一個合成 click 不標記已讀、不導頁，並在阻擋時消耗 guard。
- 下一次正常 pointer gesture 與 Enter/Space 維持既有通知啟用功能。
- 維持 65% dismiss threshold、未達門檻復位、rollback 與好友 action 行為。

**Non-Goals:**

- 不依裝置類型、hover capability 或 viewport 分流。
- 不變更視覺樣式、後端 API、路由、通知資料格式或 soft-dismiss 流程。

## Decisions

### 以一次性 gesture click guard 取代固定抑制時間

每個通知的 swipe state 使用布林狀態表示「已水平拖曳，下一個 pointer click 必須被阻擋」。水平 axis 鎖定時設為 true；pointerup、pointercancel 與未達門檻的 reset 不清除它。`click` handler 收到 pointer click 時先消耗狀態並返回。相較延長 timeout，此作法不受使用者拖曳速度與平台 click 合成延遲影響。

### 下一次 pointerdown 清除未被合成 click 消耗的 guard

若某平台在拖曳後沒有合成 click，guard 會殘留。下一次符合通知列處理範圍的 pointerdown 代表新的 gesture，開始前先清除舊 guard，使之不會永久攔截後續正常 click。新 gesture 若再次鎖定水平拖曳，會重新設置 guard。

### 將 pointer guard 與通知啟用來源分離

`handleNotificationClick` 接收啟用來源或原生事件，僅 pointer click 檢查與消耗 guard；Enter/Space 直接進入共用啟用流程，繼續呼叫 mark-as-read 並依 activity reference 導頁。這避免鍵盤事件被 pointer 狀態誤攔。

### 以慢速拖曳與後續啟用測試鎖定狀態轉移

測試以 fake timers 或可控時間讓水平拖曳超過原本 250ms，再觸發 pointerup 與 click；驗證 read、dismiss、router 三個 observable。接著驗證 guard 只消耗一次，以及 Enter/Space 在 guard 存在時仍可啟用通知。

## Implementation Contract

- Behavior: 水平拖曳一旦鎖定，該 gesture 後的下一個 pointer click SHALL 被阻擋；阻擋時 SHALL 不呼叫 read API、不改已讀狀態、不呼叫 router push。
- Behavior: 未達通知列寬 65% 的左滑 SHALL 復位且 SHALL NOT 呼叫 dismiss API；此復位 SHALL NOT 提前清除 pending pointer click guard。
- Behavior: 被阻擋的 click SHALL 消耗 guard；下一次新的正常 pointer gesture SHALL 能標記未讀通知並在 activity reference 存在時導向 `/activity?focus=<id>`。
- Behavior: Enter 與 Space SHALL 不受 pending pointer click guard 影響，並 SHALL 維持既有 mark-as-read 與 activity deep-link 行為。
- Interface: 不改後端 endpoint、route shape 或 notification shape；僅調整 `AlertsPage.vue` 內 swipe state 與 activation handler 的事件來源處理。
- Failure modes: 若拖曳後沒有瀏覽器合成 click，下一次 pointerdown SHALL 清除過期 guard；dismiss API 失敗仍沿用既有 restore 與錯誤訊息。
- Acceptance: `src/__tests__/AlertsPage.test.js` SHALL 覆蓋超過 250ms 的未達門檻慢速左滑、click 阻擋與消耗、下一次正常 click、Enter、Space；targeted test、完整 test、lint、format、build SHALL 依序完成。
- Scope: 僅修改 `src/components/AlertsPage.vue`、`src/__tests__/AlertsPage.test.js` 與本 change artifacts；不修改 CSS、stores、router 或後端。

## Risks / Trade-offs

- [Risk] 瀏覽器未合成 click 時 guard 殘留 → 下一次 pointerdown 在新 gesture 開始前清除過期 guard。
- [Risk] 共用 handler 讓鍵盤誤走 pointer guard → template 明確傳入 activation source 或 event，測試 Enter 與 Space。
- [Risk] reset helper 順手清除 guard 導致穿透復發 → guard 欄位不納入一般 swipe visual reset，並以未達門檻慢速左滑測試鎖定。
