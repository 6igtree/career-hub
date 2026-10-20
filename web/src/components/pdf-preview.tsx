"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

/** パソコン向け：ブラウザ内蔵の PDF ビューアで表示する（拡大・ページ送り・印刷ができる） */
export function PdfFrame({ bytes }: { bytes: Uint8Array }) {
  const url = useMemo(() => URL.createObjectURL(new Blob([bytes.slice()], { type: "application/pdf" })), [bytes]);
  useEffect(() => () => URL.revokeObjectURL(url), [url]);
  return <iframe src={`${url}#view=FitH`} title="履歴書のプレビュー" className="size-full rounded-lg bg-white ring-1 ring-foreground/10" />;
}

/**
 * スマホ向け：PDF の各ページを画像にして描く（スマホのブラウザはページ内に PDF を表示できない）。
 * 描き終えるまでは fallback、作り直している間は前のページに「更新中…」を重ねる
 */
export function PdfPreview({ bytes, fallback, updating = false }: { bytes: Uint8Array | null; fallback: React.ReactNode; updating?: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  const [rendered, setRendered] = useState<Uint8Array | null>(null); // いま表示しているページの元データ
  const [error, setError] = useState("");
  const busy = updating || (!!bytes && bytes !== rendered);

  useEffect(() => {
    const el = box.current;
    if (!bytes || !el) return;
    let cancelled = false;
    (async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
        // pdf.js は渡したデータを使えなくするので、複製を渡す
        const task = pdfjs.getDocument({ data: bytes.slice() });
        const doc = await task.promise;
        const width = el.clientWidth || 600;
        const pages: HTMLCanvasElement[] = [];
        for (let n = 1; n <= doc.numPages; n++) {
          const page = await doc.getPage(n);
          const scale = (width / page.getViewport({ scale: 1 }).width) * Math.min(window.devicePixelRatio || 1, 2);
          const viewport = page.getViewport({ scale });
          const canvas = Object.assign(document.createElement("canvas"), {
            width: Math.floor(viewport.width),
            height: Math.floor(viewport.height),
            className: "h-auto w-full rounded-sm bg-white shadow-sm ring-1 ring-black/10",
          });
          canvas.setAttribute("role", "img");
          canvas.setAttribute("aria-label", `履歴書 ${n}ページ目`);
          await page.render({ canvas, viewport }).promise;
          pages.push(canvas);
        }
        await task.destroy();
        if (!cancelled) {
          el.replaceChildren(...pages);
          setError("");
          setRendered(bytes);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
          setRendered(bytes);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bytes]);

  return (
    <div className="relative">
      {rendered && busy && (
        // スクロールしても見えるよう上に貼りつける（ページは押し下げない）
        <div className="pointer-events-none sticky top-2 z-10 -mb-8 flex h-8 justify-center" role="status">
          <span className="flex items-center gap-1.5 rounded-full bg-background/95 px-3 text-xs shadow-sm ring-1 ring-foreground/10">
            <Loader2 className="size-3.5 animate-spin text-primary" aria-hidden />
            更新中…
          </span>
        </div>
      )}
      {!rendered && fallback}
      <div ref={box} className="flex flex-col gap-4" />
      {error && <p className="text-sm text-destructive">プレビューを表示できませんでした：{error}</p>}
    </div>
  );
}
