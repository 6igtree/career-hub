// career-hub ブラウザ版。厚生労働省履歴書様式例の公式 PDF に、入力内容を直接書き込む
const { PDFDocument } = PDFLib;

// 様式の罫線位置（pt、A3 版の左上が原点）。build.py と同じ値
const HIST_L = [390.44, 416.11, 441.78, 467.45, 493.24, 519.03, 544.70, 570.37,
  596.16, 621.95, 647.62, 673.41, 699.20, 724.99, 750.78, 776.57];
const HIST_R = [100.51, 126.30, 152.09, 177.88, 203.67, 229.46, 255.25, 280.92];
const LICENSES = [302.51, 328.18, 353.97, 379.64, 405.31, 430.98, 456.65];
const COLS_L = [67.41, 122.65, 148.86, 555.15]; // 年 | 月 | 内容 | 右端
const COLS_R = [648.96, 704.19, 730.40, 1136.69];
const REQUEST_ROWS = 4, REQUEST_ROW_H = 25.79;
const CONTACT_DY = 64.2; // 現住所欄から連絡先欄までの距離
const PHOTO = [438.91, 78.79, 524.44, 188.43]; // 写真欄
const PHOTO_MAX = 1200; // 写真の長辺（px）の上限
// A4 版の各ページは A3 版の左右半分と同じ配置（縦のずれ 0.3pt 以内）なので、横にずらして使う
const A4_SHIFT = [-14.19, -595.73];
const NO_LINE_START = '、。，．・：；？！ー）」』】〕〉》’”!?),.'; // 行頭に来ないよう前の行に残す文字
const KEY = 'career-hub';

const empty = () => ({
  date: '',
  profile: { name: '', kana: '', birth: '', gender: '', postal: '', address: '', address_kana: '', phone: '', email: '' },
  contact: { postal: '', address: '', address_kana: '', phone: '', email: '' },
  education: [], jobs: [], licenses: [],
  resume: { motivation: '', request: '' },
  photo: '', // 写真は縮小済み JPEG の data URL
});

const SAMPLE = {
  profile: {
    name: '山田 太郎', kana: 'やまだ たろう', birth: '1995-04-01', gender: '', postal: '700-0000',
    address: '岡山県岡山市北区〇〇町1-2-3', address_kana: 'おかやまけんおかやましきたく〇〇ちょう',
    phone: '090-0000-0000', email: 'taro@example.com',
  },
  education: [
    { date: '2011-04', text: '〇〇県立〇〇高等学校 入学' },
    { date: '2014-03', text: '〇〇県立〇〇高等学校 卒業' },
    { date: '2014-04', text: '〇〇大学 工学部 情報工学科 入学' },
    { date: '2018-03', text: '〇〇大学 工学部 情報工学科 卒業' },
  ],
  jobs: [{ company: '株式会社〇〇', from: '2018-04', to: '', leave_reason: '一身上の都合により退社' }],
  licenses: [
    { date: '2015-08', text: '普通自動車第一種運転免許 取得' },
    { date: '2019-04', text: '基本情報技術者試験 合格' },
  ],
  resume: { motivation: '志望動機・自己PRをここに書く。\n改行はそのまま反映される。', request: '貴社規定に従います。' },
};

// ---- 記入内容の配置 ----

function box(x0, y0, x1, y1, text, o = {}) {
  return { x0, y0, x1, y1, text: String(text ?? '').replace(/\r/g, ''), size: 11, ...o };
}

function ym(s) {
  const m = /^(\d{4})-(\d{1,2})/.exec(s || '');
  return m ? [m[1], String(+m[2])] : ['', ''];
}

function age(birth, t) {
  const [y, m, d] = birth.split('-').map(Number);
  const before = t.getMonth() + 1 < m || (t.getMonth() + 1 === m && t.getDate() < d);
  return t.getFullYear() - y - (before ? 1 : 0);
}

function rows(items, lines, [cy, cm, ct, cr]) {
  return items.flatMap(([date, text, align], i) => {
    const [y, m] = ym(date), y0 = lines[i], y1 = lines[i + 1];
    return [box(cy, y0, cm, y1, y, { align: 'c' }), box(cm, y0, ct, y1, m, { align: 'c' }),
      box(ct + 8, y0, cr - 12, y1, text, { align })];
  });
}

