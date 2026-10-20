import type { Metadata, Viewport } from "next";
import { Toaster } from "@/components/ui/sonner";
import { SITE_DESCRIPTION, SITE_TITLE, SITE_URL } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_TITLE, template: "%s｜career-hub" },
  description: SITE_DESCRIPTION,
  applicationName: "career-hub",
  openGraph: { type: "website", locale: "ja_JP", siteName: "career-hub", url: "/", title: SITE_TITLE, description: SITE_DESCRIPTION },
  twitter: { card: "summary_large_image", title: SITE_TITLE, description: SITE_DESCRIPTION },
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
