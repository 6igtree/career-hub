"use client";

import { useId, useState } from "react";
import dynamic from "next/dynamic";
import { Award, Check, ChevronRight, GraduationCap, MapPin, MessageSquareText, Plus, Trash2, UserRound } from "lucide-react";
import { cn } from "cn";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldTitle } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText, InputGroupTextarea } from "@/components/ui/input-group";
import { Item, ItemActions, ItemContent, ItemDescription, ItemTitle } from "@/components/ui/item";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { DateField } from "@/components/date-field";
import { EditSheet } from "@/components/edit-sheet";
import { EmailField } from "@/components/email-field";
import { GenderField } from "@/components/gender-field";
import { PhotoField } from "@/components/photo-field";
import { YearMonth } from "@/components/year-month";
import { blankEntry, blankJob, byDate, formatYm, type Address, type Counts, type Layout, type Resume } from "@/lib/resume";
import { updateResume, useResume } from "@/lib/store";

// 入力欄の高さと文字サイズは components/ui 側でそろえる（スマホ 44px・16px／PC 36px・14px）
const LABEL = "text-[15px] sm:text-sm";

// 電話番号の部品は規則表が大きい（約 30KB）ので、現住所を開いたときに読み込む
const PhoneField = dynamic(() => import("@/components/phone-field").then((m) => m.PhoneField), {
  ssr: false,
  loading: () => (
    <Field>
      <FieldLabel className={LABEL}>電話</FieldLabel>
      <Input disabled />
    </Field>
  ),
});

type TextFieldProps = Omit<React.ComponentProps<typeof Input>, "onChange"> & {
  label: string;
  description?: string;
  addon?: React.ReactNode; // 先頭に置く記号やアイコン（〒 など）
  format?: (value: string) => string; // 打った値を整える（郵便番号のハイフンなど）
  onChange: (value: string) => void;
};

function TextField({ label, description, addon, format, className, onChange, ...props }: TextFieldProps) {
  const id = useId();
  // 変換中に書き換えると日本語入力が壊れるので、確定してから整える
  const input = {
    id,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      onChange(format && !(e.nativeEvent as InputEvent).isComposing ? format(e.target.value) : e.target.value),
    onCompositionEnd: format && ((e: React.CompositionEvent<HTMLInputElement>) => onChange(format(e.currentTarget.value))),
    ...props,
  };
  return (
    <Field className={className}>
      <FieldLabel htmlFor={id} className={LABEL}>
        {label}
      </FieldLabel>
      {addon ? (
        <InputGroup>
          <InputGroupAddon>{addon}</InputGroupAddon>
          <InputGroupInput {...input} />
        </InputGroup>
      ) : (
        <Input {...input} />
      )}
      {description && <FieldDescription>{description}</FieldDescription>}
    </Field>
  );
}

// 郵便番号は7桁そろったらハイフンを入れる（3桁目で入れると海外の5桁などが崩れる）
function formatPostal(v: string) {
  const d = v.normalize("NFKC").replace(/[〒\s\-‐‑‒–—―−ー]/g, "");
  return /^\d{7}$/.test(d) ? `${d.slice(0, 3)}-${d.slice(3)}` : v;
}

function AddressFields({ value, onChange, autofill }: { value: Address; onChange: (key: keyof Address, v: string) => void; autofill: boolean }) {
  const ac = (token: string) => (autofill ? token : "off");
  return (
    <FieldGroup className="grid gap-5 sm:grid-cols-2 sm:gap-4">
      <TextField
        label="郵便番号"
        addon={<InputGroupText>〒</InputGroupText>}
        value={value.postal}
        format={formatPostal}
        onChange={(v) => onChange("postal", v)}
        placeholder="700-0000"
        inputMode="numeric"
        autoComplete={ac("postal-code")}
      />
      <PhoneField label="電話" value={value.phone} onChange={(v) => onChange("phone", v)} autofill={autofill} />
      <TextField label="住所" className="sm:col-span-2" value={value.address} onChange={(v) => onChange("address", v)} autoComplete={ac("street-address")} />
      <TextField label="住所のふりがな" className="sm:col-span-2" value={value.address_kana} onChange={(v) => onChange("address_kana", v)} />
      <EmailField
        label="メール"
        className="sm:col-span-2"
        value={value.email}
        onChange={(v) => onChange("email", v)}
        autofill={autofill}
        description="様式にメール欄がないので、電話欄の下に入ります"
      />
    </FieldGroup>
  );
}

/** 一覧の1行。押すと編集画面が開く */
function EntryRow({ title, description, onClick, warn }: { title: string; description: string; onClick: () => void; warn?: boolean }) {
  return (
    <Item variant="outline" className="bg-card text-left hover:bg-muted/60" render={<button type="button" onClick={onClick} />}>
      <ItemContent className="wrap-anywhere">
        <ItemTitle className="text-base sm:text-sm">{title}</ItemTitle>
        <ItemDescription className={cn(warn && "text-destructive")}>{description}</ItemDescription>
      </ItemContent>
      <ItemActions>
        <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
      </ItemActions>
    </Item>
  );
}

