import type { MetadataRoute } from "next";

export const dynamic = "force-static";

// スマホで「ホーム画面に追加」したときの名前やアイコン
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "厚生労働省様式の履歴書",
    short_name: "履歴書",
    description: "厚生労働省様式の履歴書をブラウザでつくる",
    lang: "ja",
    id: "/", // 開く場所を変えても、追加済みのアプリと同じものとして扱われるようにする
    start_url: "/app/", // 毎日使う人は説明のページを通らず一覧から始める
    scope: "/", // 編集ページもアプリの中で開く（省くと /app/ の下だけになる）
    display: "standalone",
    background_color: "#f8f4ec",
    theme_color: "#f8f4ec",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
