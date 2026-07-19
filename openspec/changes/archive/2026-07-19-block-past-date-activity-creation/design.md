## Context

行事曆日期彈窗（`DateEventsModal.vue`）跟建立揪團活動彈窗（`EventPage.vue`）之間，日期是透過 prop 鏈路傳遞的：`CalendarMain.vue` 的日期格子點擊 → `openDateModal(date)` → `DateEventsModal.vue`（顯示當天行程列表＋「+」新增按鈕）→ 使用者點「+」→ `emit('add', props.date)` → `CalendarMain.vue` 的 `openEventModalFromDate(date)` → `EventPage.vue` 的 `initialDate` prop → watcher 把日期套進 `form.startDate`/`endDate`/`singleDate`。

這條鏈路完全沒有檢查日期是否已經過去。`EventPage.vue` 內部其實已經有兩層過去日期防護（候選日期月曆格子的 `isDisabled`、`selectDate()` 的早退判斷），但都只保護「使用者在表單內部手動選日期」這個路徑，沒有保護「日期從外部 prop 直接帶入」這個路徑。

送出前的最後一道防線（`doSubmitInternal()` 檢查 `voteDeadlineDate <= now`）跟後端驗證（`activityController.js` 檢查 `deadline_at <= now`）都已經正確擋下過去日期的活動——這確認了問題純粹是 UX 層級（讓使用者填完整張表單才被拒絕），不是資料完整性問題。

## Goals / Non-Goals

**Goals:**

- 過去日期在「新增」動作的最一開始（點擊「+」之前）就被排除，不讓使用者走到填表單、甚至送出被拒絕的地步
- 送出前的錯誤訊息文案、顏色、圖示，跟表單裡其他已經完成設計統一的警示元素（`ReportCutoffReminder.vue`）風格一致

**Non-Goals:**

- 不修改 `doSubmitInternal()`、後端驗證邏輯，兩者本來就正確
- 不修改 `excludePastHoursIfToday`（今天日期的時段小時過濾）——這個機制解決的是不同層級的問題（合法選擇後、填表單拖太久導致時間過去），跟這次「一開始就不該進入建立流程」的問題不衝突，也不重疊
- 不修改 `CalendarMain.vue` 的日期格子本身——過去日期格子仍可點開查看當天已有的行程，這是合理的既有行為

## Decisions

### 決策一：過去日期時「+」按鈕直接不渲染（hidden），不是變灰（disabled）或靜默替換成今天

討論過三種做法：
1. **Disabled**：「+」維持可見、灰階、加 tooltip 說明原因
2. **靜默 fallback**：「+」永遠可點，過去日期時 `EventPage.vue` 把日期靜默換成今天
3. **Hidden（採用）**：過去日期時「+」直接不渲染

否決方案 2（靜默 fallback）：這會是全站唯一一處「點了某個東西、結果被靜默換成別的值」的互動模式，使用者容易沒注意到日期被換掉，誤以為在幫過去那天建立活動，是使用者信任風險，不是單純的實作取捨。

在 disabled 跟 hidden 之間，最終選 hidden：過去日期本來就不該有「新增」這個動作可選，直接不給選項比灰階按鈕更乾淨；「過去日期不能新增」語意夠直覺，不需要額外用 tooltip 解釋原因。

### 決策二：`EventPage.vue` 的 `initialDate` watcher 仍加一層防禦性檢查，即使主要修正在 `DateEventsModal.vue`

雖然目前唯一會把過去日期傳入 `initialDate` 的路徑就是 `DateEventsModal.vue` 的「+」按鈕（決策一已經擋住），但 `initialDate` 是一個公開 prop，未來若有其他入口（例如另一個「快速新增」按鈕、或其他頁面的深連結）也傳入日期，理應套用同一條規則。比照 `EventPage.vue` 內部候選日期月曆格子的 `isDisabled`／`selectDate()` 早退判斷，屬於同一種防禦性寫法的延伸，成本很低（一行早退判斷），不需要額外討論。

### 決策三：送出前錯誤訊息換成 `ExclamationTriangleIcon`，不是 `ClockIcon`

