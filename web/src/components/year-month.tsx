"use client";

import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";

const THIS_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: THIS_YEAR + 2 - 1950 }, (_, i) => String(THIS_YEAR + 1 - i));
const MONTHS = Array.from({ length: 12 }, (_, i) => String(i + 1));

/**
 * 年と月を選ぶ。値は "2014-04" の形。片方だけ選んだ途中の状態は "2014-" のように持つ。
 * スマホでは端末の選択画面（ドラム）が出るので、ブラウザの月入力より選びやすい
 */
export function YearMonth({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  const [y = "", m = ""] = (value || "").split("-");
  const month = m ? String(Number(m)) : "";
  const set = (year: string, mon: string) => onChange(year || mon ? `${year}-${mon ? mon.padStart(2, "0") : ""}` : "");

  return (
    <div className="flex gap-1.5">
      <NativeSelect aria-label={`${label}の年`} value={y} onChange={(e) => set(e.target.value, month)} className="w-24">
        <NativeSelectOption value="">年</NativeSelectOption>
        {YEARS.map((v) => (
          <NativeSelectOption key={v} value={v}>
            {v}年
          </NativeSelectOption>
        ))}
      </NativeSelect>
      <NativeSelect aria-label={`${label}の月`} value={month} onChange={(e) => set(y, e.target.value)} className="w-20">
        <NativeSelectOption value="">月</NativeSelectOption>
        {MONTHS.map((v) => (
          <NativeSelectOption key={v} value={v}>
            {v}月
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </div>
  );
}
