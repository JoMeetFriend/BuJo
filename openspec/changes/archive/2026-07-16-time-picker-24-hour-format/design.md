## Context

前端 3 個元件（`EventPage.vue`、`AvailabilityPickerModal.vue`、`ActivityDetailModal.vue`）各自獨立實作「上午/下午 H:MM」這個時間字串格式的產生、格式化、解析邏輯，完全沒有共用。這個字串格式同時是：(1) 建立活動時前端送給後端的 API payload 內容，(2) 後端回傳給前端顯示既有活動時間的格式。這個 change 只處理前端範圍；後端 `formatTime`/`parseDateTime` 的對應修改由 `BuJoBackend` repo 裡另一個同名的 `time-picker-24-hour-format` change 負責，兩個 change 在部署順序上互相依賴。

## Goals / Non-Goals

**Goals:**

- 前端時間選取器與時間顯示統一改成 24 小時制零填充格式（`HH:00`，例如 `09:00`、`23:00`）
- 前端 3 處重複實作整併成一個共用工具模組
- 前端切換格式的時機要晚於後端完成雙格式相容部署，避免送出後端解析不了的字串

**Non-Goals:**

- 不涵蓋後端 `formatTime`/`parseDateTime` 的實作（見 `BuJoBackend` repo 的對應 change）
- 不新增「24:00」這個獨立可選值
- 不做分鐘級別的粒度調整，維持現有的整點（`:00`）選項

## Decisions

### 統一時間字串格式為零填充 24 小時制「HH:00」

理由：現有格式沒有補零（`createTimeOptions()` 產生的是 `9:00` 不是 `09:00`），導致同一個下拉選單內選項文字寬度不一致；補零後每個選項固定 5 個字元寬度，同時解決使用者回報的「上午 12:00 代表午夜」歧義問題。

### 建立共用工具模組 `src/utils/timeFormat.js`

匯出以下函式，取代 `EventPage.vue`、`AvailabilityPickerModal.vue`、`ActivityDetailModal.vue` 三處各自的實作：

- `createTimeOptions(): string[]` — 回傳 24 個字串 `'00:00'` ~ `'23:00'`
- `formatHourAsTimeString(hour: number): string` — 單一小時數字轉字串（`createTimeOptions` 內部呼叫，`AvailabilityPickerModal.vue`/`ActivityDetailModal.vue` 的顯示格式化也改呼叫這個，取代各自的 `const period = hour < 12 ? '上午' : '下午'` 邏輯）
- `parseHourFromTimeStr(timeStr: string): number` — 解析字串回傳 0~23 的小時數字，格式不符回傳 `-1`（維持現有的失敗回傳值慣例，呼叫端邏輯不用改）
- `parseDateTimeValue(dateStr: string, timeStr: string): Date | null` — 沿用 `EventPage.vue` 現有函式簽章跟語意，只改內部呼叫的正規表達式

三個元件改成 `import { ... } from '@/utils/timeFormat'`，個別檔案內不再保留自己的格式化/解析邏輯。

### 前端切換時機依賴後端先完成雙格式相容部署

不採用「前後端必須同一秒切換」的作法。前端的部署必須排在 `BuJoBackend` 對應 change 的「後端支援雙格式」步驟之後——後端上線雙格式相容後，前端才切換成只送新格式；前端上線穩定後，後端才移除舊格式解析分支（後端那一步的排程由 `BuJoBackend` 的 change 追蹤，不在這份 tasks.md 範圍內）。

## Implementation Contract

**Behavior**：使用者在建立揪團活動時，所有時間下拉選單（開始時間、結束時間、時段範圍、統一時間、候選時段）顯示的選項一律是 `00:00`~`23:00` 的 24 小時制字串；已建立活動的時間顯示（活動詳情、報名時間選取彈窗）同樣改成同一種格式；情境限制（今天已過去的時段排除、結束時間須晚於開始時間等）行為不變。

**Interface / data shape**：
- 新增 `src/utils/timeFormat.js`，匯出 `createTimeOptions`、`formatHourAsTimeString`、`parseHourFromTimeStr`、`parseDateTimeValue`（簽章如上）
- 建立活動 API payload 中所有時間欄位字串格式從 `/^(上午|下午)\s+(\d+):(\d+)$/` 改成 `/^(\d{2}):(\d{2})$/`（後端解析對應變更在 `BuJoBackend` 的 change 裡）

**Failure modes**：`parseHourFromTimeStr` 遇到不符格式的字串時維持現有行為（回傳 `-1`，不拋例外）——這次不改變錯誤處理策略，只改格式本身。

**Acceptance criteria**：
- `createTimeOptions()[0] === '00:00'`、`createTimeOptions()[23] === '23:00'`
- 往返一致性：對 0~23 每個小時，`parseHourFromTimeStr(formatHourAsTimeString(h)) === h`
- 既有的情境篩選相關測試（`excludePastHoursIfToday`、`excludeNotAfterStart`、今天格子鎖定）全部維持綠燈，不需要修改斷言邏輯本身（只需要把字面值從舊格式換成新格式）

**Scope boundaries**：範圍限定在前端「時間字串格式」本身；不包含後端實作（見 `BuJoBackend` 對應 change）、不包含任何情境判斷邏輯、資料庫欄位、API 端點路徑或參數名稱的變動。

## Risks / Trade-offs

- [Risk] 前端在後端完成雙格式相容之前就切換上線，會導致活動建立失敗 → Mitigation：前端部署任務明確依賴 `BuJoBackend` 對應 change 的雙格式部署先完成，作為這份 tasks.md 最後一組任務的前置條件
- [Risk] 3 處格式化/解析邏輯散落各元件，容易漏改 → Mitigation：整併成共用工具模組，並用往返一致性測試 + 前後端共用字面值 fixture 互相校驗