`ReportCutoffReminder.vue` 的「距離報名截止僅剩...」警示用 `ClockIcon`，語意是「還能送出、只是快截止了」的倒數提醒。這次要改的送出前錯誤訊息（「報名截止時間已經過去」）語意不同：這是**送出被硬性攔截**的錯誤狀態，不是倒數，時鐘圖案語意不對。改用 `ExclamationTriangleIcon`（`@heroicons/vue/24/outline`），是原本 `⚠️` emoji 想表達的意思的直接對應版本，只是換成符合全站 SVG icon 慣例的畫法，同時跟 `ReportCutoffReminder.vue` 共用 `--bujo-notification` 顏色 token，兩者共同構成「報名截止相關警示」在這個表單裡一致的顏色語言，但用不同圖示區分「倒數提醒」跟「硬性攔截」兩種不同嚴重程度的狀態。

### 決策四：錯誤文案把「流團時間」改成「報名截止時間」

已讀程式碼確認這則錯誤訊息實際檢查的是 `voteDeadlineDate`（報名截止時間），不是活動本身的時間（「流團時間」）。原文案講錯了檢查對象，是難以理解的根本原因之一，不只是措辭優化。改用「報名截止時間」跟表單其他地方（`ReportCutoffReminder.vue` 的「報名開放到...」）用語一致，使用者已經在表單其他地方看過這個詞。

## Implementation Contract

**Behaviour（`DateEventsModal.vue`）：**
- `props.date`（`YYYY-MM-DD`）早於今天的本地日期字串時：header-actions 插槽（`events.length` 為真時顯示的「+」）跟空狀態的「+」按鈕都不渲染於 DOM
- 空狀態文字：過去日期顯示「這天沒有行程」；今天或未來日期顯示「這天還沒有行程」
- 今天或未來日期：行為與現有一致，「+」正常渲染、可點擊、點擊後 emit `add` 事件並帶出 `props.date`

**Behaviour（`EventPage.vue`）：**
- `initialDate` prop watcher：當 `props.initialDate` 轉換後的日期字串早於今天時，不套用到 `form.startDate`/`endDate`/`singleDate`，也不改變 `dateMode`/`timeMode`，直接提早返回，表單維持原本的預設值（今天）
- `initialDate` 為今天或未來日期時：行為與現有一致

**Behaviour（送出前錯誤訊息，`EventPage.vue`）：**
- 觸發條件不變：送出前計算出的 `voteDeadlineDate <= now`（或無法解析）
- 訊息文字：「報名截止時間已經過去，請重新調整活動日期或時間」
- 容器樣式：邊框與文字顏色改用 `var(--bujo-notification)`，不再使用 `#dc2626`
- 圖示：`ExclamationTriangleIcon`（`@heroicons/vue/24/outline`），取代 `⚠️` emoji
- `submitError` 共用容器的其他既有錯誤文案（例如「結束時間要晚於開始時間」）不改動文字內容，但會套用同樣的新樣式（因為容器本身是共用的）

**驗證方式（acceptance criteria）：**
- `npx vitest run` 全數通過，含新增測試：
  - `DateEventsModal.test.js`：過去日期時兩處「+」皆不存在於 DOM、空狀態文字為「這天沒有行程」；今天/未來日期時「+」存在且可 emit `add`、空狀態文字為「這天還沒有行程」
  - `EventPage.test.js`：`initialDate` 為過去日期時 `form.startDate` 維持今天、`dateMode`/`timeMode` 不被覆蓋；觸發送出前擋下情境時 `submitError` 為新文案
- `npx vite build` 無錯誤
- 瀏覽器手動驗證：過去日期彈窗兩種狀態（有無既有行程）都看不到「+」；今天/未來日期彈窗「+」正常運作；送出前錯誤訊息顯示新文案、新顏色、新圖示

**Scope boundaries：**
- In scope：`DateEventsModal.vue`、`EventPage.vue`（`initialDate` watcher、送出前錯誤訊息容器）
- Out of scope：`CalendarMain.vue`（日期格子本身）、`doSubmitInternal()` 的驗證邏輯本身、後端驗證、`excludePastHoursIfToday`

## Risks / Trade-offs

[過去日期不再顯示「+」，代表使用者無法透過這個入口為過去某天「補登」活動] → 這是刻意的設計取捨（決策一已否決的方案 2 正是為了保留這種可能性），目前沒有已知的合法使用情境需要「幫過去的日子建立活動」；若未來出現這種需求（例如活動記錄回溯），需要另外設計一個明確的「補登」流程，不應該重新啟用靜默 fallback

[`initialDate` watcher 的防禦性檢查目前沒有對應的真實觸發路徑（因為決策一已經把唯一入口擋住）] → 這是刻意的第二層防線，目前測試會涵蓋這個路徑本身的正確性（直接傳入過去日期的 prop 給元件測試），不依賴實際 UI 操作路徑觸發
