import type { Metadata } from "next";
import { ApplicationList } from "@/components/application-list";

// 中身は各自のブラウザにしかないので、検索には出さない
export const metadata: Metadata = { title: "選考管理", robots: { index: false } };

export default function Page() {
  return <ApplicationList />;
}
