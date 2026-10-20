"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { EditSheet } from "@/components/edit-sheet";
import { renameResume } from "@/lib/store";

/** 名前を1つ入力する画面（履歴書とフォルダで共通）。onSave には前後の空白を除いた名前が渡る。閉じるときは呼び出し側で外す */
export function NameSheet({ title, label, value, description, onSave, onClose }: {
  title: string;
  label: string;
  value: string;
  description?: string;
  onSave: (name: string) => void;
  onClose: () => void;
}) {
  const inputId = useId();
  const [name, setName] = useState(value);
  const save = () => {
    onSave(name.trim());
    onClose();
  };

  return (
    <EditSheet
      open
      onOpenChange={(open) => !open && onClose()}
      title={title}
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
            {label}
          </FieldLabel>
          <Input id={inputId} value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          {description && <FieldDescription>{description}</FieldDescription>}
        </Field>
      </form>
    </EditSheet>
  );
}

/** 履歴書の名前を変える。空なら元の名前のまま */
export function RenameSheet({ id, title, onClose }: { id: string; title: string; onClose: () => void }) {
  return (
    <NameSheet
      title="名前を変える"
      label="名前"
      value={title}
      description="例：○○社用（PDF には出ません）"
      onSave={(name) => renameResume(id, name || title)}
      onClose={onClose}
    />
  );
}
