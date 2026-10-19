"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  Download,
  Eye,
  FileText,
  Info,
  Loader2,
  MoreHorizontal,
  Pencil,
  Sparkles,
  Trash2,
  TriangleAlert,
  Upload,
} from "lucide-react";
import { cn } from "cn";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { ButtonGroup, ButtonGroupSeparator } from "@/components/ui/button-group";
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsDesktop } from "@/components/edit-sheet";
import { PdfFrame, PdfPreview } from "@/components/pdf-preview";
import { RenameSheet } from "@/components/rename-sheet";
import { ResumeForm } from "@/components/resume-form";
import { SiteFooter } from "@/components/site";
import { documentDate, emptyResume, layoutResume, loadAssets, makePdf, missingChars, SAMPLE, type Assets, type Resume } from "@/lib/resume";
import { openResume, setResume, useResume, useResumeList } from "@/lib/store";

function download(blob: Blob, name: string) {
  const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: name });
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/** スマホでは共有メニュー（ファイルに保存、LINE やメールで送るなど）を出す。使えなければダウンロードする */
async function deliver(pdf: Uint8Array, name: string) {
  const file = new File([pdf.slice()], name, { type: "application/pdf" });
  if (matchMedia("(pointer: coarse)").matches && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: name });
      return;
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return; // 共有メニューを閉じただけ
    }
  }
  download(file, name);
}

function PreviewLoading({ progress }: { progress: number }) {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="aspect-[595/842] w-full rounded-sm" />
      <p className="text-center text-xs text-muted-foreground">
        PDF 用のフォントを読み込んでいます… {Math.round(progress * 100)}%（初回のみ約 7.8MB）
      </p>
    </div>
  );
}

/** 編集画面。開く履歴書は ?id= で受け取る（中身はブラウザにしかないので、ページは1つだけ書き出す） */
export function ResumeApp() {
  const id = useSearchParams().get("id") ?? "";
  return <OpenResume key={id} id={id} />;
}

function OpenResume({ id }: { id: string }) {
  const router = useRouter();
  const [found] = useState(() => openResume(id));
  useEffect(() => {
    if (!found) router.replace("/"); // 削除済みなどで見つからないときは一覧へ
  }, [found, router]);
  return found ? <Editor id={id} /> : null;
}

