## 1. AvailabilityPickerModal：dateWindows 改成單一物件、窗口限制與驗證

- [x] 1.1 `dateWindows` prop 形狀從 `{date: [{start,end,slotId}]}` 改成 `{date: {start,end,slotId}}`（單一物件，不是陣列），`hourOptions` 改成依 `activeDate` 直接讀該日期的單一窗口範圍，取代原本的窗口聯集邏輯（design: hourOptions 改成依 activeDate 查單一 dateWindows 物件；spec: AvailabilityPickerModal restricts time selection to the per-date candidate window）
- [x] 1.2 `defaultDayValue()` 的 dateWindows 分支改成回傳一筆對應該日期唯一窗口完整範圍的 range，不是「每個窗口各一筆」（design: defaultDayValue 在 dateWindows 模式下自動帶入該日期唯一窗口的完整範圍，而非「整天有空」；spec: New date selection defaults to full window coverage in dateWindows mode）
- [x] 1.3 `isAllDay(dateKey)` 判斷條件從 `props.dateWindows[dateKey]?.length` 改成 `!!props.dateWindows[dateKey]`（物件存在即可，不能再用陣列 `.length` 判斷）
- [x] 1.4 `handleConfirm()` 的 `findOutOfWindowDate` 檢查簡化成「該筆 range 是否完整落在該日期唯一窗口內」，不用再處理「跨窗口間空隙」的情況（design: handleConfirm 新增窗口 fit 驗證，跟現有重疊檢查並列；spec: Sub-range confirmation is rejected when it falls outside the window for that date）
- [x] 1.5 測試：單一窗口時下拉選單只提供窗口內的小時（Window restricts selectable hours）
- [x] 1.6 測試：新選一個有 dateWindows 的日期，預設帶入該窗口的完整範圍（Selecting a candidate date pre-fills the window's full range）
- [x] 1.7 測試：選取超出窗口範圍的時段時 `handleConfirm` 不送出、顯示對應日期的錯誤（Range extending past the window end is rejected）
- [x] 1.8 測試：完整落在窗口內的子區間可以正常送出（Range fully inside the window is accepted）

## 2. ActivityDetailModal：情境四加入/修改 wiring

- [x] 2.1 新增 `isScenarioDMode`、`scenarioDDateWindows`（依 `candidate_slots` 分組成單一物件形狀的 dateWindows，一個日期對一個窗口）、`scenarioDAvailableCandidateDates`、`scenarioDInitialRanges`
- [x] 2.2 `handleJoin()` 新增 `isScenarioDMode` 分支呼叫 `openScenarioDPicker()`，情境四完全不落到通用 checkbox 分支（Scenario D participants use only the availability picker, never a checkbox）
- [x] 2.3 `handlePickerConfirm` 新增 `handleScenarioDConfirm`，把 picker 回傳的 ranges 對照 `scenarioDDateWindows` 反查回 `slotId`，組成 `candidateSlotRanges` 連同 `candidateSlotIds` 一併送出（Scenario D join submission maps picker ranges back to candidate slot IDs）
- [x] 2.4 測試：點「報名參加」對情境四活動開啟 picker 而非顯示 checkbox（Joining opens the picker instead of showing checkboxes）
- [x] 2.5 測試：`handleScenarioDConfirm` 正確把 range 對應回 slotId 並送出 `candidateSlotRanges`（Confirmed ranges map to their originating candidate slots）

## 3. ActivityDetailModal：加入前後的文字與狀態顯示

- [x] 3.1 加入前選項區塊新增 `isScenarioDMode` 分支（比照情境三的「你已選擇的日期」/「選擇你方便的日期」模式，改成時段用字），確認不會出現 checkbox（Pre-join, nothing selected yet）
- [x] 3.2 加入後（voting/confirmed 狀態）新增 `isScenarioDMode` 摘要區塊，顯示已選候選時段（Post-join summary during voting or confirmed status）
- [x] 3.3 底部按鈕：「報名參加」disable 條件納入 `isScenarioDMode`；已報名後只新增**一顆**「修改報名時段」按鈕重開 picker，不比照情境三切成兩顆按鈕（design: ActivityDetailModal 只用一顆按鈕涵蓋「加入」跟「修改」；spec: Modifying after joining opens the same picker）
- [x] 3.4 測試：已報名後進入 voting/confirmed 狀態，正確顯示已選候選時段摘要（Scenario D exposes dedicated pre-join and post-join summary text）
- [x] 3.5 測試：已報名後「修改報名時段」按鈕出現、重開 picker 帶入 `scenarioDInitialRanges` 預填

