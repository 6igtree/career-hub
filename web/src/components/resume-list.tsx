"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, FileText, FolderCog, FolderInput, FolderOpen, FolderPlus, MoreHorizontal, Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { NameSheet, RenameSheet } from "@/components/rename-sheet";
import { Brand } from "@/components/site";
import { SAMPLE, sectionStatus, toResume, type Resume } from "@/lib/resume";
import {
  createFolder,
  createResume,
  deleteFolder,
  deleteResume,
  duplicateResume,
  editHref,
  getResume,
  moveResume,
  renameFolder,
  useFolders,
  useResumeList,
  type Folder,
  type Saved,
} from "@/lib/store";

// 保存内容はブラウザにしかないので、読み込むまで一覧を出さない（空の案内のちらつき防止）
const noop = () => () => {};
const useLoaded = () => useSyncExternalStore(noop, () => true, () => false);

// 開いているフォルダ。編集から戻っても同じフォルダが開くよう、このタブの間だけ覚える
const ALL = "all";
const VIEW_KEY = "career-hub:view";
function readView() {
  try {
    return sessionStorage.getItem(VIEW_KEY) ?? ALL;
  } catch {
    return ALL;
  }
}

function updatedLabel(time: number) {
  const d = new Date(time);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return `今日 ${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
  const md = `${d.getMonth() + 1}月${d.getDate()}日`;
  return d.getFullYear() === now.getFullYear() ? md : `${d.getFullYear()}年${md}`;
}

// 一覧に「あと何を書けばいいか」を出す項目（資格は無い人もいるので数えない）
const SECTIONS = [
  ["basic", "基本情報"],
  ["address", "現住所"],
  ["history", "学歴・職歴"],
  ["motivation", "志望動機"],
] as const;

function ResumeCard({ saved, folders, onRename, onDelete, onNewFolder }: {
  saved: Saved;
  folders: Folder[];
  onRename: () => void;
  onDelete: () => void;
  onNewFolder: () => void;
}) {
  const status = sectionStatus(getResume(saved.id));
  const missing = SECTIONS.filter(([key]) => !status[key]).map(([, label]) => label);
  // 直すところがあるときだけ出す（入力済みなら何も出さない）
  const todo = missing.length === SECTIONS.length ? "まだ入力していません" : missing.length ? `未入力：${missing.join("・")}` : null;
  const move = (folder: string) => {
    moveResume(saved.id, folder || undefined);
    const name = folders.find((f) => f.id === folder)?.name;
    toast(name ? `「${name}」に移しました` : "フォルダから出しました");
  };
  return (
    <Item variant="outline" className="relative bg-card hover:bg-muted/60">
      <ItemMedia variant="icon" className="size-10 rounded-lg bg-primary/10 text-primary">
        <FileText className="size-5" />
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
        <ItemDescription className="flex flex-wrap gap-x-3">
          <span>{updatedLabel(saved.updatedAt)}に更新</span>
          {todo && <span>{todo}</span>}
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
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <FolderInput />
                フォルダに移す
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-52 sm:w-44">
                <DropdownMenuRadioGroup value={saved.folder ?? ""} onValueChange={move}>
                  {/* 選んだらメニューを閉じる（選ぶ項目は、ふだんは開いたままになる） */}
                  <DropdownMenuRadioItem value="" closeOnClick>
                    入れない
                  </DropdownMenuRadioItem>
                  {folders.map((f) => (
                    <DropdownMenuRadioItem key={f.id} value={f.id} closeOnClick>
                      <span className="truncate">{f.name}</span>
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onNewFolder}>
                  <FolderPlus />
                  新しいフォルダ
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
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

// フォルダの名前を入れる画面：新しく作る（move があればその履歴書を入れる）か、名前を変える
type Naming = { kind: "new"; move?: Saved } | { kind: "rename"; folder: Folder };

/** 保存した履歴書の一覧（/app/） */
export function ResumeList() {
  const loaded = useLoaded();
  const list = useResumeList();
  const folders = useFolders();
  const router = useRouter();
  const [view, setView] = useState(readView);
  const [renaming, setRenaming] = useState<Saved | null>(null);
  const [deleting, setDeleting] = useState<Saved | null>(null);
  const [naming, setNaming] = useState<Naming | null>(null);
  const [deletingFolder, setDeletingFolder] = useState<Folder | null>(null);
  const importInput = useRef<HTMLInputElement>(null);
  const folderBar = useRef<HTMLDivElement>(null);
  // 消したフォルダが開いたままにならないよう、無ければ「すべて」
  const folder = folders.find((f) => f.id === view);
  // 選んだフォルダが端で切れていたら見えるところまで流す（フォルダのメニューが出て幅が縮んだあとに）
  useEffect(() => {
    folderBar.current?.querySelector('[aria-pressed="true"]')?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [folder?.id]);
  const sorted = [...list].sort((a, b) => b.updatedAt - a.updatedAt);
  const shown = folder ? sorted.filter((s) => s.folder === folder.id) : sorted;
  // 開いているフォルダで作ったものは、そのフォルダに入れる
  const create = (data?: Resume, title?: string) => router.push(editHref(createResume(data, title, folder?.id)));
  const select = (id: string) => {
    setView(id);
    try {
      sessionStorage.setItem(VIEW_KEY, id);
    } catch {
      // 覚えられなくても切り替えはできる
    }
  };

  async function importFile(file: File | undefined) {
    if (!file) return;
    try {
      createResume(toResume(JSON.parse(await file.text())), file.name.replace(/\.json$/i, "") || undefined, folder?.id);
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
        {loaded && list.length > 0 && (
          <div className="flex items-center gap-2">
            {/* フォルダが増えたら横に流して見る。右にフォルダのメニューがあるときは、その下にもぐらせない */}
            <div
              ref={folderBar}
              className={cn(
                "flex min-w-0 flex-1 items-center gap-2 overflow-x-auto [scrollbar-width:none]",
                folder ? "-ml-4 pl-4 sm:-ml-6 sm:pl-6" : "-mx-4 px-4 sm:-mx-6 sm:px-6",
              )}
            >
              {folders.length > 0 && (
                <ToggleGroup variant="outline" value={[folder?.id ?? ALL]} onValueChange={(v) => v[0] && select(v[0])} aria-label="表示するフォルダ">
                  {[{ id: ALL, name: "すべて", count: list.length }, ...folders.map((f) => ({ ...f, count: list.filter((s) => s.folder === f.id).length }))].map((f) => (
                    <ToggleGroupItem
                      key={f.id}
                      value={f.id}
                      className="h-9 px-3 sm:h-8 aria-pressed:border-primary/40 aria-pressed:bg-primary/10 aria-pressed:text-primary"
                    >
                      {f.name}
                      <span className="text-xs text-muted-foreground tabular-nums">{f.count}</span>
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              )}
              <Button variant="ghost" className="h-9 shrink-0 px-2.5 text-muted-foreground sm:h-8" onClick={() => setNaming({ kind: "new" })}>
                <FolderPlus data-icon="inline-start" />
                フォルダを作る
              </Button>
            </div>
            {folder && (
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="size-9 shrink-0 sm:size-8" aria-label={`フォルダ「${folder.name}」のメニュー`} />}>
                  <FolderCog />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60 sm:w-52">
                  <DropdownMenuItem onClick={() => setNaming({ kind: "rename", folder })}>
                    <Pencil />
                    フォルダの名前を変える
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onClick={() => setDeletingFolder(folder)}>
                    <Trash2 />
                    フォルダを削除
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        )}
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
              <Button className="h-11 w-full px-5 text-base sm:h-9 sm:w-auto sm:text-sm has-data-[icon=inline-start]:pl-4.5" onClick={() => create()}>
                <Plus data-icon="inline-start" />
                新しく作る
              </Button>
              <Button variant="outline" className="h-11 w-full px-5 text-base sm:h-9 sm:w-auto sm:text-sm has-data-[icon=inline-start]:pl-4.5" onClick={() => create(structuredClone(SAMPLE), "見本")}>
                <Sparkles data-icon="inline-start" />
                見本で試す
              </Button>
            </EmptyContent>
          </Empty>
        ) : shown.length === 0 ? (
          <Empty className="flex-none border bg-card">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FolderOpen />
              </EmptyMedia>
              <EmptyTitle>このフォルダは空です</EmptyTitle>
              <EmptyDescription>
                <span className="inline-block">「新しく作る」で作るか、</span>
                <span className="inline-block">「すべて」から移してください。</span>
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            <ItemGroup className="gap-3">
              {shown.map((s) => (
                <ResumeCard
                  key={s.id}
                  saved={s}
                  folders={folders}
                  onRename={() => setRenaming(s)}
                  onDelete={() => setDeleting(s)}
                  onNewFolder={() => setNaming({ kind: "new", move: s })}
                />
              ))}
            </ItemGroup>
            <p className="text-xs text-muted-foreground">
              この端末のブラウザに保存しています。別の端末で続けるときは、書き出したファイルを右上のメニューから読み込みます。
            </p>
          </>
        )}
      </main>

      {renaming && <RenameSheet id={renaming.id} title={renaming.title} onClose={() => setRenaming(null)} />}

      {naming && (
        <NameSheet
          title={naming.kind === "new" ? "フォルダを作る" : "フォルダの名前を変える"}
          label="フォルダの名前"
          value={naming.kind === "rename" ? naming.folder.name : ""}
          description="例：IT企業、事務職"
          onSave={(name) => {
            if (!name) return;
            if (naming.kind === "rename") return renameFolder(naming.folder.id, name);
            const id = createFolder(name);
            if (!naming.move) return select(id);
            moveResume(naming.move.id, id);
            toast(`「${name}」に移しました`);
          }}
          onClose={() => setNaming(null)}
        />
      )}

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

      <AlertDialog open={!!deletingFolder} onOpenChange={(open) => !open && setDeletingFolder(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>フォルダ「{deletingFolder?.name}」を削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>中の履歴書は消えず、「すべて」に残ります。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-11 sm:h-9">やめる</AlertDialogCancel>
            <AlertDialogAction
              className="h-11 sm:h-9"
              variant="destructive"
              onClick={() => {
                if (deletingFolder) deleteFolder(deletingFolder.id);
                setDeletingFolder(null);
                select(ALL);
                toast("フォルダを削除しました");
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
