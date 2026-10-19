"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { EditSheet } from "@/components/edit-sheet";
import { renameResume } from "@/lib/store";

/** 履歴書の名前を変える。開くたびに作り直すので、閉じるときは外から外す */
export function RenameSheet({ id, title: current, onClose }: { id: string; title: string; onClose: () => void }) {
  const inputId = useId();
  const [title, setTitle] = useState(current);
  const save = () => {
    renameResume(id, title.trim() || current);
    onClose();
  };

  return (
    <EditSheet
      open
      onOpenChange={(open) => !open && onClose()}
      title="名前を変える"
      footer={
        <>
          <Button variant="ghost" className="h-11 sm:h-9" onClick={onClose}>
            やめる
          </Button>
          <Button className="h-11 flex-1 sm:h-9 sm:flex-none" onClick={save}>
            保存
          </Button>
        </>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <Field>
          <FieldLabel htmlFor={inputId} className="text-[15px] sm:text-sm">
            名前
          </FieldLabel>
          <Input id={inputId} value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
          <FieldDescription>一覧で見分けるための名前です。PDF には出ません（例：○○社用）</FieldDescription>
        </Field>
      </form>
    </EditSheet>
  );
}
