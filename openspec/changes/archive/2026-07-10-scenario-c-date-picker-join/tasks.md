## 1. AvailabilityPickerModal：日期-only 與非連續候選日期

- [x] 1.1 寫前端失敗測試：`Scenario C join uses a date-only availability picker`，傳入 `dateOnly` 時不渲染時間面板與「指定時段／新增時段」操作
- [x] 1.2 實作「Mode C picker 沿用 AvailabilityPickerModal 但新增 allowedDates/dateOnly」：新增 `allowedDates`、`dateOnly` props；`dateOnly` 隱藏時間面板，summary 文案改為日期選取語意
- [x] 1.3 寫前端失敗測試：`allowedDates` 只允許非連續候選日期可選，非候選日期呈現 disabled 且點擊不會進入 `selectedDates`
- [x] 1.4 實作 `allowedDates` 日曆限制；跨月候選日期可透過月切換或候選日期涵蓋月份檢視，不重新刻 EventPage 的 `buildMonthGridCells`
- [x] 1.5 寫前端失敗測試：`Participant confirms without dates`，date-only 模式未選日期按確認時 modal 保持開啟並顯示 inline error
- [x] 1.6 實作 date-only 空選擇驗證；一般 Mode B/D 時段模式維持既有重疊驗證與 confirm 行為

## 2. ActivityDetailModal：Mode C picker 分流與 payload 轉換

- [x] 2.1 寫前端失敗測試：`Scenario C join uses a date-only availability picker`，非創建者在 `schedule_variant: 'find_date'` 且 `recruiting` 點「報名參加」會開啟 `AvailabilityPickerModal`，並傳入 `allowedDates` / `dateOnly`
- [x] 2.2 實作 Mode C join 分流（覆蓋 Requirement: Scenario C activities are detected from schedule variant；Design: 後端新增 schedule_variant 讓前端穩定辨識 Mode C）：`isScenarioCMode` 以 `activity.schedule_variant === 'find_date'` 判斷；未提供 `schedule_variant` 時維持舊 checkbox 流程
- [x] 2.3 寫前端失敗測試：`Participant confirms selected dates`，選取日期會依 `candidate_slots[*].slot_start` 對照成 `candidateSlotIds`
- [x] 2.4 實作「Mode C confirm 轉回 candidateSlotIds 而不是 ranges」：新增日期到 slot id 對照與 `handleScenarioCDateConfirm`，送出 `{ candidateSlotIds }`
- [x] 2.5 寫前端失敗測試：`Scenario C joined state shows selected dates`，已報名 recruiting 活動顯示「你選擇的日期」並提供「修改日期」入口
- [x] 2.6 實作已報名 Mode C recruiting 的修改入口（覆蓋 Requirement: Scenario C participants can start date revision during recruiting；Design: Mode C recruiting 重選由前端重開 picker 並送 candidateSlotIds）：按「修改日期」開啟 date-only picker 並預填目前 `is_selected` 的候選日期
- [x] 2.7 寫前端失敗測試：`Joined participant views frozen scenario C activity`，`voting` / `confirmed` 狀態顯示已選日期但不提供修改入口
- [x] 2.8 實作 frozen 狀態顯示：`voting` / `confirmed` 僅唯讀列出已選日期，footer 不顯示可修改 action

## 3. 驗證、文件邊界與回歸

- [x] 3.1 執行前端單元測試：`npx vitest run src/__tests__/AvailabilityPickerModal.test.js src/__tests__/ActivityDetailModal.test.js`
- [x] 3.2 執行前端完整測試：`npm run test:run`
- [x] 3.3 執行前端建置：`npm run build`
- [x] 3.4 確認 proposal/design/spec/tasks 沒有把後端實作、Mode D 修正、Mode B/C/D 建立者決選體驗重設、AvailabilityPickerModal 外觀換皮納入本 change 的實作範圍

## 4. Mode C picker 需要補齊日期語意與固定時間提示

- [x] 4.1 寫前端失敗測試：`Scenario C detail opens date-only picker instead of checkbox flow`，未報名的 Mode C 參與者在 ActivityDetailModal 不再看到 checkbox list，點「報名參加」會開啟 `AvailabilityPickerModal`，並傳入 `dateOnly=true` 與 `allowedDates`
- [x] 4.2 實作 ActivityDetailModal 的 Mode C 日期語意與已選摘要：未報名顯示日期選取語意，已報名顯示日期摘要；`recruiting` 仍保留「修改日期」，`voting` / `confirmed` 保持唯讀。精確文案與 chip 外觀列為人工驗收，不新增 brittle 文案/樣式測試
- [x] 4.3 寫前端失敗測試：`Date-only picker shows activity time and hides time controls`，Mode C picker 在 `dateOnly=true` 時顯示固定活動時間或整日資訊，且不渲染時間面板、時間下拉、指定時段或新增時段操作
- [x] 4.4 實作 Mode C 固定時間提示：ActivityDetailModal 從 `candidate_slots` 推導統一時間或整日資訊並傳給 AvailabilityPickerModal；AvailabilityPickerModal 在 `dateOnly=true` 時用日期語意標題與活動時間 meta bar 呈現
- [x] 4.5 寫前端失敗測試：`Date-only picker keeps confirmation blocked without dates and summarizes selected dates`，空選擇按確認時 modal 不關閉；選取候選日期後 summary 顯示選取日期並呈現已選天數。chip 顏色、hover、border、間距不寫自動測試
- [x] 4.6 實作 date-only summary 與確認區計數：保留 `allowedDates` disabled 行為，新增已選天數顯示；未選日期按確認時 modal 不關閉，inline error 文案使用日期語意
- [x] 4.7 人工驗收 Mode C UI（覆蓋 Design: 測試策略：關鍵行為自動測，純視覺與精確文案人工驗收）：確認詳情頁文案、picker 標題、活動時間 meta bar、日期 chip、已選天數、disabled 日期視覺狀態符合討論方向，且不把此任務擴大成 AvailabilityPickerModal 外觀換皮
- [x] 4.8 執行回歸：`npm run test:run -- src/__tests__/AvailabilityPickerModal.test.js src/__tests__/ActivityDetailModal.test.js`
- [x] 4.9 執行前端建置：`npm run build`
