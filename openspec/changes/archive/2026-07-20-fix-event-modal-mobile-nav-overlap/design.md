## Context

建立活動主表單由 `EventPage.vue` 使用共用 `BaseModal.vue` 的 scrollable 模式呈現。BaseModal overlay 目前固定覆蓋整個 viewport，手機底部導覽列則由 `AppSidebar.vue` 固定在底部、高度 62px。overlay z-index 80 高於導覽列 z-index 50，因此表單 footer 和遮罩會覆蓋導覽列。

目前工作樹另有 `CalendarMain.vue` 與 `CalendarMain.test.js` 的未提交變更，這些檔案不屬於本 change，實作與提交不得修改或納入。

## Goals / Non-Goals

**Goals:**

- 讓建立活動主表單在 640px 以下 viewport 預留 62px 底部導覽空間。
- 保持底部導覽完整可見且可點擊。
- 保持長表單 body 內捲動及固定 header/footer。
- 透過 opt-in prop 避免影響其他共用彈窗。

**Non-Goals:**

- 不修改底部導覽列本身的尺寸、z-index 或 routing。
- 不修改緊急確認、成功提示及其他 BaseModal 的滿版行為。
- 不修改建立活動表單資料與送出流程。

## Decisions

### 使用 opt-in reserveMobileNavSpace prop

BaseModal 新增 `reserveMobileNavSpace` boolean prop，預設為 false。只有建立活動主表單傳入 `reserve-mobile-nav-space`。這比讓所有共用彈窗預設縮短安全，因為好友、帳號、日期與 onboarding 彈窗沒有相同產品要求。

### 以 overlay 幾何邊界保留 62px

啟用 prop 時替 overlay 加專用 class；在 `@media (max-width: 640px)` 內設定 `bottom: 62px`。overlay 本身不進入導覽列區域，因此導覽列既不被遮住也不會被透明層攔截，可正常點擊。

不採用提高導覽列 z-index，因為那只會讓導覽顯示在 modal 上方，仍可能覆蓋 footer；也不採用全域縮短 BaseModal，以免擴大影響。

### 保留 scrollable header body footer 結構

不變更 scrollable 模式既有 flex 結構：header/footer 維持 shrink-0，body 維持 flex-1、min-height 受容器控制與 overflow-y-auto。縮短 overlay 可用高度時，長表單繼續只在 body 捲動。

## Implementation Contract

- Behavior: 手機 viewport 寬度不超過 640px 且 `reserveMobileNavSpace=true` 時，BaseModal overlay SHALL 在 viewport 底部保留 62px；該區域 SHALL 不被 overlay 攔截，底部導覽 SHALL 可見且可點擊。
- Interface: BaseModal 公開新增 optional boolean prop `reserveMobileNavSpace`，default false。true 時 overlay SHALL 帶有專用 reserve class；false 時 DOM 與既有滿版幾何 SHALL 維持不變。
- Wiring: EventPage 的建立活動主表單 SHALL 傳入 `reserve-mobile-nav-space`；緊急確認與成功提示 BaseModal SHALL NOT 傳入。
- Failure mode: 表單內容高於縮短後的 modal 時，body SHALL 使用現有垂直捲動；footer SHALL 留在 modal 內且位於導覽列上方。
- Acceptance: BaseModal tests 驗證 prop default、opt-in class 與手機 62px CSS；EventPage tests 驗證只在主表單啟用。targeted tests、lint、format、build 與 diff check SHALL 通過。
- Scope: 僅修改 BaseModal、EventPage 與其測試；不得修改 AppSidebar、CalendarMain 或建立活動資料邏輯。

## Risks / Trade-offs

- [Risk] modal 可用高度減少 62px，短螢幕顯示欄位更少 → 保留 body 內捲動與固定 footer，確保所有欄位仍可操作。
- [Risk] BaseModal 新 prop 被其他呼叫端誤用 → 預設 false，並以測試鎖定只有 EventPage 主表單啟用。
