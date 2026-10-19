import { Suspense } from "react";
import { ResumeApp } from "@/components/resume-app";

export default function Page() {
  // どの履歴書かは ?id= で受け取るので、ブラウザで開いてから描画する
  return (
    <Suspense>
      <ResumeApp />
    </Suspense>
  );
}
