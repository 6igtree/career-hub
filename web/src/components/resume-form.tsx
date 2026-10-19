"use client";

import { useId } from "react";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldTitle } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { PhotoField } from "@/components/photo-field";
import { YearMonth } from "@/components/year-month";
import { blankEntry, blankJob, type Address, type Counts, type Layout } from "@/lib/resume";
import { updateResume, useResume } from "@/lib/store";

type TextFieldProps = Omit<React.ComponentProps<typeof Input>, "onChange"> & {
  label: string;
  description?: string;
  onChange: (value: string) => void;
};

function TextField({ label, description, className, onChange, ...props }: TextFieldProps) {
  const id = useId();
  return (
    <Field className={className}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input id={id} onChange={(e) => onChange(e.target.value)} {...props} />
      {description && <FieldDescription>{description}</FieldDescription>}
    </Field>
  );
}

function CountBadge({ n, max }: { n: number; max: number }) {
  return (
    <Badge variant={n > max ? "destructive" : "secondary"} className="tabular-nums">
      {n} / {max} 行
    </Badge>
  );
}

function RowActions({ label, index, count, onMove, onRemove }: {
  label: string;
  index: number;
  count: number;
  onMove: (to: number) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex justify-end gap-0.5">
      <Button type="button" variant="ghost" size="icon-sm" aria-label={`${label}を上へ`} disabled={index === 0} onClick={() => onMove(index - 1)}>
        <ChevronUp />
      </Button>
      <Button type="button" variant="ghost" size="icon-sm" aria-label={`${label}を下へ`} disabled={index === count - 1} onClick={() => onMove(index + 1)}>
        <ChevronDown />
      </Button>
      <Button type="button" variant="ghost" size="icon-sm" aria-label={`${label}を削除`} className="text-muted-foreground hover:text-destructive" onClick={onRemove}>
        <Trash2 />
      </Button>
    </div>
  );
}

function move<T>(list: T[], from: number, to: number) {
  if (to < 0 || to >= list.length) return;
  [list[from], list[to]] = [list[to], list[from]];
}

function AddressFields({ value, onChange, autofill }: { value: Address; onChange: (key: keyof Address, v: string) => void; autofill: boolean }) {
  const ac = (token: string) => (autofill ? token : "off");
  return (
    <FieldGroup className="grid gap-4 sm:grid-cols-2">
      <TextField label="郵便番号" value={value.postal} onChange={(v) => onChange("postal", v)} placeholder="700-0000" inputMode="numeric" autoComplete={ac("postal-code")} />
      <TextField label="電話" type="tel" value={value.phone} onChange={(v) => onChange("phone", v)} placeholder="090-0000-0000" autoComplete={ac("tel")} />
      <TextField label="住所" className="sm:col-span-2" value={value.address} onChange={(v) => onChange("address", v)} autoComplete={ac("street-address")} />
      <TextField label="住所のふりがな" className="sm:col-span-2" value={value.address_kana} onChange={(v) => onChange("address_kana", v)} />
      <TextField
        label="メール"
        type="email"
        className="sm:col-span-2"
        value={value.email}
        onChange={(v) => onChange("email", v)}
        autoComplete={ac("email")}
        description="様式にメール欄がないので、電話欄の下に入ります"
      />
    </FieldGroup>
  );
}