const filled = (list, keys) => list.filter(x => keys.some(k => (x[k] || '').trim()));

function history(d) {
  const items = [['', '学歴', 'c'], ...filled(d.education, ['date', 'text']).map(x => [x.date, x.text, '']), ['', '職歴', 'c']];
  for (const j of filled(d.jobs, ['company', 'from'])) {
    items.push([j.from, `${j.company} 入社`, '']);
    items.push(j.to ? [j.to, `${j.company} ${j.leave_reason || '退社'}`, ''] : ['', '現在に至る', '']);
  }
  return [...items, ['', '以上', 'r']];
}

// A3 版の座標で、左ページと右ページに置く内容を返す。様式に入りきらない行は errors に入れる
function layout(d, today) {
  const p = d.profile, errors = [];
  const [by, bm, bd] = (p.birth || '').split('-');
  const left = [
    box(280, 88.8, 319.7, 99.84, today.getFullYear(), { align: 'r' }),
    box(332.28, 88.8, 353.64, 99.84, today.getMonth() + 1, { align: 'c' }),
    box(364.68, 88.8, 386.04, 99.84, today.getDate(), { align: 'c' }),
    box(130, 110.7, 390, 126.36, p.kana, { size: 10 }),
    box(130, 138, 390, 203.67, p.name, { size: 24 }),
    box(120, 210.6, 170.3, 221.64, by, { align: 'r' }),
    box(182.88, 210.6, 216.0, 221.64, bm ? +bm : '', { align: 'c' }),
    box(227.04, 210.6, 260.16, 221.64, bd ? +bd : '', { align: 'c' }),
    box(326.4, 210.6, 348.48, 221.64, p.birth ? age(p.birth, today) : '', { align: 'c' }),
    box(430, 203.67, 555.15, 229.46, p.gender, { align: 'c' }),
  ];
  if (d.photo) left.push({ photo: true, x0: PHOTO[0], y0: PHOTO[1], x1: PHOTO[2], y1: PHOTO[3] });
  for (const [dy, a] of [[0, p], [CONTACT_DY, d.contact]]) {
    left.push(
      box(130, 229.46 + dy, 452, 245.11 + dy, a.address_kana, { size: 9 }),
      box(132, 246.6 + dy, 265, 257.64 + dy, a.postal),
      box(130, 258 + dy, 452, 293.75 + dy, a.address, { size: 12, wrap: true }),
      box(460, 245 + dy, 552, 263 + dy, a.phone),
      box(460, 263 + dy, 552, 292 + dy, a.email, { size: 9, wrap: true }),
    );
  }

  const hist = history(d), lic = filled(d.licenses, ['date', 'text']).map(x => [x.date, x.text, '']);
  const n = HIST_L.length - 1, maxHist = n + HIST_R.length - 1, maxLic = LICENSES.length - 1;
  const request = (d.resume.request || '').trim();
  const reqLines = request ? request.split('\n').length : 0;
  if (hist.length > maxHist) errors.push(`学歴・職歴が${hist.length}行あります。様式に入るのは${maxHist}行までです`);
  if (lic.length > maxLic) errors.push(`免許・資格が${lic.length}行あります。様式に入るのは${maxLic}行までです`);
  if (reqLines > REQUEST_ROWS) errors.push(`本人希望記入欄が${reqLines}行あります。様式に入るのは${REQUEST_ROWS}行までです`);

  left.push(...rows(hist.slice(0, n), HIST_L, COLS_L));
  const right = [
    ...rows(hist.slice(n, maxHist), HIST_R, COLS_R),
    ...rows(lic.slice(0, maxLic), LICENSES, COLS_R),
    box(656, 491, 1130, 638, (d.resume.motivation || '').trim(), { size: 10.5, wrap: true, top: true, lh: 1.6 }),
    box(656, 673.41, 1130, 673.41 + REQUEST_ROWS * REQUEST_ROW_H, request,
      { size: 10.5, wrap: true, top: true, lhPt: REQUEST_ROW_H }),
  ];
  return { left, right, errors, counts: { hist: hist.length, maxHist, lic: lic.length, maxLic, req: reqLines } };
}

