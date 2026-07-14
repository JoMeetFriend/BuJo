## 1. 契約與測試基礎

- [x] 1.1 依「Soft-dismiss API 契約」確認開發環境的 `PATCH /api/notifications/:id/dismiss` 不需 body、成功回 200、失敗回非 2xx，並以手動 API 請求驗證成功後 `GET /api/notifications` 不再回傳該通知；若 sibling BuJoBackend 尚未交付則記錄為前端整合阻擋，不以 localStorage 或 sessionStorage 替代。
- [x] 1.2 在 `src/__tests__/AlertsPage.test.js` 建立 axios mock、固定通知列寬與 Pointer Events helpers，證明測試可載入通知並模擬 10px 軸向鎖定、20% reveal 與 65% commit 邊界；以 targeted `npm run test:run -- src/__tests__/AlertsPage.test.js` 驗證測試基礎。

## 2. 手勢與視覺互動

- [x] 2.1 依「Pointer Events 與軸向鎖定」及 requirement「Notification rows reveal dismissal affordance during a left drag」實作單列 pointer capture、水平／垂直分類、只允許左移與紅色垃圾桶 reveal；以 component tests 驗證水平拖曳會移動、垂直與向右手勢不移動且不送 API。
- [x] 2.2 依「長距離固定比例門檻」及 requirement「Dismissal requires a long drag」實作 20% 完整顯示、低於 65% 彈回、達 65% 才提交且速度不能略過門檻；以 64%、65% 與快速短滑 component tests 驗證請求次數與列位置。
- [x] 2.3 依「單列拖曳狀態與事件隔離」及 requirement「Pending friendship actions block dismissal」限制同時只有一列可拖曳，阻擋含 `accept`／`reject` actions 的列並隔離內嵌按鈕事件；以 component tests 驗證待處理邀請不能滑除、按鈕仍送既有 friendship request、actions 清空後可滑除。

## 3. Dismissal 狀態與既有行為

- [x] 3.1 依「樂觀滑出與失敗復原」及 requirement「Successful dismissal removes only frontend rendering」實作滑出、收合、單次 dismiss request、成功後才從 `notifications` 移除與摘要重算，且不寫入 Web Storage；以 component tests 驗證 DOM、摘要、API path/body/request count 及 storage spies。
- [x] 3.2 依 requirement「Failed dismissal restores the notification」保存原索引與 `isRead`，對 404、500、timeout 或 network rejection 統一復原列並顯示「無法移除通知」，busy 期間拒絕重複手勢與 click；以 rejection component tests 驗證原順序、未讀狀態及只有一次 request。
- [x] 3.3 依「Reduced motion 與垃圾桶語意」及 requirement「Existing notification interactions and accessibility remain available」加入 `移除通知` accessible name、reduced-motion CSS 與拖曳後 click suppression，同時保留 click／Enter／Space 已讀、全部已讀及 friendship actions；以 component tests 與 reduced-motion 樣式 assertion 驗證既有 API 呼叫不回歸。
- [x] 3.4 依「距離驅動深紅漸層與提交門檻」更新 requirement「Notification rows reveal dismissal affordance during a left drag」與「Dismissal requires a long drag」的視覺實作：背景以左滑距離／列寬 65% 的 clamp 進度，從透明連續加深至 `rgb(153 27 27)`，完整深紅與 dismissal commit 同時發生，未達門檻放手時顏色歸零；以 `src/__tests__/AlertsPage.test.js` 驗證 0%、32.5%、65% 的 alpha 分別為 0、0.5、1，且只有 alpha 1 會送出 dismiss API。
- [x] 3.5 依「距離驅動亮紅圓環與提交門檻」更新 requirement「Notification rows reveal dismissal affordance during a left drag」與「Dismissal requires a long drag」：改用亮紅 `rgb(239 68 68)`，以與背景相同的 65% clamp 進度驅動垃圾桶 SVG 圓環從空弧、半圈到閉合一圈，且僅在閉環／alpha 1 時送出 dismiss API；以 `src/__tests__/AlertsPage.test.js` 驗證 0%、32.5%、65% 的亮紅 alpha 為 0、0.5、1，圓環 dashoffset 為 100、50、0，並驗證未達閉環不會送出 API。

## 4. 完整驗證

- [x] 4.1 執行 `npm run test:run` 與 `npm run build`，確認新增手勢測試、既有通知相關流程與 production build 全部通過；任何失敗需修正後重跑至成功。
- [x] 4.2 執行 `npm run lint` 與 `npm run format`，再以 `git diff --check` 及 `git diff -- src/components/AlertsPage.vue src/__tests__/AlertsPage.test.js` 確認只包含本 change 的前端行為與測試，沒有 Web Storage fallback 或 sibling backend 檔案異動。
