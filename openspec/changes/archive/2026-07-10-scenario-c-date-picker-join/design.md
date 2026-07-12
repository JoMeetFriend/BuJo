## Context

Mode B 已完成「range 模式 + AvailabilityPickerModal」報名流程，但 Mode C 仍停留在 slot 模式 checkbox：創建者建立活動時挑選非連續候選日期與統一時間，參與者在詳情頁勾選候選時段。這能寫入資料，但使用者心智是「選哪幾天可以」，不應被迫理解候選時段。

目前 `availability_mode` 只有 `slot` / `range`，無法穩定區分 Mode C 與 Mode D；兩者都是 `slot` 且 `requires_voting=true`。前端需要依賴後端提供可直接消費的 `schedule_variant`，避免用候選 slot 形狀猜測模式。前端最新重構已把 EventPage 的時間過濾與月曆格子抽為共用純函數；本 change 不回頭新增重複邏輯。

## Goals / Non-Goals

**Goals:**

- Mode C 報名改用日期-only picker，隱藏時間面板，只顯示可選候選日期
- Mode C 報名文案改成日期語意，避免讓參與者以為需要填寫可用時段
- Mode C picker 顯示建立者設定的固定活動時間或整日資訊，但不可開放參與者編輯時間
- 保留 Mode C 非連續候選日期能力
- 保留 Mode C 既有後端 slot 資料模型，picker confirm 後轉成 `candidateSlotIds`
- Mode C 已報名者在 `recruiting` 期間可重新選日期；進入 `voting` / `confirmed` 後凍結
- 將後端 API 支援需求記錄為依賴，不在前端計畫中實作後端

**Non-Goals:**

- 不把 Mode C 遷移到 `ActivityAvailabilityRange`
- 不修改 Mode D 報名流程
- 不重設 Mode B/C/D 建立者決選體驗
- 不做 `AvailabilityPickerModal` 外觀換皮
- 不改 EventPage 的 Mode C 建立活動 UI 與 payload 形狀

## Decisions

### 後端新增 schedule_variant 讓前端穩定辨識 Mode C

前端依賴後端 `GET /api/activities/:id` 回傳 `schedule_variant`，建議值：

- `fixed`：Mode A
- `find_time`：Mode B
- `find_date`：Mode C
- `find_date_time`：Mode D

前端用 `schedule_variant === 'find_date'` 判斷是否開日期-only picker，不用再從 `availability_mode`、`candidate_slots` 數量或 slot 是否同時間推測。替代方案是前端猜測候選 slot 形狀；放棄原因是 Mode C 與某些 D 活動都可能呈現多日期 slot，猜測會讓未來 D 修正時互相踩到。

### Mode C picker 沿用 AvailabilityPickerModal 但新增 allowedDates/dateOnly

`AvailabilityPickerModal` 新增 `allowedDates` 與 `dateOnly` props。`allowedDates` 為 `YYYY-MM-DD` 字串陣列；有設定時，日曆只允許這些日期可選，其他日期停用。`dateOnly` 為 true 時隱藏時間面板，summary 顯示已選日期，confirm 回傳的每個 entry 仍維持 `{ date, allDay, timeRanges }`，其中 `allDay=true`、`timeRanges=[]`。

這保留 Mode B 已建立的 modal 外殼、日期選取狀態、summary 與 confirm 事件，不新增第二個 Mode C 專用彈窗。替代方案是 ActivityDetailModal 自己刻一個日期 picker；放棄原因是會重複日曆狀態與 modal 行為，之後外觀換皮也會多一個 surface。

### Mode C picker 需要補齊日期語意與固定時間提示

目前 date-only 模式已能隱藏時間面板，但使用者體驗還不完整：標題仍是「選取有空時間」，上方仍顯示「活動日期範圍」，詳情頁也只顯示「你選擇的日期」。這些文案沒有完整表達 Mode C 的心智模型。

本 change 需要補齊以下 UI contract：

- ActivityDetailModal：未報名的 Mode C 參與者應看到「選擇你方便的日期」與「尚未選擇日期」；已選/已報名狀態應顯示「你已選擇：7/12、7/15」這類日期摘要
- AvailabilityPickerModal：`dateOnly=true` 時標題應為「選擇可參加日期」或等價日期語意，不使用「有空時間」
- AvailabilityPickerModal：`dateOnly=true` 時上方 meta bar 應顯示建立者設定的固定活動時間，例如 `活動時間：下午 7:00 – 下午 9:00`；若候選 slot 為整日，顯示 `活動時間：整日`
- AvailabilityPickerModal：`dateOnly=true` 時只高亮/框選 `allowedDates`，非候選日期維持 disabled 視覺與不可點擊行為
- AvailabilityPickerModal：已選日期摘要以 chip 顯示，確認區同時顯示 `已選 N 天`
- AvailabilityPickerModal：未選日期按確認時不關閉 modal，保留目前 inline error 行為，文案為「請至少選擇一天」或等價日期語意

