import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "next-themes";
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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f7f9" },
    { media: "(prefers-color-scheme: dark)", color: "#16181c" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" className="h-full antialiased" suppressHydrationWarning>
      <body className="flex min-h-full flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <Toaster position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