// ---- PDF への書き込み ----

const charWidths = new Map(); // 1pt あたりの文字幅。和文は詰めないので文字ごとの幅の合計で測れる
function charW(font, ch) {
  let w = charWidths.get(ch);
  if (w === undefined) charWidths.set(ch, (w = font.widthOfTextAtSize(ch, 1)));
  return w;
}
const textW = (font, s, size) => [...s].reduce((sum, ch) => sum + charW(font, ch), 0) * size;

function wrap(font, text, size, maxW) {
  const out = [];
  for (const para of text.split('\n')) {
    let line = '', w = 0;
    for (const ch of para) {
      const cw = charW(font, ch) * size;
      if (line && w + cw > maxW && !NO_LINE_START.includes(ch)) {
        out.push(line);
        line = '';
        w = 0;
      }
      line += ch;
      w += cw;
    }
    out.push(line);
  }
  return out;
}

// 欄に収まるまで文字を縮め、各行の位置（ベースライン、A3 版の上からの距離）を返す
function fit(b, font) {
  const w = b.x1 - b.x0, h = b.y1 - b.y0;
  const asc = font.heightAtSize(1, { descender: false }), em = font.heightAtSize(1);
  let size = b.size, lines, lineH;
  if (b.wrap) {
    for (;; size -= 0.25) {
      lines = wrap(font, b.text, size, w);
      lineH = b.lhPt ?? size * (b.lh ?? 1.3);
      if (lines.length * lineH <= h + 0.01 || size <= 4) break;
    }
  } else {
    lines = [b.text.replace(/\n/g, ' ')];
    const tw = textW(font, lines[0], size);
    if (tw > w) size *= w / tw;
    lineH = h;
  }
  const top = b.top ? b.y0 : b.y0 + Math.max(0, (h - lines.length * lineH) / 2);
  return lines.map((s, i) => {
    const tw = textW(font, s, size);
    const x = b.align === 'r' ? b.x1 - tw : b.align === 'c' ? b.x0 + (w - tw) / 2 : b.x0;
    return { s, x, y: top + i * lineH + (lineH - em * size) / 2 + asc * size, size };
  });
}

function draw(page, items, dx, font, photo) {
  const H = page.getHeight();
  for (const b of items) {
    if (b.photo) {
      page.drawImage(photo, { x: b.x0 + dx, y: H - b.y1, width: b.x1 - b.x0, height: b.y1 - b.y0 });
    } else if (b.text.trim()) {
      for (const t of fit(b, font)) page.drawText(t.s, { x: t.x + dx, y: H - t.y, size: t.size, font });
    }
  }
}

