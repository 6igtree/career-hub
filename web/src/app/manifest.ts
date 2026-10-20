import type { MetadataRoute } from "next";

export const dynamic = "force-static";

// スマホで「ホーム画面に追加」したときの名前やアイコン
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "厚生労働省様式の履歴書",
    short_name: "履歴書",
    description: "厚生労働省様式の履歴書をブラウザでつくる",
    lang: "ja",
    start_url: "/",
    display: "standalone",
    background_color: "#f8f4ec",
    theme_color: "#f8f4ec",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
