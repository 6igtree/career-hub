import type { Metadata } from "next";
import { ResumeList } from "@/components/resume-list";

// 中身は各自のブラウザにしかないので、検索には出さない
export const metadata: Metadata = { title: "保存した履歴書", robots: { index: false } };

export default function Page() {
  return <ResumeList />;
}