function SheetFooter({ onRemove, onDone }: { onRemove: () => void; onDone: () => void }) {
  return (
    <>
      <Button variant="ghost" className="h-11 text-destructive sm:h-9" onClick={onRemove}>
        <Trash2 data-icon="inline-start" />
        削除
      </Button>
      <Button className="h-11 flex-1 sm:h-9 sm:flex-none" onClick={onDone}>
        完了
      </Button>
    </>
  );
}

/** 学歴・免許資格の一覧。1件ずつ編集画面で直し、閉じると年月の順に並べ直す */
function EntryList({ list, label, placeholder }: { list: "education" | "licenses"; label: string; placeholder: string }) {
  const items = useResume()[list];
  const [editing, setEditing] = useState<number | null>(null);
  const item = editing === null ? undefined : items[editing];
  const close = () => {
    updateResume((r) => void (r[list] = byDate(r[list].filter((x) => x.date || x.text.trim()), (x) => x.date)));
    setEditing(null);
  };

  return (
    <div className="flex flex-col gap-2">
      {items.length === 0 && <p className="py-1 text-sm text-muted-foreground">まだありません</p>}
      {items.map((x, i) => (
        <EntryRow
          key={i}
          title={x.text || "（内容が未入力）"}
          description={formatYm(x.date) || "年月が未入力"}
          warn={!formatYm(x.date)}
          onClick={() => setEditing(i)}
        />
      ))}
      <Button
        variant="outline"
        className="mt-1 h-11 w-full border-dashed sm:h-9"
        onClick={() => {
          updateResume((r) => void r[list].push(blankEntry()));
          setEditing(items.length);
        }}
      >
        <Plus data-icon="inline-start" />
        {label}を追加
      </Button>
      {item && editing !== null && (
        <EditSheet
          open
          onOpenChange={(open) => !open && close()}
          title={label}
          footer={
            <SheetFooter
              onDone={close}
              onRemove={() => {
                updateResume((r) => void r[list].splice(editing, 1));
                setEditing(null);
              }}
            />
          }
        >
          <FieldGroup className="gap-5">
            <Field>
              <FieldTitle className={LABEL}>年月</FieldTitle>
              <YearMonth label={label} value={item.date} onChange={(v) => updateResume((r) => void (r[list][editing].date = v))} />
            </Field>
            <TextField label="内容" value={item.text} onChange={(v) => updateResume((r) => void (r[list][editing].text = v))} placeholder={placeholder} />
          </FieldGroup>
        </EditSheet>
      )}
    </div>
  );
}

function JobList() {
  const { jobs } = useResume();
  const [editing, setEditing] = useState<number | null>(null);
  const job = editing === null ? undefined : jobs[editing];
  const set = (key: "company" | "from" | "to" | "leave_reason", v: string) =>
    updateResume((r) => void (editing !== null && (r.jobs[editing][key] = v)));
  const close = () => {
    updateResume((r) => void (r.jobs = byDate(r.jobs.filter((x) => x.company.trim() || x.from), (x) => x.from)));
    setEditing(null);
  };

  return (
    <div className="flex flex-col gap-2">
      {jobs.length === 0 && <p className="py-1 text-sm text-muted-foreground">職歴がなければ空けておけます</p>}
      {jobs.map((x, i) => (
        <EntryRow
          key={i}
          title={x.company || "（会社名が未入力）"}
          description={
            formatYm(x.from) ? `${formatYm(x.from)} 入社 〜 ${x.to ? `${formatYm(x.to)} 退社` : "在職中"}` : "入社の年月が未入力"
          }
          warn={!formatYm(x.from)}
          onClick={() => setEditing(i)}
        />
      ))}
      <Button
        variant="outline"
        className="mt-1 h-11 w-full border-dashed sm:h-9"
        onClick={() => {
          updateResume((r) => void r.jobs.push(blankJob()));
          setEditing(jobs.length);
        }}
      >
        <Plus data-icon="inline-start" />
        職歴を追加
      </Button>
      {job && editing !== null && (
        <EditSheet
          open
          onOpenChange={(open) => !open && close()}
          title="職歴"
          footer={
            <SheetFooter
              onDone={close}
              onRemove={() => {
                updateResume((r) => void r.jobs.splice(editing, 1));
                setEditing(null);
              }}
            />
          }
        >
          <FieldGroup className="gap-5">
            <TextField label="会社名" value={job.company} onChange={(v) => set("company", v)} placeholder="株式会社〇〇" />
            <Field>
              <FieldTitle className={LABEL}>入社</FieldTitle>
              <YearMonth label="入社" value={job.from} onChange={(v) => set("from", v)} />
            </Field>
            <Field>
              <FieldTitle className={LABEL}>退社</FieldTitle>
              <YearMonth label="退社" value={job.to} onChange={(v) => set("to", v)} />
              <FieldDescription>在職中は空けておくと「現在に至る」と入ります</FieldDescription>
            </Field>
            {job.to && <TextField label="退社理由" value={job.leave_reason} onChange={(v) => set("leave_reason", v)} placeholder="一身上の都合により退社" />}
          </FieldGroup>
        </EditSheet>
      )}
    </div>
  );
}

