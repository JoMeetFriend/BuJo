## Why

使用者在測試「揪團報名」流程時，回報 `AvailabilityPickerModal.vue`（選取有空時間彈窗）的時間選取下拉選單有 3 個影響操作的顯示/互動問題：選單會超出彈窗卡片本身的高度、在選單自己的選項列表上捲動會被誤判成使用者在捲背景而整個關掉、以及點 X 關閉彈窗後重新開啟會跳回空白的「選取日期」畫面而不是原本設定好的預設時段。這些都直接卡住使用者選取時間、完成報名，需要立即修正。

## What Changes

- `computePickerPosition()` 的邊界計算從整個瀏覽器視窗改成觸發按鈕所在的彈窗卡片（`.bujo-modal-panel`），避免選單在彈窗變緊湊時飄出卡片邊界疊在背景上
- `handleScrollClose()` 新增排除規則：捲動事件如果發生在選單自己的 `.time-picker-panel` 內（使用者在滾動小時選項列表），不觸發關閉；只有捲動彈窗以外的背景才會關閉選單
- `close()` 改成依 `props.fixedDate` 是否存在條件式重設狀態：有 `fixedDate` 時重新開啟會回到該日期的預設時段（沿用時段範圍或整天有空），不會再清空成「無日期可選」的空白畫面（因為 `fixedDate` 模式本來就沒有日曆可以重新選日期）

## Capabilities

### New Capabilities

(無)

### Modified Capabilities

- `scenario-b-availability-reporting`: 新增時間選取下拉選單的定位邊界、捲動時的關閉判斷、彈窗關閉重開後狀態還原這幾項行為要求

## Impact

- Affected code:
  - Modified: `src/components/AvailabilityPickerModal.vue`
  - Modified: `src/__tests__/AvailabilityPickerModal.test.js`
