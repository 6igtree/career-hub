"use client";

import { useRef } from "react";
import { ImageIcon, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { loadPhoto, type Layout } from "@/lib/resume";

export function PhotoField({ photo, layout, onChange }: { photo: string; layout: Layout | null; onChange: (dataUrl: string) => void }) {
  const input = useRef<HTMLInputElement>(null);

  async function pick(file: File | undefined) {
    if (!file || !layout) return;
    try {
      onChange(await loadPhoto(file, layout));
    } catch {
      toast.error("この写真は読み込めませんでした", {
        description: "JPEG か PNG を選んでください（Chrome は iPhone の HEIC を読めません）",
      });
    }
  }

  return (
    <div className="flex items-center gap-4">
      {/* 写真欄と同じ縦横比（縦 38.7mm × 横 30.2mm） */}
      <div className="grid aspect-[85.53/109.64] w-20 shrink-0 place-items-center overflow-hidden rounded-md border border-dashed bg-muted/40 text-muted-foreground">
        {photo ? (
          // data URL の写真なので next/image の最適化は使えない
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="履歴書に入れる写真" className="size-full object-cover" />
        ) : (
          <ImageIcon className="size-6" aria-hidden />
        )}
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" className="h-11 sm:h-9" disabled={!layout} onClick={() => input.current?.click()}>
            <Upload data-icon="inline-start" />
            {photo ? "写真を変える" : "写真を選ぶ"}
          </Button>
          {photo && (
            <Button type="button" variant="ghost" className="h-11 sm:h-9" onClick={() => onChange("")}>
              <X data-icon="inline-start" />
              外す
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">縦4:横3 の証明写真がおすすめ（中央で切り抜きます）</p>
      </div>
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          pick(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}