## 4. ActivityDetailModal：建立者決策畫面情境四巢狀交集顯示

- [x] 4.1 決策區塊的 `!isRangeMode` 分支新增情境四子分支：對 `activity.decision_candidates` 每筆候選時段，各自渲染「完全重疊」/「部分重疊」子清單（讀該筆自己的 `perfect_overlap`/`partial_overlap`），沿用情境二 `perfectOverlapCandidates`/`partialOverlapCandidates` 已有的 radio + `slotText` + 票數呈現方式（design: 建立者決策畫面情境四新增巢狀交集顯示，比照情境二的呈現模式；spec: Creator decision view shows nested overlap ranking per candidate slot for Scenario D）
- [x] 4.2 新增 `selectedDecisionSlot: {candidateSlotId, slotStart, slotEnd} | null` 取代情境四場景下單純的 `selectedDecisionSlotId`，選定巢狀清單裡的某個窄窗口時一併記錄外層候選時段 id
- [x] 4.3 `confirmFormation` 的送出邏輯，情境四改成送 `{candidateSlotId, slotStart, slotEnd}`，不是單純 `{candidateSlotId}`（spec: Confirming Scenario D formation submits the candidate slot and the chosen narrow window）
- [x] 4.4 測試：兩個候選時段各自有自己的 perfect_overlap/partial_overlap 資料時，決策區塊渲染兩組獨立的巢狀清單（Each candidate slot shows its own overlap breakdown）
- [x] 4.5 測試：選定某個候選時段底下的窄窗口並確認時，正確送出 `candidateSlotId`+`slotStart`+`slotEnd`（Confirming a selected segment submits all three fields）

## 5. EventPage.vue：候選時段建立簡化成一天一組

- [x] 5.1 移除 `addCandidateTimeSlot`/`removeCandidateTimeSlot` 函式與「＋新增候選時段」按鈕，`candidateSlots` 資料結構從 `[{date, timeSlots: [...]}]` 簡化成 `[{date, startTime, endTime}]`（design: EventPage.vue 拿掉「＋新增候選時段」，一天一組時段；spec: EventPage candidate slot creation is limited to one slot per date for Scenario D）
- [x] 5.2 送給後端 `dateSlots` 的 payload 組裝邏輯同步調整成讀取簡化後的資料結構
- [x] 5.3 測試：已設定時段的候選日期，UI 上不會出現「新增另一組時段」的控制項（No add-slot control is available for an already-configured date）

## 6. AvailabilityPickerModal：時間選取窗口邊界防呆（B/C/D 共用，早期討論但漏未排入本次 tasks 的補件）

- [x] 6.1 新增情境無關的 `windowBoundsFor(dateKey)`，`dateWindows`（情境四單一窗口）跟全域 `timeWindowStart`/`timeWindowEnd`（情境二/三）共用同一套邊界查詢，`hourOptions`/`startHourOptions` 改用這個統一查詢
- [x] 6.2 `startHourOptions` 排除窗口終點本身，選了終點當開始時間不會有合法結束時間可搭配的情況從源頭排除
- [x] 6.3 `selectRangeStart` 自動帶入結束時間（+1 小時）改成 clamp 在窗口終點內，不再產生超出候選時段範圍的預設值
- [x] 6.4 `addRange()`（＋新增時段）改用 `windowBoundsFor` 而不是只認全域 `timeWindowStart`/`timeWindowEnd`，情境四用「＋新增時段」也要感知窗口邊界
- [x] 6.5 `findOutOfWindowDate` 改名為 `findOutOfWindowDates`，用 `windowBoundsFor` 取代只認 `dateWindows`，讓情境二/三的全域窗口送出前也有邊界檢查，不用只靠後端 400
- [x] 6.6 `findOverlapConflictDate` 改名為 `findOverlapConflictDates`，兩個檢查函式都回傳所有有問題的日期（不只找第一個），`handleConfirm` 的 `confirmError` 一次列出全部有問題的日期
- [x] 6.7 已選清單的 chip 新增錯誤標記（`problemDates` computed），選取當下就能看到哪些日期有問題，不用等按下確認
- [x] 6.8 測試：候選時段窗口 01:00-07:00 時，開始時間選單不能選到窗口終點、選最後一個合法小時時結束時間正確 clamp 在窗口內
- [x] 6.9 測試：情境二/三（全域 timeWindow）選超出範圍的時段，送出前也會被攔下
- [x] 6.10 測試：兩個日期同時都有問題時，`confirmError` 一次列出兩個日期
- [x] 6.11 測試：有問題的日期，已選清單的 chip 有錯誤標記，沒問題的日期沒有

