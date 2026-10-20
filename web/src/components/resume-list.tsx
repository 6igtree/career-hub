"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, FileText, FolderOpen, MoreHorizontal, Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item";
import { Skeleton } from "@/components/ui/skeleton";
import { RenameSheet } from "@/components/rename-sheet";
import { Brand, SiteFooter } from "@/components/site";
import { SAMPLE, toResume, type Resume } from "@/lib/resume";
import { createResume, deleteResume, duplicateResume, editHref, getResume, useResumeList, type Saved } from "@/lib/store";

// 保存内容はブラウザにしかないので、読み込むまで一覧を出さない（空の案内のちらつき防止）
const noop = () => () => {};
const useLoaded = () => useSyncExternalStore(noop, () => true, () => false);

function updatedLabel(time: number) {
  const d = new Date(time);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return `今日 ${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
  const md = `${d.getMonth() + 1}月${d.getDate()}日`;
  return d.getFullYear() === now.getFullYear() ? md : `${d.getFullYear()}年${md}`;
}

function ResumeCard({ saved, onRename, onDelete }: { saved: Saved; onRename: () => void; onDelete: () => void }) {
  const name = getResume(saved.id).profile.name;
  return (
    <Item variant="outline" className="relative bg-card hover:bg-muted/60">
      <ItemMedia variant="icon" className="border-transparent bg-primary/10 text-primary">
        <FileText />
      </ItemMedia>
      <ItemContent className="wrap-anywhere">
        <ItemTitle className="text-base sm:text-sm">
          {/* リンクの押せる範囲をカード全体に広げる */}
          <Link
            href={editHref(saved.id)}
            className="outline-none after:absolute after:inset-0 after:rounded-lg focus-visible:after:ring-3 focus-visible:after:ring-ring/50"
          >
            {saved.title}
          </Link>
        </ItemTitle>
        <ItemDescription>
          {name || "氏名未入力"} ・ {updatedLabel(saved.updatedAt)} 更新
        </ItemDescription>
      </ItemContent>
      <ItemActions className="relative z-10">
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="size-11 sm:size-8" aria-label={`${saved.title}のメニュー`} />}>
            <MoreHorizontal className="size-5 sm:size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 sm:w-44">
            <DropdownMenuItem onClick={onRename}>
              <Pencil />
              名前を変える
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                duplicateResume(saved.id);
                toast.success("複製しました");
              }}
            >
              <Copy />
              複製する
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={onDelete}>
              <Trash2 />
              削除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </ItemActions>
    </Item>
  );
}

/** 保存した履歴書の一覧（/app/） */
export function ResumeList() {
  const loaded = useLoaded();
  const list = useResumeList();
  const router = useRouter();
  const [renaming, setRenaming] = useState<Saved | null>(null);
  const [deleting, setDeleting] = useState<Saved | null>(null);
  const importInput = useRef<HTMLInputElement>(null);
  const sorted = [...list].sort((a, b) => b.updatedAt - a.updatedAt);
  const create = (data?: Resume, title?: string) => router.push(editHref(createResume(data, title)));

  async function importFile(file: File | undefined) {
    if (!file) return;
    try {
      createResume(toResume(JSON.parse(await file.text())), file.name.replace(/\.json$/i, "") || undefined);
      toast.success("読み込みました");
    } catch {
      toast.error("このファイルは読み込めませんでした", { description: "書き出した JSON ファイルを選んでください" });
    }
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-3xl items-center gap-3 px-4 sm:px-6">
          <Brand />
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="ml-auto size-11 sm:size-8" aria-label="メニュー" />}>
              <MoreHorizontal className="size-5 sm:size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60 sm:w-52">
              <DropdownMenuItem onClick={() => importInput.current?.click()}>
                <FolderOpen />
                ファイルから読み込む
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-4 py-6 sm:px-6">
        <div className="flex min-h-11 items-center justify-between gap-3 sm:min-h-9">
          <h1 className="text-lg font-semibold">保存した履歴書</h1>
          {loaded && list.length > 0 && (
            <Button className="h-11 sm:h-9" onClick={() => create()}>
              <Plus data-icon="inline-start" />
              新しく作る
            </Button>
          )}
        </div>
        {!loaded ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : list.length === 0 ? (
          <Empty className="flex-none border bg-card">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FileText />
              </EmptyMedia>
              <EmptyTitle>まだ履歴書がありません</EmptyTitle>
              <EmptyDescription>
                {/* 言葉の途中で折り返さない */}
                <span className="inline-block">新しく作るか、</span>
                <span className="inline-block">見本の内容で試してみてください。</span>
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent className="sm:flex-row sm:justify-center">
              <Button className="h-11 w-full px-5 text-base sm:h-9 sm:w-auto sm:text-sm" onClick={() => create()}>
                <Plus data-icon="inline-start" />
                新しく作る
              </Button>
              <Button variant="outline" className="h-11 w-full px-5 text-base sm:h-9 sm:w-auto sm:text-sm" onClick={() => create(structuredClone(SAMPLE), "見本")}>
                <Sparkles data-icon="inline-start" />
                見本で試す
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <>
            <ItemGroup className="gap-3">
              {sorted.map((s) => (
                <ResumeCard key={s.id} saved={s} onRename={() => setRenaming(s)} onDelete={() => setDeleting(s)} />
              ))}
            </ItemGroup>
            <p className="text-xs text-muted-foreground">
              この端末のブラウザに保存しています。別の端末で続けるときは、書き出したファイルを右上のメニューから読み込みます。
            </p>
          </>
        )}
      </main>

      <SiteFooter className="max-w-3xl" />

      {renaming && <RenameSheet id={renaming.id} title={renaming.title} onClose={() => setRenaming(null)} />}

      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>「{deleting?.title}」を削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>入力内容と写真が消え、元に戻せません。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-11 sm:h-9">やめる</AlertDialogCancel>
            <AlertDialogAction
              className="h-11 sm:h-9"
              variant="destructive"
              onClick={() => {
                if (deleting) deleteResume(deleting.id);
                setDeleting(null);
                toast("削除しました");
              }}
            >
              削除する
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
          importFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </>
  );
}
