# 三彡川設計驗收管理系統

室內設計公司內部使用的工地驗收 Web App。目標是把紙本驗收流程數位化，讓現場缺失紀錄、照片整理與驗收報告輸出可以即時完成。

## MVP 功能

- 專案建立：專案名稱、驗收日期、業主名稱、工地地址、備註
- 缺失紀錄：位置、缺失內容、狀態、改善期限、備註
- 狀態管理：待改善 / 已完成
- 現場照片：手機與 iPad 上傳、前端壓縮、綁定缺失項目
- PDF 報告：以瀏覽器列印流程輸出 A4 驗收報告，可另存 PDF
- 響應式介面：支援手機、iPad、電腦
- Firebase-ready：已保留 Auth、Firestore、Storage 初始化架構

電子簽名暫不列入此版 MVP。

## 技術架構

- Frontend：Next.js App Router
- UI：Next.js 承載最新版 HTML / CSS / JavaScript 原型
- Backend-ready：Firebase Authentication、Firestore、Cloud Storage
- Hosting：Firebase Hosting，可接 GoDaddy 自訂網域，例如 `app.xxx.com`

## 專案結構

```text
.
├── app/                # Next.js App Router 入口
│   ├── layout.tsx      # 全站 metadata 與 layout
│   ├── page.tsx        # 載入最新版驗收系統原型
│   └── globals.css     # Next 外框樣式
├── public/prototype/   # 目前最新版驗收系統 UI
│   ├── index.html      # 系統畫面
│   ├── styles.css      # 系統樣式
│   └── app.js          # 系統互動邏輯
├── lib/                # Firebase 與資料型別設定
├── index.html          # file:// 預覽轉向頁
├── .env.example        # Firebase 環境變數範本
├── package.json        # 專案套件與啟動指令
└── README.md           # 專案說明
```

`.next`、`node_modules`、`.DS_Store` 等本機產物已列入 `.gitignore`，不需要上傳到 GitHub。

目前正式 Next.js 首頁會載入 `public/prototype/index.html`。根目錄的 `index.html` 只是為了保留本機 `file://` 預覽路徑，會自動轉向同一份 prototype。

## 開發啟動

```bash
npm install
npm run dev
```

開發網址預設為：

```text
http://localhost:3000
```

## Firebase 設定

先複製環境變數範本：

```bash
cp .env.example .env.local
```

再填入 Firebase Web App 設定：

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

目前 prototype 已接 Firebase：登入使用 Authentication，專案 / 缺失 / 追加單寫入 Firestore，缺失照片上傳到 Cloud Storage。若 Firestore 還沒有資料，系統會先保留示範資料方便確認操作流程。

## Firebase Authentication 登入

目前 prototype 已接 Firebase Email/Password 登入，不使用 Google 登入。

Firebase Console 需先完成：

1. 到 `Authentication > Sign-in method` 啟用 `Email/Password`。
2. 到 `Authentication > Users` 新增使用者：`service@shanchuandesign.com`。
3. 使用 Firebase 後台設定的密碼登入系統。

## Firebase 前端設定檔與部署

GitHub 會把 Google / Firebase Web API Key 判定為 secret，所以正式設定不要直接寫在 `app.js`。

本機測試時可複製範本：

```bash
cp public/prototype/firebase-config.example.js public/prototype/firebase-config.js
```

再把 `public/prototype/firebase-config.js` 內的欄位換成 Firebase Console 提供的 Web App config。這個檔案已被 `.gitignore` 忽略，不要 commit。

線上部署不需要從本機提供這個檔案。GitHub Actions 會從 repository secret `FIREBASE_CONFIG_JSON` 自動產生 `public/prototype/firebase-config.js`，再部署到 GitHub Pages。

`FIREBASE_CONFIG_JSON` 格式如下：

```json
{
  "apiKey": "YOUR_FIREBASE_WEB_API_KEY",
  "authDomain": "YOUR_PROJECT_ID.firebaseapp.com",
  "projectId": "YOUR_PROJECT_ID",
  "storageBucket": "YOUR_PROJECT_ID.firebasestorage.app",
  "messagingSenderId": "YOUR_MESSAGING_SENDER_ID",
  "appId": "YOUR_FIREBASE_APP_ID",
  "measurementId": "YOUR_MEASUREMENT_ID"
}
```

GitHub Pages 設定請選 `GitHub Actions` 作為部署來源。每次 push 到 `main` 後，workflow 會自動更新正式網址。

## Firestore / Storage 同步

目前資料結構：

- `projects/{projectId}`：專案基本資料。
- `projects/{projectId}/defects/{defectId}`：缺失項目。
- `projects/{projectId}/addendums/{addendumId}`：工程追加項目。
- `Storage/projects/{projectId}/defects/{defectId}/...`：缺失照片。

MVP 測試階段可先用 Firebase 測試模式；準備上線前建議改成「已登入使用者才可讀寫」：

```js
allow read, write: if request.auth != null;
```

## Google Apps Script 提醒

靜態版已先準備提醒 payload。缺失或追加工程儲存時，系統會整理以下資料：

- 專案名稱
- 工程內容
- 負責人
- 設計師 Google 信箱
- 截止日期
- 提醒日期（截止日前一天）

後續將 Apps Script 部署成 Web App 後，把網址填入 `public/prototype/app.js` 的 `GAS_REMINDER_ENDPOINT` 即可開始串接。

Apps Script 端可用 `e.postData.contents` 讀取 JSON 字串，再依 `remindAt` 建立排程或寫入 Google Sheet。

登入帳號預計使用 GoDaddy 公司網域信箱：`service@shanchuandesign.com`；專案負責設計師的提醒信箱使用 Google / Gmail 信箱。

## 部署方向

1. 在客戶 Firebase 帳號建立專案。
2. 啟用 Authentication、Firestore Database、Cloud Storage、Hosting。
3. 將此 Next.js 專案部署到 Firebase Hosting。
4. 在 GoDaddy DNS 設定自訂子網域，例如 `app.xxx.com`。
5. Firebase Hosting 會自動管理 SSL 憑證。

## Ownership

客戶擁有 Firebase 專案、Database 資料、Storage 檔案、網域與 Hosting 帳號。

開發端保留系統原始碼著作權、GitHub repository、通用元件與系統架構。
