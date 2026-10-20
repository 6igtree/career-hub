import type { Metadata, Viewport } from "next";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "厚生労働省様式の履歴書｜career-hub",
  description:
    "厚生労働省の履歴書様式例どおりの履歴書を、ブラウザで入力するだけで PDF にできます。無料・登録不要で、入力内容は外に送信しません。",
  applicationName: "career-hub",
};

export const viewport: Viewport = {
  viewportFit: "cover", // iPhone のホームバーを避けて操作バーを置く
  themeColor: "#f8f4ec", // 背景の生成りと同じ色
  colorScheme: "light", // ダークモードは使わない（端末がダークでも明るく出す）
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
