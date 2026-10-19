"""career.toml から 履歴書・職務経歴書 の PDF を out/ に生成する。

使い方: python3 build.py [career.toml]
"""
import datetime
import html
import json
import os
import re
import shutil
import subprocess
import sys
import tomllib
from pathlib import Path

ROOT = Path(__file__).parent
CHROMES = [  # 環境変数 CHROME があればそちらを使う
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    "google-chrome", "chromium", "chromium-browser",
]
FORM = ROOT / "form"  # 厚生労働省履歴書様式例の公式 PDF を SVG にしたもの（README 参照）

# 文字を置く位置（pt、A3 版の左上が原点）。ブラウザ版と共通
LAYOUT = json.loads((FORM / "layout.json").read_text(encoding="utf-8"))
HIST_L, HIST_R = LAYOUT["history"]["left"], LAYOUT["history"]["right"]
LICENSES = LAYOUT["licenses"]
COLS_L, COLS_R = LAYOUT["columns"]["left"], LAYOUT["columns"]["right"]
# A4 版の各ページは A3 版の左右半分と同じ配置（縦のずれ 0.3pt 以内）なので、横にずらして使う
A4_SHIFT = LAYOUT["a4Shift"]
PHOTO_MAX = 1200  # 写真の長辺（px）の上限。写真欄の高さ 38.7mm に対して約 790dpi あれば十分

# 欄からはみ出す文字を、収まるまで縮める
FIT_JS = """<script>
for (const el of document.querySelectorAll('.f')) {
  let s = parseFloat(getComputedStyle(el).fontSize);
  while (s > 5 && (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1))
    el.style.fontSize = (s -= 0.25) + 'px';
}
</script>"""


def e(s):
    return html.escape(str(s or ""))


def br(s):
    return e(str(s or "").strip()).replace("\n", "<br>")


def ym(s):
    """'2018-04' -> ('2018', '4')"""
    if not s:
        return "", ""
    y, m = s.split("-")[:2]
    return y, str(int(m))


def period(a, b):
    ya, ma = ym(a)
    yb, mb = ym(b)
    return f"{ya}年{ma}月 〜 " + (f"{yb}年{mb}月" if b else "現在")


def age(birth, today):
    b = datetime.date.fromisoformat(birth)
    return today.year - b.year - ((today.month, today.day) < (b.month, b.day))


def jdate(d):
    return f"{d.year}年{d.month}月{d.day}日"


def limit(n, max_n, name):
    if n > max_n:
        sys.exit(f"{name}が{n}行あります。様式に入るのは{max_n}行までです")


def box(x0, y0, x1, y1, text, size=11, cls="", style=""):
    """様式上の矩形 (x0, y0)-(x1, y1) に文字を置く。cls: c=中央 r=右寄せ w=折り返し top=上寄せ"""
    return (f'<div class="f {cls}" style="left:{x0}pt;top:{y0}pt;width:{x1 - x0:.2f}pt;'
            f'height:{y1 - y0:.2f}pt;font-size:{size}pt;{style}"><div>{text}</div></div>')


def field(name, text, dy=0):
    """layout.json の欄 name に文字を置く。dy は縦にずらす量（連絡先欄で使う）"""
    f = LAYOUT["fields"][name]
    x0, y0, x1, y1 = f["box"]
    cls = " ".join(c for c in (f.get("align"), f.get("wrap") and "w", f.get("top") and "top") if c)
    style = (f"line-height:{f['lineHeight']}" if "lineHeight" in f
             else f"line-height:{f['lineHeightPt']}pt" if "lineHeightPt" in f else "")
    return box(x0, y0 + dy, x1, y1 + dy, text, size=f.get("size", 11), cls=cls, style=style)


def rows(items, lines, cols):
    """(年月, 内容, 寄せ) を罫線 lines の各行に1件ずつ置く"""
    cy, cm, ct, cr = cols
    pad_l, pad_r = LAYOUT["rowPadding"]
    out = []
    for (date, text, align), y0, y1 in zip(items, lines, lines[1:]):
        y, m = ym(date)
        out += [box(cy, y0, cm, y1, y, cls="c"), box(cm, y0, ct, y1, m, cls="c"),
                box(ct + pad_l, y0, cr - pad_r, y1, e(text), cls=align)]
    return out


