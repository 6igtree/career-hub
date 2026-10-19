"use client";

import { Check } from "lucide-react";
import { cn } from "cn";
import type { Resume } from "@/lib/resume";

export type SectionId = "basic" | "address" | "history" | "licenses" | "motivation";

export const SECTIONS: { id: SectionId; label: string }[] = [
  { id: "basic", label: "基本情報" },
  { id: "address", label: "現住所" },
  { id: "history", label: "学歴・職歴" },
  { id: "licenses", label: "免許・資格" },
  { id: "motivation", label: "志望動機" },
];

const has = (s: string) => s.trim().length > 0;

/** 各欄の主な項目が埋まっているか。目安として見せるだけで、保存は止めない */
export function sectionStatus(r: Resume): Record<SectionId, boolean> {
  const p = r.profile;
  return {
    basic: has(p.name) && has(p.kana) && has(p.birth),
    address: has(p.postal) && has(p.address) && has(p.phone),
    history: r.education.some((x) => has(x.text)),
    licenses: r.licenses.some((x) => has(x.text)),
    motivation: has(r.resume.motivation),
  };
}

/** 入力の進み具合。押すとその欄へ移る。画面上部に固定し、スマホでは横にスクロールする */
export function SectionNav({ status }: { status: Record<SectionId, boolean> }) {
  const done = SECTIONS.filter((s) => status[s.id]).length;
  return (
    <nav aria-label="入力する項目" className="sticky top-14 z-30 -mx-4 border-b bg-background/85 px-4 py-2 backdrop-blur-md sm:-mx-6 sm:px-6 lg:mx-0 lg:rounded-xl lg:border lg:px-2">
      <div className="flex items-center gap-2">
        {/* relative：読み上げ用の隠し文字（sr-only）が横スクロールの外にはみ出してページ幅を広げないように */}
        <ol className="relative flex min-w-0 flex-1 gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {SECTIONS.map((s, i) => (
            <li key={s.id} className="shrink-0">
              <a
                href={`#${s.id}`}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors hover:bg-muted",
                  status[s.id] ? "border-primary/30 bg-primary/5 text-foreground" : "text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "grid size-4 place-items-center rounded-full text-[10px] tabular-nums",
                    status[s.id] ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                  )}
                >
                  {status[s.id] ? <Check className="size-2.5" strokeWidth={3} aria-hidden /> : i + 1}
                </span>
                {s.label}
                {status[s.id] && <span className="sr-only">（入力済み）</span>}
              </a>
            </li>
          ))}
        </ol>
        <span className="hidden shrink-0 text-xs text-muted-foreground tabular-nums sm:block">
          {done} / {SECTIONS.length} 完了
        </span>
      </div>
    </nav>
  );
}

/** 欄の見出しの前に付ける番号。入力済みならチェックにする */
export function SectionNumber({ n, done }: { n: number; done: boolean }) {
  return (
    <span
      className={cn(
        "grid size-6 shrink-0 place-items-center rounded-full text-xs font-semibold tabular-nums",
        done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
      )}
    >
      {done ? <Check className="size-3.5" strokeWidth={3} aria-label="入力済み" /> : n}
    </span>
  );
}
