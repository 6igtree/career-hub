import { FileText } from "lucide-react";
import { cn } from "cn";

/** ヘッダー左のロゴと名前 */
export function Brand() {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
        <FileText className="size-4" aria-hidden />
      </span>
      <div className="min-w-0 leading-tight">
        <h1 className="truncate text-sm font-semibold">厚生労働省様式の履歴書</h1>
        <p className="truncate text-xs text-muted-foreground">ResumeDocs</p>
      </div>
    </div>
  );
}

/** 出典と注意書き。bottomBar：スマホで画面下に操作バーがあるページ用の余白 */
export function SiteFooter({ bottomBar = false }: { bottomBar?: boolean }) {
  return (
    <footer className="border-t text-xs text-muted-foreground">
      <div className={cn("mx-auto flex w-full max-w-7xl flex-col gap-1 px-4 pt-6 sm:px-6", bottomBar ? "pb-28 lg:pb-6" : "pb-6")}>
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
          厚生労働省・ハローワークとは関係のない非公式ツールです。PDF のフォントは IPAex明朝（IPAフォントライセンス）。
          <a className="underline underline-offset-2" href="https://github.com/6igtree/career-hub">
            ソースコード
          </a>
        </p>
      </div>
    </footer>
  );
}
