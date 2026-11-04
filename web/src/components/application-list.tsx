"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { CalendarDays, ClipboardList, FileText, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  deleteApplication,
  editHref,
  saveApplication,
  STATUSES,
  useApplications,
  useLoaded,
  useResumeList,
  type Application,
  type ApplicationInput,
  type Status,
} from "@/lib/store";

const LABEL = "text-[15px] sm:text-sm";
const NONE = "none"; // 履歴書を選ばない

function dateLabel(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  const day = new Date(y, m - 1, d);
  const md = `${m}月${d}日（${"日月火水木金土"[day.getDay()]}）`;
  return y === new Date().getFullYear() ? md : `${y}年${md}`;
}

// 終わったものは下へ。ほかは次の予定が近い順（予定の無いものはその後ろ）、同じなら更新が新しい順
// "9" は どの日付（"2026-…"）よりも後ろに並ぶ
const order = (a: Application, b: Application) =>
  Number(a.status === "終了") - Number(b.status === "終了") || (a.date || "9").localeCompare(b.date || "9") || b.updatedAt - a.updatedAt;

/** 応募先を追加・編集する画面。app が無ければ新しく作る */
function ApplicationSheet({ app, onClose }: { app?: Application; onClose: () => void }) {
  const id = useId();
  const resumes = useResumeList();
  const [form, setForm] = useState<ApplicationInput>(() => app ?? { company: "", status: "応募前" });
  const set = (patch: Partial<ApplicationInput>) => setForm((f) => ({ ...f, ...patch }));
  const company = form.company.trim();
  const items = [{ value: NONE, label: "選ばない" }, ...resumes.map((r) => ({ value: r.id, label: r.title }))];
  const linked = resumes.some((r) => r.id === form.resume);

  const save = () => {
    if (!company) return;
    saveApplication({ ...form, company }, app?.id);
    onClose();
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
              メモ
            </FieldLabel>
            <Textarea id={`${id}-memo`} value={form.memo ?? ""} onChange={(e) => set({ memo: e.target.value || undefined })} placeholder="面接の場所、聞かれたことなど" />
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
  // 編集中の応募先。"new" は新しく追加
  const [editing, setEditing] = useState<Application | "new" | null>(null);
  const sorted = [...apps].sort(order);

  const addButton = (className?: string) => (
    <Button className={cn("h-11 sm:h-9", className)} onClick={() => setEditing("new")}>
      <Plus data-icon="inline-start" />
      応募先を追加
    </Button>
  );

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
          {loaded && apps.length > 0 && addButton()}
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
                return (
                  <Item key={a.id} variant="outline" className={cn("relative bg-card hover:bg-muted/60", ended && "opacity-60")}>
                    <ItemContent className="wrap-anywhere">
                      <ItemTitle className="text-base sm:text-sm">
                        {/* 押せる範囲をカード全体に広げる */}
                        <button
                          type="button"
                          onClick={() => setEditing(a)}
                          className="text-left outline-none after:absolute after:inset-0 after:rounded-lg focus-visible:after:ring-3 focus-visible:after:ring-ring/50"
                        >
                          {a.company}
                        </button>
                        <Badge variant={a.status === "内定" ? "default" : "secondary"}>{a.status}</Badge>
                      </ItemTitle>
                      {(a.date || resume) && (
                        <ItemDescription className="flex flex-wrap gap-x-3">
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

      {editing && <ApplicationSheet app={editing === "new" ? undefined : editing} onClose={() => setEditing(null)} />}
    </>
  );
}