def history(d):
    items = [("", "学歴", "c")] + [(x["date"], x["text"], "") for x in d.get("education", [])]
    items.append(("", "職歴", "c"))
    for j in d.get("jobs", []):
        items.append((j["from"], f'{j["company"]} 入社', ""))
        if j.get("to"):
            items.append((j["to"], f'{j["company"]} {j.get("leave_reason", "退社")}', ""))
        else:
            items.append(("", "現在に至る", ""))
    return items + [("", "以上", "r")]


def rirekisho(d, today):
    """厚生労働省履歴書様式例（A3 版の座標）に重ねる記入内容を (左ページ, 右ページ) で返す"""
    p, r = d["profile"], d.get("resume", {})
    by, bm, bd = p["birth"].split("-")
    left = [
        field("dateYear", today.year),
        field("dateMonth", today.month),
        field("dateDay", today.day),
        field("kana", e(p["kana"])),
        field("name", e(p["name"])),
        field("birthYear", by),
        field("birthMonth", int(bm)),
        field("birthDay", int(bd)),
        field("age", age(p["birth"], today)),
        field("gender", e(p.get("gender"))),
    ]
    if p.get("photo"):
        x0, y0, x1, y1 = LAYOUT["photo"]
        left.append(f'<img class="photo" src="{(ROOT / p["photo"]).resolve().as_uri()}" '
                    f'style="left:{x0}pt;top:{y0}pt;width:{x1 - x0:.2f}pt;height:{y1 - y0:.2f}pt">')
    for dy, a in ((0, p), (LAYOUT["contactOffset"], d.get("contact", {}))):
        left += [
            field("addressKana", e(a.get("address_kana")), dy),
            field("postal", e(a.get("postal")), dy),
            field("address", e(a.get("address")), dy),
            field("phone", e(a.get("phone")), dy),
            field("email", e(a.get("email")).replace("@", "<wbr>@"), dy),
        ]

    hist, lic = history(d), [(x["date"], x["text"], "") for x in d.get("licenses", [])]
    n = len(HIST_L) - 1
    limit(len(hist), n + len(HIST_R) - 1, "学歴・職歴")
    limit(len(lic), len(LICENSES) - 1, "免許・資格")
    left += rows(hist[:n], HIST_L, COLS_L)

    request = str(r.get("request") or "").strip()
    limit(len(request.splitlines()), LAYOUT["fields"]["request"]["rows"], "本人希望記入欄")
    right = rows(hist[n:], HIST_R, COLS_R) + rows(lic, LICENSES, COLS_R) + [
        field("motivation", e(str(r.get("motivation") or "").strip())),
        field("request", e(request)),
    ]
    return "\n".join(left), "\n".join(right)


def sheet(size, form, overlay, dx=0):
    return (f'<section class="sheet {size}"><div class="cal"><img src="{(FORM / form).as_uri()}">'
            f'<div class="ov" style="left:{dx}pt">{overlay}</div></div></section>')


def write_rirekisho(d, today, outdir):
    # A4 の各ページには、そのページの欄だけを入れる。ページ外の要素があると Chrome が全体を縮小してしまう
    left, right = rirekisho(d, today)
    to_pdf(sheet("a4", "a4-1.svg", left, A4_SHIFT[0]) + sheet("a4", "a4-2.svg", right, A4_SHIFT[1]) + FIT_JS,
           outdir / "履歴書.pdf")
    to_pdf(sheet("a3", "a3.svg", left + right) + FIT_JS, outdir / "履歴書_A3.pdf")


