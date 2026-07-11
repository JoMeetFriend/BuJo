## Why

目前 ALERTS 未讀數徽章使用與側欄選取提示相近的淡綠色，提醒層級不足，使用者不容易在掃視導覽列時辨識新通知。需要在維持 BuJo 低飽和紙張／手帳風格的前提下，提高桌機與手機未讀徽章的可見性。

## What Changes

- 將桌機側邊欄與手機底部導覽列共用的 ALERTS 未讀徽章改為印泥暗紅底與白字。
- 使用固定的通知語意色票，並以紙色描邊、輕微硬邊陰影與 18px 最小尺寸維持手帳印章質感及小字可讀性。
- 補強測試，明確驗證桌機與手機兩個 ALERTS 入口同步顯示相同的未讀數與 `9+` 上限。
- 保留現有未讀計數、同步、0 則隱藏及 API 行為。

## Non-Goals

- 不修改通知列表內容、通知類型、未讀同步時機或後端 API。
- 不新增動畫、閃爍、漸層或一般系統亮紅色錯誤樣式。
- 不重設側欄圖示、導覽排版、標籤文字或選取狀態。

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `notification-unread-badge`: 增加桌機與手機未讀徽章的高對比印泥暗紅視覺要求，並要求兩個導覽入口顯示一致。

## Impact

- Affected specs: notification-unread-badge
- Affected code:
  - Modified: src/assets/main.css, src/components/AppSidebar.vue, src/__tests__/AppSidebar.test.js
  - New: (none)
  - Removed: (none)
- APIs and dependencies: no changes
