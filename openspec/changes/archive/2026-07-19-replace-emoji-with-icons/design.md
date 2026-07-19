## Context

全站圖示慣例是使用 `@heroicons/vue/24/outline`（例如 `ClockIcon`、`ExclamationTriangleIcon`、`ClipboardDocumentIcon` 等既有用法），但有 5 類共 14 處位置還是直接寫死彩色 emoji 字元：`⚠`/`⚠️`（3 處）、`📍`（1 處）、`⭐`（1 處）、`✅`（8 處，全在同一個檔案的字串常數裡）、`👤`/`✉`（4 處，同一批表單欄位圖示）。這批 emoji 在不同作業系統/瀏覽器渲染不一致，跟全站 SVG icon 語言不搭。已透過 `/spectra-discuss` 逐一確認每一處的實際語意（不是憑 emoji 字面猜的），詳細過程略，結論直接寫在下方 Decisions。

另外還有一批裝飾性排版符號（`✕`、`→`、`←`、`↩`、`☐`、`✦`、`★`、`♥`、`☰`、`↗`），判斷是刻意的像素風設計元素，多半已標記 `aria-hidden="true"`，這次明確排除。

## Goals / Non-Goals

**Goals:**

- 全站不再有任何真正彩色的 emoji 字元用作圖示，5 類位置全部改用 heroicons SVG
- `ActivityDetailModal.vue` 的成功訊息不再把圖示內嵌在字串常數裡

**Non-Goals:**

- 不處理裝飾性排版符號
- 不影響 `unify-danger-warning-colors` change 正在處理的顏色 token
- 不新增任何新的圖示載入慣例（沿用既有 import 方式）

## Decisions

### `⭐` 換成 `UserIcon` 而不是保留星星形狀

`ActivityDetailModal.vue:36` 的 `⭐` 出現在 `v-if="activity.creator.avatar_url"` 顯示大頭照、`v-else` 顯示替代圖示的分支裡——讀程式碼確認這是「發起人沒有大頭照時的替代圖示」，不是評分或收藏功能。星星形狀在這個語境下語意其實是錯的，換成通用人形圖示（`UserIcon`）才符合「這是一個人、只是沒有照片」的實際意思。

### `✅`（8 處）改成「容器加固定圖示＋字串拿掉 emoji」，不是逐一原地替換

這 8 處 emoji 內嵌在 `callAction(path, method, successMsg, body)` 呼叫時傳入的字串常數裡（例如 `callAction('join', 'POST', '✅ 報名成功！')`），最終存進 `successMessage` ref，模板用 `{{ successMessage }}` 純文字顯示在共用容器 `.activity-detail-success` 裡。字串常數裡的 emoji 沒辦法原地換成 Vue 元件（字串只能是文字），所以做法是：8 個字串常數都拿掉「✅ 」前綴，改成純文字；`.activity-detail-success` 容器本身（模板約第 494-495 行）固定加一次 `DocumentCheckIcon`，因為這 8 則訊息語意都是「操作成功」，共用同一個容器、同一顆圖示，不需要每則訊息各自帶圖示資訊。

### `👤` 與 `✉` 三個檔案一起換，不是只換 `RegisterViews.vue` 的 `👤`

`RegisterViews.vue` 裡暱稱欄位（`👤`）跟信箱欄位（`✉`）是同一個表單裡並排的欄位圖示。如果只換 `👤` 不換 `✉`，同一個表單裡兩個欄位圖示會一個是 SVG、一個是文字符號，比不換更突兀。`✉` 同樣的用法還出現在 `LoginView.vue:25`、`ProfileEditPage.vue:210`，這次一起處理，避免同一批位於輸入框內的圖示風格不一致。

## Implementation Contract

**`EventPage.vue`**：
- `timeError` 的兩處警示（第 341、543 行附近）：`<span>⚠</span>` 改成 `<ExclamationTriangleIcon class="h-3.5 w-3.5 shrink-0" aria-hidden="true" />`，新增 `import { ExclamationTriangleIcon } from '@heroicons/vue/24/outline'`（若該檔案因為 `unify-danger-warning-colors` change 已經有這個 import，不要重複 import）