function EntryList({ list, label, placeholder }: { list: "education" | "licenses"; label: string; placeholder: string }) {
  const items = useResume()[list];
  return (
    <div className="flex flex-col gap-3">
      {items.map((item, i) => (
        <div
          key={i}
          className="grid grid-cols-[1fr_auto] items-center gap-2 rounded-lg border p-3 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:rounded-none sm:border-0 sm:p-0"
        >
          <YearMonth label={`${label}${i + 1}`} value={item.date} onChange={(v) => updateResume((r) => void (r[list][i].date = v))} />
          {/* スマホでは年月と操作ボタンを1行目に並べ、内容は2行目に置く */}
          <Input
            className="order-last col-span-2 sm:order-none sm:col-span-1"
            aria-label={`${label}${i + 1}の内容`}
            value={item.text}
            placeholder={placeholder}
            onChange={(e) => updateResume((r) => void (r[list][i].text = e.target.value))}
          />
          <RowActions
            label={`${label}${i + 1}`}
            index={i}
            count={items.length}
            onMove={(to) => updateResume((r) => move(r[list], i, to))}
            onRemove={() => updateResume((r) => void r[list].splice(i, 1))}
          />
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" className="self-start" onClick={() => updateResume((r) => void r[list].push(blankEntry()))}>
        <Plus data-icon="inline-start" />
        {label}を追加
      </Button>
    </div>
  );
}

function JobList() {
  const { jobs } = useResume();
  const set = (i: number, key: "company" | "from" | "to" | "leave_reason", v: string) => updateResume((r) => void (r.jobs[i][key] = v));
  return (
    <div className="flex flex-col gap-3">
      {jobs.map((job, i) => (
        <div key={i} className="flex flex-col gap-3 rounded-lg border p-3">
          <div className="flex items-center gap-2">
            <Input aria-label={`職歴${i + 1}の会社名`} placeholder="株式会社〇〇" value={job.company} onChange={(e) => set(i, "company", e.target.value)} />
            <RowActions
              label={`職歴${i + 1}`}
              index={i}
              count={jobs.length}
              onMove={(to) => updateResume((r) => move(r.jobs, i, to))}
              onRemove={() => updateResume((r) => void r.jobs.splice(i, 1))}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field>
              <FieldTitle>入社</FieldTitle>
              <YearMonth label={`職歴${i + 1}の入社`} value={job.from} onChange={(v) => set(i, "from", v)} />
            </Field>
            <Field>
              <FieldTitle>退社</FieldTitle>
              <YearMonth label={`職歴${i + 1}の退社`} value={job.to} onChange={(v) => set(i, "to", v)} />
              {!job.to && <FieldDescription>在職中は空けておくと「現在に至る」と入ります</FieldDescription>}
            </Field>
          </div>
          {job.to && <TextField label="退社理由" value={job.leave_reason} onChange={(v) => set(i, "leave_reason", v)} placeholder="一身上の都合により退社" />}
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" className="self-start" onClick={() => updateResume((r) => void r.jobs.push(blankJob()))}>
        <Plus data-icon="inline-start" />
        職歴を追加
      </Button>
    </div>
  );
}

export function ResumeForm({ counts, layout }: { counts: Counts | null; layout: Layout | null }) {
  const resume = useResume();
  const p = resume.profile;
  const setProfile = (key: keyof typeof p, v: string) => updateResume((r) => void (r.profile[key] = v));
  const motivationId = useId();
  const requestId = useId();

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>基本情報</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <FieldGroup className="grid gap-4 sm:grid-cols-2">
            <TextField label="氏名" value={p.name} onChange={(v) => setProfile("name", v)} placeholder="山田 太郎" autoComplete="name" />
            <TextField label="ふりがな" value={p.kana} onChange={(v) => setProfile("kana", v)} placeholder="やまだ たろう" />
            <TextField label="生年月日" type="date" value={p.birth} onChange={(v) => setProfile("birth", v)} autoComplete="bday" />
            <TextField label="性別（記入は任意）" value={p.gender} onChange={(v) => setProfile("gender", v)} />
            <TextField
              label="書類の日付"
              type="date"
              className="sm:col-span-2"
              value={resume.date}
              onChange={(v) => updateResume((r) => void (r.date = v))}
              description="提出する日。空けておくと今日の日付が入り、年齢もその日で計算します"
            />
          </FieldGroup>
          <Separator />
          <Field>
            <FieldTitle>写真</FieldTitle>
            <PhotoField photo={resume.photo} layout={layout} onChange={(v) => updateResume((r) => void (r.photo = v))} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>現住所</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <AddressFields value={p} onChange={setProfile} autofill />
          <Collapsible className="rounded-lg border">
            <CollapsibleTrigger className="group flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm font-medium">
              現住所以外に連絡を希望する場合の連絡先
              <ChevronDown className="size-4 text-muted-foreground transition-transform group-data-[panel-open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent className="border-t px-3 py-4">
              <AddressFields value={resume.contact} onChange={(key, v) => updateResume((r) => void (r.contact[key] = v))} autofill={false} />
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>学歴・職歴</CardTitle>
          <CardDescription>「学歴」「職歴」の見出しと最後の「以上」も1行ずつ使います</CardDescription>
          {counts && (
            <CardAction>
              <CountBadge n={counts.hist} max={counts.maxHist} />
            </CardAction>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <section className="flex flex-col gap-3">
            <h3 className="text-sm font-medium">学歴</h3>
            <EntryList list="education" label="学歴" placeholder="〇〇大学 工学部 情報工学科 入学" />
          </section>
          <Separator />
          <section className="flex flex-col gap-3">
            <h3 className="text-sm font-medium">職歴</h3>
            <JobList />
          </section>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>免許・資格</CardTitle>
          {counts && (
            <CardAction>
              <CountBadge n={counts.lic} max={counts.maxLic} />
            </CardAction>
          )}
        </CardHeader>
        <CardContent>
          <EntryList list="licenses" label="免許・資格" placeholder="普通自動車第一種運転免許 取得" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>志望動機・本人希望</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <Field>
            <FieldLabel htmlFor={motivationId}>志望の動機、特技、好きな学科、アピールポイントなど</FieldLabel>
            <Textarea
              id={motivationId}
              rows={8}
              value={resume.resume.motivation}
              onChange={(e) => updateResume((r) => void (r.resume.motivation = e.target.value))}
            />
            <FieldDescription>長い文章は、欄に収まるまで文字を小さくします</FieldDescription>
          </Field>
          <Field>
            <div className="flex items-center justify-between gap-2">
              <FieldLabel htmlFor={requestId}>本人希望記入欄</FieldLabel>
              {counts && <CountBadge n={counts.req} max={counts.maxReq} />}
            </div>
            <Textarea
              id={requestId}
              rows={4}
              placeholder="貴社規定に従います。"
              value={resume.resume.request}
              onChange={(e) => updateResume((r) => void (r.resume.request = e.target.value))}
            />
            <FieldDescription>特に希望がなければ「貴社規定に従います。」と書くのが一般的です</FieldDescription>
          </Field>
        </CardContent>
      </Card>
    </div>
  );
}