const assets = Promise.all(['../form/kouroushourirekishoA4.pdf', '../form/kouroushourirekisho.pdf', 'fonts/ipaexm.ttf']
  .map(async url => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${url} を読み込めません（${res.status}）`);
    return new Uint8Array(await res.arrayBuffer());
  }))
  .then(([a4, a3, font]) => ({ a4, a3, font, charset: new Set(fontkit.create(font).characterSet) }));

async function makePdf(kind, d) {
  const { a4, a3, font: fontBytes } = await assets;
  const doc = await PDFDocument.load(kind === 'a3' ? a3 : a4);
  doc.registerFontkit(fontkit);
  const font = await doc.embedFont(fontBytes, { subset: true });
  const photo = d.photo ? await doc.embedJpg(await (await fetch(d.photo)).arrayBuffer()) : null;
  const { left, right } = layout(d, documentDate(d));
  const pages = doc.getPages();
  if (kind === 'a3') {
    draw(pages[0], [...left, ...right], 0, font, photo);
  } else {
    draw(pages[0], left, A4_SHIFT[0], font, photo);
    draw(pages[1], right, A4_SHIFT[1], font, photo);
  }
  // 公式 PDF の作成者などの情報は引き継がない
  const now = new Date();
  doc.setTitle('履歴書');
  doc.setAuthor(d.profile.name || '');
  doc.setSubject('');
  doc.setKeywords([]);
  doc.setCreator('career-hub');
  doc.setProducer('career-hub');
  doc.setCreationDate(now);
  doc.setModificationDate(now);
  return doc.save();
}

function documentDate(d) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d.date || '');
  return m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date();
}

// ---- 写真 ----

async function loadPhoto(file) {
  // 写真の回転情報を反映する。指定を受け付けない古いブラウザでは指定なしで読み直す
  const img = await createImageBitmap(file, { imageOrientation: 'from-image' }).catch(() => createImageBitmap(file));
  const ratio = (PHOTO[2] - PHOTO[0]) / (PHOTO[3] - PHOTO[1]);
  let sx = 0, sy = 0, sw = img.width, sh = img.height;
  if (sw / sh > ratio) { sw = sh * ratio; sx = (img.width - sw) / 2; } else { sh = sw / ratio; sy = (img.height - sh) / 2; }
  const oh = Math.min(PHOTO_MAX, Math.round(sh)), ow = Math.round(oh * ratio);
  const canvas = Object.assign(document.createElement('canvas'), { width: ow, height: oh });
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff'; // 透過 PNG の透明部分が黒くならないように
  ctx.fillRect(0, 0, ow, oh);
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, ow, oh);
  return canvas.toDataURL('image/jpeg', 0.9);
}

// ---- 画面 ----

const $ = id => document.getElementById(id);
const form = $('form');
const LISTS = {
  education: { fields: [['date', '年月', 'month'], ['text', '学校名・入学/卒業など']], blank: { date: '', text: '' } },
  jobs: {
    fields: [['company', '会社名'], ['from', '入社', 'month'], ['to', '退社（在職中は空）', 'month'], ['leave_reason', '退社理由']],
    blank: { company: '', from: '', to: '', leave_reason: '一身上の都合により退社' },
  },
  licenses: { fields: [['date', '年月', 'month'], ['text', '免許・資格']], blank: { date: '', text: '' } },
};

function merge(s) {
  const e = empty(), list = v => (Array.isArray(v) ? v : []);
  return {
    ...e, ...s,
    profile: { ...e.profile, ...s.profile }, contact: { ...e.contact, ...s.contact }, resume: { ...e.resume, ...s.resume },
    education: list(s.education), jobs: list(s.jobs), licenses: list(s.licenses),
  };
}

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    return s && typeof s === 'object' ? merge(s) : empty();
  } catch {
    return empty();
  }
}

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // 保存できない環境（プライベートブラウズなど）でも作成は続けられる
  }
}

let state = load();

const getPath = path => path.split('.').reduce((o, k) => o?.[k], state) ?? '';
function setPath(path, value) {
  const keys = path.split('.'), last = keys.pop();
  keys.reduce((o, k) => o[k], state)[last] = value;
}

function renderLists() {
  for (const [name, spec] of Object.entries(LISTS)) {
    form.querySelector(`[data-list="${name}"]`).replaceChildren(...state[name].map((item, i) => {
      const row = Object.assign(document.createElement('div'), { className: `row ${name}` });
      for (const [field, label, type = 'text'] of spec.fields) {
        const input = Object.assign(document.createElement('input'), { type, value: item[field] ?? '' });
        if (type === 'month') input.placeholder = '2014-04';
        Object.assign(input.dataset, { list: name, i, field });
        const lab = document.createElement('label');
        lab.append(label, input);
        row.append(lab);
      }
      const ops = Object.assign(document.createElement('div'), { className: 'ops' });
      for (const [op, text, aria] of [['-1', '↑', '上へ'], ['1', '↓', '下へ'], ['del', '✕', '削除']]) {
        const btn = Object.assign(document.createElement('button'), { type: 'button', textContent: text });
        btn.setAttribute('aria-label', aria);
        Object.assign(btn.dataset, { list: name, i, op });
        ops.append(btn);
      }
      row.append(ops);
      return row;
    }));
  }
}

function fillForm() {
  for (const el of form.querySelectorAll('[data-path]')) el.value = getPath(el.dataset.path);
  $('photo-clear').hidden = !state.photo;
  renderLists();
}

function showMessages(items) {
  $('messages').replaceChildren(...items.map(([cls, text]) => Object.assign(document.createElement('li'), { className: cls, textContent: text })));
}

function showCounts({ hist, maxHist, lic, maxLic, req }) {
  const set = (id, text, over) => Object.assign($(id), { textContent: text, className: over ? 'count over' : 'count' });
  set('hist-count', `学歴・職歴の欄：${hist} / ${maxHist} 行`, hist > maxHist);
  set('lic-count', `免許・資格の欄：${lic} / ${maxLic} 行`, lic > maxLic);
  set('req-count', `本人希望記入欄：${req} / ${REQUEST_ROWS} 行`, req > REQUEST_ROWS);
}

function missingChars(charset) {
  const text = JSON.stringify({ ...state, photo: '' });
  return [...new Set([...text].filter(ch => !charset.has(ch.codePointAt(0)) && ch.trim()))];
}

let timer, runs = 0, previewUrl;
function schedule() {
  clearTimeout(timer);
  timer = setTimeout(update, 400);
}

async function update() {
  save();
  const run = ++runs;
  const { errors, counts } = layout(state, documentDate(state));
  showCounts(counts);
  try {
    const { charset } = await assets;
    const missing = missingChars(charset);
    const bytes = await makePdf('a4', state);
    if (run !== runs) return;
    showMessages([
      ...errors.map(e => ['error', e]),
      ...(missing.length ? [['warn', `フォントにない文字は PDF に表示されません：${missing.join(' ')}`]] : []),
    ]);
    $('dl-a4').disabled = $('dl-a3').disabled = errors.length > 0;
    $('status').textContent = errors.length ? 'はみ出す行を減らすとダウンロードできます' : '';
    URL.revokeObjectURL(previewUrl);
    previewUrl = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
    $('preview').src = `${previewUrl}#view=FitH`;
  } catch (e) {
    showMessages([['error', `PDF を作れませんでした：${e.message}`]]);
  }
}

