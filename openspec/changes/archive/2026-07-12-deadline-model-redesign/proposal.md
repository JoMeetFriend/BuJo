## Why

活動建立表單目前用單一 `deadline` 欄位＋固定預設偏移算截止時間，這個模型有多個實際踩到的問題：`getValidDeadlinePresets` 判斷「還沒過去」完全沒有安全緩衝，導致活動明天才開始時，系統自動選中的「1 天前」預設可能只剩下 24 分鐘的報名緩衝卻毫無警示；`isUrgent` 檢查的是「活動本身多快開始」而不是「算出來的截止時間多快到」，兩個訊號在事件夠近時才會同步觸發，事件稍遠就會脫鉤，完全偵測不到風險；情境三／四的錨點目前綁在最早候選日，導致黃色提醒文字承諾「其他候選日不受影響」卻無法兌現。同時 `ActivityDetailModal.vue` 切換活動時 `actionError` 沒有重置，會讓舊的報名錯誤訊息殘留到不相關的活動卡片上；決選候選清單跟 `AvailabilityPickerModal` 都沒有處理候選時段/候選日期已經過期的狀態，讓使用者能選到早已過去的時段。這次要把建立表單的截止時間顯示、選取邏輯、跟相關的過期狀態呈現一次修正，避免使用者在不知情的情況下建立出報名緩衝過短甚至已經過期的活動。

## What Changes

- **建立表單三行常駐顯示**：取代現有「調整列 vs 黃色警示框」互斥關係，改成兩行永遠顯示（報名截止時間、決策硬截止時間），第三行只有情境三／四且有候選日快到時才出現
- **智慧預設演算法**：不再永遠選「還沒過去的最大偏移量」當預設，改成固定先試「3 小時前」當一般情況目標值，不安全才依序降級到「1 小時前」→「30 分鐘前」→無報名緩衝，不分「當天／非當天」兩套邏輯
- **`isUrgent` 判斷方式改為檢查算出來的截止時間本身是否貼近現在**，取代現行檢查「活動本身距今多久」的做法
- **二次確認 modal（`showUrgentConfirm`）觸發範圍縮到極端情況**：只有智慧演算法五層都無法提供安全緩衝時才跳出，文字同步更新
- **情境四補上跟情境三對等的候選日提醒文案**（現行只有情境三有專屬文字）
- **情境二新增時間窗必填即時驗證**：比照情境一 `timeError` 模式，因為新的截止時間模型下，情境二的決策硬截止時間錨點依賴時間窗的開始時間，未設定會導致錨點退化成不合理的預設值
- **`ActivityDetailModal.vue` 的 `actionError` 在 `fetchActivity()` 切換活動時重置**，修掉舊錯誤訊息殘留到不同活動卡片的 bug
- **決選候選清單新增過期候選項目的呈現**：情境二／三／四適用，維持顯示但整列停用樣式＋文字標籤，不能只靠灰階顏色
- **`AvailabilityPickerModal.vue` 新增候選日期／候選時段整體過期時的停用狀態**：目前只有情境二／三／四共用的「今天的時段選單排除過去鐘點」這種局部時間過濾，沒有「整個候選日期/窗口已經過期」的日期格子層級停用，這次要新增，日曆格子放不下文字標籤，改用非顏色的視覺標示（例如刪除線或圖示）

## Non-Goals (optional)

- **不包含任何通知功能**：`vote_deadline_at` 到期人數未達標時通知建立者、以及既有 `time_to_pick`/`activity_cancelled`/`activity_confirmed` 通知型別的呈現/管理，是另一位組員的通知功能工作範圍，本次 change 不處理
- **不包含後端 API 契約異動**：`deadline_at`/`vote_deadline_at` 語意調整、狀態機（`recruiting`→`voting`→`cancelled`/`confirmed`）統一四情境行為，是後端 `BuJoBackend` repo 平行進行的另一個 change，本次前端 change 只處理 UI 呈現與前端計算邏輯，不修改 API 呼叫的資料結構本身
- **不包含「報名截止後隱藏活動卡片給非報名者/非建立者」的存取限制功能**：這是使用者額外要求的獨立新功能，會另開專屬 change，不在本次範圍

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `activity-deadline-validation`: 建立表單的截止時間顯示與選取邏輯全面改版——三行常駐顯示取代現有「調整列 vs 黃色框」互斥關係、智慧預設演算法取代永遠選最大有效偏移量的做法、`isUrgent` 判斷依據從「活動本身距今多久」改成「算出來的截止時間距今多久」、二次確認 modal 觸發範圍限縮、情境二新增時間窗必填驗證
- `activity-decision-view`: 決選候選清單新增過期候選項目的停用樣式＋文字標籤呈現；`actionError` 在切換活動時正確重置
- `activity-schedule-time-picker-validation`: 從現行「今天的時段選單排除過去鐘點」的小時層級過濾，擴充到「候選日期/候選窗口整體已過期」的日期格子層級停用
- `scenario-b-availability-reporting`: 建立表單的時間窗從「選填」改為「必填」，因為新的截止時間模型下，情境二的決策硬截止時間錨點依賴時間窗的開始時間存在

## Impact

- Affected specs: `activity-deadline-validation`, `activity-decision-view`, `activity-schedule-time-picker-validation`, `scenario-b-availability-reporting`
- Affected code:
  - Modified: src/components/EventPage.vue
  - Modified: src/components/ActivityDetailModal.vue
  - Modified: src/components/AvailabilityPickerModal.vue
