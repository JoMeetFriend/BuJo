## 1. 公開設定與共用官方帳號入口

- [x] 1.1 完成「Responsive add-friend link and QR configuration」與「Official Account entry points adapt to viewport and configuration」：新增公開 Vite URL 設定及 `src/components/LineOfficialAccountEntry.vue`，手機優先連結、桌機顯示 QR 與連結，缺值或圖片錯誤時 fail-soft；以 `src/__tests__/LineOfficialAccountEntry.test.js` 驗證兩種 viewport、缺值及 image error。
- [x] 1.2 在 `.env.example` 與 `README.md` 記錄兩個公開 URL、LINE secret 禁止進前端及部署驗證步驟；以文件內容檢查確認變數名稱、用途與安全邊界完整一致。

## 2. 登入後一次性 onboarding

- [x] 2.1 完成「Identity-aware CTA without friendship claims」與「Onboarding actions follow LINE identity state」：建立 `src/components/LineNotificationOnboardingModal.vue`，無 LINE identity 時導向既有 authenticated link route，有 LINE identity 時顯示官方帳號入口，任何狀態都不宣稱已加入或已開啟推播；以 `src/__tests__/LineNotificationOnboardingModal.test.js` 驗證正常、缺失及 malformed identities。
- [x] 2.2 完成「Versioned per-user client persistence」：以 `src/composables/useLineNotificationOnboarding.js` 封裝 per-user v1 key、`seen` 寫入與 localStorage 例外時的 SPA session fallback，並保證動作執行前先記錄；以 `src/__tests__/useLineNotificationOnboarding.test.js` 驗證同帳號不重複、不同帳號隔離、版本化 key 與 storage exception。
- [x] 2.3 完成「Global authenticated onboarding owned by App」與「Authenticated users receive one non-blocking onboarding prompt」：在 `src/App.vue` 只於 auth initialized、user ID 存在且已登入應用區域掛載 modal，登入／註冊／landing／guest 狀態不顯示，關閉或略過不導頁；以 `src/__tests__/App.test.js` 驗證 route/auth 顯示矩陣與非阻擋關閉行為。

## 3. 個人設定永久入口與視覺契約

- [x] 3.1 完成「Permanent settings fallback」與「Profile settings retain a permanent LINE notification entry」：在 `src/components/ProfileEditPage.vue` 增加不受 onboarding key 影響的 `LINE 通知` 區塊，依 LINE identity 顯示綁定 CTA 或官方帳號入口；以 `src/__tests__/ProfileEditPage.test.js` 驗證 connected、unconnected、seen key 三種情境。
- [x] 3.2 完成「LINE onboarding follows BuJo interaction and visual conventions」：modal、官方帳號入口與設定區塊採 Modern Paper 方角、線框、既有 token、成熟留白，所有按鈕／連結具 accessible name 與 focus-visible，QR 具描述性 alt；以元件 DOM assertions、source/style assertions及鍵盤 focus 測試驗證。

## 4. 整合驗證與交付

- [x] 4.1 依序執行 onboarding targeted tests 與 `npm run test:run`，確認登入方式、localStorage、外部設定、設定頁 fallback 的回歸測試全部通過；任何失敗須修正到測試命令 exit code 0。
- [x] 4.2 執行 `npm run lint`、`npm run format`、重新執行 `npm run test:run` 與 `npm run build`，並以手機／桌機實際 viewport 人工確認 modal 可略過、手機連結、桌機 QR、鍵盤焦點及缺少設定的 fail-soft 行為。

## 5. 官方 QR 與口語文案調整

- [x] 5.1 完成「Bundled official QR fallback and conversational copy」與「Official Account entry points adapt to viewport and configuration」的 QR 補充：將官方 `L_gainfriends_2dbarcodes_GW.png` 納入 `src/assets/`，讓桌機在未設定外部 QR URL 時仍顯示官方 QR，手機維持 add friend 連結，圖片錯誤仍 fail-soft；以 `src/__tests__/LineOfficialAccountEntry.test.js` 驗證預設資產、外部覆寫與 image error。
- [x] 5.2 完成「Onboarding guidance uses conversational language」：更新 `LineNotificationOnboardingModal.vue` 與共用官方帳號入口的標題、說明、步驟與 fallback 文案，使已連接與未連接狀態都自然口語且不誤稱推播已開啟；以 `src/__tests__/LineNotificationOnboardingModal.test.js` 與 `src/__tests__/LineOfficialAccountEntry.test.js` 鎖定文字。
- [x] 5.3 執行 onboarding targeted tests、`npm run lint`、`npm run format`、`npm run test:run` 與 `npm run build`，並以桌機／手機 viewport 人工確認官方 QR、口語文案、手機連結與略過操作。