function saveFile(bytes, name, type) {
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([bytes], { type })), download: name });
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

form.addEventListener('input', e => {
  const t = e.target;
  if (t.dataset.path) setPath(t.dataset.path, t.value);
  else if (t.dataset.field) state[t.dataset.list][+t.dataset.i][t.dataset.field] = t.value;
  else return;
  schedule();
});

form.addEventListener('click', e => {
  const btn = e.target.closest('button');
  if (!btn) return;
  const { add, list, op } = btn.dataset, i = +btn.dataset.i;
  if (add) {
    state[add].push({ ...LISTS[add].blank });
  } else if (op === 'del') {
    state[list].splice(i, 1);
  } else if (op) {
    const j = i + +op, items = state[list];
    if (j < 0 || j >= items.length) return;
    [items[i], items[j]] = [items[j], items[i]];
  } else {
    return;
  }
  renderLists();
  schedule();
});

$('photo').addEventListener('change', async e => {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) return;
  try {
    state.photo = await loadPhoto(file);
    $('photo-clear').hidden = false;
    schedule();
  } catch {
    showMessages([['error', 'この写真は読み込めませんでした。JPEG か PNG の画像を選んでください（iPhone の HEIC は Chrome では読めません）']]);
  }
});

$('photo-clear').addEventListener('click', () => {
  state.photo = '';
  $('photo-clear').hidden = true;
  schedule();
});

$('sample').addEventListener('click', () => {
  state = merge(structuredClone(SAMPLE));
  fillForm();
  schedule();
});

$('reset').addEventListener('click', () => {
  if (!confirm('入力した内容をすべて消します。よろしいですか？')) return;
  state = empty();
  fillForm();
  schedule();
});

$('export').addEventListener('click', () => saveFile(JSON.stringify(state, null, 2), 'career-hub.json', 'application/json'));
$('import-button').addEventListener('click', () => $('import').click());
$('import').addEventListener('change', async e => {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) return;
  try {
    state = merge(JSON.parse(await file.text()));
    fillForm();
    schedule();
  } catch {
    showMessages([['error', 'このファイルは読み込めませんでした。「データを書き出す」で保存した JSON ファイルを選んでください']]);
  }
});

for (const kind of ['a4', 'a3']) {
  $(`dl-${kind}`).addEventListener('click', async () => {
    saveFile(await makePdf(kind, state), kind === 'a3' ? '履歴書_A3.pdf' : '履歴書.pdf', 'application/pdf');
  });
}

fillForm();
update();