function Editor({ id }: { id: string }) {
  const resume = useResume();
  const title = useResumeList().find((s) => s.id === id)?.title ?? "履歴書";
  const isDesktop = useIsDesktop();
  const [assets, setAssets] = useState<Assets | null>(null);
  const [progress, setProgress] = useState(0);
  const [loadError, setLoadError] = useState("");
  const [preview, setPreview] = useState<{ bytes: Uint8Array; source: Resume } | null>(null);
  const [busy, setBusy] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [renaming, setRenaming] = useState(false);

  useEffect(() => {
    loadAssets(setProgress)
      .then(setAssets)
      .catch((e) => setLoadError(e instanceof Error ? e.message : String(e)));
  }, []);

  const check = useMemo(() => (assets ? layoutResume(resume, assets.layout, documentDate(resume)) : null), [resume, assets]);
  const missing = useMemo(() => (assets ? missingChars(resume, assets.charset) : []), [resume, assets]);
  const showPreview = isDesktop || previewOpen;
  const blocked = !assets || !check || check.errors.length > 0;
  const isEmpty = !resume.profile.name && !resume.education.length && !resume.jobs.length && !resume.licenses.length;

  // 入力が止まってから PDF を作り直す。スマホではプレビューを開いている間だけ作る
  useEffect(() => {
    if (!assets || !showPreview) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      setBusy(true);
      try {
        const bytes = await makePdf("a4", resume, assets);
        if (!cancelled) setPreview({ bytes, source: resume });
      } catch (e) {
        if (!cancelled) toast.error("PDF を作れませんでした", { description: e instanceof Error ? e.message : String(e) });
      } finally {
        if (!cancelled) setBusy(false);
      }
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [resume, assets, showPreview]);

  async function save(kind: "a4" | "a3") {
    if (!assets || blocked) return;
    try {
      // プレビュー用に作った最新の PDF があればそのまま使う（スマホの共有メニューをすぐ出せる）
      const pdf = kind === "a4" && preview?.source === resume ? preview.bytes : await makePdf(kind, resume, assets);
      await deliver(pdf, kind === "a3" ? "履歴書_A3.pdf" : "履歴書.pdf");
    } catch (e) {
      toast.error("PDF を保存できませんでした", { description: e instanceof Error ? e.message : String(e) });
    }
  }

  function exportData() {
    download(new Blob([JSON.stringify(resume, null, 2)], { type: "application/json" }), `${title}.json`);
    toast.success("データを書き出しました", { description: "別の端末では、一覧のメニューの「ファイルから読み込む」で続きから使えます" });
  }

  const status = !assets ? "準備中" : busy ? "更新中…" : "A4・2枚";

  return (
    <>
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-1.5 px-2 sm:gap-3 sm:px-6">
          <Link href="/" aria-label="一覧へ戻る" className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "size-11 shrink-0 sm:size-8")}>
            <ChevronLeft className="size-5 sm:size-4" />
          </Link>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-semibold">{title}</p>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Check className="size-3 shrink-0 text-primary" aria-hidden />
              <span className="truncate">この端末に自動保存</span>
            </p>
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="size-11 sm:size-8" aria-label="メニュー" />}>
                <MoreHorizontal className="size-5 sm:size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60 sm:w-52">
                <DropdownMenuItem onClick={() => setRenaming(true)}>
                  <Pencil />
                  名前を変える
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setResume(structuredClone(SAMPLE))}>
                  <Sparkles />
                  見本を入れる
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportData}>
                  <Upload />
                  データを書き出す
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={() => setConfirmReset(true)}>
                  <Trash2 />
                  内容をすべて消す
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="hidden lg:block">
              <ButtonGroup>
                <Button disabled={blocked} onClick={() => save("a4")}>
                  <Download data-icon="inline-start" />
                  PDF を保存
                </Button>
                <ButtonGroupSeparator />
                <DropdownMenu>
                  <DropdownMenuTrigger render={<Button size="icon" disabled={blocked} aria-label="保存する形を選ぶ" />}>
                    <ChevronDown />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuItem onClick={() => save("a4")}>A4（2枚）で保存</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => save("a3")}>A3（見開き）で保存</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </ButtonGroup>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-7xl flex-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-4">
          {isEmpty && (
            <Empty className="border bg-card">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FileText />
                </EmptyMedia>
                <EmptyTitle className="text-lg">
                {/* 言葉の途中で折り返さないよう、まとまりごとに区切る */}
                <span className="inline-block">厚生労働省様式の履歴書を、</span>
                <span className="inline-block">そのまま PDF に</span>
              </EmptyTitle>
                <EmptyDescription>
                  入力するだけで、公式の様式に書き込んだ履歴書ができます。無料・登録不要で、入力内容はこの端末の外に送信しません。
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button className="h-11 px-5 text-base sm:h-9 sm:text-sm" onClick={() => setResume(structuredClone(SAMPLE))}>
                  <Sparkles data-icon="inline-start" />
                  見本で試す
                </Button>
              </EmptyContent>
            </Empty>
          )}
          {loadError && (
            <Alert variant="destructive">
              <TriangleAlert />
              <AlertTitle>PDF を作る準備ができませんでした</AlertTitle>
              <AlertDescription>ページを再読み込みしてください。（{loadError}）</AlertDescription>
            </Alert>
          )}
          {check && check.errors.length > 0 && (
            <Alert variant="destructive">
              <TriangleAlert />
              <AlertTitle>様式に入りきりません</AlertTitle>
              <AlertDescription>
                <ul className="list-disc pl-4">
                  {check.errors.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
                行を減らすと PDF を保存できます。
              </AlertDescription>
            </Alert>
          )}
          {missing.length > 0 && (
            <Alert>
              <Info />
              <AlertTitle>PDF のフォントにない文字があります</AlertTitle>
              <AlertDescription>この文字は PDF では表示されません：{missing.join(" ")}</AlertDescription>
            </Alert>
          )}
          <ResumeForm counts={check?.counts ?? null} layout={assets?.layout ?? null} />
        </div>

        <aside className="hidden lg:block" aria-label="プレビュー">
          <div className="sticky top-20 flex h-[calc(100dvh-6rem)] flex-col rounded-xl bg-muted/60 ring-1 ring-foreground/10">
            <div className="flex items-center justify-between px-4 py-3 text-sm">
              <span className="font-medium">プレビュー</span>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                {busy && <Loader2 className="size-3.5 animate-spin" aria-hidden />}
                {status}
              </span>
            </div>
            <div className="min-h-0 flex-1 px-4 pb-4">
              {isDesktop && (preview ? <PdfFrame bytes={preview.bytes} /> : <PreviewLoading progress={progress} />)}
            </div>
          </div>
        </aside>
      </main>

      <SiteFooter bottomBar />

      {/* スマホ：画面下に固定する操作バー */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/90 backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-xl gap-2 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <Button variant="outline" className="h-12 flex-1 text-base" disabled={!assets} onClick={() => setPreviewOpen(true)}>
            <Eye data-icon="inline-start" />
            プレビュー
          </Button>
          <Button className="h-12 flex-1 text-base" disabled={blocked} onClick={() => save("a4")}>
            <Download data-icon="inline-start" />
            PDF を保存
          </Button>
        </div>
      </div>

      {!isDesktop && (
        <Drawer open={previewOpen} onOpenChange={setPreviewOpen} showSwipeHandle>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>プレビュー</DrawerTitle>
              <DrawerDescription>{busy ? "更新中…" : "A4・2枚。保存すると、ファイルへの保存や LINE・メールでの送信を選べます"}</DrawerDescription>
            </DrawerHeader>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
              {preview ? <PdfPreview bytes={preview.bytes} /> : <PreviewLoading progress={progress} />}
            </div>
            <DrawerFooter className="pt-3">
              <Button className="h-11" disabled={blocked} onClick={() => save("a4")}>
                <Download data-icon="inline-start" />
                PDF を保存
              </Button>
              <Button variant="ghost" disabled={blocked} onClick={() => save("a3")}>
                A3（見開き）で保存
              </Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      )}

      <AlertDialog open={confirmReset} onOpenChange={setConfirmReset}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>この履歴書の内容をすべて消しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              入力内容と写真が消えます。残しておきたい場合は、先に一覧で複製するか、「データを書き出す」で保存してください。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-11 sm:h-9">やめる</AlertDialogCancel>
            <AlertDialogAction
              className="h-11 sm:h-9"
              variant="destructive"
              onClick={() => {
                setResume(emptyResume());
                setConfirmReset(false);
                toast("内容を消しました");
              }}
            >
              消す
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {renaming && <RenameSheet id={id} title={title} onClose={() => setRenaming(false)} />}
    </>
  );
}
