"use client";

import { useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, ClipboardList, Download, FileText, ListChecks, MoreHorizontal, Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldTitle } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Item, ItemContent, ItemDescription, ItemGroup, ItemTitle } from "@/components/ui/item";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { BottomTabs, HeaderTabs } from "@/components/app-tabs";
import { DateField } from "@/components/date-field";
import { EditSheet } from "@/components/edit-sheet";
import { Brand } from "@/components/site";
import {
  applicationHref,
  deleteApplication,
  editHref,
  importApplications,
  saveApplication,
  STATUSES,
  useApplications,
  useLoaded,
  useResumeList,
  type Application,
  type ApplicationInput,
  type Status,
  type Step,
} from "@/lib/store";
import { download } from "@/lib/utils";

const LABEL = "text-[15px] sm:text-sm";
const NONE = "none"; // 履歴書を選ばない

export const stepLabel = (s: Step) => (s.kind === "その他" ? s.name?.trim() || "その他" : s.kind);

// 選考の記録は日付の順。日付の無いものは後ろに、足した順で並ぶ（sort は並びを崩さない）
export const sortSteps = (steps: Step[] = []) => [...steps].sort((a, b) => (a.date || "9").localeCompare(b.date || "9"));

export function dateLabel(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  const day = new Date(y, m - 1, d);
  const md = `${m}月${d}日（${"日月火水木金土"[day.getDay()]}）`;
  return y === new Date().getFullYear() ? md : `${y}年${md}`;
}

// 終わったものは下へ。ほかは次の予定が近い順（予定の無いものはその後ろ）、同じなら更新が新しい順
// "9" は どの日付（"2026-…"）よりも後ろに並ぶ
const order = (a: Application, b: Application) =>
  Number(a.status === "終了") - Number(b.status === "終了") || (a.date || "9").localeCompare(b.date || "9") || b.updatedAt - a.updatedAt;

/** 応募先を追加・編集する画面。app が無ければ新しく作る。onSaved には保存した id が渡る */
export function ApplicationSheet({ app, onClose, onSaved }: { app?: Application; onClose: () => void; onSaved?: (id: string) => void }) {
  const id = useId();
  const resumes = useResumeList();
  const [form, setForm] = useState<ApplicationInput>(() => app ?? { company: "", status: "応募前" });
  const set = (patch: Partial<ApplicationInput>) => setForm((f) => ({ ...f, ...patch }));
  const company = form.company.trim();
  const items = [{ value: NONE, label: "選ばない" }, ...resumes.map((r) => ({ value: r.id, label: r.title }))];
  const linked = resumes.some((r) => r.id === form.resume);

  const save = () => {
    if (!company) return;
    const id = saveApplication({ ...form, company }, app?.id);
    onClose();
    onSaved?.(id);
  };
  const remove = () => {
    if (!app) return;
    deleteApplication(app.id);
    onClose();
    // 消したものは、すぐなら戻せる
    toast("削除しました", { action: { label: "元に戻す", onClick: () => saveApplication(app, app.id) } });
  };

  return (
    <EditSheet
      open
      onOpenChange={(open) => !open && onClose()}
      title={app ? "応募先を編集" : "応募先を追加"}
      footer={
        <>
          {app && (
            <Button variant="ghost" size="icon" className="mr-auto size-11 text-destructive hover:text-destructive sm:size-9" aria-label="削除" onClick={remove}>
              <Trash2 />
            </Button>
          )}
          <Button variant="ghost" className="h-11 sm:h-9" onClick={onClose}>
            やめる
          </Button>
          <Button className="h-11 flex-1 sm:h-9 sm:flex-none" disabled={!company} onClick={save}>
            保存
          </Button>
        </>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <FieldGroup className="gap-5">
          <Field>
            <FieldLabel htmlFor={`${id}-company`} className={LABEL}>
              応募先
            </FieldLabel>
            <Input id={`${id}-company`} value={form.company} onChange={(e) => set({ company: e.target.value })} placeholder="例：○○株式会社" autoFocus={!app} />
          </Field>
          <Field>
            <FieldTitle className={LABEL}>状態</FieldTitle>
            <ToggleGroup variant="outline" value={[form.status]} onValueChange={(v) => v[0] && set({ status: v[0] as Status })} aria-label="状態" className="flex-wrap">
              {STATUSES.map((s) => (
                <ToggleGroupItem key={s} value={s} className="h-11 px-3 sm:h-8 aria-pressed:border-primary/40 aria-pressed:bg-primary/10 aria-pressed:text-primary">
                  {s}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </Field>
          <Field>
            <FieldLabel htmlFor={`${id}-date`} className={LABEL}>
              次の予定日
            </FieldLabel>
            <DateField id={`${id}-date`} value={form.date ?? ""} onChange={(date) => set({ date: date || undefined })} placeholder="面接日・締切日など" clearLabel="日付を消す" />
          </Field>
          <Field>
            <FieldLabel htmlFor={`${id}-resume`} className={LABEL}>
              使った履歴書
            </FieldLabel>
            <Select items={items} value={linked ? form.resume : NONE} onValueChange={(v) => set({ resume: v === NONE ? undefined : (v as string) })}>
              <SelectTrigger id={`${id}-resume`} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {items.map((i) => (
                  <SelectItem key={i.value} value={i.value}>
                    {i.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {linked && (
              <FieldDescription>
                <Link href={editHref(form.resume!)} className="underline underline-offset-2">
                  この履歴書を開く
                </Link>
              </FieldDescription>
            )}
          </Field>
          <Field>
            <FieldLabel htmlFor={`${id}-memo`} className={LABEL}>
              会社についてのメモ
            </FieldLabel>
            <Textarea id={`${id}-memo`} value={form.memo ?? ""} onChange={(e) => set({ memo: e.target.value || undefined })} placeholder="社風、志望理由の材料など" />
            <FieldDescription>面接ごとのメモは、保存したあとの「選考の記録」に書きます。</FieldDescription>
          </Field>
        </FieldGroup>
      </form>
    </EditSheet>
  );
}

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
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-3xl items-center gap-3 px-4 sm:px-6">
          <Brand />
          <HeaderTabs />
        </div>
      </header>

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
                <span className="inline-block">次の予定を書いておけます。</span>
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
                const latest = sortSteps(a.steps).at(-1);
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
                      {(a.date || resume || latest) && (
                        <ItemDescription className="flex flex-wrap gap-x-3">
                          {latest && (
                            <span className="inline-flex items-center gap-1">
                              <ListChecks className="size-3.5" aria-hidden />
                              {stepLabel(latest)}
                              {latest.date && `・${dateLabel(latest.date)}`}
                            </span>
                          )}
                          {a.date && !ended && (
                            <span className="inline-flex items-center gap-1">
                              <CalendarDays className="size-3.5" aria-hidden />
                              {dateLabel(a.date)}
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
