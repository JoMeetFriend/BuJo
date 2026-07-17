## Problem

桌機使用者若以超過 250ms 的慢速水平拖曳通知列，放開後瀏覽器合成的 click 可能落在既有時間型抑制窗之外，誤將通知標記已讀並導向活動頁。

## Root Cause

通知列在水平拖曳鎖定時以固定的 250ms 截止時間抑制 click；此截止時間從拖曳過程開始計算，而不是與同一次 pointer gesture 及其後續合成 click 綁定，因此拖曳時間較長時 guard 會在 pointerup 前失效。

## Proposed Solution

- 將時間型 click 抑制改為一次性的 pointer gesture guard。
- 水平拖曳鎖定後標記阻擋下一個 pointer click，並僅在 click 消耗或下一次 pointerdown 確認過期時清除。
- 將 pointer click guard 與通知啟用行為分開，使 Enter 與 Space 維持標記已讀及活動導頁。
- 保留既有 65% 刪除門檻、復位、dismiss rollback、好友操作及手機 pointer 行為。

## Non-Goals

- 不新增裝置或 viewport 判斷。
- 不變更通知頁樣式、後端 API、路由、通知資料格式或軟刪除流程。

## Success Criteria

- 超過 250ms 的水平拖曳放開後，即使產生 click，也不呼叫 read API、不導向活動頁。
- 未達 65% 的拖曳仍復位且不呼叫 dismiss API。
- guard 消耗後的下一次正常 pointer 點擊可標記已讀並導頁。
- Enter 與 Space 不受 pointer guard 影響。

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `notification-swipe-dismiss`: 水平拖曳後的 click 抑制改為 gesture-scoped 一次性 guard，並維持既有刪除門檻與復位行為。
- `notification-activity-deep-link`: pointer click guard 僅阻擋拖曳後的 pointer click，鍵盤 Enter/Space 啟用仍維持標記已讀與導頁。

## Impact

- Affected specs: notification-swipe-dismiss, notification-activity-deep-link
- Affected code:
  - Modified: src/components/AlertsPage.vue
  - Modified: src/__tests__/AlertsPage.test.js
  - New: openspec/changes/fix-notification-swipe-click-through/specs/notification-swipe-dismiss/spec.md
  - New: openspec/changes/fix-notification-swipe-click-through/specs/notification-activity-deep-link/spec.md
  - New: openspec/changes/fix-notification-swipe-click-through/design.md
  - New: openspec/changes/fix-notification-swipe-click-through/tasks.md
  - Removed: none
