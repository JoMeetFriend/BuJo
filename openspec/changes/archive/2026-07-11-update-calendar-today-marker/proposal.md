## Summary

將月曆中「今天」的聚焦方式由整格底色與框線，調整為日期數字後方的柔和紅色圓形，使提示更集中並符合 BuJo 的手帳視覺。

## Motivation

目前整格淡紫底與綠色內框的今日標記視覺範圍較大，容易與格子 hover 或活動內容競爭。新的緊湊日期標記能保留辨識度，同時降低對月曆內容的干擾。

## Proposed Solution

- 今天的日期數字以由既有通知紅色混合白色而成的柔和紅色圓形呈現，不顯示額外文字。
- 今日日期沿用其他日期的字級與原始左上位置，圓形只作為數字後方的裝飾背景。
- 日期列使用相同的水平與垂直內距：手機 4px、桌面 6px；今日圓形縮為手機 20px、桌面 22px，避免在不同格子尺寸下顯得擁擠。
- 移除今天整格的專用底色與內框，保留一般格子的 hover、鍵盤操作、活動條與多筆活動計數行為。
- 為今天的日期格加入標準無障礙目前日期語意。
- 補上元件測試，驗證今日格與非今日格的標記差異。

## Non-Goals

- 不調整日期計算、月份切換、日期詳情視窗或活動資料處理。
- 不改變其他日期、活動狀態與通知使用的色彩語意。
- 不保留今日整格的淡色背景。
- 不在日期旁顯示「日」或其他今日文字標籤。

## Capabilities

### New Capabilities

- `calendar-today-marker`: 定義月曆中目前日期的視覺標記與無障礙語意。

### Modified Capabilities

(none)

## Impact

- Affected specs: calendar-today-marker
- Affected code:
  - Modified: src/components/CalendarMain.vue, src/__tests__/CalendarMain.test.js
  - New: openspec/specs/calendar-today-marker/spec.md
  - Removed: none
