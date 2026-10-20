"use client";

import { useId, useRef, useState } from "react";
import { AsYouType, getCountries, getCountryCallingCode, type CountryCode } from "libphonenumber-js/min";
import { ButtonGroup } from "@/components/ui/button-group";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";

const flag = (code: string) => String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
const names = new Intl.DisplayNames(["ja"], { type: "region", style: "short" }); // 「香港」「アメリカ」など短い呼び方
const collator = new Intl.Collator("ja");
const entry = (code: CountryCode) => ({ code, name: names.of(code) ?? code, dial: getCountryCallingCode(code) });
// 選ばれそうな国を先に並べる（漢字の国名は五十音順だと最後に回るため）
const TOP = (["JP", "US", "CN", "KR", "TW", "HK", "TH", "SG", "PH", "VN", "AU", "CA", "GB", "DE", "FR", "BR"] as const).map(entry);
const REST = getCountries()
  .filter((code) => !TOP.some((c) => c.code === code))
  .map(entry)
  .sort((a, b) => collator.compare(a.name, b.name));
// 閉じているときは「🇯🇵 +81」だけ出す
const ITEMS = [...TOP, ...REST].map((c) => ({ value: c.code, label: `${flag(c.code)} +${c.dial}` }));

function CountryItem({ c }: { c: ReturnType<typeof entry> }) {
  return (
    <SelectItem value={c.code}>
      <span className="flex-1">
        {flag(c.code)} {c.name}
      </span>
      <span className="text-muted-foreground">+{c.dial}</span>
    </SelectItem>
  );
}

// 日本は国内の書き方（090-1234-5678）、ほかの国は国番号付き（+1 415-555-2671）で持つ
function format(digits: string, country: CountryCode) {
  if (country === "JP") return digits && new AsYouType("JP").input(digits);
  const national = new AsYouType(country);
  national.input(digits); // 国内用の先頭の 0 などはここで外れる
  const nsn = national.getNumber()?.nationalNumber ?? "";
  if (!nsn) return "";
  const intl = new AsYouType().input(`+${getCountryCallingCode(country)}${nsn}`);
  const i = intl.indexOf(" ");
  return i < 0 ? intl : intl.slice(0, i + 1) + intl.slice(i + 1).replaceAll(" ", "-");
}

// 値から国を読み取る（国番号なしは日本、読めなければ undefined）
function countryOf(value: string): CountryCode | undefined {
  if (!value.startsWith("+")) return value ? "JP" : undefined;
  const t = new AsYouType();
  t.input(value);
  return t.getCountry();
}

/** 電話番号。国番号を選び（最初は日本）、数字を打つとハイフンが入る */
export function PhoneField({ label, value, onChange, autofill }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autofill: boolean;
}) {
  const id = useId();
  const group = useRef<HTMLDivElement>(null);
  const [picked, setPicked] = useState<CountryCode>("JP");
  const country = countryOf(value) ?? picked;
  const prefix = country === "JP" ? "" : `+${getCountryCallingCode(country)} `;
  const shown = value.startsWith(prefix) ? value.slice(prefix.length) : value;

  function change(raw: string) {
    const t = raw.normalize("NFKC").trim();
    if (t.startsWith("+")) {
      // 「+」から始まる番号（貼り付け・自動入力など）は国も合わせる
      const a = new AsYouType();
      a.input(t);
      const c = a.getCountry();
      const nsn = a.getNumber()?.nationalNumber ?? "";
      if (!c) return onChange(t);
      setPicked(c);
      return onChange(format(c === "JP" ? `0${nsn}` : nsn, c));
    }
    onChange(format(t.replace(/\D/g, ""), country));
  }

  function pick(c: CountryCode) {
    setPicked(c);
    onChange(format(shown.replace(/\D/g, ""), c));
  }

  return (
    <Field>
      <FieldLabel htmlFor={id} className="text-[15px] sm:text-sm">
        {label}
      </FieldLabel>
      <ButtonGroup ref={group} className="w-full">
        <Select items={ITEMS} value={country} onValueChange={(v) => pick(v as CountryCode)}>
          <SelectTrigger aria-label={`${label}の国番号`}>
            <SelectValue />
          </SelectTrigger>
          {/* 一覧は電話欄全体の下に同じ幅で出す */}
          <SelectContent anchor={group} align="start" alignItemWithTrigger={false}>
            {TOP.map((c) => (
              <CountryItem key={c.code} c={c} />
            ))}
            <SelectSeparator />
            {REST.map((c) => (
              <CountryItem key={c.code} c={c} />
            ))}
          </SelectContent>
        </Select>
        <Input
          id={id}
          type="tel"
          value={shown}
          // 変換中は書き換えず、確定してから整える
          onChange={(e) => ((e.nativeEvent as InputEvent).isComposing ? onChange(prefix + e.target.value) : change(e.target.value))}
          onCompositionEnd={(e) => change(e.currentTarget.value)}
          placeholder={country === "JP" ? "090-0000-0000" : undefined}
          autoComplete={autofill ? "tel" : "off"}
        />
      </ButtonGroup>
    </Field>
  );
}
