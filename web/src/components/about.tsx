import { ChevronDown } from "lucide-react";

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

/** トップの説明とよくある質問。保存内容を読む前の HTML にも入るので、検索にも使われる */
export function About() {
  return (
    <section className="mx-auto w-full max-w-3xl px-4 pb-10 sm:px-6" aria-labelledby="about">
      <h2 id="about" className="text-base font-semibold">
        厚生労働省様式の履歴書を、ブラウザで作成
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        厚生労働省が配布している「履歴書様式例」の PDF に、入力した内容を書き込んで保存します。罫線や見出しは公式のままです。応募先ごとに、いくつでも保存できます。
      </p>
      <h2 className="mt-8 text-base font-semibold">よくある質問</h2>
      <div className="mt-3 divide-y rounded-xl bg-card ring-1 ring-foreground/10">
        {FAQ.map(({ q, a }) => (
          <details key={q} className="group px-4">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 py-2 text-sm font-medium [&::-webkit-details-marker]:hidden">
              {q}
              <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden />
            </summary>
            <p className="pb-3 text-sm text-muted-foreground">{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
