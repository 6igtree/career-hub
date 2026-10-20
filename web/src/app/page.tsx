import type { Metadata } from "next";
import { About } from "@/components/about";
import { ResumeList } from "@/components/resume-list";
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

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ResumeList>
        <About />
      </ResumeList>
    </>
  );
}
