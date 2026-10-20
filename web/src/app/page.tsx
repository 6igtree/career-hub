/* eslint-disable @next/next/no-img-element -- 静的に書き出すので、next/image の最適化は使えない */
import type { Metadata } from "next";
import Link from "next/link";
import { Check, DoorOpen, FileCheckCorner, Files, FolderOpen, Printer, ShieldCheck, Smartphone } from "lucide-react";
import { cn } from "cn";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Item, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item";
import { Separator } from "@/components/ui/separator";
import { Brand, SiteFooter } from "@/components/site";
import { StartButtons } from "@/components/start-buttons";
import { SITE_DESCRIPTION, SITE_URL } from "@/lib/site";

export const metadata: Metadata = { alternates: { canonical: "/" } };

// 検索エンジンに、無料で使えるウェブアプリだと伝える
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "ResumeDocs",
  alternateName: "厚生労働省様式の履歴書",
  url: `${SITE_URL}/`,
  description: SITE_DESCRIPTION,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  inLanguage: "ja",
  isAccessibleForFree: true,
  offers: { "@type": "Offer", price: "0", priceCurrency: "JPY" },
};

// 順番のない内容なので番号は付けない（番号は「使い方」だけ）
const FEATURES = [
  { icon: FileCheckCorner, title: "公式の様式そのまま", text: "厚生労働省が配布している PDF に書き込むので、罫線や見出しが様式とずれません。" },
  { icon: DoorOpen, title: "無料・登録不要", text: "開いてすぐ書き始められます。メールアドレスの登録もいりません。" },
  { icon: ShieldCheck, title: "入力内容は外に出ない", text: "入力した内容と写真は、このブラウザの中だけに保存します。サーバーには送りません。" },
  { icon: Smartphone, title: "スマホで最後まで", text: "入力から PDF の保存までスマホでできます。保存した PDF は LINE やメールでそのまま送れます。" },
  { icon: Files, title: "応募先ごとに保存", text: "履歴書はいくつでも保存できます。複製して志望動機だけ書き換えれば、2社目からは手早く作れます。" },
  { icon: Printer, title: "A4 でも A3 でも", text: "用紙は A4（2枚）と A3（見開き1枚）から選べます。証明写真は写真欄に合わせて中央で切り抜きます。" },
];

const STEPS = [
  { title: "入力する", text: "氏名や学歴・職歴を、項目ごとの欄に書きます。書いた内容はその場で自動保存されます。" },
  { title: "仕上がりを確かめる", text: "「プレビュー」で PDF の仕上がりを確かめます。パソコンでは入力欄の横にいつも表示されます。" },
  { title: "PDF で保存する", text: "A4 か A3 を選んで保存します。印刷して郵送にも、メールでの提出にも使えます。" },
];

const FAQ = [
  {
    q: "厚生労働省の履歴書様式例とは？",
    a: "2021年に厚生労働省が公表した履歴書の様式例です。性別欄は任意記入で、通勤時間や扶養家族の欄はありません。",
  },
  { q: "無料で使えますか？登録は必要ですか？", a: "無料で、登録も不要です。" },
  {
    q: "入力した内容はどこに保存されますか？",
    a: "使っているブラウザの中だけに保存し、外部には送信しません。別の端末で続けるときは、書き出したファイルを読み込みます。",
  },
  { q: "スマホでも作れますか？", a: "入力から PDF の保存までスマホでできます。保存すると、LINE やメールで送ることもできます。" },
  { q: "印刷するときの用紙は？", a: "A4（2枚）と A3（見開き1枚）のどちらでも保存できます。" },
];

const h2 = "font-serif text-2xl font-semibold sm:text-3xl";
const phone = "w-[44%] max-w-48 overflow-hidden rounded-3xl shadow-lg ring-1 shadow-foreground/10 ring-foreground/10";

