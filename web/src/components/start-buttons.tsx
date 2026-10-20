"use client";

import { useRouter } from "next/navigation";
import { Plus, Sparkles } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { SAMPLE, type Resume } from "@/lib/resume";
import { createResume, editHref } from "@/lib/store";

/** トップの「つくる」「見本で試す」。押すと新しい履歴書を作って編集ページへ */
export function StartButtons({ className }: { className?: string }) {
  const router = useRouter();
  const create = (data?: Resume, title?: string) => router.push(editHref(createResume(data, title)));
  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row", className)}>
      <Button className="h-12 px-6 text-base has-data-[icon=inline-start]:pl-5.5" onClick={() => create()}>
        <Plus data-icon="inline-start" />
        履歴書をつくる
      </Button>
      <Button variant="outline" className="h-12 px-6 text-base has-data-[icon=inline-start]:pl-5.5" onClick={() => create(structuredClone(SAMPLE), "見本")}>
        <Sparkles data-icon="inline-start" />
        見本で試す
      </Button>
    </div>
  );
}
