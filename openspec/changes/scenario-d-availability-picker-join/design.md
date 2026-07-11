## Context

`AvailabilityPickerModal.vue` 目前有兩種模式：一般模式（一個全域 `timeWindowStart`/`timeWindowEnd` 套用到所有選取日期，情境二在用）、`dateOnly` 模式（完全沒有時間面板，情境三在用）。情境四的候選時段原本規劃是創建者為每個候選日期各自預先開好的離散窗口、一天可以有多個，後來確認這個「一天多窗口」的彈性缺乏驗證、是參與者端兩個實際 bug 的根因，決定拿掉——**改成一天只對應一組時段**，`dateWindows` 的形狀也跟著從「日期對窗口陣列」簡化成「日期對單一窗口物件」。

元件本身的時間選擇是下拉選單清單（`selectedDates[date]` 本來就是陣列，支援同一天加多筆時段），不是拖曳選取，這點延續沿用。

`ActivityDetailModal.vue` 目前用 `isScenarioCMode`（`schedule_variant==='find_date'`）驅動情境三的 checkbox→picker 切換；建立者決策畫面用 `!isRangeMode` 分支通用渲染 `activity.decision_candidates` 扁平陣列（情境三／四共用），`isRangeMode` 分支則是情境二專屬的 `perfectOverlapCandidates`/`partialOverlapCandidates` 巢狀顯示。後端（`BuJoBackend` 同名 change）幫情境四的 `decision_candidates` 每筆加上了 `perfect_overlap`/`partial_overlap`（各候選時段自己的交集運算結果），現有的 `!isRangeMode` 通用分支只會顯示 `slotText(slot)` 跟 `count`，看不到這兩個新欄位，需要在情境四時額外巢狀顯示。

`EventPage.vue` 建立候選時段的 UI 原本規劃不動，但「一天一組時段」的簡化必須連帶拿掉「＋新增候選時段」，否則建立者還是能在 UI 上生出一天多筆的資料違反新的模型限制。

## Goals / Non-Goals

**Goals:**
- `AvailabilityPickerModal` 能依日期限制可選時間範圍在創建者開的單一窗口內
- 情境四參與者全程（加入前、加入後修改）都透過 picker 操作，不出現 checkbox
- 情境四的文字/狀態顯示比照情境三的既有模式
- 建立者決策畫面能看到情境四每個候選時段各自算出的完全重疊/部分重疊窄窗口，並能自由選任一個確認成團
- `EventPage.vue` 的候選時段建立 UI 限制成一天一組時段，跟後端的建立驗證一致

**Non-Goals:**
- 不重做元件的日曆拖曳選日期機制（`onDayMousedown`/`onDayMouseover`/`canSelectDateKey`），情境四直接沿用 `allowedDates` 限制，跟情境三同一套
- 不做「修改日期」「修改時間」兩顆按鈕並存的設計——情境四只有一顆按鈕，日期跟時段一起修改
- 不改情境三的決策畫面渲染邏輯，`activity.decision_candidates` 通用陣列渲染已經相容後端新回傳的完整排名，不需要調整

## Decisions

### hourOptions 改成依 activeDate 查單一 dateWindows 物件

`dateWindows` 從陣列簡化成單一物件（`{date: {start, end, slotId}}`）後，`hourOptions` 不用再算「聯集」，直接依 `activeDate` 讀該日期的單一窗口範圍即可；`startHourOptions`/`endHourOptionsFor` 不用改，繼續疊加在新的 `hourOptions` 之上。

### defaultDayValue 在 dateWindows 模式下自動帶入該日期唯一窗口的完整範圍，而非「整天有空」

`dateWindows` 模式下「整天有空」這個概念沒有意義。新選到一個有 `dateWindows` 的日期時，`defaultDayValue()` 改成回傳一筆 `{from: w.start, to: w.end}`（該日期唯一窗口的完整範圍），對應地 `isAllDay()` 在 `dateWindows` 有值時永遠回傳 `false`。

### handleConfirm 新增窗口 fit 驗證，跟現有重疊檢查並列

`dateWindows` 模式下，除了既有的「同一天時段不能重疊」檢查（`findOverlapConflictDate`，適用參與者自己用「＋新增時段」加的多筆子區間），新增「每筆時段必須完整落在該日期唯一窗口內」的檢查（`findOutOfWindowDate`），沒通過一樣設 `confirmError`、跳到對應日期，不送出。因為一天只有一個窗口，不會再有「落在窗口間空隙」的情況，只需要檢查「完整落在窗口內」。

### ActivityDetailModal 只用一顆按鈕涵蓋「加入」跟「修改」

情境四統一成同一個動作——不管是第一次加入還是事後修改，都是同一顆按鈕開同一個 picker。

### 建立者決策畫面情境四新增巢狀交集顯示，比照情境二的呈現模式

`ActivityDetailModal.vue` 的決策區塊（`!isRangeMode` 分支）情境四新增子分支：對 `activity.decision_candidates` 裡的每個候選時段，各自渲染一組「完全重疊」/「部分重疊」子清單（讀該候選時段自己的 `perfect_overlap`/`partial_overlap`），沿用情境二 `perfectOverlapCandidates`/`partialOverlapCandidates` 已經有的 radio + `slotText` + 票數呈現方式。建立者選定某個候選時段底下的某個窄窗口後，`confirmFormation` 送出的 body 從單純 `{candidateSlotId}` 改成 `{candidateSlotId, slotStart, slotEnd}`——`candidateSlotId` 是外層候選時段的 id，`slotStart`/`slotEnd` 是選定的窄窗口時間，兩者都必須送，跟後端新的 confirmFormation 情境四驗證規則一致。

