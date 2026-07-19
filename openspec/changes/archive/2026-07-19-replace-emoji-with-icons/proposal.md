## Summary

把全站真正彩色、跨平台渲染不一致的 emoji 換成 heroicons SVG icon，沿用全站既有的 `@heroicons/vue/24/outline` 慣例。

## Motivation

全站目前多處直接使用 emoji 字元（`⚠`、`✅`、`⭐`、`📍`、`👤`）當作圖示，這類 emoji 在不同作業系統/瀏覽器上渲染的字型、顏色、粗細都不一樣，跟全站其餘圖示一律使用 heroicons SVG（例如 `ClockIcon`、`ExclamationTriangleIcon`）的慣例不一致。已透過 `/spectra-discuss` 完整討論定案，確認哪些是真正需要處理的彩色 emoji、哪些是刻意保留的裝飾性排版符號（`✕`、`→`、`←`、`↩`、`☐`、`✦`、`★`、`♥`、`☰`、`↗`，多半已標記 `aria-hidden="true"`，屬於既有像素風設計語言，不在這次範圍）。

## Proposed Solution

- `⚠`/`⚠️`（`EventPage.vue:341,543` 的 `timeError`、`AvailabilityPickerModal.vue:270` 的 `confirmError`，共 3 處）→ `ExclamationTriangleIcon`。這三處都是阻斷式表單驗證錯誤，跟 `block-past-date-activity-creation` change 裡 `EventPage.vue:941` 送出前錯誤訊息用的是同一種語意，沿用同一顆圖示。
- `📍`（`ActivityDetailModal.vue:113`，地點連結前綴）→ `MapPinIcon`，語意直接對應。
- `⭐`（`ActivityDetailModal.vue:36`）→ `UserIcon`。這個星星出現在 `v-if="activity.creator.avatar_url"` 顯示大頭照、`v-else` 顯示星星的分支裡，是「發起人沒有大頭照時的替代圖示」，不是評分/收藏語意，星星形狀在這裡語意不對，換成通用人形圖示。
- `✅`（`ActivityDetailModal.vue` 8 處）：這 8 處都是呼叫 `callAction(path, method, successMsg, body)` 時傳入的字串常數（例如 `callAction('join', 'POST', '✅ 報名成功！')`），存進 `successMessage` ref，模板用 `{{ successMessage }}` 純文字顯示在共用容器 `.activity-detail-success` 裡（模板約第 494-495 行）。emoji 內嵌在 JS 字串常數裡，不能原地換成 Vue 元件，做法是把 8 個字串常數裡的「✅ 」前綴全部拿掉（變成純文字，例如「報名成功！」「已取消報名」「成團成功！」「活動已取消」），改成在 `.activity-detail-success` 容器裡固定加一次 `DocumentCheckIcon`（8 則訊息共用同一個容器、同一顆圖示，不用逐一處理）。
- `👤`（`RegisterViews.vue:24`，暱稱欄位圖示）→ `UserIcon`；同一批表單欄位圖示裡的 `✉`（`RegisterViews.vue:40`、`LoginView.vue:25`、`ProfileEditPage.vue:210`）→ `EnvelopeIcon`，三個檔案一起處理。原因：`RegisterViews.vue` 裡暱稱欄位跟信箱欄位是同一個表單並排的欄位圖示，只換 `👤` 不換 `✉` 會讓同一個表單裡兩個欄位圖示風格不一致。

## Non-Goals

- 不處理裝飾性排版符號（`✕`、`→`、`←`、`↩`、`☐`、`✦`、`★`、`♥`、`☰`、`↗`）——判斷是刻意的像素風設計元素，多半已標記 `aria-hidden="true"`，不是技術債
- 不影響 `--bujo-danger`/`--bujo-warning` 顏色 token 統一（change: `unify-danger-warning-colors`，已在進行中的獨立 change）——`EventPage.vue:341,543`、`AvailabilityPickerModal.vue:270` 這三處雖然跟該 change 有檔案重疊，但那邊改的是 border/text 顏色，這次改的是 emoji 本身換成 icon 元件，兩者互不衝突、可以任何順序合併
- 不新增新的 heroicons import 慣例——全部沿用既有的 `@heroicons/vue/24/outline`

## Capabilities

### New Capabilities

- `emoji-to-icon-replacement`: 定義全站哪些 emoji 位置改用 heroicons SVG icon、對應哪一顆圖示，以及 `ActivityDetailModal.vue` 成功訊息容器統一圖示（不逐字串處理）的行為契約

### Modified Capabilities

(none)

## Impact

- Affected specs: `emoji-to-icon-replacement`（新增）
- Affected code:
  - Modified: src/components/EventPage.vue
  - Modified: src/components/AvailabilityPickerModal.vue
  - Modified: src/components/ActivityDetailModal.vue
  - Modified: src/components/RegisterViews.vue
  - Modified: src/components/LoginView.vue
  - Modified: src/components/ProfileEditPage.vue