**`AvailabilityPickerModal.vue`**：
- `confirmError` 顯示區塊：`⚠️ {{ confirmError }}` 改成 `<ExclamationTriangleIcon class="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> {{ confirmError }}`，新增對應 import

**`ActivityDetailModal.vue`**：
- 第 36 行 `<span v-else>⭐</span>` 改成 `<UserIcon class="h-5 w-5" aria-hidden="true" />`（實際 class 依現有 `.activity-detail-avatar` 容器尺寸調整，維持視覺大小一致）
- 第 113 行 `>📍 {{ activity.location }}</a>` 改成 `><MapPinIcon class="inline h-4 w-4 shrink-0" aria-hidden="true" /> {{ activity.location }}</a>`
- 8 處 `callAction(..., '✅ xxx', ...)` 呼叫，字串裡的「✅ 」前綴全部拿掉
- `.activity-detail-success` 容器（模板約第 494-495 行）：`<span>{{ successMessage }}</span>` 改成 `<DocumentCheckIcon class="h-4 w-4 shrink-0" aria-hidden="true" /><span>{{ successMessage }}</span>`，容器本身可能需要調整成 flex 排列讓圖示與文字並排（比照其他既有「圖示＋文字」容器的排版方式）
- 新增 `import { UserIcon, MapPinIcon, DocumentCheckIcon } from '@heroicons/vue/24/outline'`

**`RegisterViews.vue`**：
- 第 24 行 `<span class="text-[var(--bujo-muted-strong)]">👤</span>` 改成 `<UserIcon class="h-4 w-4 text-[var(--bujo-muted-strong)]" aria-hidden="true" />`
- 第 40 行 `<span class="text-[var(--bujo-muted-strong)]">✉</span>` 改成 `<EnvelopeIcon class="h-4 w-4 text-[var(--bujo-muted-strong)]" aria-hidden="true" />`
- 新增 `import { UserIcon, EnvelopeIcon } from '@heroicons/vue/24/outline'`

**`LoginView.vue`**：
- 第 25 行同樣的 `✉` span 改成 `<EnvelopeIcon class="h-4 w-4 text-[var(--bujo-muted-strong)]" aria-hidden="true" />`，新增對應 import

**`ProfileEditPage.vue`**：
- 第 210 行同樣的 `✉` span（`text-lg` 版本）改成 `<EnvelopeIcon class="h-5 w-5" aria-hidden="true" />`（沿用該處原本 `text-lg` 對應的視覺大小），新增對應 import

**驗證方式（acceptance criteria）**：
- 全專案文字搜尋確認 `src/components/` 下不再出現 `⚠`、`✅`、`⭐`、`📍`、`👤`、`✉` 這幾個字元（裝飾性排版符號 `✕`、`→` 等不受影響，維持存在）
- `npx vitest run` 全數通過；若既有測試斷言了字串裡的「✅ 」前綴（例如 `ActivityDetailModal.test.js` 若有斷言 `successMessage` 完整字串），要一併更新成拿掉前綴後的文字
- `npx vite build` 無錯誤
- 瀏覽器手動驗證：時段驗證錯誤、確認錯誤呈現警示圖示；發起人無大頭照時顯示人形圖示；活動地點前面顯示地圖圖示；報名/取消/成團/取消活動的成功訊息呈現勾勾圖示；註冊/登入/個人設定頁的暱稱與信箱欄位呈現對應圖示

**Scope boundaries**：
- In scope：上方列出的 6 個檔案、5 類 emoji
- Out of scope：裝飾性排版符號、`unify-danger-warning-colors` change 涵蓋的顏色 token

## Risks / Trade-offs

[`✅` 相關的 8 個字串常數拿掉 emoji 前綴後，如果有既有測試直接斷言完整字串（含「✅ 」），會需要同步更新測試] → 這是預期內的連動修改，不是風險，implementation 階段要先搜尋 `ActivityDetailModal.test.js` 裡是否有這類斷言

[`.activity-detail-success` 容器加圖示後排版可能跟原本純文字時不同，需要視覺確認] → 沒有自動化方式驗證視覺排版是否好看，這項只能靠瀏覽器手動驗證這一步把關，不是自動化測試能覆蓋的
