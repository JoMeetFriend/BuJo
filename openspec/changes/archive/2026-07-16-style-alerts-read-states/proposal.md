## Why

通知列目前只靠左側 accent border 區分未讀，已讀與未讀的背景、文字與提示層次不夠明顯。加入一致的狀態視覺可讓使用者快速掃描，同時維持 BuJo 的方角紙張風格。

## What Changes

- 未讀通知使用淡綠紙張底色、accent 邊框／圖示、較粗深色文字與脈衝提示點。
- 已讀通知使用原本的紙張灰白底、較淡文字與 muted 圖示。
- 點擊標為已讀時，背景、邊框、文字與圖示平滑切換。
- reduced motion 時取消未讀提示點脈衝。
- 通知項目明確保持方角，不加入圓角、浮起或位移效果。
- 保留首次載入動畫、API、導頁、好友操作與左滑刪除行為。

## Capabilities

### New Capabilities

- `alerts-read-state-visuals`: 定義通知列未讀／已讀的方角視覺狀態、切換效果與 reduced-motion 行為。

### Modified Capabilities

(none)

## Impact

- Affected specs: alerts-read-state-visuals
- Affected code:
  - Modified: src/components/AlertsPage.vue
  - Modified: src/__tests__/AlertsPage.test.js
  - New: openspec/changes/style-alerts-read-states/specs/alerts-read-state-visuals/spec.md
  - New: openspec/changes/style-alerts-read-states/design.md
  - New: openspec/changes/style-alerts-read-states/tasks.md
  - Removed: none
