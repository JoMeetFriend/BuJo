## Summary

新增 `--bujo-warning`、`--bujo-danger` 兩個設計 token，取代全站寫死的 `#dc2626`／`#ef4444`／`#fef2f2`，`--bujo-notification` 保留原名原值不動。

## Motivation

`main.css` 目前只有 `--bujo-notification: #b84a43` 一個相關 token，卻被借用在三個完全不相關的地方：報名截止警示（`ReportCutoffReminder.vue`）、`AppSidebar.vue` 的未讀數字小圓點、`LandingPage.vue`／`CalendarMain.vue` 的今天標記圓點。同時全站 14 個檔案的表單驗證錯誤文字跟危險操作按鈕（登出、刪除）都還是寫死 Tailwind 標準紅 `#dc2626`，其中 `ProfileEditPage.vue` 的登出按鈕 hover 狀態另外用了 `#ef4444`／`#fef2f2`。這些寫死顏色跟全站柔霧、去飽和度的「Modern Paper」設計語言不搭，之前 `redesign-activity-deadline-reminder` change 已經把 `ReportCutoffReminder.vue` 的警示樣式從 `#dc2626` 改成設計 token，這次要把剩下的 14 個檔案一併統一。

已透過 `/spectra-discuss` 完整討論定案：語意上「還能操作、只是快來不及」（時間性警示）跟「阻斷式／危險操作」（表單驗證失敗、登出、刪除）是不同類別，即使顏色視覺上相近也應該用不同 token 名稱，讓程式碼裡的顏色引用本身就能表達「為什麼是紅的」。

## Proposed Solution

新增兩個 token：
- `--bujo-warning: #dea45b`：時間性警示，目前唯一使用者是 `ReportCutoffReminder.vue`
- `--bujo-danger: #cb635b`：阻斷式錯誤／危險操作，取代全站 14 個檔案的 `#dc2626`／`#ef4444`／`#fef2f2`

`--bujo-notification: #b84a43` 保留原名原值完全不動，維持只給 `AppSidebar.vue` 未讀數字小圓點、`LandingPage.vue`／`CalendarMain.vue` 今天標記圓點兩處使用——這兩處跟警示/危險語意無關，純粹是醒目色，不重新歸類、不換色。

`EventPage.vue` 送出前擋下「報名截止時間已經過去」的錯誤訊息（`redesign-activity-deadline-reminder`／`block-past-date-activity-creation` 兩個 change 陸續做的）目前掛在 `--bujo-notification` 上，這次改掛到 `--bujo-danger`，因為它本質是阻斷式表單驗證錯誤，不是「還能操作」的警示。這牽動既有 spec `activity-deadline-validation` 裡「Form blocks submission when the computed deadline is not in the future」這條需求，這次一併更新該需求的內容，明確寫入使用 `--bujo-danger` token。

危險按鈕（登出、刪除）的 hover 狀態統一不再另外做專屬深/淺色，直接沿用同一個 `--bujo-danger`，需要淡背景時比照 `--bujo-notification` 已經在用的 `color-mix(in srgb, var(--bujo-danger) 40%, white)` 手法現算，不新增第四個顏色 token。`PixelButton.vue` 的 `.bujo-btn--danger` 已經是這個寫法，是既有慣例的參考範例；`ProfileEditPage.vue` 的 `.profile-logout-btn` 改成同一種寫法。

## Non-Goals

- 不處理 emoji 換 SVG icon（`⚠️`、`✅`、`⭐`、`📍`、`👤` 等）——已討論並決定是另一個獨立 change，不併入這次
- 不處理 dark mode——目前整個專案沒有任何 dark mode 實作，`main.css` 沒有 `@media (prefers-color-scheme: dark)` 或 `[data-theme]` 覆蓋
- 不重新分類或更動 `AppSidebar.vue` 未讀數字小圓點、`LandingPage.vue`／`CalendarMain.vue` 今天標記圓點——這兩處維持使用 `--bujo-notification`，顏色值不變
- 不引入第四個顏色 token 給 hover 專屬深/淺色用——一律用 `color-mix()` 從既有 token 現算
- 除了 `activity-deadline-validation` 裡明確命名 `--bujo-notification` 的那條需求外，其餘 13 個檔案的錯誤訊息顏色目前沒有任何既有 spec 規範它們的顏色，這次只當作實作細節的視覺一致性修正，不額外新增 spec capability 描述每個檔案的顏色規則

## Alternatives Considered

- **只用一個 token（把全部東西都併進 `--bujo-notification`）**：討論時否決——時間性警示跟阻斷式錯誤在語意上明顯不同，共用一個名字會讓「為什麼登出按鈕用 notification 這個顏色」變得難以理解，即使顏色數值接近，分開命名的成本很低（多一行 `:root` 設定），值得換取語意清楚。
- **把 `--bujo-notification` 直接改名/改色去對應新的警示語意**：討論時否決——`AppSidebar.vue`、`LandingPage.vue`、`CalendarMain.vue` 三處會被連帶換色（CSS 變數是全域共用，改值就會全部套用），但這三處使用者明確要求不能動，因此新警示語意必須用全新的 `--bujo-warning` token，不能借用或修改 `--bujo-notification`。

## Impact

- Affected specs: `activity-deadline-validation`（修改「Form blocks submission when the computed deadline is not in the future」這條需求，把送出前錯誤訊息使用的 token 從 `--bujo-notification` 改成 `--bujo-danger`）
- Affected code:
  - Modified: src/assets/main.css
  - Modified: src/components/EventPage.vue
  - Modified: src/components/AvailabilityPickerModal.vue
  - Modified: src/components/ProfileEditPage.vue
  - Modified: src/components/LoginView.vue
  - Modified: src/components/RegisterViews.vue
  - Modified: src/components/FriendAddModal.vue
  - Modified: src/components/FriendsPage.vue
  - Modified: src/components/AlertsPage.vue
  - Modified: src/components/ActivityView.vue
  - Modified: src/components/CalendarMain.vue
  - Modified: src/components/ActivityDetailModal.vue
  - Modified: src/components/ui/PixelButton.vue