/** トップ（説明のページ）。使っている人も見られるよう、自動で一覧へは移さない */
export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-3 px-4 sm:px-6">
          <Brand />
          {/* リンクは Button ではなく buttonVariants で見た目だけ合わせる（shadcn の推奨） */}
          <Link href="/app/" className={cn(buttonVariants({ variant: "outline" }), "ml-auto h-11 px-3 sm:h-9")}>
            <FolderOpen data-icon="inline-start" />
            保存した履歴書
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto grid w-full max-w-5xl items-center gap-12 px-4 pt-10 pb-16 sm:px-6 md:grid-cols-[1fr_18rem] md:gap-14 md:pt-20 lg:grid-cols-[1fr_21rem]">
          <div>
            <h1 className="font-serif text-[2rem] leading-snug font-semibold sm:text-4xl lg:text-[2.6rem]">
              {/* 言葉の途中で折り返さない */}
              <span className="inline-block">厚生労働省様式の</span>
              <span className="inline-block">履歴書を、</span>
              <span className="inline-block">そのまま PDF に</span>
            </h1>
            <p className="mt-5 max-w-xl leading-relaxed text-muted-foreground">
              厚生労働省が配布している「履歴書様式例」の PDF に、入力した内容を書き込みます。罫線や見出しは公式のまま。入力した内容は外部に送りません。
            </p>
            <StartButtons className="mt-8" />
            <div className="mt-5 flex flex-wrap gap-2">
              {["無料", "登録不要", "スマホ対応"].map((label) => (
                <Badge key={label} variant="outline" className="h-6 px-2.5 text-[0.8125rem]">
                  <Check data-icon="inline-start" className="text-primary" />
                  {label}
                </Badge>
              ))}
            </div>
          </div>
          <figure className="mx-auto w-full max-w-80 md:max-w-none">
            <div className="relative">
              {/* 後ろの2枚目（A4 では2枚になる） */}
              <div aria-hidden className="absolute inset-0 translate-x-2.5 translate-y-2.5 rotate-[1.5deg] rounded-[3px] bg-card shadow-sm ring-1 ring-foreground/10" />
              <AspectRatio ratio={210 / 297} className="overflow-hidden rounded-[3px] bg-white shadow-xl ring-1 shadow-foreground/15 ring-foreground/10">
                <img
                  src="/lp/resume.webp"
                  width={900}
                  height={1273}
                  fetchPriority="high"
                  alt="見本の内容で作った履歴書の1枚目。厚生労働省の様式例に、氏名・住所・学歴・職歴が書き込まれている"
                  className="size-full object-cover"
                />
              </AspectRatio>
            </div>
            <figcaption className="mt-5 text-center text-xs text-muted-foreground">見本で作った1枚目（A4）</figcaption>
          </figure>
        </section>

        <section aria-labelledby="features" className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6 md:py-20">
          <h2 id="features" className={h2}>
            ResumeDocs でできること
          </h2>
          {/* 履歴書の表と同じく、外側を太い線、内側を細い線で区切る */}
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
          <div className="mx-auto grid w-full max-w-5xl items-center gap-12 px-4 py-16 sm:px-6 md:grid-cols-[1fr_auto] md:gap-16 md:py-20">
            <div>
              <h2 id="steps" className={h2}>
                使い方
              </h2>
              <ItemGroup className="mt-8 gap-7">
                {STEPS.map(({ title, text }, i) => (
                  <Item key={title} role="listitem" className="items-start gap-3 p-0">
                    {/* 印鑑のような朱の丸で順番を示す */}
                    <ItemMedia className="size-9 rounded-full border-[1.5px] border-primary font-serif text-base text-primary group-has-data-[slot=item-description]/item:translate-y-0">
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
            <div className="flex items-start justify-center gap-4 sm:gap-6">
              <AspectRatio ratio={390 / 844} className={phone}>
                <img
                  src="/lp/form.webp"
                  width={780}
                  height={1688}
                  loading="lazy"
                  alt="スマホの入力画面。氏名・ふりがな・生年月日の欄が並んでいる"
                  className="size-full object-cover"
                />
              </AspectRatio>
              <AspectRatio ratio={390 / 844} className={cn(phone, "mt-10")}>
                <img
                  src="/lp/preview.webp"
                  width={780}
                  height={1688}
                  loading="lazy"
                  alt="スマホのプレビュー画面。保存する PDF の1枚目が表示されている"
                  className="size-full object-cover"
                />
              </AspectRatio>
            </div>
          </div>
          <Separator />
        </section>

        <section aria-labelledby="faq" className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6 md:py-20">
          <h2 id="faq" className={h2}>
            よくある質問
          </h2>
          {/* 閉じている答えも HTML に残す（検索エンジンが読め、ページ内検索でも開く） */}
          <Accordion multiple hiddenUntilFound className="mt-8 max-w-3xl border-t-2 border-foreground">
            {FAQ.map(({ q, a }) => (
              <AccordionItem key={q} value={q} className="border-b border-foreground/15">
                <AccordionTrigger className="items-center py-4 text-base">{q}</AccordionTrigger>
                <AccordionContent className="pb-4 leading-relaxed text-muted-foreground">{a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        <section aria-labelledby="start" className="mx-auto w-full max-w-5xl px-4 pb-16 sm:px-6 md:pb-20">
          <Card className="gap-6 px-6 py-8 md:flex-row md:items-center md:justify-between md:px-10 md:py-10">
            <CardHeader className="px-0 md:flex-1">
              <CardTitle>
                <h2 id="start" className={h2}>
                  すぐに書き始められます
                </h2>
              </CardTitle>
              <CardDescription className="mt-1">登録はいりません。見本で試してから、自分の内容に書き換えることもできます。</CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              <StartButtons />
            </CardContent>
          </Card>
        </section>
      </main>

      <SiteFooter className="max-w-5xl" />
    </>
  );
}
