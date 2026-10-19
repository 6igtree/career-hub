"use client";

import { useId, useState } from "react";
import { Field, FieldDescription, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const PRESETS = ["", "男", "女"];
const OPTIONS = [
  { value: "none", label: "記入しない" },
  { value: "男", label: "男" },
  { value: "女", label: "女" },
  { value: "free", label: "自分で書く" },
];

/** 性別。様式では記入は任意なので「記入しない」を先頭に置き、自由に書くこともできる */
export function GenderField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const id = useId();
  const [freeChosen, setFreeChosen] = useState(false);
  const free = freeChosen || !PRESETS.includes(value);
  const selected = free ? "free" : value || "none";

  return (
    <FieldSet className="gap-2">
      <FieldLegend variant="label" className="text-[15px] sm:text-sm">
        性別
      </FieldLegend>
      <RadioGroup
        value={selected}
        onValueChange={(v) => {
          const next = String(v);
          setFreeChosen(next === "free");
          if (next !== "free") onChange(next === "none" ? "" : next);
        }}
        className="flex flex-wrap gap-x-5 gap-y-2"
      >
        {OPTIONS.map((o) => (
          <Field key={o.value} orientation="horizontal" className="w-auto">
            <RadioGroupItem value={o.value} id={`${id}-${o.value}`} />
            <FieldLabel htmlFor={`${id}-${o.value}`} className="py-1 text-base font-normal sm:py-0 sm:text-sm">
              {o.label}
            </FieldLabel>
          </Field>
        ))}
      </RadioGroup>
      {free && (
        <Input
          aria-label="性別（自由に記入）"
          className="h-11 text-base sm:h-9 sm:text-sm"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoFocus={freeChosen}
        />
      )}
      <FieldDescription>記入は任意です</FieldDescription>
    </FieldSet>
  );
}
