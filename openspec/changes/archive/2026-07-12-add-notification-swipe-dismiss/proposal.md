## Why

目前通知列表只能標記已讀，使用者無法整理已處理的通知；若只從當下畫面移除，重新整理後又會出現，也無法維持一致體驗。需要提供不容易誤觸的左滑移除互動，並透過後端 soft dismissal 永久隱藏通知，同時保留資料列供後續稽核。

## What Changes

- 通知列支援觸控與滑鼠左滑；拖曳距離增加時，垃圾桶背景從透明連續加深至亮紅色，垃圾桶外圍的進度弧同步成長為一整圈；圓環完整與亮紅終點才播放滑出與收合動畫並送出移除請求，讓兩種視覺回饋共同表達刪除進度。
- 未達門檻、垂直捲動或標記已讀 API 失敗時，不會遺失通知；dismiss API 失敗時會將通知復原至原位置並顯示錯誤。
- 仍含接受／拒絕操作的好友邀請禁止滑除；使用者必須先完成其中一項操作，待通知不再是待處理狀態後才能滑除。
- 前端呼叫受認證的 `PATCH /api/notifications/:id/dismiss`；後端契約需將通知標記已讀並記錄 soft dismissal，後續通知列表不再回傳該筆資料，但不刪除資料列。
- 保留既有點擊已讀、鍵盤已讀、全部已讀及好友邀請接受／拒絕流程，並支援 reduced-motion 與可辨識的垃圾桶無障礙名稱。

## Capabilities

### New Capabilities

- `notification-swipe-dismiss`: 定義通知列左滑的透明至亮紅與垃圾桶圓環距離回饋、長距離移除、防誤觸、待處理邀請限制、失敗復原與後端 dismissal API 契約。

### Modified Capabilities

(none)

## Impact

- Affected specs: notification-swipe-dismiss
- Affected code:
  - New: src/__tests__/AlertsPage.test.js
  - Modified: src/components/AlertsPage.vue
  - Removed: (none)
- External dependency: sibling BuJoBackend 必須提供 `PATCH /api/notifications/:id/dismiss`，將通知設為已讀並持久化 soft dismissal；其 Prisma schema、migration、route、controller、service 與 Jest 測試不屬於本前端 repo 的檔案範圍。
