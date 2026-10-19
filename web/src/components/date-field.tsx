"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// カレンダーは開いたときに初めて使うので後から読み込む。欄に触れた時点で先読みして待たせない
const loadCalendar = () => import("@/components/date-calendar");
const DateCalendar = dynamic(loadCalendar, { ssr: false, loading: () => <div className="h-80 w-64" /> });

const parse = (s: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || "");
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : undefined;
};
const format = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/**
 * 日付を選ぶ（値は "1995-04-01" の形）。押すとカレンダーが開き、年と月はプルダウンで一気に移れる。
 * clearLabel を渡すと、日付を空に戻すボタンを出す
 */
export function DateField({
  id,
  value,
  onChange,
  placeholder,
  initialMonth,
  clearLabel,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  initialMonth?: Date; // 未入力のときに最初に開く月
  clearLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const date = parse(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            id={id}
            variant="outline"
            className="h-11 w-full justify-start bg-transparent text-base font-normal sm:h-9 sm:text-sm"
            onPointerEnter={loadCalendar}
            onFocus={loadCalendar}
          />
        }
      >
        <CalendarIcon data-icon="inline-start" className="text-muted-foreground" />
        {date ? (
          `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
        ) : (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <DateCalendar
          selected={date}
          defaultMonth={initialMonth}
          onSelect={(d) => {
            onChange(format(d));
            setOpen(false);
          }}
        />
        {clearLabel && value && (
          <div className="border-t p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
            >
              {clearLabel}
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
