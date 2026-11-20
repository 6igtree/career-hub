import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock, Check, FileText, ListChecks, NotebookPen, ShieldCheck } from "lucide-react";
import { cn } from "cn";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Item, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item";
import { Separator } from "@/components/ui/separator";
import { Brand, SiteFooter } from "@/components/site";
import { SITE_URL } from "@/lib/site";

// 新卒の就活と転職の両方で検索されるよう、どちらの言葉もタイトルと説明に入れる
const TITLE = "就活・転職の選考管理を無料で｜面接の記録と日程を一覧に";
const DESCRIPTION =
  "応募した会社ごとに、選考の段階・面接の日程・面接のメモをまとめて管理できます。新卒の就活にも転職活動にも使えます。無料・登録不要でスマホに対応し、入力内容は外部に送信しません。送った履歴書もそのまま開けます。";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/tracker/" },
  openGraph: { url: "/tracker/", title: TITLE, description: DESCRIPTION },
  twitter: { title: TITLE, description: DESCRIPTION },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "ResumeDocs 選考管理",
  url: `${SITE_URL}/tracker/`,
  description: DESCRIPTION,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  inLanguage: "ja",
  isAccessibleForFree: true,
  offers: { "@type": "Offer", price: "0", priceCurrency: "JPY" },
};

// できないこと（通知・カレンダー連携・同期）は書かない。期待させすぎない
const FEATURES = [
  { icon: ListChecks, title: "選考の段階がひと目で分かる", text: "応募先ごとに「応募前・書類選考・面接・内定・終了」のどこにいるかを残せます。" },
  { icon: CalendarClock, title: "次の面接の日付が一覧に出る", text: "面接や面談の日付を入れておくと、一覧に次の予定が並びます。" },
  {
    icon: NotebookPen,
    title: "面接ごとにメモを残せる",
    text: "カジュアル面談から最終面接まで1回ずつ記録できます。説明会やグループディスカッションも「その他」で残せます。",
  },
  { icon: FileText, title: "送った履歴書とつながる", text: "どの履歴書を送ったかを選んでおけば、応募先の画面からそのまま開けます。" },
  { icon: ShieldCheck, title: "入力内容は外に出ない", text: "保存先はこのブラウザの中だけ。サーバーには送らず、登録もいりません。" },
];

const STEPS = [
  { title: "応募先を追加する", text: "会社名と、今の選考の段階を入れます。" },
  { title: "面接を記録する", text: "面接や面談が決まったら日付を入れ、終わったらメモを書きます。" },
  { title: "一覧で確かめる", text: "どこまで進んだか、次の面接はいつかを一覧で見られます。" },
];

const FAQ = [
  { q: "無料で使えますか？登録は必要ですか？", a: "無料で、登録も不要です。" },
  { q: "新卒の就活でも使えますか？", a: "使えます。説明会やグループディスカッションなどは、記録の種類を「その他」にして名前を付けられます。" },
  {
    q: "スプレッドシートで管理するのと何が違いますか？",
    a: "表を作る手間がなく、スマホでも入力しやすい画面になっています。面接ごとのメモや、送った履歴書もいっしょに残せます。",
  },
  {
    q: "入力した内容はどこに保存されますか？",
    a: "使っているブラウザの中だけに保存し、外部には送信しません。別の端末で続けるときは、一覧の右上の「バックアップ」で書き出したファイルを読み込みます。",
  },
  { q: "履歴書も作れますか？", a: "厚生労働省の様式例どおりの履歴書を作って PDF で保存できます。作った履歴書は、応募先に結び付けられます。" },
];

const h2 = "text-2xl font-bold sm:text-3xl";
const START = "/app/applications/";

function StartLink({ className }: { className?: string }) {
  return (
    <Link href={START} className={cn(buttonVariants(), "h-12 px-6 text-base", className)}>
      選考管理をはじめる
    </Link>
  );
}

