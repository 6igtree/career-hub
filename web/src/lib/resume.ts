// 履歴書のデータと、厚生労働省履歴書様式例の公式 PDF への書き込み
import type { PDFFont, PDFImage, PDFPage } from "pdf-lib";

export type Entry = { date: string; text: string };
export type Job = { company: string; from: string; to: string; leave_reason: string };
export type Address = { postal: string; address: string; address_kana: string; phone: string; email: string };
export type Resume = {
  date: string; // 書類の日付（YYYY-MM-DD）。空なら今日
  profile: Address & { name: string; kana: string; birth: string; gender: string };
  contact: Address; // 現住所以外に連絡を希望する場合だけ
  education: Entry[];
  jobs: Job[];
  licenses: Entry[];
  resume: { motivation: string; request: string };
  photo: string; // 写真欄の比率に切り抜いて縮小した JPEG の data URL
};

const blankAddress = (): Address => ({ postal: "", address: "", address_kana: "", phone: "", email: "" });
export const blankEntry = (): Entry => ({ date: "", text: "" });
export const blankJob = (): Job => ({ company: "", from: "", to: "", leave_reason: "一身上の都合により退社" });

export const emptyResume = (): Resume => ({
  date: "",
  profile: { name: "", kana: "", birth: "", gender: "", ...blankAddress() },
  contact: blankAddress(),
  education: [],
  jobs: [],
  licenses: [],
  resume: { motivation: "", request: "" },
  photo: "",
});

export const SAMPLE: Resume = {
  ...emptyResume(),
  profile: {
    name: "山田 太郎", kana: "やまだ たろう", birth: "1995-04-01", gender: "", postal: "700-0000",
    address: "岡山県岡山市北区〇〇町1-2-3", address_kana: "おかやまけんおかやましきたく〇〇ちょう",
    phone: "090-0000-0000", email: "taro@example.com",
  },
  education: [
    { date: "2011-04", text: "〇〇県立〇〇高等学校 入学" },
    { date: "2014-03", text: "〇〇県立〇〇高等学校 卒業" },
    { date: "2014-04", text: "〇〇大学 工学部 情報工学科 入学" },
    { date: "2018-03", text: "〇〇大学 工学部 情報工学科 卒業" },
  ],
  jobs: [{ company: "株式会社〇〇", from: "2018-04", to: "", leave_reason: "一身上の都合により退社" }],
  licenses: [
    { date: "2015-08", text: "普通自動車第一種運転免許 取得" },
    { date: "2019-04", text: "基本情報技術者試験 合格" },
  ],
  resume: { motivation: "志望動機・自己PRをここに書く。\n改行はそのまま反映される。", request: "貴社規定に従います。" },
};

/** 読み込んだデータ（古い形式や欠けたものを含む）を、すべての項目がそろった Resume にする */
export function toResume(data: unknown): Resume {
  const e = emptyResume();
  if (!data || typeof data !== "object") return e;
  const d = data as Partial<Resume>;
  const list = <T extends object>(v: unknown, blank: () => T): T[] =>
    Array.isArray(v) ? v.filter((x) => x && typeof x === "object").map((x) => ({ ...blank(), ...x })) : [];
  return {
    date: typeof d.date === "string" ? d.date : "",
    profile: { ...e.profile, ...d.profile },
    contact: { ...e.contact, ...d.contact },
    education: list(d.education, blankEntry),
    jobs: list(d.jobs, blankJob),
    licenses: list(d.licenses, blankEntry),
    resume: { ...e.resume, ...d.resume },
    photo: typeof d.photo === "string" ? d.photo : "",
  };
}

// ---- 文字を置く位置（form/layout.json。コマンド版と共通） ----

type Box = [number, number, number, number];
type FieldSpec = {
  box: Box;
  align?: "c" | "r";
  size?: number;
  wrap?: boolean;
  top?: boolean;
  lineHeight?: number;
  lineHeightPt?: number;
  rows?: number;
};
export type Layout = {
  a4Shift: [number, number];
  photo: Box;
  fields: Record<string, FieldSpec>;
  contactOffset: number;
  history: { left: number[]; right: number[] };
  licenses: number[];
  columns: { left: Box; right: Box };
  rowPadding: [number, number];
};

