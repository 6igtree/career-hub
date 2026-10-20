import type { Metadata } from "next";
import { Suspense } from "react";
import { ResumeApp } from "@/components/resume-app";

// 中身は各自のブラウザにしかないので、検索には出さない
export const metadata: Metadata = { title: "履歴書を編集", robots: { index: false } };

export default function Page() {
  // ?id= はブラウザで読むので、開いてから描画する
  return (
    <Suspense>
      <ResumeApp />
    </Suspense>
  );
}
