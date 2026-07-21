## Problem

手機版建立活動主表單使用滿版 BaseModal 遮罩，會覆蓋固定在底部的 62px 主導覽列，導致導覽入口不可見也無法點擊離開建立流程。

## Root Cause

BaseModal overlay 使用 `fixed inset-0 z-[80]` 佔滿 viewport；手機底部導覽列為固定 62px 且 z-index 50。建立活動表單沒有提供 opt-in 的底部保留空間，因此 overlay 與 footer 都延伸到導覽列區域。

## Proposed Solution

- 為 BaseModal 新增預設關閉的 `reserveMobileNavSpace` boolean prop。
- prop 開啟且 viewport 寬度不超過 640px 時，讓 overlay 底部停在導覽列上方 62px。
- 僅建立活動主表單啟用此 prop；緊急確認、成功提示及其他共用彈窗維持既有行為。
- 保留 scrollable body 與固定 header/footer，使長表單仍可在 modal 內捲動。

## Non-Goals

- 不修改 AppSidebar 手機導覽列高度、z-index 或互動。
- 不變更建立活動資料、驗證或送出流程。
- 不讓所有 BaseModal 預設避開底部導覽列。

## Success Criteria

- 手機寬度不超過 640px 時，建立活動主表單 overlay 與 footer 不覆蓋 62px 底部導覽列。
- 底部五個導覽入口完整可見且可點擊。
- 表單內容過長時 body 維持垂直捲動，footer 仍固定在 modal 內。
- 其他 BaseModal 的滿版遮罩行為不變。

## Capabilities

### New Capabilities

- `event-modal-mobile-nav-layout`: 建立活動主表單在手機上保留底部導覽列空間，同時維持表單內捲動與可操作 footer。

### Modified Capabilities

(none)

## Impact

- Affected code:
  - Modified: `src/components/ui/BaseModal.vue`
  - Modified: `src/components/EventPage.vue`
  - Modified: `src/__tests__/BaseModal.test.js`
  - Modified: `src/__tests__/EventPage.test.js`
  - New: `openspec/changes/fix-event-modal-mobile-nav-overlap/specs/event-modal-mobile-nav-layout/spec.md`
  - New: `openspec/changes/fix-event-modal-mobile-nav-overlap/design.md`
  - New: `openspec/changes/fix-event-modal-mobile-nav-overlap/tasks.md`
  - Removed: (none)
