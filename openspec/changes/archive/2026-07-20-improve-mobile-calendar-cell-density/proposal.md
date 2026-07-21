## Summary

改善手機版七欄月曆日期格的資訊密度，避免首筆活動標題與其餘活動數量互相擠壓。

## Motivation

手機版每個日期格寬度有限，目前活動標題占用下方內容列，而絕對定位於右下角的 `+N` 會壓在同一視覺區域，導致標題更難辨識。調整後應保留首筆活動名稱與完整日期清單入口，同時維持六週月曆、今日標記及桌機配置。

## Proposed Solution

- 在 640px 以下將 `+N` 移到日期格右上角並縮減其視覺佔用。
- 縮減手機活動列、活動條及狀態點的水平 chrome，讓一行截斷標題取得更多寬度。
- 維持每格只顯示最早一筆活動、單筆不顯示 `+N`、點擊日期開啟完整清單的既有行為。

## Capabilities

### New Capabilities

- `mobile-calendar-cell-density`: 定義手機月曆日期格內日期、首筆活動標題與其餘活動數量的緊湊且不互相遮擋的呈現。

### Modified Capabilities

(none)

## Impact

- Affected specs: mobile-calendar-cell-density
- Affected code:
  - Modified: src/components/CalendarMain.vue
  - Modified: src/__tests__/CalendarMain.test.js
  - New: (none)
  - Removed: (none)
- APIs, data structures, dependencies: unchanged
