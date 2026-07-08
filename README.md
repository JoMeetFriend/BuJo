# BuJo（前端）

好友揪團活動規劃平台的前端專案。使用者可以註冊/登入、加好友、建立與報名活動，未來將延伸通知、投票、聊天室等功能。

本 repo 為前端，需搭配後端 [BuJoBackend](https://github.com/JoMeetFriend/BuJoBackend)（Node.js + Express + Prisma + PostgreSQL）一起運作。

## 技術棧

- Vue 3 + Vite
- Pinia（狀態管理）
- Vue Router
- Tailwind CSS
- Vitest（測試）
- ESLint + oxlint + Prettier（程式碼風格）

## 環境需求

- Node.js `^20.19.0` 或 `>=22.12.0`

## 環境變數

複製 `.env.example` 建立 `.env.local`（本地開發用，已加入 `.gitignore` 不會被 commit）：

```
VITE_API_URL=            # 後端 API 網址，本地開發填 http://localhost:3000
VITE_GOOGLE_CLIENT_ID=   # Google OAuth Client ID（公開值，非密鑰）
```

Vite 讀取順序為 `.env.local` > `.env`，因此本地開發會自動使用 `.env.local` 的設定，部署環境則使用 `.env`，不需要手動切換。

## 認證方式

- **本地帳號密碼**：註冊/登入走後端 API
- **Google 登入**：前端取得 Google ID Token 後送後端驗證，只需要 `VITE_GOOGLE_CLIENT_ID`（公開值），不需要也不應該在前端放 Client Secret
- **LINE 登入**：整個流程（含 callback）都在後端處理，前端不需要額外的環境變數

若要在本地測試 OAuth 登入，需確認 Google Cloud Console / LINE Developers 後台的 redirect URI 有指向本機網址。

## 安裝與啟動

```sh
npm install
npm run dev
```

### 建置

```sh
npm run build
```

### 測試

```sh
npm run test        # watch 模式
npm run test:run    # 單次執行
```

### Lint / Format

```sh
npm run lint
npm run format
```

## 部署

- 前端：[Vercel](https://bujofe.vercel.app)
- 後端：[Render](https://bujo-backend.onrender.com)

合併進 `dev` 分支的內容會自動部署到上方前端網址，方便 demo。

## 相關 Repo

- 後端：[BuJoBackend](https://github.com/JoMeetFriend/BuJoBackend)

### 使用 Docker 本地建置與運行

由於專案採用 Vite，環境變數必須在**建置階段（Build Time）**寫入。打包時請務必帶入 `--build-arg`，否則會預設連至 localhost：

```sh
docker build \
  --build-arg VITE_API_URL=https://your-backend-api.com\
  --build-arg VITE_GOOGLE_CLIENT_ID=your-google-id \
  -t bujo-frontend .
```
