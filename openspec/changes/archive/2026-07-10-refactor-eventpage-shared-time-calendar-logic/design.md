## Context

`EventPage.vue` 支援四種建立活動情境（A 固定日期+固定時間、B 固定日期+投票時間、C 投票日期+統一時間、D 投票日期+各自投票時段）。每個情境的表單都需要「開始/結束時間下拉選單過濾」跟「月曆格子生成」，這兩組邏輯在四情境裡各自重複實作，行為幾乎一樣但寫了 4 份。

## Goals / Non-Goals

**Goals:**

- 把時間過濾跟月曆格子生成的重複邏輯各自抽成共用純函數
- 重構前後行為完全一致，包含每個既有測試的斷言結果
- 補上月曆格子目前缺漏的規格文件

**Non-Goals:**

- 不處理情境三、四的 range 報名機制範圍決策（使用者已決定暫緩，跟這次重構無關）
- 不把這兩組函數抽成跨檔案的 composable——目前只有 `EventPage.vue` 一個地方在用，之後如果 `AvailabilityPickerModal.vue` 或其他元件也需要才考慮抽成獨立檔案
- 不改變既有的活動時段選單驗證規格內容——時間過濾的規格需求沒有變化

## Decisions

### 時間過濾抽成 excludePastHoursIfToday 跟 excludeNotAfterStart 兩個純函數

四情境的「開始時間過濾」都是同一個判斷：目標日期是今天時，排除 `new Date().getHours()` 以前的小時，否則回傳完整清單。四情境的「結束時間過濾」都是同一個判斷：有已選的開始時間時，排除不晚於它的小時。差異只在「目標日期是不是今天」這個布林值怎麼算出來（情境一/二/四是單一日期字串比較，情境三是陣列成員判斷 `candidateDates.value.includes(...)`），所以把這個布林值當參數傳進共用函數，而不是把「怎麼判斷是不是今天」也塞進共用函數——後者會讓共用函數要嘛認得四種不同的資料來源（違反單一職責），要嘛還是要在四個呼叫點各自寫一次判斷式（沒有真的消除重複）。

情境一的結束時間過濾多一個額外守衛（`form.endDate !== form.startDate` 時直接回傳完整清單，因為跨日不用比較同一天的開始時間），這個守衛留在情境一自己的 computed 裡，呼叫共用函數前先擋掉，不硬塞進共用函數（其他三個情境都是單一日期，沒有這個概念）。

情境四維持是吃參數的 plain function（`slotStartTimeOptions(date)`/`slotEndTimeOptions(slot)`），不改成 computed——因為情境四同時存在多個獨立候選時段，沒有單一「目前的」時段可以讓 computed 閉包讀取，這個設計是既有的、這次不動。

### 月曆格子抽成 buildMonthGridCells 純函數，只回傳情境無關的基礎欄位

三個月曆 computed 的「42 格網格數學」（算第一天、往前補到週日、產生 42 格、每格的 `key`/`date`/`label`/`isCurrentMonth`/`isToday`）完全相同，這部分抽成 `buildMonthGridCells(month)`。每個情境專屬的欄位（`isSelected`/`isCandidate`/`isEditing`/`isConfigured`/`isDisabled`）留在各自的 computed 裡用 `.map()` 疊加，不塞進共用函數——這些欄位的資料來源（`selectedDate`/`candidateDates`/`candidateSlots`/`editingSlotDate`）都是不同的 ref，共用函數沒有理由知道這些。

`key` 欄位本身就是每格的日期字串（`formatDateValue(date)`），三個情境原本都用同一個變數名稱 `dateValue` 重新算一次同樣的值，這次直接重用 `key`，不多存一個欄位——這是唯一跟「純粹搬動程式碼」略有不同的地方，但不影響回傳物件的欄位形狀（`key` 本來就存在）。

### 補上月曆格子規格，不修改時間過濾規格

時間過濾的規格需求已經記錄在既有的活動時段選單驗證規格裡（涵蓋情境 B/C/D，文字裡也提到情境 A 是既有一致行為），這次重構沒有改變任何時間過濾的規格層級行為，所以不需要修改這份規格。月曆格子的「哪天停用、哪天標示為已選/候選/已設定/編輯中」目前完全沒有規格文件，這次趁重構順便正式記錄下來，屬於補文件債，不是規格層級的行為變更。

## Risks / Trade-offs

- **[Risk]** `candidateDateCells`（情境三）跟 `scenario4DateCells`（情境四）目前完全沒有測試覆蓋，重構這兩個 computed 時如果不小心改變行為，既有測試不會發現。→ **Mitigation**：重構前先補上針對現有行為的測試（tasks.md 會列出），在重構前的程式碼上先確認是綠的，重構後再跑一次確認還是綠的，用這個等價性驗證取代測試覆蓋率不足的問題。
- **[Trade-off]** `buildMonthGridCells` 回傳的基礎欄位跟三個情境各自要疊加的欄位是用 `.map()` + 展開運算子組合，會比原本「一次性在 `Array.from` 的 callback 裡把所有欄位一次算完」多一層物件建立（先建基礎物件，再展開建新物件）。三個 computed 都只在月份切換或候選狀態改變時重新計算（42 格），效能差異可忽略，換取的是重複程式碼消除，判斷這個取捨是值得的。