/** 選考管理の説明のページ（「選考管理」「就活 管理」などで探す人の入口） */
export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-3 px-4 sm:px-6">
          <Brand />
          <Link href={START} className={cn(buttonVariants({ variant: "outline" }), "ml-auto h-11 px-3 sm:h-9")}>
            選考管理を開く
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto w-full max-w-5xl px-4 pt-10 pb-16 sm:px-6 md:pt-20">
          <h1 className="text-[2rem] leading-snug font-bold sm:text-4xl lg:text-[2.6rem]">
            <span className="inline-block">就活・転職の選考を、</span>
            <span className="inline-block">ひとつの一覧で</span>
          </h1>
          <p className="mt-5 max-w-xl leading-relaxed text-muted-foreground">
            応募した会社ごとに、選考の段階と面接の日程・メモをまとめておけます。入力した内容は外部に送りません。
          </p>
          <StartLink className="mt-8" />
          <div className="mt-5 flex flex-wrap gap-2">
            {["無料", "登録不要", "スマホ対応"].map((label) => (
              <Badge key={label} variant="outline" className="h-6 px-2.5 text-[0.8125rem] has-data-[icon=inline-start]:pl-2">
                <Check data-icon="inline-start" className="text-primary" />
                {label}
              </Badge>
            ))}
          </div>
        </section>

        <section aria-labelledby="features" className="mx-auto w-full max-w-5xl px-4 pb-16 sm:px-6 md:pb-20">
          <h2 id="features" className={h2}>
            できること
          </h2>
          <ItemGroup className="mt-8 grid gap-0 border-t-2 border-foreground md:grid-cols-2 md:gap-x-10">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <Item key={title} role="listitem" className="items-start gap-3 rounded-none border-0 border-b border-foreground/15 px-0 py-5">
                <ItemMedia variant="icon" className="text-primary">
                  <Icon aria-hidden className="size-5" />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle className="text-base font-semibold">{title}</ItemTitle>
                  <ItemDescription className="line-clamp-none leading-relaxed">{text}</ItemDescription>
                </ItemContent>
              </Item>
            ))}
          </ItemGroup>
        </section>

        <section aria-labelledby="steps" className="bg-card">
          <Separator />
          <div className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6 md:py-20">
            <h2 id="steps" className={h2}>
              使い方
            </h2>
            <ItemGroup className="mt-8 gap-7">
              {STEPS.map(({ title, text }, i) => (
                <Item key={title} role="listitem" className="items-start gap-3 p-0">
                  <ItemMedia className="size-9 rounded-full border-[1.5px] border-primary text-base font-semibold text-primary group-has-data-[slot=item-description]/item:translate-y-0">
                    {i + 1}
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle className="text-base leading-9 font-semibold">{title}</ItemTitle>
                    <ItemDescription className="line-clamp-none leading-relaxed">{text}</ItemDescription>
                  </ItemContent>
                </Item>
              ))}
            </ItemGroup>
          </div>
          <Separator />
        </section>

        <section aria-labelledby="faq" className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6 md:py-20">
          <h2 id="faq" className={h2}>
            よくある質問
          </h2>
          <Accordion multiple hiddenUntilFound className="mt-8 border-t-2 border-foreground">
            {FAQ.map(({ q, a }) => (
              <AccordionItem key={q} value={q} className="border-b border-foreground/15">
                <AccordionTrigger className="items-center py-4 text-base">{q}</AccordionTrigger>
                <AccordionContent className="pb-4 leading-relaxed text-muted-foreground">{a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          <p className="mt-6 leading-relaxed text-muted-foreground">
            履歴書の作り方は
            <Link className="underline underline-offset-2" href="/">
              厚生労働省様式の履歴書
            </Link>
            のページで紹介しています。
          </p>
        </section>

        <section aria-labelledby="start" className="mx-auto w-full max-w-5xl px-4 pb-16 sm:px-6 md:pb-20">
          <Card className="gap-6 px-6 py-8 md:flex-row md:items-center md:justify-between md:px-10 md:py-10">
            <CardHeader className="px-0 md:flex-1">
              <CardTitle>
                <h2 id="start" className={h2}>
                  すぐに使い始められます
                </h2>
              </CardTitle>
              <CardDescription className="mt-1">登録はいりません。応募先を1件追加するところから始めます。</CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              <StartLink />
            </CardContent>
          </Card>
        </section>
      </main>

      <SiteFooter className="max-w-5xl" />
    </>
  );
}
