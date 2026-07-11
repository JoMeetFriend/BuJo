## 1. 通知徽章視覺

- [x] 1.1 在 `src/assets/main.css` 新增值為 `#b84a43` 的通知語意色票，並在 `src/components/AppSidebar.vue` 套用 **High-contrast stamp-style unread badge** 契約：桌機與手機共用暗紅底、白色 Space Mono 粗體、18px 最小寬高、紙色 1px 描邊、2px 向右下硬邊淡陰影及不遮住信封主體的右上定位；未讀數為 `9+` 時徽章只水平延展且不改變導覽排版。驗證：以瀏覽器分別在桌機與手機 viewport 檢查未讀數 `1` 與 `9+`，確認色彩、尺寸、位置、文字不裁切及周圍版面不位移。

## 2. 雙版位行為測試

- [x] 2.1 擴充 `src/__tests__/AppSidebar.test.js`，讓未讀數測試同時斷言桌機側欄與手機底部導覽各有一個 `.bujo-nav-badge`，兩者在未讀數為 `2` 時皆顯示 `2`、未讀數超過 9 時皆顯示 `9+`，而 0 則時兩者皆不存在。驗證：執行 `npm run test:run -- src/__tests__/AppSidebar.test.js` 且測試全數通過。

## 3. 品質與視覺驗收

- [x] 3.1 執行 `npm run format`、`npm run lint`、`npm run test:run` 與 `npm run build`，確認格式、靜態檢查、完整測試及 production build 全數成功；再於桌機與手機 viewport 各保留一張 ALERTS 未讀數為 `1` 的畫面檢查結果，確認暗紅 badge 清楚可辨、未遮住信封圖示，且其他側欄色彩、圖示、文字與間距未改變。
