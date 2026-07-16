## Why

好友通知目前只能顯示通用好友圖示，無法辨識是哪位使用者發起邀請或接受邀請。後端通知契約將提供行為者資料，前端需要在不影響既有通知操作與視覺狀態的前提下顯示對應頭像。

## What Changes

- 保留通知 API 回傳的 `actor` 資料，包含使用者識別、顯示名稱與可為空的頭像網址。
- `friend_request_created` 與 `friend_request_accepted` 通知優先顯示行為者頭像。
- 相對頭像路徑沿用既有 API base URL 正規化；絕對 HTTPS 網址維持原值。
- 缺少頭像、缺少 actor 或圖片載入失敗時，退回既有好友圖示。
- 活動與一般通知圖示、方形 paper 視覺、已讀狀態、好友接受／拒絕、導頁、swipe 與 dismissal 行為保持不變。

## Capabilities

### New Capabilities

- `friend-notification-avatar`: 好友通知依後端 actor 契約顯示方形行為者頭像，並在資料或圖片不可用時安全退回既有好友圖示。

### Modified Capabilities

(none)

## Impact

- Affected specs: `friend-notification-avatar`
- Affected code:
  - Modified: `src/components/AlertsPage.vue`
  - Modified: `src/__tests__/AlertsPage.test.js`
- External dependency: BuJoBackend 的 `GET /api/notifications` 每筆通知新增非破壞性的 `actor` 欄位；舊前端可安全忽略此欄位。
- No schema, migration, new endpoint, or dependency changes.
