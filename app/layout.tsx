import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "山川設計驗收系統",
  description: "室內設計工地驗收、缺失紀錄、照片與 PDF 報告管理系統"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body>{children}</body>
    </html>
  );
}
