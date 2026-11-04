"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldTitle } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { EditSheet } from "@/components/edit-sheet";
import { editHref, saveApplication, STATUSES, useResumeList, type Application, type ApplicationInput, type Status } from "@/lib/store";

const LABEL = "text-[15px] sm:text-sm";
const NONE = "none"; // 履歴書を選ばない

/** 応募先を追加・編集する画面。app が無ければ新しく作る。onSaved には保存した id が渡る。onDelete を渡すと削除ボタンを出す */
export function ApplicationSheet({ app, onClose, onSaved, onDelete }: {
  app?: Application;
  onClose: () => void;
  onSaved?: (id: string) => void;
  onDelete?: () => void;
}) {
  const id = useId();
  const resumes = useResumeList();
  const [form, setForm] = useState<ApplicationInput>(() => app ?? { company: "", status: "応募前" });
  const set = (patch: Partial<ApplicationInput>) => setForm((f) => ({ ...f, ...patch }));
  const company = form.company.trim();
  const items = [{ value: NONE, label: "選ばない" }, ...resumes.map((r) => ({ value: r.id, label: r.title }))];
  const linked = resumes.some((r) => r.id === form.resume);

  const save = () => {
    if (!company) return;
    const id = saveApplication({ ...form, company }, app?.id);
    onClose();
    onSaved?.(id);
  };

  return (
    <EditSheet
      open
      onOpenChange={(open) => !open && onClose()}
      title={app ? "応募先を編集" : "応募先を追加"}
      footer={
        <>
          {onDelete && (
            <Button variant="ghost" size="icon" className="mr-auto size-11 text-destructive hover:text-destructive sm:size-9" aria-label="削除" onClick={onDelete}>
              <Trash2 />
            </Button>
          )}
          <Button variant="ghost" className="h-11 sm:h-9" onClick={onClose}>
            やめる
          </Button>
          <Button className="h-11 flex-1 sm:h-9 sm:flex-none" disabled={!company} onClick={save}>
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
        <FieldGroup className="gap-5">
          <Field>
            <FieldLabel htmlFor={`${id}-company`} className={LABEL}>
              応募先
            </FieldLabel>
            <Input id={`${id}-company`} value={form.company} onChange={(e) => set({ company: e.target.value })} placeholder="例：○○株式会社" autoFocus={!app} />
          </Field>
          <Field>
            <FieldTitle className={LABEL}>状態</FieldTitle>
            <ToggleGroup variant="outline" value={[form.status]} onValueChange={(v) => v[0] && set({ status: v[0] as Status })} aria-label="状態" className="flex-wrap">
              {STATUSES.map((s) => (
                <ToggleGroupItem key={s} value={s} className="h-11 px-3 sm:h-8 aria-pressed:border-primary/40 aria-pressed:bg-primary/10 aria-pressed:text-primary">
                  {s}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </Field>
          <Field>
            <FieldLabel htmlFor={`${id}-resume`} className={LABEL}>
              使った履歴書
            </FieldLabel>
            <Select items={items} value={linked ? form.resume : NONE} onValueChange={(v) => set({ resume: v === NONE ? undefined : (v as string) })}>
              <SelectTrigger id={`${id}-resume`} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {items.map((i) => (
                  <SelectItem key={i.value} value={i.value}>
                    {i.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {linked && (
              <FieldDescription>
                <Link href={editHref(form.resume!, app?.id)} className="underline underline-offset-2">
                  この履歴書を開く
                </Link>
              </FieldDescription>
            )}
          </Field>
          <Field>
            <FieldLabel htmlFor={`${id}-memo`} className={LABEL}>
              会社についてのメモ
            </FieldLabel>
            <Textarea id={`${id}-memo`} value={form.memo ?? ""} onChange={(e) => set({ memo: e.target.value || undefined })} placeholder="社風、志望理由の材料など" />
            {!app && <FieldDescription>面接ごとのメモは、保存したあとの「選考の記録」に書きます。</FieldDescription>}
          </Field>
        </FieldGroup>
      </form>
    </EditSheet>
  );
}
