"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, ChevronDown, ChevronLeft, FileText, ListChecks, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { AppHeader } from "@/components/app-tabs";
import { ApplicationSheet } from "@/components/application-sheet";
import { DateField } from "@/components/date-field";
import {
  dateLabel,
  deleteApplication,
  editHref,
  newStepId,
  sortSteps,
  STATUSES,
  STEP_KINDS,
  stepLabel,
  today,
  upcoming,
  updateApplication,
  useApplications,
  useLoaded,
  useResumeList,
  type Application,
  type Status,
  type Step,
  type StepKind,
} from "@/lib/store";

const KIND_ITEMS = STEP_KINDS.map((k) => ({ value: k, label: k }));
const MEMO_HINT = "聞かれたこと\n答えたこと\n逆質問したこと\n面接官\n感触";

// 次に足す記録の種類：前の記録の次の段階（一次の次は二次）。最初は一次面接、最終の次も最終面接
function nextKind(last?: StepKind): StepKind {
  if (last === "その他") return "その他";
  const i = last ? STEP_KINDS.indexOf(last) : 0;
  return STEP_KINDS[Math.min(i + 1, STEP_KINDS.indexOf("最終面接"))];
}

/** 選考の記録1件。入力したそばから保存する */
function StepCard({ step, autoFocus, onChange, onRemove }: {
  step: Step;
  autoFocus: boolean;
  onChange: (patch: Partial<Step>) => void;
  onRemove: () => void;
}) {
  const label = stepLabel(step);
  return (
    <li className="rounded-xl border bg-card p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Select items={KIND_ITEMS} value={step.kind} onValueChange={(v) => onChange({ kind: v as StepKind })}>
          {/* スマホでは「種類・削除」の下に日付を置く（1行に収まらないため） */}
          <SelectTrigger className="flex-1 sm:w-40 sm:flex-none" aria-label="種類">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {KIND_ITEMS.map((k) => (
              <SelectItem key={k.value} value={k.value}>
                {k.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {step.kind === "その他" && (
          <Input className="w-40" aria-label="名前" placeholder="例：人事面談" value={step.name ?? ""} onChange={(e) => onChange({ name: e.target.value || undefined })} />
        )}
        <div className="order-last w-full sm:order-none sm:w-48">
          <DateField value={step.date ?? ""} onChange={(date) => onChange({ date: date || undefined })} placeholder="日付" clearLabel="日付を消す" />
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto size-11 text-muted-foreground hover:text-destructive sm:order-last sm:size-9"
          aria-label={`${label}の記録を削除`}
          onClick={onRemove}
        >
          <Trash2 />
        </Button>
      </div>
      <Textarea
        className="mt-3 min-h-40"
        aria-label={`${label}のメモ`}
        placeholder={MEMO_HINT}
        value={step.memo}
        onChange={(e) => onChange({ memo: e.target.value })}
        autoFocus={autoFocus}
      />
    </li>
  );
}

function Detail({ app }: { app: Application }) {
  const resumes = useResumeList();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [added, setAdded] = useState<string | null>(null); // 足したばかりの記録（メモに入力欄を合わせる）
  // 並びは開いたときに日付順で決め、このページにいる間は変えない（日付を直した記録が目の前から動かないように）。
  // 足した記録は後ろに付く
  const [order] = useState(() => sortSteps(app.steps).map((s) => s.id));
  const all = app.steps ?? [];
  const steps = [...order.flatMap((id) => all.filter((s) => s.id === id)), ...all.filter((s) => !order.includes(s.id))];
  const resume = resumes.find((r) => r.id === app.resume);
  const next = upcoming(app.steps);
  const update = (fn: (draft: Application) => void) => updateApplication(app.id, fn);

  const addStep = () => {
    const id = newStepId();
    // 日付は今日にしておく（面接の直後に書く人が多いため）
    update((d) => {
      d.steps = [...(d.steps ?? []), { id, kind: nextKind(d.steps?.at(-1)?.kind), date: today(), memo: "" }];
    });
    setAdded(id);
  };
  const changeStep = (id: string, patch: Partial<Step>) =>
    update((d) => {
      const s = d.steps?.find((x) => x.id === id);
      if (s) Object.assign(s, patch);
    });
  const removeStep = (id: string) => {
    const removed = all.find((s) => s.id === id);
    if (!removed) return;
    update((d) => {
      d.steps = d.steps?.filter((s) => s.id !== id);
    });
    // 戻すのは消した1件だけ（その間にほかの記録へ書いた内容は残す）。並びは元の位置に戻る
    const restore = () =>
      update((d) => {
        if (!d.steps?.some((s) => s.id === id)) d.steps = [...(d.steps ?? []), removed];
      });
    toast("記録を削除しました", { action: { label: "元に戻す", onClick: restore } });
  };

  return (
    <>
      <Link href="/app/applications/" className={cn(buttonVariants({ variant: "ghost" }), "-ml-2 h-11 self-start text-muted-foreground sm:h-9")}>
        <ChevronLeft data-icon="inline-start" />
        選考管理
      </Link>

      <section className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold wrap-anywhere">{app.company}</h1>
            {/* 状態はここで直接変える（記録を足しても自動では変わらないため、すぐ直せるように） */}
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant={app.status === "内定" ? "default" : "outline"}
                    size="sm"
                    className="h-9 rounded-full sm:h-7"
                    aria-label={`状態：${app.status}（押すと変えられます）`}
                  />
                }
              >
                {app.status}
                <ChevronDown data-icon="inline-end" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-44 sm:w-36">
                <DropdownMenuRadioGroup value={app.status} onValueChange={(v) => update((d) => void (d.status = v as Status))}>
                  {STATUSES.map((s) => (
                    <DropdownMenuRadioItem key={s} value={s} closeOnClick>
                      {s}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <Button variant="outline" className="h-11 shrink-0 sm:h-9" onClick={() => setEditing(true)}>
            <Pencil data-icon="inline-start" />
            編集
          </Button>
        </div>
        {(next || resume) && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {next && (
              <span className="inline-flex items-center gap-1 text-foreground">
                <CalendarDays className="size-4" aria-hidden />
                次の予定：{stepLabel(next)}・{dateLabel(next.date!)}
              </span>
            )}
            {resume && (
              <Link href={editHref(resume.id, app.id)} className="inline-flex items-center gap-1 underline underline-offset-2">
                <FileText className="size-4" aria-hidden />
                {resume.title}
              </Link>
            )}
          </div>
        )}
        {app.memo && <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">{app.memo}</p>}
      </section>

      <section aria-labelledby="steps" className="flex flex-col gap-3 border-t pt-6">
        <div className="flex min-h-11 items-center justify-between gap-3 sm:min-h-9">
          <h2 id="steps" className="text-lg font-semibold">
            選考の記録
          </h2>
          {steps.length > 0 && (
            <Button className="h-11 sm:h-9" onClick={addStep}>
              <Plus data-icon="inline-start" />
              記録を追加
            </Button>
          )}
        </div>
        {steps.length === 0 ? (
          <Empty className="flex-none border bg-card">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ListChecks />
              </EmptyMedia>
              <EmptyTitle>まだ記録がありません</EmptyTitle>
              <EmptyDescription>
                <span className="inline-block">面接や面談ごとに、</span>
                <span className="inline-block">聞かれたことや話した内容を残せます。</span>
              </EmptyDescription>
            </EmptyHeader>
            <Button className="h-11 w-full px-5 text-base sm:h-9 sm:w-auto sm:text-sm" onClick={addStep}>
              <Plus data-icon="inline-start" />
              記録を追加
            </Button>
          </Empty>
        ) : (
          <ol className="flex flex-col gap-3">
            {steps.map((s) => (
              <StepCard key={s.id} step={s} autoFocus={s.id === added} onChange={(patch) => changeStep(s.id, patch)} onRemove={() => removeStep(s.id)} />
            ))}
          </ol>
        )}
        <p className="text-xs text-muted-foreground">入力した内容は、この端末のブラウザにすぐ保存されます。</p>
      </section>

      {editing && (
        <ApplicationSheet
          app={app}
          onClose={() => setEditing(false)}
          onDelete={() => {
            // 編集画面を閉じてから確認を出す（画面を重ねない）
            setEditing(false);
            setDeleting(true);
          }}
        />
      )}

      <AlertDialog open={deleting} onOpenChange={setDeleting}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>「{app.company}」を削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              {all.length > 0 ? `面接の記録${all.length}件も消え、元に戻せません。` : "元に戻せません。"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-11 sm:h-9">やめる</AlertDialogCancel>
            <AlertDialogAction
              className="h-11 sm:h-9"
              variant="destructive"
              onClick={() => {
                deleteApplication(app.id); // 見つからなくなるので、一覧へ戻る
                toast("削除しました");
              }}
            >
              削除する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/** 応募先1件の詳しいページ（/app/applications/detail/?id=） */
export function ApplicationDetail() {
  const id = useSearchParams().get("id") ?? "";
  const loaded = useLoaded();
  const app = useApplications().find((a) => a.id === id);
  const router = useRouter();
  // 見つからない（削除した・別の端末のリンク）ときは一覧へ
  useEffect(() => {
    if (loaded && !app) router.replace("/app/applications/");
  }, [loaded, app, router]);

  return (
    <>
      <AppHeader />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6">
        {app ? (
          <Detail key={app.id} app={app} />
        ) : (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-10 w-1/2" />
            <Skeleton className="h-40 w-full" />
          </div>
        )}
      </main>
    </>
  );
}