### EventPage.vue 拿掉「＋新增候選時段」，一天一組時段

`addCandidateTimeSlot`/`removeCandidateTimeSlot` 兩個函式與「＋新增候選時段」按鈕整組移除，`candidateSlots` 的資料結構從 `[{date, timeSlots: [{id, startTime, endTime}]}]` 簡化成 `[{date, startTime, endTime}]`，送給後端 `dateSlots` 的 payload shape 本來就是扁平陣列，不受影響——只是現在保證每個 `date` 只會出現一次。

## Risks / Trade-offs

- **[Risk]** `dateWindows` 跟既有的全域 `timeWindowStart`/`timeWindowEnd` 是兩套平行機制，元件內同時存在 → **Mitigation**：用 `dateWindows` 是否有值判斷要走哪一套，彼此不會同時生效（情境四傳 `dateWindows`、情境二傳全域 window），不需要處理衝突優先序
- **[Risk]** 建立者決策畫面的情境四巢狀顯示，選定的是「候選時段底下的某個窄窗口」而不是候選時段本身，`selectedDecisionSlotId` 這個既有的單一 ref 不夠用，需要同時記錄外層候選時段 id 跟內層窄窗口的 start/end → **Mitigation**：改用一個物件 `selectedDecisionSlot: {candidateSlotId, slotStart, slotEnd} | null`，取代單純的 `selectedDecisionSlotId`，情境三／情境二維持只用得到其中一部分欄位
- **[Risk]** `EventPage.vue` 移除「＋新增候選時段」是 BREAKING UI 變更，如果使用者正在編輯一個已經有多筆時段的舊草稿 → **Mitigation**：這個功能還在開發分支上，沒有正式使用者資料，不需要處理舊草稿相容

## Migration Plan

無資料遷移需求（純前端元件與頁面邏輯變更）。依 tasks.md 順序實作＋補測試，全部通過後才 commit。跟後端 `scenario-d-matching-rework` change 屬於同一組功能，API contract（`decision_candidates` 格式、`confirmFormation` body）已經在後端變更，前端這次一併對齊，避免分開部署造成前後端不相容。

## Open Questions

（無）

## Addendum：跨情境 UI 配色一致性修復

情境四手動流程驗證過程中額外發現的問題，見 proposal.md 的同名 Addendum 段落。這裡只記錄跟既有設計相關的技術決策。

### 「已選日期」統一成一個共用 CSS 變數，不沿用 `--bujo-accent`

`--bujo-accent` 在全站十幾個檔案裡用於 focus outline、hover 邊框、圖示顏色等不相關用途，不能直接把它改成新顏色。改成新增專屬的 `--bujo-day-selected: #daebeb`，`AvailabilityPickerModal.vue`/`EventPage.vue` 四個各自獨立維護「已選」顏色的函式全部改指向這一個變數。「目前編輯中／作用中」的黑色狀態（`isEditing`、`AvailabilityPickerModal` 的作用中 chip）語意上是另一個獨立概念，不受影響、維持黑色。

### 時間下拉選單選中文字不可見，根因是同一元素上兩個文字顏色 class 互相覆蓋

`EventPage.vue` 的時間按鈕原本 base class 固定寫 `text-[var(--bujo-ink)]`，選中狀態的條件 class 又疊加 `text-[var(--bujo-white)]`。Tailwind 對同一元素上兩個作用相同屬性（文字顏色）的 utility class，最終生效的是**樣式表裡宣告順序在後**的那個，不是 DOM 上 class 出現的順序，所以無法用調整 template 裡 class 順序來修——只能讓兩個 class 的意圖從根本上不衝突。修法是選中狀態改成跟 base class 一致的 `text-[var(--bujo-ink)]`（背景換成淺色的 `--bujo-day-selected` 而不是深色的 `--bujo-ink`），從此不會有兩個互斥的文字顏色 class 同時存在。

### 卡片狀態色計算搬進 `ActivityDetailModal.vue` 內部，不再要求呼叫端外部綁定

原本 `activity-focus-card--*` 狀態 class 是由呼叫端（`ActivityView.vue`）用 `focusCardClass(activity)` 算好後外部 `:class` 綁定在 `<ActivityDetailModal>` 元件上——這個設計要求每個呼叫端都要記得自己算、自己綁，`DateEventsModal.vue` 這個呼叫路徑就漏掉了，卡片永遠只會顯示 CSS 裡寫死的預設藍色，狀態色機制形同虛設。`ActivityDetailModal.vue` 本身已經有 fetch 到的完整 `activity` 物件（`is_creator`/`has_joined`/`status`），把同一套判斷邏輯搬進元件內部算成 `computed`、綁在元件自己的根元素上，不管誰呼叫這個元件都會自動套用正確狀態色，結構性地不會再出現「忘記綁定」的情況。`ActivityView.vue` 原本的外部綁定跟著移除，避免兩處邏輯重複、以後各自漂移。