固定時間提示由前端從 Mode C 的 `candidate_slots` 推導：若所有候選 slot 都是 `all_day=true`，顯示整日；否則取統一的 `slot_start` / `slot_end` 時分格式化。Mode C 的後端資料模型仍是 slot，因此不新增後端欄位。

### 測試策略：關鍵行為自動測，純視覺與精確文案人工驗收

Mode C 的補齊包含資料流、互動狀態與 UI 呈現。自動測試只覆蓋容易回歸且會破壞流程的行為，不為每個精確文案、chip 樣式、disabled 顏色、hover 效果或排版寫測試，避免測試過度脆弱。

需要自動測試的部分：

- ActivityDetailModal 在 `schedule_variant === 'find_date'` 時不走舊 checkbox 流程，點報名會開 date-only picker
- AvailabilityPickerModal 在 `dateOnly=true` 時隱藏時間面板，且顯示固定活動時間或整日資訊
- `allowedDates` 非候選日期不可被選取
- 空選擇按確認時 modal 不關閉，且有 inline validation
- 選取日期後仍能轉成正確 `candidateSlotIds`
- `recruiting` 已報名可修改，`voting` / `confirmed` 不可修改

只需要人工驗收的部分：

- 精確文案是否符合產品語氣，例如「選擇你方便的日期」或等價日期語意
- chip 的顏色、border、hover、間距、圓角與視覺層次
- 確認區「已選 N 天」的呈現位置與排版
- disabled 日期的視覺樣式是否足夠清楚
- modal 標題與 meta bar 的字距、留白與整體觀感

### Mode C confirm 轉回 candidateSlotIds 而不是 ranges

ActivityDetailModal 建立 `date -> candidateSlotId` 對照表：以 `candidate_slots[*].slot_start` 的本地日期字串作為 key。Mode C picker confirm 後，將選取日期轉成對應 `candidateSlotIds` 呼叫既有 `POST /:id/join` slot 分支。

不改成 `{ ranges }` 是為了讓本 change 聚焦在報名體驗，而不是資料模型遷移。Mode D 後續會再評估是否正式共用 `ActivityAvailabilityRange`。

### Mode C recruiting 重選由前端重開 picker 並送 candidateSlotIds

前端在 `schedule_variant === 'find_date'`、`status === 'recruiting'`、`has_joined === true` 時顯示「修改日期」入口。使用者重新確認日期後，前端仍送 `{ candidateSlotIds }`。覆寫既有 availability 的資料一致性由後端獨立計畫負責；前端只負責在 `voting` / `confirmed` 不提供修改入口。

## Risks / Trade-offs

- **[Risk]** `schedule_variant` 需要前後端同步；若後端未部署，前端無法辨識 Mode C。→ **Mitigation**：前端只在 `schedule_variant === 'find_date'` 時啟用新流程，其餘維持現有 slot checkbox，並把後端支援拆成獨立後端計畫。
- **[Risk]** `allowedDates` 跨月時，現有 `AvailabilityPickerModal` 只有基於 `rangeStart` 的單月畫面。→ **Mitigation**：Mode C 先用候選日期最早/最晚值設定 range，並新增月切換或顯示候選日期涵蓋月份；測試覆蓋跨月候選日期。
- **[Risk]** Mode C 重選若在狀態轉換後發生會影響決選。→ **Mitigation**：後端以活動狀態作最後防線，只允許 `recruiting` 覆寫；`voting`/`confirmed` 回 400。
- **[Trade-off]** 本 change 讓 Mode C UI 使用 picker，但資料仍是 slot。→ 這保留小範圍與低風險；Mode D 之後再決定是否把 C/D 一起遷移到 range。

## Migration Plan

1. 後端先完成並部署 `scenario-c-date-picker-api` 計畫，提供 `schedule_variant` 與 Mode C recruiting 重選。
2. 前端部署 Mode C 日期-only picker 分流。
3. 若後端尚未部署，前端會落回既有 checkbox 流程，不破壞現有報名。

## Open Questions

（無）
