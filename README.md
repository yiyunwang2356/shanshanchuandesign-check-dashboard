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
- UI：React + TypeScript + CSS
- Icons：lucide-react
- Backend-ready：Firebase Authentication、Firestore、Cloud Storage
- Hosting：Firebase Hosting，可接 GoDaddy 自訂網域，例如 `app.xxx.com`

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

目前 App 在未填 Firebase 設定時會使用前端暫存資料，方便先確認操作流程。後續可把專案、缺失與照片改接 Firestore / Cloud Storage。

## 部署方向

1. 在客戶 Firebase 帳號建立專案。
2. 啟用 Authentication、Firestore Database、Cloud Storage、Hosting。
3. 將此 Next.js 專案部署到 Firebase Hosting。
4. 在 GoDaddy DNS 設定自訂子網域，例如 `app.xxx.com`。
5. Firebase Hosting 會自動管理 SSL 憑證。

## Ownership

客戶擁有 Firebase 專案、Database 資料、Storage 檔案、網域與 Hosting 帳號。

開發端保留系統原始碼著作權、GitHub repository、通用元件與系統架構。
