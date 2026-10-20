"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, Copy, FileText, FileUp, FolderInput, FolderOpen, FolderPlus, MoreHorizontal, Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
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
import { ButtonGroup, ButtonGroupSeparator } from "@/components/ui/button-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
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

// 「新しく作る」の ▾ に並べるもの
const MENU = [
  { icon: FileText, title: "履歴書", text: "空の状態から書く" },
  { icon: Sparkles, title: "見本から", text: "見本の内容を入れて、書き換えて使う", sample: true },
  { icon: FolderPlus, title: "フォルダ", text: "応募先の種類などで履歴書を分ける" },
  { icon: FileUp, title: "ファイルから読み込む", text: "書き出したファイルで続きを書く" },
];

/** ▾ の中の1行。アイコン・名前・説明を並べる（shadcn の Item をメニューの中で使う形） */
function CreateItem({ icon: Icon, title, text, onClick }: { icon: typeof FileText; title: string; text: string; onClick: () => void }) {
  return (
    <DropdownMenuItem onClick={onClick}>
      <Item size="xs" className="w-full flex-nowrap">
        <ItemMedia variant="icon" className="size-8 rounded-md bg-primary/10 text-primary">
          <Icon className="size-4" />
        </ItemMedia>
        <ItemContent className="gap-0">
          <ItemTitle>{title}</ItemTitle>
          <ItemDescription className="line-clamp-none">{text}</ItemDescription>
        </ItemContent>
      </Item>
    </DropdownMenuItem>
  );
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
                      <span className="min-w-0 truncate">{f.name}</span>
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
  const counts = new Map<string, number>();
  for (const s of list) if (s.folder) counts.set(s.folder, (counts.get(s.folder) ?? 0) + 1);
  const views = [{ id: ALL, name: "すべて", count: list.length }, ...folders.map((f) => ({ ...f, count: counts.get(f.id) ?? 0 }))];
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
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-4 py-6 sm:px-6">
        <div className="flex min-h-11 items-center justify-between gap-3 sm:min-h-9">
          <h1 className="text-lg font-semibold">保存した履歴書</h1>
          {loaded && list.length > 0 && (
            <ButtonGroup>
              <Button className="h-11 sm:h-9" onClick={() => create()}>
                <Plus data-icon="inline-start" />
                新しく作る
              </Button>
              <ButtonGroupSeparator />
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button size="icon" className="size-11 sm:size-9" aria-label="作るものを選ぶ" />}>
                  <ChevronDown />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72 sm:w-64">
                  <DropdownMenuGroup>
                    {/* フォルダを開いているときは、どこに作られるかを示す */}
                    {folder && <DropdownMenuLabel className="truncate">「{folder.name}」に作る</DropdownMenuLabel>}
                    {MENU.slice(0, 2).map((m) => (
                      <CreateItem key={m.title} {...m} onClick={() => (m.sample ? create(structuredClone(SAMPLE), "見本") : create())} />
                    ))}
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <CreateItem {...MENU[2]} onClick={() => setNaming({ kind: "new" })} />
                  <CreateItem {...MENU[3]} onClick={() => importInput.current?.click()} />
                </DropdownMenuContent>
              </DropdownMenu>
            </ButtonGroup>
          )}
        </div>
        {loaded && folders.length > 0 && list.length > 0 && (
          <div className="flex items-center gap-2">
            {/* フォルダが増えたら横に流して見る。全部は右の ▾ から一覧で選べる（マウスでは横に流しにくいため） */}
            <div
              ref={folderBar}
              className={cn(
                "flex min-w-0 flex-1 items-center gap-2 overflow-x-auto [scrollbar-width:none]",
                // 流したときも画面の端に付かないよう、端の余白を残して止める
                "-ml-4 scroll-pl-4 pl-4 sm:-ml-6 sm:scroll-pl-6 sm:pl-6",
              )}
            >
              <ToggleGroup variant="outline" value={[folder?.id ?? ALL]} onValueChange={(v) => v[0] && select(v[0])} aria-label="表示するフォルダ">
                {views.map((v) => (
                  <ToggleGroupItem
                    key={v.id}
                    value={v.id}
                    className="h-9 px-3 sm:h-8 aria-pressed:border-primary/40 aria-pressed:bg-primary/10 aria-pressed:text-primary"
                  >
                    {/* 長い名前は省略する（全部は ▾ の一覧で見られる） */}
                    <span className="max-w-40 truncate">{v.name}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">{v.count}</span>
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="outline" size="icon" className="size-9 shrink-0 sm:size-8" aria-label="フォルダの一覧" />}>
                <ChevronDown />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 sm:w-56">
                <DropdownMenuRadioGroup value={folder?.id ?? ALL} onValueChange={select}>
                  {views.map((v) => (
                    <DropdownMenuRadioItem key={v.id} value={v.id} closeOnClick>
                      <span className="min-w-0 flex-1 truncate">{v.name}</span>
                      <span className="text-xs text-muted-foreground tabular-nums">{v.count}</span>
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
                {folder && (
                  <>
                    <DropdownMenuSeparator />
                    {/* 下の2つは、開いているフォルダに対する操作 */}
                    <DropdownMenuGroup>
                      <DropdownMenuLabel className="truncate">「{folder.name}」</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => setNaming({ kind: "rename", folder })}>
                        <Pencil />
                        名前を変える
                      </DropdownMenuItem>
                      <DropdownMenuItem variant="destructive" onClick={() => setDeletingFolder(folder)}>
                        <Trash2 />
                        削除
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
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
            <Button variant="link" className="h-11 text-muted-foreground sm:h-9" onClick={() => importInput.current?.click()}>
              <FileUp data-icon="inline-start" />
              書き出したファイルを読み込む
            </Button>
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
              この端末のブラウザに保存しています。別の端末で続けるときは、書き出したファイルを「新しく作る」の ▾ から読み込みます。
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