type TextItem = Omit<FieldSpec, "align"> & { box: Box; text: string; size: number; align?: "" | "c" | "r" };
type Item = TextItem | { photo: true; box: Box };
type Row = [date: string, text: string, align: "" | "c" | "r"];

const str = (v: unknown) => String(v ?? "").replace(/\r/g, "");

export function ym(s: string): [string, string] {
  const m = /^(\d{4})-(\d{1,2})$/.exec(s || "");
  return m ? [m[1], String(Number(m[2]))] : ["", ""];
}

export function documentDate(d: Resume): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d.date || "");
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date();
}

function age(birth: string, t: Date) {
  const [y, m, d] = birth.split("-").map(Number);
  const before = t.getMonth() + 1 < m || (t.getMonth() + 1 === m && t.getDate() < d);
  return t.getFullYear() - y - (before ? 1 : 0);
}

const filled = <T extends Record<string, string>>(list: T[], keys: (keyof T)[]) =>
  list.filter((x) => keys.some((k) => str(x[k]).trim()));

function history(d: Resume): Row[] {
  const rows: Row[] = [["", "学歴", "c"], ...filled(d.education, ["date", "text"]).map((x): Row => [x.date, x.text, ""])];
  rows.push(["", "職歴", "c"]);
  for (const j of filled(d.jobs, ["company", "from"])) {
    rows.push([j.from, `${j.company} 入社`, ""]);
    rows.push(j.to ? [j.to, `${j.company} ${j.leave_reason || "退社"}`, ""] : ["", "現在に至る", ""]);
  }
  rows.push(["", "以上", "r"]);
  return rows;
}

function field(L: Layout, name: string, text: unknown, dy = 0): TextItem {
  const f = L.fields[name];
  const [x0, y0, x1, y1] = f.box;
  return { ...f, box: [x0, y0 + dy, x1, y1 + dy], text: str(text), size: f.size ?? 11 };
}

function rows(L: Layout, items: Row[], lines: number[], [cy, cm, ct, cr]: Box): TextItem[] {
  const [padL, padR] = L.rowPadding;
  return items.flatMap(([date, text, align], i): TextItem[] => {
    const [y, m] = ym(date);
    const [y0, y1] = [lines[i], lines[i + 1]];
    return [
      { box: [cy, y0, cm, y1], text: y, size: 11, align: "c" },
      { box: [cm, y0, ct, y1], text: m, size: 11, align: "c" },
      { box: [ct + padL, y0, cr - padR, y1], text: str(text), size: 11, align },
    ];
  });
}

export type Counts = { hist: number; maxHist: number; lic: number; maxLic: number; req: number; maxReq: number };

/** A3 版の座標で、左ページと右ページに置く内容を返す。様式に入りきらない行は errors に入れる */
export function layoutResume(d: Resume, L: Layout, today: Date) {
  const p = d.profile;
  const [by, bm, bd] = (p.birth || "").split("-");
  const left: Item[] = [
    field(L, "dateYear", today.getFullYear()),
    field(L, "dateMonth", today.getMonth() + 1),
    field(L, "dateDay", today.getDate()),
    field(L, "kana", p.kana),
    field(L, "name", p.name),
    field(L, "birthYear", by),
    field(L, "birthMonth", bm ? Number(bm) : ""),
    field(L, "birthDay", bd ? Number(bd) : ""),
    field(L, "age", p.birth ? age(p.birth, today) : ""),
    field(L, "gender", p.gender),
  ];
  if (d.photo) left.push({ photo: true, box: L.photo });
  for (const [dy, a] of [[0, p], [L.contactOffset, d.contact]] as const) {
    left.push(
      field(L, "addressKana", a.address_kana, dy),
      field(L, "postal", a.postal, dy),
      field(L, "address", a.address, dy),
      field(L, "phone", a.phone, dy),
      field(L, "email", a.email, dy),
    );
  }

  const hist = history(d);
  const lic = filled(d.licenses, ["date", "text"]).map((x): Row => [x.date, x.text, ""]);
  const request = str(d.resume.request).trim();
  const n = L.history.left.length - 1;
  const counts: Counts = {
    hist: hist.length,
    maxHist: n + L.history.right.length - 1,
    lic: lic.length,
    maxLic: L.licenses.length - 1,
    req: request ? request.split("\n").length : 0,
    maxReq: L.fields.request.rows ?? 4,
  };
  const errors: string[] = [];
  if (counts.hist > counts.maxHist) errors.push(`学歴・職歴が${counts.hist}行あります。様式に入るのは${counts.maxHist}行までです`);
  if (counts.lic > counts.maxLic) errors.push(`免許・資格が${counts.lic}行あります。様式に入るのは${counts.maxLic}行までです`);
  if (counts.req > counts.maxReq) errors.push(`本人希望記入欄が${counts.req}行あります。様式に入るのは${counts.maxReq}行までです`);

  left.push(...rows(L, hist.slice(0, n), L.history.left, L.columns.left));
  const right: Item[] = [
    ...rows(L, hist.slice(n, counts.maxHist), L.history.right, L.columns.right),
    ...rows(L, lic.slice(0, counts.maxLic), L.licenses, L.columns.right),
    field(L, "motivation", str(d.resume.motivation).trim()),
    field(L, "request", request),
  ];
  return { left, right, errors, counts };
}

