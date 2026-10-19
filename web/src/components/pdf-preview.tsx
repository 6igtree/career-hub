"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/** パソコン向け：ブラウザ内蔵の PDF ビューアで表示する（拡大・ページ送り・印刷ができる） */
export function PdfFrame({ bytes }: { bytes: Uint8Array }) {
  const url = useMemo(() => URL.createObjectURL(new Blob([bytes.slice()], { type: "application/pdf" })), [bytes]);
  useEffect(() => () => URL.revokeObjectURL(url), [url]);
  return <iframe src={`${url}#view=FitH`} title="履歴書のプレビュー" className="size-full rounded-lg bg-white ring-1 ring-foreground/10" />;
}

/**
 * スマホ向け：PDF の各ページを画像として描く。
 * スマホのブラウザはページ内に PDF を表示できない（iPhone は1ページ目だけ、Android はダウンロードになる）ため
 */
export function PdfPreview({ bytes }: { bytes: Uint8Array | null }) {
  const box = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const el = box.current;
    if (!bytes || !el) return;
    let cancelled = false;
    (async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
        // pdf.js は受け取ったデータを作業用スレッドに渡して使えなくするので、複製を渡す
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
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bytes]);

  return (
    <>
      <div ref={box} className="flex flex-col gap-4" />
      {error && <p className="text-sm text-destructive">プレビューを表示できませんでした：{error}</p>}
    </>
  );
}
