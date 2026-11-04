"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, ClipboardList, Download, FileText, ListChecks, MoreHorizontal, Plus, Upload } from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Item, ItemContent, ItemDescription, ItemGroup, ItemTitle } from "@/components/ui/item";
import { Skeleton } from "@/components/ui/skeleton";
import { AppHeader, BottomTabs } from "@/components/app-tabs";
import { ApplicationSheet } from "@/components/application-sheet";
import {
  applicationHref,
  dateLabel,
  importApplications,
  sortSteps,
  stepLabel,
  upcoming,
  useApplications,
  useLoaded,
  useResumeList,
  type Application,
} from "@/lib/store";
import { download } from "@/lib/utils";

// 終わったものは下へ。ほかは次の予定が近い順（予定の無いものはその後ろ）、同じなら更新が新しい順
// "9" は どの日付（"2026-…"）よりも後ろに並ぶ
const nextDate = (a: Application) => upcoming(a.steps)?.date || "9";
const order = (a: Application, b: Application) =>
  Number(a.status === "終了") - Number(b.status === "終了") || nextDate(a).localeCompare(nextDate(b)) || b.updatedAt - a.updatedAt;

/** 選考管理（/app/applications/） */
export function ApplicationList() {
  const loaded = useLoaded();
  const apps = useApplications();
  const resumes = useResumeList();
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const importInput = useRef<HTMLInputElement>(null);
  const sorted = [...apps].sort(order);

  const addButton = (className?: string) => (
    <Button className={cn("h-11 sm:h-9", className)} onClick={() => setAdding(true)}>
      <Plus data-icon="inline-start" />
      応募先を追加
    </Button>
  );

  async function importFile(file: File | undefined) {
    if (!file) return;
    try {
      const n = importApplications(JSON.parse(await file.text()));
      toast.success(`${n}件を読み込みました`);
    } catch {
      toast.error("このファイルは読み込めませんでした", { description: "選考管理で書き出した JSON ファイルを選んでください" });
    }
  }

  return (
    <>
      <AppHeader />

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-4 pt-6 pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:px-6 lg:pb-6">
        <div className="flex min-h-11 items-center justify-between gap-3 sm:min-h-9">
          <h1 className="text-lg font-semibold">選考管理</h1>
          {loaded && (
            <div className="flex items-center gap-2">
              {apps.length > 0 && addButton()}
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant="outline" size="icon" className="size-11 sm:size-9" aria-label="書き出しと読み込み" />}>
                  <MoreHorizontal />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60 sm:w-52">
                  <DropdownMenuItem
                    disabled={apps.length === 0}
                    onClick={() => {
                      download(new Blob([JSON.stringify(apps, null, 2)], { type: "application/json" }), "選考管理.json");
                      toast.success("書き出しました", { description: "別の端末では、ここの「読み込む」で続きを使えます" });
                    }}
                  >
                    <Download />
                    書き出す
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => importInput.current?.click()}>
                    <Upload />
                    読み込む
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
        {!loaded ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : apps.length === 0 ? (
          <Empty className="flex-none border bg-card">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ClipboardList />
              </EmptyMedia>
              <EmptyTitle>まだ応募先がありません</EmptyTitle>
              <EmptyDescription>
                <span className="inline-block">応募先ごとに、選考の状態と</span>
                <span className="inline-block">面接ごとのメモを残せます。</span>
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>{addButton("w-full px-5 text-base sm:w-auto sm:text-sm")}</EmptyContent>
          </Empty>
        ) : (
          <>
            <ItemGroup className="gap-3">
              {sorted.map((a) => {
                const resume = resumes.find((r) => r.id === a.resume);
                const ended = a.status === "終了";
                // これからの予定があればそれを、無ければ最後の記録を出す
                const next = ended ? undefined : upcoming(a.steps);
                const latest = next ? undefined : sortSteps(a.steps).at(-1);
                return (
                  <Item key={a.id} variant="outline" className={cn("relative bg-card hover:bg-muted/60", ended && "opacity-60")}>
                    <ItemContent className="wrap-anywhere">
                      <ItemTitle className="text-base sm:text-sm">
                        {/* 押せる範囲をカード全体に広げる */}
                        <Link
                          href={applicationHref(a.id)}
                          className="outline-none after:absolute after:inset-0 after:rounded-lg focus-visible:after:ring-3 focus-visible:after:ring-ring/50"
                        >
                          {a.company}
                        </Link>
                        <Badge variant={a.status === "内定" ? "default" : "secondary"}>{a.status}</Badge>
                      </ItemTitle>
                      {(next || resume || latest) && (
                        <ItemDescription className="flex flex-wrap gap-x-3">
                          {next && (
                            <span className="inline-flex items-center gap-1 text-foreground">
                              <CalendarDays className="size-3.5" aria-hidden />
                              次：{stepLabel(next)}・{dateLabel(next.date!)}
                            </span>
                          )}
                          {latest && (
                            <span className="inline-flex items-center gap-1">
                              <ListChecks className="size-3.5" aria-hidden />
                              {stepLabel(latest)}
                              {latest.date && `・${dateLabel(latest.date)}`}
                            </span>
                          )}
                          {resume && (
                            <span className="inline-flex items-center gap-1">
                              <FileText className="size-3.5" aria-hidden />
                              {resume.title}
                            </span>
                          )}
                        </ItemDescription>
                      )}
                    </ItemContent>
                  </Item>
                );
              })}
            </ItemGroup>
            <p className="text-xs text-muted-foreground">この端末のブラウザに保存しています。</p>
          </>
        )}
      </main>
      <BottomTabs />

      {/* 追加したら、そのまま選考の記録を書けるよう詳しいページを開く */}
      {adding && <ApplicationSheet onClose={() => setAdding(false)} onSaved={(id) => router.push(applicationHref(id))} />}

      <input
        ref={importInput}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => {
          importFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </>
  );
}