const has = (s: string) => s.trim().length > 0;

/** 各項目の主な欄が埋まっているか（目安。保存は止めない） */
function sectionStatus(r: Resume) {
  const p = r.profile;
  return {
    basic: has(p.name) && has(p.kana) && has(p.birth),
    address: has(p.postal) && has(p.address) && has(p.phone),
    history: r.education.some((x) => has(x.text)),
    licenses: r.licenses.some((x) => has(x.text)),
    motivation: has(r.resume.motivation),
  };
}

/** 閉じていても中身が分かるよう、見出しの下に要約を出す */
function SectionTrigger({ icon: Icon, title, summary, done, alert }: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  summary: string;
  done: boolean;
  alert?: boolean;
}) {
  return (
    <span className="flex min-w-0 flex-1 items-center gap-3">
      <span
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-full",
          done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
        )}
      >
        {done ? <Check className="size-4" aria-label="入力済み" /> : <Icon className="size-4" />}
      </span>
      <span className="min-w-0">
        <span className="block text-base font-semibold">{title}</span>
        <span className={cn("block truncate text-sm font-normal text-muted-foreground", alert && "text-destructive")}>{summary}</span>
      </span>
    </span>
  );
}

export function ResumeForm({ counts, layout }: { counts: Counts | null; layout: Layout | null }) {
  const resume = useResume();
  const p = resume.profile;
  const status = sectionStatus(resume);
  const setProfile = (key: keyof typeof p, v: string) => updateResume((r) => void (r.profile[key] = v));
  const birthId = useId();
  const dateId = useId();
  const motivationId = useId();
  const requestId = useId();
  const motivationLength = [...resume.resume.motivation.replace(/\s/g, "")].length;
  const [by, bm, bd] = p.birth.split("-").map(Number);
  const histOver = counts ? counts.hist > counts.maxHist : false;
  const licOver = counts ? counts.lic > counts.maxLic : false;
  const reqOver = counts ? counts.req > counts.maxReq : false;
  const filledCount = (list: { text: string }[]) => list.filter((x) => has(x.text)).length;

  return (
    <Accordion multiple defaultValue={["basic"]} className="rounded-xl bg-card px-4 ring-1 ring-foreground/10 sm:px-5">
      <AccordionItem value="basic" id="basic">
        <AccordionTrigger className="items-center py-4 hover:no-underline">
          <SectionTrigger
            icon={UserRound}
            title="基本情報"
            summary={p.name ? `${p.name}${p.birth ? `・${by}年${bm}月${bd}日生` : ""}` : "氏名・生年月日・写真など"}
            done={status.basic}
          />
        </AccordionTrigger>
        <AccordionContent>
          <div className="flex flex-col gap-6 pt-1 pb-4">
            <FieldGroup className="grid gap-5 sm:grid-cols-2 sm:gap-4">
              <TextField label="氏名" value={p.name} onChange={(v) => setProfile("name", v)} placeholder="山田 太郎" autoComplete="name" />
              <TextField label="ふりがな" value={p.kana} onChange={(v) => setProfile("kana", v)} placeholder="やまだ たろう" />
              <Field>
                <FieldLabel htmlFor={birthId} className={LABEL}>
                  生年月日
                </FieldLabel>
                <DateField
                  id={birthId}
                  value={p.birth}
                  onChange={(v) => setProfile("birth", v)}
                  placeholder="選んでください"
                  initialMonth={new Date(new Date().getFullYear() - 25, 0)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor={dateId} className={LABEL}>
                  書類の日付
                </FieldLabel>
                <DateField
                  id={dateId}
                  value={resume.date}
                  onChange={(v) => updateResume((r) => void (r.date = v))}
                  placeholder="今日の日付"
                  clearLabel="今日の日付にする"
                />
                <FieldDescription>空けておくと今日の日付になります</FieldDescription>
              </Field>
            </FieldGroup>
            <GenderField value={p.gender} onChange={(v) => setProfile("gender", v)} />
            <Separator />
            <Field>
              <FieldTitle className={LABEL}>写真</FieldTitle>
              <PhotoField photo={resume.photo} layout={layout} onChange={(v) => updateResume((r) => void (r.photo = v))} />
            </Field>
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="address" id="address">
        <AccordionTrigger className="items-center py-4 hover:no-underline">
          <SectionTrigger icon={MapPin} title="現住所" summary={p.address || "住所・電話・メール"} done={status.address} />
        </AccordionTrigger>
        <AccordionContent>
          <div className="flex flex-col gap-6 pt-1 pb-4">
            <AddressFields value={p} onChange={setProfile} autofill />
            <Collapsible className="rounded-lg border">
              <CollapsibleTrigger className="group flex min-h-11 w-full items-center justify-between gap-2 px-3 py-2 text-left text-base font-medium sm:min-h-9 sm:text-sm">
                現住所以外に連絡を希望する場合
                <ChevronRight className="size-4 text-muted-foreground transition-transform group-data-[panel-open]:rotate-90" />
              </CollapsibleTrigger>
              <CollapsibleContent className="border-t px-3 py-4">
                <AddressFields value={resume.contact} onChange={(key, v) => updateResume((r) => void (r.contact[key] = v))} autofill={false} />
              </CollapsibleContent>
            </Collapsible>
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="history" id="history">
        <AccordionTrigger className="items-center py-4 hover:no-underline">
          <SectionTrigger
            icon={GraduationCap}
            title="学歴・職歴"
            summary={`学歴 ${filledCount(resume.education)}件・職歴 ${resume.jobs.filter((x) => has(x.company)).length}件${
              counts ? `（${counts.hist} / ${counts.maxHist} 行）` : ""
            }`}
            done={status.history}
            alert={histOver}
          />
        </AccordionTrigger>
        <AccordionContent>
          <div className="flex flex-col gap-6 pt-1 pb-4">
            <p className="text-sm text-muted-foreground">年月の古い順に並びます。「学歴」「職歴」の見出しと最後の「以上」も1行ずつ使います。</p>
            <section className="flex flex-col gap-2">
              <h3 className="text-sm font-semibold">学歴</h3>
              <EntryList list="education" label="学歴" placeholder="〇〇大学 工学部 情報工学科 卒業" />
            </section>
            <section className="flex flex-col gap-2">
              <h3 className="text-sm font-semibold">職歴</h3>
              <JobList />
            </section>
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="licenses" id="licenses">
        <AccordionTrigger className="items-center py-4 hover:no-underline">
          <SectionTrigger
            icon={Award}
            title="免許・資格"
            summary={filledCount(resume.licenses) ? `${filledCount(resume.licenses)}件${counts ? `（${counts.lic} / ${counts.maxLic} 行）` : ""}` : "なければ空けておけます"}
            done={status.licenses}
            alert={licOver}
          />
        </AccordionTrigger>
        <AccordionContent>
          <div className="pt-1 pb-4">
            <EntryList list="licenses" label="免許・資格" placeholder="普通自動車第一種運転免許 取得" />
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="motivation" id="motivation">
        <AccordionTrigger className="items-center py-4 hover:no-underline">
          <SectionTrigger
            icon={MessageSquareText}
            title="志望動機・本人希望"
            summary={resume.resume.motivation.trim() ? `志望動機 ${motivationLength} 文字` : "志望動機と本人希望"}
            done={status.motivation}
            alert={reqOver}
          />
        </AccordionTrigger>
        <AccordionContent>
          <div className="flex flex-col gap-6 pt-1 pb-4">
            <Field>
              <FieldLabel htmlFor={motivationId} className={LABEL}>
                志望の動機、特技、好きな学科、アピールポイントなど
              </FieldLabel>
              <InputGroup>
                <InputGroupTextarea
                  id={motivationId}
                  rows={8}
                  value={resume.resume.motivation}
                  onChange={(e) => updateResume((r) => void (r.resume.motivation = e.target.value))}
                />
                <InputGroupAddon align="block-end">
                  <InputGroupText className="ml-auto tabular-nums">{motivationLength} 文字</InputGroupText>
                </InputGroupAddon>
              </InputGroup>
              <FieldDescription>長い文章は欄に合わせて文字を小さくします</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor={requestId} className={cn(LABEL, "w-full")}>
                本人希望記入欄
                {counts && (
                  <span className={cn("ml-auto font-normal text-muted-foreground tabular-nums", reqOver && "text-destructive")}>
                    {counts.req} / {counts.maxReq} 行
                  </span>
                )}
              </FieldLabel>
              <Textarea
                id={requestId}
                rows={4}
                placeholder="貴社規定に従います。"
                value={resume.resume.request}
                onChange={(e) => updateResume((r) => void (r.resume.request = e.target.value))}
              />
              <FieldDescription>特になければ「貴社規定に従います。」と書くのが一般的です</FieldDescription>
            </Field>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
