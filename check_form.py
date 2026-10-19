"""サンプルで作った履歴書の様式が公式 PDF と一致しているかを、罫線の座標で確かめる（要 poppler: brew install poppler）。

使い方: python3 check_form.py
"""
import datetime
import re
import subprocess
import sys
import tempfile
import tomllib
from pathlib import Path

import build

TOLERANCE = 0.1  # pt（0.035mm）
PAGES = [  # (公式 PDF, ページ, 出力 PDF, ページ)
    ("kouroushourirekishoA4.pdf", 1, "履歴書.pdf", 1),
    ("kouroushourirekishoA4.pdf", 2, "履歴書.pdf", 2),
    ("kouroushourirekisho.pdf", 1, "履歴書_A3.pdf", 1),
]


def rules(pdf, page):
    """PDF の1ページにある罫線（細長い塗りの矩形）を (向き, 位置, 始点, 終点) で返す"""
    svg = subprocess.run(["pdftocairo", "-svg", "-f", str(page), "-l", str(page), str(pdf), "-"],
                         check=True, capture_output=True, text=True).stdout
    svg = re.sub(r'<g id="glyph.*?</g>|<clipPath.*?</clipPath>', "", svg, flags=re.S)  # 字形と切り抜きは飛ばす
    out = []
    for attrs in re.findall(r"<path ([^>]*)/>", svg):
        d = re.search(r' d="([^"C]*)"', attrs)
        nums = [float(x) for x in re.findall(r"-?\d+\.?\d*", d.group(1))] if d else []
        if len(nums) != 10:
            continue
        m = re.search(r'transform="matrix\(([^)]*)\)"', attrs)
        a, b, c, dd, e, f = map(float, re.split(r"[ ,]+", m.group(1).strip())) if m else (1, 0, 0, 1, 0, 0)
        xs, ys = zip(*[(a * x + c * y + e, b * x + dd * y + f) for x, y in zip(nums[0:8:2], nums[1:8:2])])
        w, h = max(xs) - min(xs), max(ys) - min(ys)
        if h < 2.5 < w:
            out.append(("H", (min(ys) + max(ys)) / 2, min(xs), max(xs)))
        elif w < 2.5 < h:
            out.append(("V", (min(xs) + max(xs)) / 2, min(ys), max(ys)))
    return out


def worst(official, mine):
    """公式の各罫線について、出力側で一番近い罫線とのずれ（pt）の最大値"""
    return max(min(max(abs(p - q) for p, q in zip(o[1:], m[1:])) for m in mine if m[0] == o[0])
               for o in official)


def main():
    sample = tomllib.loads((build.ROOT / "career.example.toml").read_text(encoding="utf-8"))
    with tempfile.TemporaryDirectory() as tmp:
        tmp = Path(tmp)
        build.write_rirekisho(sample, datetime.date.today(), tmp)
        ok = True
        for src, sp, out, op in PAGES:
            official, mine = rules(build.FORM / src, sp), rules(tmp / out, op)
            dev = worst(official, mine)
            ok &= dev <= TOLERANCE and len(mine) >= len(official)
            print(f"{src} {sp}ページ目: 罫線 {len(official)} 本中 出力 {len(mine)} 本、最大のずれ {dev:.3f}pt")
    print("OK: 公式様式と一致" if ok else f"NG: {TOLERANCE}pt を超えるずれがある")
    sys.exit(not ok)


if __name__ == "__main__":
    main()
