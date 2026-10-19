"use client";

import { ja } from "react-day-picker/locale";
import { Calendar } from "@/components/ui/calendar";

const THIS_YEAR = new Date().getFullYear();

/** 日付欄のカレンダー。年と月はプルダウンで移れる。date-field から必要になったときだけ読み込む */
export default function DateCalendar({ selected, defaultMonth, onSelect }: {
  selected?: Date;
  defaultMonth?: Date;
  onSelect: (date: Date) => void;
}) {
  return (
    <Calendar
      mode="single"
      locale={ja}
      captionLayout="dropdown"
      startMonth={new Date(1940, 0)}
      endMonth={new Date(THIS_YEAR + 1, 11)}
      defaultMonth={selected ?? defaultMonth}
      selected={selected}
      onSelect={(d) => d && onSelect(d)}
    />
  );
}
