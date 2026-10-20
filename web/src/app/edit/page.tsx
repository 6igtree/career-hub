import { Suspense } from "react";
import { ResumeApp } from "@/components/resume-app";

export default function Page() {
  // ?id= はブラウザで読むので、開いてから描画する
  return (
    <Suspense>
      <ResumeApp />
    </Suspense>
  );
}
