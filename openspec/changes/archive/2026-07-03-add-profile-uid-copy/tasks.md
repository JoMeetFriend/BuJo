## 1. 彈窗行為

- [x] 1.1 在 `src/components/ProfileAccountModal.vue` 實作 Display shareable BuJo ID code，並依「優先從 uid 其次從 id 取得分享代碼」決策推導分享代碼：當 `uid` 或 `id` 存在時，在顯示名稱下方渲染最後五個字元；當兩者都缺少時，隱藏整個代碼列。用 `ProfileAccountModal` tests 驗證 explicit uid、id fallback 與缺少識別碼案例。
- [x] 1.2 在 `src/components/ProfileAccountModal.vue` 實作 Copy shareable BuJo ID code，加入右側複製控制，只複製可見五碼代碼並顯示本地成功回饋；用 `ProfileAccountModal` test stub `navigator.clipboard.writeText`，並驗證收到 `d5e6f`。
- [x] 1.3 依「將回饋保留在彈窗列內」決策處理 clipboard unavailable 或 rejected write：不關閉彈窗、保持代碼可見、顯示本地失敗回饋；用 `ProfileAccountModal` test reject clipboard call，並驗證失敗回饋出現。
- [x] 1.4 保留既有帳號彈窗操作：加入 BuJo ID 列後，個人編輯連結、close action、頭像或 fallback face、顯示名稱與登出按鈕行為仍可用；用 `ProfileAccountModal` tests 驗證既有 edit、logout 與 close controls 仍會渲染或 emit。
- [x] 1.5 依「複製控制使用圖示按鈕」決策更新 Copy shareable BuJo ID code：`src/components/ProfileAccountModal.vue` 的複製控制視覺內容改成圖示且不顯示「複製」文字，但仍保留 `aria-label` 或等效 accessible name；用 `ProfileAccountModal` tests 驗證按鈕可由 accessible name 找到、可見文字不包含「複製」、點擊仍只寫入 `d5e6f`。
- [x] 1.6 更新 Copy shareable BuJo ID code 的回饋位置：`src/components/ProfileAccountModal.vue` 在點擊圖示複製按鈕後，將「已複製」或「複製失敗」顯示在按鈕右側而非下一行；用 `ProfileAccountModal` tests 驗證成功回饋是複製按鈕的下一個同列元素，且點擊仍只寫入 `d5e6f`。
- [x] 1.7 更新 Display shareable BuJo ID code 的可見格式：`src/components/ProfileAccountModal.vue` 在名稱下方顯示 `Bujo ID: d5e6f`，同時複製按鈕仍只複製 `d5e6f`；用 `ProfileAccountModal` tests 驗證 visible text 包含 `Bujo ID: d5e6f`，且 clipboard 仍收到 `d5e6f`。

## 2. 測試與驗證

- [x] 2.1 新增 `src/__tests__/ProfileAccountModal.test.js`，覆蓋 Display shareable BuJo ID code、Copy shareable BuJo ID code、Preserve existing account modal actions，以及「只複製五碼分享代碼」設計決策；用 `npm run test:run` 驗證。
- [x] 2.2 實作後執行 repository quality checks，確保變更符合 implementation contract 與格式規則；用 `npm run test:run`、`npm run lint` 與 `npm run format` 全部成功作為驗證。
