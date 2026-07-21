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
VITE_LINE_OFFICIAL_ACCOUNT_ADD_FRIEND_URL= # LINE 官方帳號公開 add friend URL
VITE_LINE_OFFICIAL_ACCOUNT_QR_CODE_URL=    # LINE 官方帳號公開 QR Code 圖片 URL
```

Vite 讀取順序為 `.env.local` > `.env`，因此本地開發會自動使用 `.env.local` 的設定，部署環境則使用 `.env`，不需要手動切換。

`VITE_LINE_OFFICIAL_ACCOUNT_ADD_FRIEND_URL` 與
`VITE_LINE_OFFICIAL_ACCOUNT_QR_CODE_URL` 只用來在登入後引導與個人設定頁顯示公開的加入好友入口。兩者可以從 LINE Official Account Manager 或 LINE Developers Console 取得。QR Code 圖片網址未設定時會改用專案內建的官方 QR Code；加入好友網址未設定時不會產生空連結，仍可透過 QR Code 加入。

所有 `VITE_` 變數都會被打包到瀏覽器端，**禁止**放入 LINE Messaging API channel access token、LINE Channel Secret、OAuth Client Secret 或其他機密。`LINE_MESSAGING_CHANNEL_ACCESS_TOKEN` 與 `LINE_PUSH_ENABLED` 僅能設定在 BuJoBackend。

## 認證方式

- **本地帳號密碼**：註冊/登入走後端 API
- **Google 登入**：OAuth 與 callback 都在後端處理，前端只是 `window.location.href` 導頁到後端入口，不需要任何前端環境變數
- **LINE 登入**：OAuth 與 callback 都在後端處理；前端的兩個 LINE 官方帳號環境變數只負責顯示公開 add friend 入口，不參與登入或推播授權

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

部署 LINE 官方帳號引導前，請確認：

- 前端部署環境已設定真實 add friend URL 與 QR Code 圖片 URL。
- 手機可由 add friend URL 開啟正確的 BuJo 官方帳號。
- 桌機可顯示 QR Code，且使用手機 LINE 掃描後開啟同一個官方帳號。
- BuJoBackend 已另外設定 Messaging API token 與 push feature flag；前端不得持有這些值。

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