// ---- PDF への書き込み ----

const NO_LINE_START = "、。，．・：；？！ー）」』】〕〉》’”!?),."; // 行頭に来ないよう前の行に残す文字
const charWidths = new Map<string, number>(); // 1pt あたりの文字幅。和文は詰めないので文字ごとの幅の合計で測れる

function charW(font: PDFFont, ch: string) {
  let w = charWidths.get(ch);
  if (w === undefined) charWidths.set(ch, (w = font.widthOfTextAtSize(ch, 1)));
  return w;
}

const textW = (font: PDFFont, s: string, size: number) => [...s].reduce((sum, ch) => sum + charW(font, ch), 0) * size;

function wrap(font: PDFFont, text: string, size: number, maxW: number) {
  const out: string[] = [];
  for (const para of text.split("\n")) {
    let line = "";
    let w = 0;
    for (const ch of para) {
      const cw = charW(font, ch) * size;
      if (line && w + cw > maxW && !NO_LINE_START.includes(ch)) {
        out.push(line);
        line = "";
        w = 0;
      }
      line += ch;
      w += cw;
    }
    out.push(line);
  }
  return out;
}

/** 欄に収まるまで文字を縮め、各行の位置（ベースライン。A3 版の上からの距離）を返す */
function fit(b: TextItem, font: PDFFont) {
  const [x0, y0, x1, y1] = b.box;
  const [w, h] = [x1 - x0, y1 - y0];
  const asc = font.heightAtSize(1, { descender: false });
  const em = font.heightAtSize(1);
  let size = b.size;
  let lines: string[];
  let lineH: number;
  if (b.wrap) {
    for (;; size -= 0.25) {
      lines = wrap(font, b.text, size, w);
      lineH = b.lineHeightPt ?? size * (b.lineHeight ?? 1.3);
      if (lines.length * lineH <= h + 0.01 || size <= 4) break;
    }
  } else {
    lines = [b.text.replace(/\n/g, " ")];
    const tw = textW(font, lines[0], size);
    if (tw > w) size *= w / tw;
    lineH = h;
  }
  const top = b.top ? y0 : y0 + Math.max(0, (h - lines.length * lineH) / 2);
  return lines.map((s, i) => {
    const tw = textW(font, s, size);
    const x = b.align === "r" ? x1 - tw : b.align === "c" ? x0 + (w - tw) / 2 : x0;
    return { s, x, y: top + i * lineH + (lineH - em * size) / 2 + asc * size, size };
  });
}

function draw(page: PDFPage, items: Item[], dx: number, font: PDFFont, photo: PDFImage | null) {
  const H = page.getHeight();
  for (const b of items) {
    const [x0, y0, x1, y1] = b.box;
    if ("photo" in b) {
      if (photo) page.drawImage(photo, { x: x0 + dx, y: H - y1, width: x1 - x0, height: y1 - y0 });
    } else if (b.text.trim()) {
      for (const t of fit(b, font)) page.drawText(t.s, { x: t.x + dx, y: H - t.y, size: t.size, font });
    }
  }
}

export type Assets = { a4: Uint8Array; a3: Uint8Array; font: Uint8Array; layout: Layout; charset: Set<number> };

