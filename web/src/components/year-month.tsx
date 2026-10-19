"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const THIS_YEAR = new Date().getFullYear();
const YEARS = [
  { label: "年", value: null },
  ...Array.from({ length: THIS_YEAR + 2 - 1950 }, (_, i) => String(THIS_YEAR + 1 - i)).map((y) => ({ label: `${y}年`, value: y })),
];
const MONTHS = [{ label: "月", value: null }, ...Array.from({ length: 12 }, (_, i) => ({ label: `${i + 1}月`, value: String(i + 1) }))];

function Choice({ items, value, onChange, label, className }: {
  items: { label: string; value: string | null }[];
  value: string;
  onChange: (v: string) => void;
  label: string;
  className: string;
}) {
  return (
    <Select items={items} value={value || null} onValueChange={(v) => onChange((v as string | null) ?? "")}>
      <SelectTrigger aria-label={label} className={className}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value ?? "none"} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** 年と月を選ぶ。値は "2014-04" の形。片方だけ選んだ途中の状態は "2014-" のように持つ */
export function YearMonth({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  const [y = "", m = ""] = (value || "").split("-");
  const month = m ? String(Number(m)) : "";
  const set = (year: string, mon: string) => onChange(year || mon ? `${year}-${mon ? mon.padStart(2, "0") : ""}` : "");

  return (
    <div className="flex gap-2">
      <Choice items={YEARS} value={y} onChange={(v) => set(v, month)} label={`${label}の年`} className="h-11 w-32 text-base sm:h-9 sm:w-28 sm:text-sm" />
      <Choice items={MONTHS} value={month} onChange={(v) => set(y, v)} label={`${label}の月`} className="h-11 w-24 text-base sm:h-9 sm:w-20 sm:text-sm" />
    </div>
  );
}
