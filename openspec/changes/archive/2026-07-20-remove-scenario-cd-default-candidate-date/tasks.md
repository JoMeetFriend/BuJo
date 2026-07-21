## 1. 移除情境三、四的自動預設候選日期

- [x] 1.1 刪除 `EventPage.vue` 情境三的 `watch(currentScenarioKey, ...)` 監聽器（切到情境三、`candidateDates` 為空時自動塞入「明天」的那一段），實現「Scenario C and D do not auto-populate a default candidate date on entry」對應的「Switching to scenario C with no candidate dates leaves the list empty」情境；以瀏覽器手動驗證：今天日期切到情境三，候選日期清單維持空白，不會出現任何自動選取的日期。
- [x] 1.2 刪除 `EventPage.vue` 情境四的 `watch(currentScenarioKey, ...)` 監聽器（切到情境四、`candidateSlots` 為空時自動塞入「明天 09:00–18:00」、含舊格式「上午/下午」時間字串的那一段），實現同一條規格的「Switching to scenario D with no candidate slots leaves the list empty」情境，這個刪除同時移除了程式碼裡唯一還在用舊時間格式字串的殘留；以瀏覽器手動驗證：今天日期切到情境四，候選組合清單維持空白（顯示既有的「尚未新增」空狀態文字），不會出現任何自動選取的日期或「上午/下午」字樣的時間文字。
- [x] 1.3 手動驗證「Existing candidate selections are left untouched when re-entering a scenario」情境：在情境三或情境四手動選好至少一個候選日期後，切到別的情境再切回來，確認原本選好的候選日期／候選時段沒有被清空或改變。

## 2. 整體驗證

- [x] 2.1 執行 `npx vitest run` 確認全數通過（若既有測試依賴這兩段自動帶入的行為而失敗，需要一併更新該測試以反映新行為），執行 `npx vite build` 確認無錯誤，執行 `npx eslint` 確認除既有無關 warning 外無新增問題。
