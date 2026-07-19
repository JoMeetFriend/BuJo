## Context

`main.css` 目前只有一個相關 token `--bujo-notification: #b84a43`，被三種完全不相關的用途共用：`ReportCutoffReminder.vue` 的報名截止警示文字、`AppSidebar.vue:380` 的未讀數字小圓點背景、`LandingPage.vue:920`／`CalendarMain.vue:1079` 的今天標記圓點背景（後兩者用 `color-mix(in srgb, var(--bujo-notification) 40%, white)` 算淡色）。

除此之外，全站 12 個元件檔案（`EventPage.vue`、`AvailabilityPickerModal.vue`、`ProfileEditPage.vue`、`LoginView.vue`、`RegisterViews.vue`、`FriendAddModal.vue`、`FriendsPage.vue`、`AlertsPage.vue`、`ActivityView.vue`、`CalendarMain.vue`、`ActivityDetailModal.vue`、`PixelButton.vue`）的表單驗證錯誤文字跟危險操作按鈕，都直接寫死 Tailwind 標準紅 `#dc2626`；`ProfileEditPage.vue` 的登出按鈕 hover 狀態額外用了 `#ef4444`（更亮的紅）跟 `#fef2f2`（淡粉紅背景）。這些寫死顏色是 Tailwind 內建色階，飽和度比全站柔霧、去飽和度的「Modern Paper」調色盤（`--bujo-page: #f3f4ef`、`--bujo-ink: #20251f`、`--bujo-accent: #98d0a2` 等）明顯高，視覺上不搭。

已透過 `/spectra-discuss` 完整討論定案，詳細過程略，結論直接寫在下方 Decisions。

## Goals / Non-Goals

**Goals:**

- 全站表單驗證錯誤文字、危險操作按鈕統一改用新的 `--bujo-danger` token，不再有任何檔案寫死 `#dc2626`／`#ef4444`／`#fef2f2`
- `ReportCutoffReminder.vue` 的報名截止警示改用新的 `--bujo-warning` token，跟 `--bujo-danger` 用不同名字區分「還能操作」跟「阻斷式」兩種語意
- `--bujo-notification` 的名字與顏色值完全不變，繼續只服務未讀小圓點跟今天標記圓點兩處

**Non-Goals:**

- 不處理 emoji 換 SVG icon（另一個獨立 change）
- 不處理 dark mode（專案目前沒有任何 dark mode 實作）
- 不重新歸類或更動未讀小圓點、今天標記圓點的顏色來源
- 不新增第四個顏色 token 給 hover 專屬深/淺色用

## Decisions

### 為什麼是三個 token 而不是一個或兩個

討論時考慮過「全部併成一個 `--bujo-notification`」跟「把 `--bujo-notification` 直接改名改色」兩種做法，都因為會牽動未讀小圓點跟今天標記圓點的既有視覺（CSS 變數是全域共用，改哪個值就會連帶影響所有引用它的地方）而被否決。最終定案是三個獨立 token，`--bujo-notification` 完全不動，另外新增 `--bujo-warning`（時間性警示）跟 `--bujo-danger`（阻斷式／危險操作）兩個。

### 為什麼 `--bujo-danger` 用單一顏色，不做 hover 專屬深/淺色

`PixelButton.vue` 的 `.bujo-btn--danger` 變體本來就是「平常中性色、hover 才變單一紅色，沒有另外算深/淺色」的寫法（第 88-97 行）。`ProfileEditPage.vue` 的 `.profile-logout-btn` 卻是另一套「平常紅框、hover 換更亮的紅 + 淡粉紅背景」的寫法，兩者不一致。這次統一比照 `PixelButton.vue` 既有的簡單寫法：hover 需要淡背景時，用 `color-mix(in srgb, var(--bujo-danger) 40%, white)` 現算（沿用 `--bujo-notification` 已經在用的手法），不用另外選一個更亮的紅色當 hover 專屬色。

### `EventPage.vue:941` 送出前錯誤訊息改掛 `--bujo-danger`

這則訊息（「報名截止時間已經過去，請重新調整活動日期或時間」）是**送出前的硬性攔截**：使用者必須修正才能再送出，跟「還能操作、只是快來不及」的 `ReportCutoffReminder.vue` 警示語意不同，屬於阻斷式表單驗證錯誤，應該歸類到 `--bujo-danger`，不是 `--bujo-warning` 或 `--bujo-notification`。

## Implementation Contract

**`main.css`**：
- 新增兩行：`--bujo-warning: #dea45b;`、`--bujo-danger: #cb635b;`
- `--bujo-notification: #b84a43;` 這一行維持完全不變

