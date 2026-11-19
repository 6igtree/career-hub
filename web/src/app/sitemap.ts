import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

// 検索に出したいのは説明のページだけ（編集ページは各自のブラウザの中身を開くだけなので載せない）
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/`, lastModified: new Date(), changeFrequency: "monthly", priority: 1 },
    { url: `${SITE_URL}/tracker/`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
  ];
}