## 7. 收尾驗證

- [x] 7.1 跑 `npx vitest run` 全套前端測試，確認無回歸
- [x] 7.2 `npx vite build` 確認無語法/樣板錯誤
- [ ] 7.3 手動流程驗證：建立一個至少兩個候選日期的情境四活動，走一次加入→查看摘要→修改→（建立者）查看巢狀決策清單→確認成團的完整流程

## 8. 跨情境 UI 配色一致性修復（情境四手動驗證過程中額外發現，見 proposal.md/design.md 的 Addendum）

- [x] 8.1 新增 `--bujo-day-selected: #daebeb`（`src/assets/main.css`），`AvailabilityPickerModal.vue` 的 `dayClass()`、`EventPage.vue` 的 `dateButtonClass()`（情境一/二單一日期）、`candidateDateButtonClass()`（情境三候選日期）、`scenario4DateButtonClass()`（情境四候選日期，僅 `isConfigured` 分支）四個函式的「已選」狀態改用同一個變數，取代原本各自獨立的綠/黑/黃三種顏色；「目前編輯中／作用中」的黑色狀態（`isEditing`、作用中 chip）不受影響（design: 「已選日期」統一成一個共用 CSS 變數，不沿用 `--bujo-accent`）
- [x] 8.2 `EventPage.vue` 的 `scenarioButtonClass()`（日期確定了嗎/時間確定了嗎，已確定/大概範圍/讓大家選 切換鈕）active 狀態改用 `--bujo-day-selected`，取代原本的黑底白字
- [x] 8.3 修復 `EventPage.vue` 六個時間下拉選單（情境一/二單一時間、情境三統一開始/結束時間、情境四候選時段開始/結束時間）選中時間文字不可見的問題，改成 `bg-[var(--bujo-day-selected)] text-[var(--bujo-ink)]`，跟 base class 一致不再互相覆蓋；`AvailabilityPickerModal.vue` 報名時間下拉選單（`from`/`to` 小時清單）比照同步改色（design: 時間下拉選單選中文字不可見，根因是同一元素上兩個文字顏色 class 互相覆蓋）
- [x] 8.4 更新 `src/__tests__/EventPage.test.js` 既有斷言舊顏色 class（`bujo-ink`/`bujo-card-yellow`）字串的三個測試，改成斷言 `bujo-day-selected`（Selected date/time cells across scenarios share the same day-selected color token）
- [x] 8.5 `DateEventsModal.vue`：當天沒有行程時，把純文字提示「點右上角 ＋ 新增」改成可點擊的 + 圖示按鈕，直接放在提示文字下方、無邊框、hover 時觸發放大效果（`hover:scale-125`）；當天已有行程時，+ 按鈕維持在標題列原本的位置（只在 `events.length > 0` 時顯示），新增行程的能力兩種情況下都要保留（Empty-state add button is a borderless icon that scales on hover; populated-list add button stays in the header）
- [x] 8.6 把 `ActivityDetailModal.vue` 卡片狀態色（`mine-recruiting`/`mine-confirmed`/`joined`/`recruiting`/`confirmed`/`neutral` 六種）的計算從呼叫端外部綁定，改成元件內部用自己 fetch 到的 `activity` 物件算成 `computed`、綁在元件根元素上；移除 `ActivityView.vue` 裡重複的 `focusCardClass()` function 與外部綁定；`DateEventsModal.vue` 開啟 `ActivityDetailModal.vue` 時卡片現在會正確依活動狀態顯示對應顏色，不再永遠落回寫死的預設藍色（design: 卡片狀態色計算搬進 `ActivityDetailModal.vue` 內部，不再要求呼叫端外部綁定）
- [x] 8.7 跑 `npx vitest run` 全套前端測試（201 個，含更新後的 8.4）與 `npx vite build`，每個子項改動後都各自重新驗證一次，確認無回歸
