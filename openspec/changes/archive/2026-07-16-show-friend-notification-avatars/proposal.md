## Why

好友通知目前只能顯示通用好友圖示，無法辨識是哪位使用者發起邀請或接受邀請；活動建立通知也只能顯示通用活動圖示，無法辨識建立者。後端通知契約將提供行為者資料，前端需要在不影響既有通知操作與視覺狀態的前提下，讓好友通知與 `activity_created` 顯示對應頭像。

## What Changes

- 保留通知 API 回傳的 `actor` 資料，包含使用者識別、顯示名稱與可為空的頭像網址。
- `friend_request_created` 與 `friend_request_accepted` 通知優先顯示行為者頭像。
- `activity_created` 通知優先顯示活動建立者頭像，其他活動生命週期通知仍顯示既有 activity icon。
- 相對頭像路徑沿用既有 API base URL 正規化；絕對 HTTPS 網址維持原值。
- 缺少頭像、缺少 actor 或圖片載入失敗時，依通知類型退回既有好友或 activity icon。
- 將頭像類型 allowlist 命名為 `ACTOR_AVATAR_NOTIFICATION_TYPES`，明確包含兩種好友通知與 `activity_created`。
- 其他活動與一般通知圖示、方形 paper 視覺、已讀狀態、好友接受／拒絕、導頁、swipe 與 dismissal 行為保持不變。

## Capabilities

### New Capabilities

- `friend-notification-avatar`: 兩種好友通知與 `activity_created` 依後端 actor 契約顯示方形行為者頭像，並在資料或圖片不可用時安全退回該通知原有圖示。

### Modified Capabilities

(none)

## Impact

- Affected specs: `friend-notification-avatar`
- Affected code:
  - Modified: `src/components/AlertsPage.vue`
  - Modified: `src/__tests__/AlertsPage.test.js`
- External dependency: BuJoBackend 的 `GET /api/notifications` 對 `activity_created` 回傳由既有 `activity.creator` 組成的 `actor: { id, displayName, avatarUrl } | null`；其他活動生命週期與一般通知維持 `actor: null`。舊後端或缺少 actor 時，新前端安全退回原本圖示。
- No schema, migration, new endpoint, or dependency changes.
