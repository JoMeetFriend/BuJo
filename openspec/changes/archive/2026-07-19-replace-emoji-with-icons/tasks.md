## 1. 表單驗證錯誤圖示

- [x] 1.1 在 `src/components/EventPage.vue` 把 `timeError` 兩處警示（`<span>⚠</span>`）改成 `ExclamationTriangleIcon`，新增對應 import（若已因其他 change 匯入則不重複），對應「Blocking validation errors use ExclamationTriangleIcon instead of a warning emoji」；以瀏覽器手動驗證兩處 `timeError` 顯示三角形警示圖示、不再有 `⚠` 字元。
- [x] 1.2 在 `src/components/AvailabilityPickerModal.vue` 把 `confirmError` 顯示區塊的 `⚠️` 改成 `ExclamationTriangleIcon`，新增對應 import，滿足同一條「Blocking validation errors use ExclamationTriangleIcon instead of a warning emoji」規格；以瀏覽器手動驗證 `confirmError` 顯示三角形警示圖示。

## 2. `ActivityDetailModal.vue` 圖示替換

- [x] 2.1 把第 36 行發起人無大頭照時的 `⭐` 改成 `UserIcon`，對應「Creator avatar fallback uses UserIcon instead of a star emoji」，對應設計文件「`⭐` 換成 `UserIcon` 而不是保留星星形狀」；以瀏覽器手動驗證發起人沒有大頭照時顯示人形圖示，有大頭照時行為不變。
- [x] 2.2 把第 113 行地點連結前綴的 `📍` 改成 `MapPinIcon`，對應「Activity location link uses MapPinIcon instead of a pin emoji」；以瀏覽器手動驗證有地點的活動顯示地圖圖示。
- [x] 2.3 把 8 處 `callAction(..., '✅ xxx', ...)` 呼叫字串裡的「✅ 」前綴全部拿掉，`.activity-detail-success` 容器（模板約第 494-495 行）固定加一次 `DocumentCheckIcon`，對應「Activity action success messages use a single shared DocumentCheckIcon, not per-message emoji」，對應設計文件「`✅`（8 處）改成「容器加固定圖示＋字串拿掉 emoji」，不是逐一原地替換」，並比照規格裡的 Example 表格核對「報名成功！」「已取消報名」「成團成功！」「活動已取消」四則訊息拿掉前綴後的文字正確；以 `src/__tests__/ActivityDetailModal.test.js` 確認既有測試通過（若有斷言含「✅ 」的完整字串，一併更新成拿掉前綴後的文字），並以瀏覽器手動驗證任一操作成功後訊息容器顯示勾勾圖示、文字沒有殘留 emoji。
- [x] 2.4 新增 `import { UserIcon, MapPinIcon, DocumentCheckIcon } from '@heroicons/vue/24/outline'` 到 `ActivityDetailModal.vue` 的 `<script setup>`。

## 3. 表單欄位圖示（暱稱／信箱）

- [x] 3.1 在 `src/components/RegisterViews.vue` 把暱稱欄位的 `👤` 改成 `UserIcon`、信箱欄位的 `✉` 改成 `EnvelopeIcon`，新增對應 import，對應「Nickname and email form-field icons use UserIcon and EnvelopeIcon instead of emoji」，對應設計文件「`👤` 與 `✉` 三個檔案一起換，不是只換 `RegisterViews.vue` 的 `👤`」；以瀏覽器手動驗證註冊表單兩個欄位都顯示 SVG 圖示。
- [x] 3.2 在 `src/components/LoginView.vue` 把信箱欄位的 `✉` 改成 `EnvelopeIcon`，新增對應 import，滿足同一條規格裡「Login form email field」的情境；以瀏覽器手動驗證登入表單信箱欄位顯示信封圖示。
- [x] 3.3 在 `src/components/ProfileEditPage.vue` 把帳號顯示區的 `✉` 改成 `EnvelopeIcon`，新增對應 import，滿足同一條規格裡「Profile-edit page email display」的情境；以瀏覽器手動驗證個人設定頁的信箱顯示區顯示信封圖示。

## 4. 整體驗證

- [x] 4.1 執行 `grep -rn "⚠\|✅\|⭐\|📍\|👤\|✉" src/components/` 確認回傳空結果（確認裝飾性排版符號如 `✕`、`→` 不受影響、不會被誤判），執行 `npx vitest run` 確認全數通過，執行 `npx vite build` 確認無錯誤，執行 `npx eslint` 確認除既有無關 warning 外無新增問題。