**改用 `--bujo-warning` 的地方（1 處）**：
- `ReportCutoffReminder.vue`：`text-[var(--bujo-notification)]` 改成 `text-[var(--bujo-warning)]`（僅此一處文字顏色，元件其餘樣式不變）

**改用 `--bujo-danger` 的地方（所有 `#dc2626`／`#ef4444`／`#fef2f2` 出現處，逐檔列出）**：
- `EventPage.vue`：地址搜尋錯誤文字（`text-[#dc2626]`）、時段驗證錯誤的 border 與文字（`border-[#dc2626]`、`text-[#dc2626]` 共 2 處）、刪除候選時段的 hover 文字色、送出前錯誤訊息容器的 border 與文字（原本掛 `--bujo-notification`，改掛 `--bujo-danger`）
- `AvailabilityPickerModal.vue`：問題日期標記的 hover border/text、`ring` 樣式、選中狀態的 border/text/background、確認錯誤訊息容器的 border 與文字
- `ProfileEditPage.vue`：bio 錯誤文字、頭像上傳錯誤文字、帳號錯誤文字（2 處）、登出按鈕（base 與 hover 都改用同一個 `--bujo-danger`，不再另外用 `#ef4444` 當 hover 專屬色，`#fef2f2` 淡背景改用 `color-mix(in srgb, var(--bujo-danger) 40%, white)`）
- `LoginView.vue`：登入錯誤訊息容器的 border 與文字
- `RegisterViews.vue`：註冊錯誤訊息容器的 border 與文字
- `FriendAddModal.vue`：加好友錯誤文字
- `FriendsPage.vue`：好友列表錯誤文字、刪除好友按鈕的 hover 文字色
- `AlertsPage.vue`：`.alerts-status-text--error` 的文字色
- `ActivityView.vue`：`.activity-state-message--error` 的文字色
- `CalendarMain.vue`：`.calendar-fetch-error` 的文字色
- `ActivityDetailModal.vue`：`.activity-detail-state--error`、`.activity-detail-error` 的文字色
- `PixelButton.vue`：`.bujo-btn--danger:hover` 的 border/text 從 `#dc2626` 改成 `var(--bujo-danger)`（base 狀態的 `--bujo-line`／`--bujo-muted-strong` 不動）

**不動的地方（確認清單，避免誤改）**：
- `AppSidebar.vue:380`：未讀數字小圓點背景，繼續用 `var(--bujo-notification)`
- `LandingPage.vue:920`、`CalendarMain.vue:1079`：今天標記圓點背景，繼續用 `color-mix(in srgb, var(--bujo-notification) 40%, white/var(--bujo-white))`

**驗證方式（acceptance criteria）**：
- 全專案文字搜尋確認 `src/` 目錄下不再有任何 `#dc2626`、`#ef4444`、`#fef2f2` 字面值（`grep -rn "#dc2626\|#ef4444\|#fef2f2" src/` 應該回傳空結果）
- `main.css` 的 `--bujo-notification` 那一行的 hex 值仍是 `#b84a43`，不能被改動
- `npx vitest run` 全數通過（既有測試不應因為顏色變更而失敗，除非測試本身斷言了寫死的 hex 值，屆時需要一併更新斷言）
- `npx vite build` 無錯誤
- 瀏覽器手動驗證：報名截止警示（`ReportCutoffReminder.vue`）呈現新的琥珀色系（`--bujo-warning`）；表單驗證錯誤、登出按鈕、刪除按鈕呈現新的柔和紅色系（`--bujo-danger`）；未讀數字小圓點跟今天標記圓點的顏色沒有任何視覺變化

**Scope boundaries**：
- In scope：`main.css` 新增兩個 token；上述所有 `--bujo-danger`／`--bujo-warning` 對應清單列出的檔案
- Out of scope：emoji 換 icon、dark mode、未讀小圓點與今天標記圓點的顏色來源或分類

## Risks / Trade-offs

[`--bujo-danger` 跟 `--bujo-notification` 的實際顏色數值接近（`#cb635b` vs `#b84a43`，都是柔和磚紅/珊瑚色系），肉眼可能不容易分辨] → 這是刻意的設計取捨：兩者語意上分屬不同類別（醒目色 vs 阻斷式錯誤），但視覺上維持同一個柔霧色系是刻意的，不需要為了「一眼看出差異」而選用對比更強烈、進而破壞整體調色盤一致性的顏色

[`ProfileEditPage.vue` 登出按鈕拿掉 `#ef4444` hover 專屬亮紅色跟 `#fef2f2` 淡粉背景後，hover 時的視覺強度會比改動前弱一些] → 這是刻意跟隨 `PixelButton.vue` 既有慣例做的取捨，讓兩個危險按鈕的 hover 行為一致，優先於維持這一個按鈕原本較強烈的 hover 效果