def shokumu(d, today):
    p, cv = d["profile"], d.get("cv", {})
    jobs = []
    for j in d.get("jobs", []):
        projects = "".join(f"""
      <tr><td class="per">{period(pj["from"], pj.get("to"))}</td><td>
        <b>{e(pj["title"])}</b>
        <div class="meta">役割：{e(pj.get("role"))}　規模：{e(pj.get("team"))}</div>
        <div>{br(pj.get("detail"))}</div>
        {f'<div class="res">【成果】{br(pj["result"])}</div>' if pj.get("result") else ""}
        {f'<div class="meta">【使用技術】{e(pj["tech"])}</div>' if pj.get("tech") else ""}
      </td></tr>""" for pj in j.get("projects", []))
        jobs.append(f"""
    <h3>{e(j["company"])}（{period(j["from"], j.get("to"))}）</h3>
    <div class="meta">事業内容：{e(j.get("business"))}　従業員数：{e(j.get("employees"))}　職種：{e(j.get("role"))}</div>
    <table class="grid cvt"><tr><th class="per">期間</th><th>業務内容</th></tr>{projects}</table>""")
    tech = "".join(f'<tr><td class="lbl">{e(t["category"])}</td><td>{e(t["items"])}</td></tr>' for t in cv.get("tech", []))
    lic = "".join(f'<li>{e(x["text"])}（{"年".join(ym(x["date"]))}月）</li>' for x in d.get("licenses", []))
    return f"""
<section class="cv">
  <h1 class="c">職 務 経 歴 書</h1>
  <div class="r">{jdate(today)} 現在<br>氏名　{e(p["name"])}</div>
  <h2>職務要約</h2><p>{br(cv.get("summary"))}</p>
  <h2>職務経歴</h2>{"".join(jobs)}
  <h2>活かせる経験・知識・技術</h2><ul>{"".join(f"<li>{e(s)}</li>" for s in cv.get("skills", []))}</ul>
  {f'<h2>テクニカルスキル</h2><table class="grid">{tech}</table>' if tech else ""}
  {f"<h2>資格</h2><ul>{lic}</ul>" if lic else ""}
  <h2>自己PR</h2><p>{br(cv.get("pr"))}</p>
  <p class="r">以上</p>
</section>"""


def prepare_photo(p, base, outdir):
    """写真のパスを career.toml の場所から解決する。macOS では HEIC も使えるよう sips で JPEG にし、
    スマホの写真で PDF が重くならないよう長辺を PHOTO_MAX まで縮める"""
    if not p.get("photo"):
        return
    src = (base / p["photo"]).resolve()
    if not src.exists():
        sys.exit(f"写真が見つかりません: {src}")
    if shutil.which("sips"):
        info = subprocess.run(["sips", "-g", "pixelWidth", "-g", "pixelHeight", src], capture_output=True, text=True).stdout
        dims = [int(n) for n in re.findall(r"pixel(?:Width|Height): (\d+)", info)]
        if not dims:
            sys.exit(f"写真を画像として読み込めません: {src}")
        resize = ["-Z", str(PHOTO_MAX)] if max(dims) > PHOTO_MAX else []  # -Z は小さい画像を拡大してしまう
        dst = outdir / "photo.jpg"
        subprocess.run(["sips", "-s", "format", "jpeg", *resize, src, "--out", dst], check=True, capture_output=True)
        src = dst
    elif src.suffix.lower() in (".heic", ".heif"):
        sys.exit("HEIC の写真は macOS 以外では使えません。JPEG か PNG に変換してください")
    p["photo"] = str(src)


def chrome():
    if os.environ.get("CHROME"):
        return os.environ["CHROME"]
    for c in CHROMES:
        if Path(c).exists() or shutil.which(c):
            return c
    sys.exit("Google Chrome が見つかりません。環境変数 CHROME に実行ファイルのパスを指定してください")


def to_pdf(body, out):
    page = f'<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="{(ROOT / "style.css").as_uri()}">{body}'
    tmp = out.with_suffix(".html")
    tmp.write_text(page, encoding="utf-8")
    subprocess.run([chrome(), "--headless", "--disable-gpu", "--no-pdf-header-footer",
                    f"--print-to-pdf={out}", tmp.as_uri()], check=True, capture_output=True)
    print(out)


def main():
    src = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "career.toml"
    if not src.exists() and len(sys.argv) == 1:
        src = ROOT / "career.example.toml"
        print("career.toml がないのでサンプルで生成します")
    d = tomllib.loads(src.read_text(encoding="utf-8"))
    today = datetime.date.fromisoformat(d["date"]) if d.get("date") else datetime.date.today()
    outdir = ROOT / "out"
    outdir.mkdir(exist_ok=True)
    prepare_photo(d["profile"], src.parent, outdir)
    write_rirekisho(d, today, outdir)
    to_pdf(shokumu(d, today), outdir / "職務経歴書.pdf")
    if sys.platform == "darwin":
        subprocess.run(["open", outdir / "履歴書.pdf", outdir / "職務経歴書.pdf"])


if __name__ == "__main__":
    main()