async function fetchOk(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} を読み込めません（${res.status}）`);
  return res;
}

/** 本文を読みながら進み具合（0〜1）を知らせる。圧縮されて届くと早めに 1 になる */
async function readWithProgress(res: Response, onProgress?: (ratio: number) => void) {
  const total = Number(res.headers.get("content-length")) || 0;
  if (!res.body || !total || !onProgress) return new Uint8Array(await res.arrayBuffer());
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let got = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    got += value.length;
    onProgress(Math.min(1, got / total));
  }
  const out = new Uint8Array(got);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.length;
  }
  return out;
}

/** 公式 PDF・配置データ・フォント（約 7.8MB）を読み込む */
export async function loadAssets(onProgress?: (ratio: number) => void): Promise<Assets> {
  const bytes = async (url: string) => new Uint8Array(await (await fetchOk(url)).arrayBuffer());
  const [a4, a3, layout, font, fontkit] = await Promise.all([
    bytes("/form/kouroushourirekishoA4.pdf"),
    bytes("/form/kouroushourirekisho.pdf"),
    fetchOk("/form/layout.json").then((r) => r.json() as Promise<Layout>),
    fetchOk("/fonts/ipaexm.ttf").then((r) => readWithProgress(r, onProgress)),
    import("@pdf-lib/fontkit").then((m) => m.default),
  ]);
  return { a4, a3, layout, font, charset: new Set(fontkit.create(font).characterSet) };
}

/** フォントにない文字（PDF では表示されない）を返す */
export function missingChars(d: Resume, charset: Set<number>) {
  const text = JSON.stringify({ ...d, photo: "" });
  return [...new Set([...text].filter((ch) => ch.trim() && !charset.has(ch.codePointAt(0)!)))];
}

/** 公式 PDF に記入内容を書き込んだ PDF を作る。A4 は2枚、A3 は見開き1枚 */
export async function makePdf(kind: "a4" | "a3", d: Resume, assets: Assets) {
  const [{ PDFDocument }, fontkit] = await Promise.all([import("pdf-lib"), import("@pdf-lib/fontkit").then((m) => m.default)]);
  const doc = await PDFDocument.load(kind === "a3" ? assets.a3 : assets.a4);
  doc.registerFontkit(fontkit);
  const font = await doc.embedFont(assets.font, { subset: true });
  const photo = d.photo ? await doc.embedJpg(await (await fetch(d.photo)).arrayBuffer()) : null;
  const { left, right } = layoutResume(d, assets.layout, documentDate(d));
  const pages = doc.getPages();
  if (kind === "a3") {
    draw(pages[0], [...left, ...right], 0, font, photo);
  } else {
    draw(pages[0], left, assets.layout.a4Shift[0], font, photo);
    draw(pages[1], right, assets.layout.a4Shift[1], font, photo);
  }
  // 公式 PDF の作成者などの情報は引き継がない
  const now = new Date();
  doc.setTitle("履歴書");
  doc.setAuthor(d.profile.name || "");
  doc.setSubject("");
  doc.setKeywords([]);
  doc.setCreator("career-hub");
  doc.setProducer("career-hub");
  doc.setCreationDate(now);
  doc.setModificationDate(now);
  return doc.save();
}

// ---- 写真 ----

/** 写真の向きを直し、写真欄の比率に中央で切り抜いて、長辺 1200px 以下の JPEG にする */
export async function loadPhoto(file: File, layout: Layout) {
  // 写真の回転情報を反映する。指定を受け付けない古いブラウザでは指定なしで読み直す
  const img = await createImageBitmap(file, { imageOrientation: "from-image" }).catch(() => createImageBitmap(file));
  const [x0, y0, x1, y1] = layout.photo;
  const ratio = (x1 - x0) / (y1 - y0);
  let [sx, sy, sw, sh] = [0, 0, img.width, img.height];
  if (sw / sh > ratio) {
    sw = sh * ratio;
    sx = (img.width - sw) / 2;
  } else {
    sh = sw / ratio;
    sy = (img.height - sh) / 2;
  }
  const oh = Math.min(1200, Math.round(sh));
  const ow = Math.round(oh * ratio);
  const canvas = Object.assign(document.createElement("canvas"), { width: ow, height: oh });
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff"; // 透過 PNG の透明部分が黒くならないように
  ctx.fillRect(0, 0, ow, oh);
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, ow, oh);
  return canvas.toDataURL("image/jpeg", 0.9);
}
