"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { ChevronDown, Download, Eye, FileText, FolderOpen, Info, Loader2, MoreHorizontal, Sparkles, Trash2, TriangleAlert, Upload } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { PdfFrame, PdfPreview } from "@/components/pdf-preview";
import { ResumeForm } from "@/components/resume-form";
import { documentDate, emptyResume, layoutResume, loadAssets, makePdf, missingChars, SAMPLE, toResume, type Assets, type Resume } from "@/lib/resume";
import { setResume, useResume } from "@/lib/store";

const DESKTOP = "(min-width: 1024px)";

function useIsDesktop() {
  return useSyncExternalStore(
    (onChange) => {
      const mq = matchMedia(DESKTOP);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => matchMedia(DESKTOP).matches,
    () => false,
  );
}

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

export function ResumeApp() {
  const resume = useResume();
  const isDesktop = useIsDesktop();
  const [assets, setAssets] = useState<Assets | null>(null);
  const [progress, setProgress] = useState(0);
  const [loadError, setLoadError] = useState("");
  const [preview, setPreview] = useState<{ bytes: Uint8Array; source: Resume } | null>(null);
  const [busy, setBusy] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const importInput = useRef<HTMLInputElement>(null);

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
    download(new Blob([JSON.stringify(resume, null, 2)], { type: "application/json" }), "career-hub.json");
    toast.success("データを書き出しました", { description: "別の端末では「データを読み込む」で続きから使えます" });
  }

  async function importData(file: File | undefined) {
    if (!file) return;
    try {
      setResume(toResume(JSON.parse(await file.text())));
      toast.success("データを読み込みました");
    } catch {
      toast.error("このファイルは読み込めませんでした", { description: "「データを書き出す」で保存した JSON ファイルを選んでください" });
    }
  }

  const status = !assets ? "準備中" : busy ? "更新中…" : "A4・2枚";

  return (
    <>
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
              <FileText className="size-4" aria-hidden />
            </span>
            <div className="min-w-0 leading-tight">
              <h1 className="truncate text-sm font-semibold">career-hub</h1>
              <p className="truncate text-xs text-muted-foreground">厚生労働省様式の履歴書をつくる</p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="ghost" size="icon" aria-label="メニュー" />}>
                <MoreHorizontal />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setResume(structuredClone(SAMPLE))}>
                  <Sparkles />
                  見本を入れる
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportData}>
                  <Upload />
                  データを書き出す
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => importInput.current?.click()}>
                  <FolderOpen />
                  データを読み込む
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={() => setConfirmReset(true)}>
                  <Trash2 />
                  すべて消す
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="hidden items-center lg:flex">
              <Button className="rounded-r-none" disabled={blocked} onClick={() => save("a4")}>
                <Download data-icon="inline-start" />
                PDF を保存
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={<Button className="rounded-l-none border-l-primary-foreground/25 px-2" disabled={blocked} aria-label="保存する形を選ぶ" />}
                >
                  <ChevronDown />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem onClick={() => save("a4")}>A4（2枚）で保存</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => save("a3")}>A3（見開き）で保存</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-7xl flex-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            厚生労働省履歴書様式例の公式 PDF に、入力した内容をそのまま書き込みます。入力内容はこのブラウザの中だけに保存され、どこにも送信されません。
          </p>
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
          {isEmpty && (
            <Alert>
              <Sparkles />
              <AlertTitle>まずは見本で試せます</AlertTitle>
              <AlertDescription>
                <p>見本を入れると、仕上がりの PDF をすぐに確認できます。</p>
                <Button size="sm" variant="outline" className="mt-2" onClick={() => setResume(structuredClone(SAMPLE))}>
                  見本を入れる
                </Button>
              </AlertDescription>
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

      <footer className="border-t text-xs text-muted-foreground">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-1 px-4 pt-6 pb-28 sm:px-6 lg:pb-6">
          <p>
            出典：厚生労働省「厚生労働省履歴書様式例」（
            <a className="underline underline-offset-2" href="https://www.hellowork.mhlw.go.jp/member/career_doc01.html">
              ハローワークインターネットサービス
            </a>
            ）、
            <a className="underline underline-offset-2" href="https://www.digital.go.jp/resources/open_data/public_data_license_v1.0">
              公共データ利用規約（第1.0版）
            </a>
            。公式 PDF に記入内容を書き加えて作成しています。
          </p>
          <p>
            本ツールは厚生労働省およびハローワークとは関係のない非公式のツールです。PDF のフォントは IPAex明朝（IPAフォントライセンス）。
            <a className="underline underline-offset-2" href="https://github.com/6igtree/career-hub">
              ソースコード
            </a>
          </p>
        </div>
      </footer>

      {/* スマホ：画面下に固定する操作バー */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/90 backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-xl gap-2 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <Button variant="outline" className="h-11 flex-1" disabled={!assets} onClick={() => setPreviewOpen(true)}>
            <Eye data-icon="inline-start" />
            プレビュー
          </Button>
          <Button className="h-11 flex-1" disabled={blocked} onClick={() => save("a4")}>
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
            <AlertDialogTitle>入力内容をすべて消しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              このブラウザに保存している内容と写真が消えます。残しておきたい場合は、先に「データを書き出す」で保存してください。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>やめる</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                setResume(emptyResume());
                setConfirmReset(false);
                toast("すべて消しました");
              }}
            >
              消す
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <input
        ref={importInput}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => {
          importData(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </>
  );
}
