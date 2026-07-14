<!-- SPECTRA:START v1.0.2 -->

# Spectra Instructions

This project uses Spectra for Spec-Driven Development(SDD). Specs live in `openspec/specs/`, change proposals in `openspec/changes/`.

## Use `$spectra-*` skills when:

- A discussion needs structure before coding → `$spectra-discuss`
- User wants to plan, propose, or design a change → `$spectra-propose`
- Tasks are ready to implement → `$spectra-apply`
- There's an in-progress change to continue → `$spectra-ingest`
- User asks about specs or how something works → `$spectra-ask`
- Implementation is done → `$spectra-archive`
- Commit only files related to a specific change → `$spectra-commit`

## Workflow

discuss? → propose → apply ⇄ ingest → archive

- `discuss` is optional — skip if requirements are clear
- Requirements change mid-work? `ingest` → resume `apply`

## Parked Changes

Changes can be parked（暫存）— temporarily moved out of `openspec/changes/`. Parked changes won't appear in `spectra list` but can be found with `spectra list --parked`. To restore: `spectra unpark <name>`. The `$spectra-apply` and `$spectra-ingest` skills handle parked changes automatically.

<!-- SPECTRA:END -->

# AGENTS.md

給所有協助這個 repo 開發的 AI coding agent（Claude Code、Codex、或其他工具）看的共用規則。此檔案是規則的唯一來源；`CLAUDE.md` 只補充 Claude Code 專屬設定，不重複這裡的內容。

## 專案概述

BuJo 前端，Vue 3 + Vite + Pinia + Vue Router + Tailwind。需搭配後端 [BuJoBackend](https://github.com/JoMeetFriend/BuJoBackend)（Node/Express/Prisma/PostgreSQL）運作，詳見 README.md。

## 視覺設計規範

- UI / visual implementation follows `BuJo_Visual_Specification_v1.md`.
- Follow its 2026 Modern Paper correction: preserve BuJo's paper/editorial/printed-object character while using mature spacing, padding, typography hierarchy, and ink/color scale.
- Avoid both flat equal-weight wireframes and generic AI/SaaS soft-card UI.

## 目錄結構重點

- `src/components/` — 頁面與 UI 元件
- `src/stores/` — Pinia store（如 `auth.js` 認證狀態、`friendStore.js` 好友狀態）
- `src/router/` — 路由與認證守衛
- `src/composables/` — 共用邏輯（如 `useUserSearch.js`）

## 開發指令

```sh
npm run dev          # 本地開發
npm run build         # 建置
npm run test:run       # 執行測試（Vitest）
npm run lint          # eslint + oxlint
npm run format        # prettier
```

修改程式碼後執行 `npm run lint` 與 `npm run format`，不要手動調整格式（已有 eslint/oxlint/prettier 設定）。

## 測試

前端測試框架為 Vitest。新增或修改功能時，同步補上對應測試（`*.spec.js` / `*.test.js`）。

## Git 慣例

- **分支命名**：kebab-case，格式為 `feature/描述-描述`（例：`feature/local-signup-login`），不要用底線
- **Commit 訊息**：目前沒有嚴格格式，通常是動詞開頭或分類開頭（例：「新增:」「更新:」「修正:」，也有 `refactor(scope):` 這類寫法）。新增 commit 時，觀察附近既有的 commit 風格照抄即可，不需要發明新格式
- **Issue**：格式為「功能 + 預期結果」

## PR 審閱

此專案 PR 會有 Gemini 自動審閱，異動盡量聚焦、單一目的，避免大範圍無關改動混在同一個 PR。

## 認證相關的重要邊界（勿破壞）

- Vite 環境變數載入順序是 `.env.local` > `.env`，本地開發用 `.env.local`（已加入 `.gitignore`）。修改 env 載入邏輯前請確認不會破壞這個順序
- `VITE_GOOGLE_CLIENT_ID` 是公開值，前端環境變數**絕不能**加入任何 OAuth Client Secret 或其他機密
- LINE Login 整個流程在後端完成，前端沒有、也不需要對應的 LINE client id 環境變數
- 路由認證守衛與 `stores/auth.js`（`fetchMe`、`logout`、`initialized`）已是既定認證模式，修改前先理解現有流程，避免重複實作或繞過守衛邏輯
