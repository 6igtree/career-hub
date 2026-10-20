import Link from "next/link";
import { FileText } from "lucide-react";
import { cn } from "cn";

/** ヘッダー左のロゴと名前。押すとトップ（説明のページ）へ */
export function Brand() {
  return (
    <Link href="/" className="flex min-w-0 items-center gap-2.5 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
        <FileText className="size-4" aria-hidden />
      </span>
      <span className="min-w-0 leading-tight">
        <span className="block truncate text-sm font-semibold">厚生労働省様式の履歴書</span>
        <span className="block truncate text-xs text-muted-foreground">ResumeDocs</span>
      </span>
    </Link>
  );
}

const FORM_URL = "https://www.hellowork.mhlw.go.jp/member/career_doc01.html";
const PDL_URL = "https://www.digital.go.jp/resources/open_data/public_data_license_v1.0";

/** 様式の出典。公共データ利用規約では、加工したら出典に加えて「加工したこと」と「加工した者」も書く */
export function FormCredit() {
  // 編集中に押しても入力画面を離れないよう、別のタブで開く。リンクの途中では折り返さない
  const link = { className: "whitespace-nowrap underline underline-offset-2", target: "_blank", rel: "noopener noreferrer" };
  return (
    <>
      様式：厚生労働省「<a {...link} href={FORM_URL}>厚生労働省履歴書様式例</a>」をもとに ResumeDocs で作成（
      <a {...link} href={PDL_URL}>
        公共データ利用規約 第1.0版
      </a>
      ）
    </>
  );
}

/** トップの出典と注意書き。className：本文の幅に揃える */
export function SiteFooter({ className }: { className?: string }) {
  return (
    <footer className="border-t text-xs text-muted-foreground">
      <div className={cn("mx-auto flex w-full max-w-7xl flex-col gap-1 px-4 pt-6 pb-6 sm:px-6", className)}>
        <p>
          出典：厚生労働省「厚生労働省履歴書様式例」（
          <a className="underline underline-offset-2" href={FORM_URL}>
            ハローワークインターネットサービス
          </a>
          ）、
          <a className="underline underline-offset-2" href={PDL_URL}>
            公共データ利用規約（第1.0版）
          </a>
          。この様式をもとに、記入内容を書き加えて ResumeDocs で作成しています。
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
