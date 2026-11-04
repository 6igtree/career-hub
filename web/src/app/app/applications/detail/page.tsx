import type { Metadata } from "next";
import { Suspense } from "react";
import { ApplicationDetail } from "@/components/application-detail";

// 中身は各自のブラウザにしかないので、検索には出さない
export const metadata: Metadata = { title: "選考の記録", robots: { index: false } };

export default function Page() {
  // ?id= はブラウザで読むので、開いてから描画する
  return (
    <Suspense>
      <ApplicationDetail />
    </Suspense>
  );
}
