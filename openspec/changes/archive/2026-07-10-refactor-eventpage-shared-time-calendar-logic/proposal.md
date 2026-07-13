## Why

`EventPage.vue` 裡有兩組邏輯橫跨情境一/二/三/四各自重複實作了一次：開始/結束時間過濾（4 組、共 8 個 computed/function）跟月曆 42 格網格生成（3 個 computed）。四情境的過濾規則跟網格數學本質上完全一樣，只差在讀哪個 ref、疊加哪個情境專屬欄位，現在改一個地方要同步改 3-4 處，容易漏改；情境三、四之後如果要擴充新功能，也會被迫在 4 份幾乎一樣的程式碼上各改一次。這次先把重複邏輯抽成共用函數，跟情境三、四未來要不要做 range 報名是分開的兩件事，不互相依賴。

順帶發現：月曆格子（哪天可選、哪天停用、哪天是候選/已設定/編輯中）目前完全沒有對應的規格文件，趁這次重構把這個既有行為正式補上規格。開始/結束時間過濾的規格需求已經記錄在既有的活動時段選單驗證規格裡（涵蓋情境 B/C/D，且文字已提及情境 A 是既有一致行為），這次不用再改。

## What Changes

- 新增 `excludePastHoursIfToday(isTargetToday, options)`、`excludeNotAfterStart(startTime, options)` 兩個純函數，取代四情境（A/B/C/D）各自重複的開始/結束時間過濾邏輯
- 新增 `buildMonthGridCells(month)` 純函數，取代三個月曆格子 computed（`dateCells`/`candidateDateCells`/`scenario4DateCells`）裡重複的 42 格網格建構邏輯，各情境專屬欄位（`isSelected`/`isCandidate`/`isEditing`/`isConfigured`/`isDisabled`）維持在各自的 computed 裡疊加
- 純重構，不改變任何現有行為、不改變任何欄位形狀或使用者可見的畫面/互動
- 補上月曆格子的規格文件（新 capability），把既有但從未正式記錄過的行為（哪天停用、哪天標示為已選/候選/已設定/編輯中）寫下來

## Capabilities

### New Capabilities

- `event-form-calendar-grid`：建立活動表單月曆格子的既有行為（今天以前的日期停用、各情境疊加自己的選取/候選/設定狀態），這次重構前完全沒有規格文件記錄過

### Modified Capabilities

無——開始/結束時間過濾的規格需求本身沒有變化，既有的活動時段選單驗證規格不需要修改。

## Impact

- Affected code:
  - Modified: `src/components/EventPage.vue`
  - Modified: `src/__tests__/EventPage.test.js`
