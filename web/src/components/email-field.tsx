"use client";

import { useId } from "react";
import { Autocomplete } from "@base-ui/react";
import { Mail } from "lucide-react";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";

// よく使われる順。@ の前を打つと上から6つを候補に出し、@ のあとを打ち始めると合うものに絞る
const DOMAINS = [
  "gmail.com", "yahoo.co.jp", "icloud.com", "outlook.jp", "outlook.com", "hotmail.com",
  "docomo.ne.jp", "au.com", "ezweb.ne.jp", "softbank.ne.jp", "i.softbank.jp", "ymobile.ne.jp",
];

function suggest(value: string) {
  const at = value.indexOf("@");
  const local = at < 0 ? value : value.slice(0, at);
  const typed = at < 0 ? "" : value.slice(at + 1).toLowerCase();
  if (!local.trim()) return [];
  return DOMAINS.filter((d) => d.startsWith(typed) && d !== typed)
    .slice(0, 6)
    .map((d) => `${local}@${d}`);
}

/** メールアドレス。打ち始めると「taro@gmail.com」のような候補が出て、押すと入る。一覧にないものはそのまま打てばよい */
export function EmailField({ label, description, value, onChange, autofill, className }: {
  label: string;
  description?: string;
  value: string;
  onChange: (value: string) => void;
  autofill: boolean;
  className?: string;
}) {
  const id = useId();
  const items = suggest(value);

  return (
    <Field className={className}>
      <FieldLabel htmlFor={id} className="text-[15px] sm:text-sm">
        {label}
      </FieldLabel>
      <Autocomplete.Root items={items} mode="none" value={value} onValueChange={onChange} openOnInputClick>
        <Autocomplete.InputGroup render={<InputGroup />}>
          <InputGroupAddon>
            <Mail />
          </InputGroupAddon>
          <Autocomplete.Input
            render={<InputGroupInput />}
            id={id}
            placeholder="taro@gmail.com"
            inputMode="email"
            autoComplete={autofill ? "email" : "off"}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
          />
        </Autocomplete.InputGroup>
        <Autocomplete.Portal>
          <Autocomplete.Positioner sideOffset={6} className="isolate z-50">
            <Autocomplete.Popup className="max-h-(--available-height) w-(--anchor-width) max-w-(--available-width) origin-(--transform-origin) overflow-hidden rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
              <Autocomplete.List className="max-h-[min(--spacing(72),var(--available-height))] scroll-py-1 overflow-y-auto overscroll-contain p-1 data-empty:p-0">
                {(item: string) => (
                  <Autocomplete.Item
                    key={item}
                    value={item}
                    className="flex w-full cursor-default items-center rounded-md px-2 py-2.5 text-base outline-hidden select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground sm:px-1.5 sm:py-1 sm:text-sm"
                  >
                    {item}
                  </Autocomplete.Item>
                )}
              </Autocomplete.List>
            </Autocomplete.Popup>
          </Autocomplete.Positioner>
        </Autocomplete.Portal>
      </Autocomplete.Root>
      {description && <FieldDescription>{description}</FieldDescription>}
    </Field>
  );
}
