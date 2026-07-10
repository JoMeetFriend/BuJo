## Why

情境三（日期讓大家選、時間已確定或整日）目前仍用候選時段 checkbox 報名，使用者看到的是「候選時段」而不是「可參加日期」，跟原本 Mode C 的使用心智不一致。Mode B 已完成 `AvailabilityPickerModal` 接入與共用日期/時間選取邏輯重構，現在可以用較小範圍把 Mode C 報名體驗修正成日期-only picker，同時保留既有 slot 資料模型降低風險。

## What Changes

- Mode C 活動詳情在參與者點「報名參加」時開啟 `AvailabilityPickerModal` 的日期-only 模式，只顯示候選日期，不顯示時間面板
- Mode C 活動詳情與 picker 文案改成日期語意：詳情頁提示「選擇你方便的日期」，picker 標題與摘要不可再讓參與者理解成要填寫可用時段
- Mode C picker 上方顯示建立者設定的固定活動時間（例如 `活動時間：下午 7:00 – 下午 9:00`）或 `活動時間：整日`，但下方仍只提供日期選取，不顯示時間面板
- Mode C picker 只允許選取創建者建立活動時挑選的非連續候選日期，其他日期停用
- Mode C picker 已選日期以 chip 顯示，確認區同步顯示已選天數；未選日期按確認時留在 modal 內顯示 inline validation
- Mode C picker confirm 後將選取日期轉回既有 `candidateSlotIds`，沿用目前 slot 模式的 `POST /:id/join` API，不改成 range 資料模型
- Mode C 已報名者在活動仍為 `recruiting` 時可以重新選日期；進入 `voting` 或 `confirmed` 後凍結，不允許再改
- 前端改以後端提供的 `schedule_variant: 'find_date'` 穩定辨識 Mode C，避免用 `availability_mode: 'slot'` 猜測 Mode C 與 Mode D
- 後端 API 支援（`schedule_variant`、Mode C recruiting 重選、Mode B range cancel cleanup）拆到後端 repo 的獨立計畫處理
- 沿用已完成的 EventPage 共用時間過濾、月曆格子純函數與 `AvailabilityPickerModal` 既有時段重疊驗證，不重新刻元件

## Capabilities

### New Capabilities

- `scenario-c-date-picker-join`: 情境三活動的參與者透過日期-only picker 選擇可參加日期，並可在 recruiting 期間重新提交選擇。

### Modified Capabilities

（無）

## Impact

- Affected specs:
  - New: `scenario-c-date-picker-join`
- Affected code:
  - Modified: `src/components/AvailabilityPickerModal.vue`
  - Modified: `src/components/ActivityDetailModal.vue`
  - Modified: `src/__tests__/AvailabilityPickerModal.test.js`
  - Modified: `src/__tests__/ActivityDetailModal.test.js`
- API dependency:
  - Requires backend `GET /api/activities/:id` to return `schedule_variant: 'find_date'` for Mode C activities
  - Requires backend `POST /api/activities/:id/join` to allow Mode C joined participants to replace `candidateSlotIds` during `recruiting`
- Follow-up plans:
  - Mode D 修正獨立處理
  - Mode B/C/D 建立者決選體驗重設獨立處理
  - `AvailabilityPickerModal` 外觀換皮獨立處理
