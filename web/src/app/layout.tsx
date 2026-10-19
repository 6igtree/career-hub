import type { Metadata, Viewport } from "next";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "career-hub｜厚生労働省様式の履歴書をブラウザでつくる",
  description:
    "厚生労働省履歴書様式例の公式 PDF に入力内容を書き込んで、履歴書の PDF をつくれます。無料・登録不要で、入力内容はブラウザの外に送信しません。",
  applicationName: "career-hub",
};

export const viewport: Viewport = {
  viewportFit: "cover", // iPhone の画面下の余白（ホームバー）を避けて操作バーを置くため
  themeColor: "#f8f4ec", // 背景の生成りと同じ色
  colorScheme: "light", // ダークモードは使わない（端末がダークでも、入力欄やスクロールバーを明るい色で出す）
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
