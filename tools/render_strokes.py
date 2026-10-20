"""Render routed strokes for visual verification.

usage: python3 tools/render_strokes.py out.png glyph1,glyph2,...   (glyph names or 'all')
"""
import math
import sys

import numpy as np
from PIL import Image, ImageDraw

from build_strokes import build_glyph, all_glyph_names
from glyphlib import PX, raster

S = 2.2
COLORS = [(220, 40, 40), (30, 120, 220), (20, 160, 60), (200, 120, 0), (150, 50, 200), (0, 160, 170),
          (120, 120, 0), (230, 0, 140)]


def arrow(d, a, b, col):
    ang = math.atan2(b[1] - a[1], b[0] - a[0])
    for s in (2.6, -2.6):
        d.line([b, (b[0] - 7 * math.cos(ang + s * 0.2), b[1] - 7 * math.sin(ang + s * 0.2))], fill=col, width=2)


def render(name):
    strokes = build_glyph(name)
    m, ox = raster([(name, 0)])
    H, W = m.shape
    sc = S / PX
    img = Image.new('RGB', (int(W * sc), int(H * sc)), 'white')
    big = np.array(Image.fromarray(m).resize(img.size, Image.NEAREST))
    a = np.array(img)
    a[big] = (225, 228, 240)
    img = Image.fromarray(a)
    d = ImageDraw.Draw(img)
    for g in range(0, int(H / PX) + 1, 50):
        d.line([(0, g * S), (img.width, g * S)], fill=(200, 220, 200))
    for i, st in enumerate(strokes):
        col = COLORS[i % len(COLORS)]
        if st.get('dot'):
            x, y = st['points'][0]
            x += ox
            d.ellipse([x * S - 6, y * S - 6, x * S + 6, y * S + 6], fill=col)
            d.text((x * S + 8, y * S - 14), str(i + 1), fill=col)
            continue
        pts = [((x + ox) * S, y * S) for x, y in st['points']]
        d.line(pts, fill=col, width=3)
        # arrows every ~35 U
        acc = 0
        for p, q in zip(pts, pts[1:]):
            seg = math.dist(p, q)
            acc += seg
            if acc > 35 * S and seg > 1:
                arrow(d, p, q, col)
                acc = 0
        x, y = pts[0]
        d.ellipse([x - 6, y - 6, x + 6, y + 6], outline=col, width=3)
        d.text((x + 8, y - 16), str(i + 1), fill=col)
        x, y = pts[-1]
        d.rectangle([x - 3, y - 3, x + 3, y + 3], fill=col)
    d.text((4, img.height - 14), name, fill='blue')
    return img


if __name__ == '__main__':
    names = all_glyph_names() if sys.argv[2] == 'all' else sys.argv[2].split(',')
    tiles = [render(n) for n in names]
    maxw = 1900
    rows, row, w = [], [], 0
    for t in tiles:
        if w + t.width > maxw and row:
            rows.append(row)
            row, w = [], 0
        row.append(t)
        w += t.width + 4
    rows.append(row)
    H = sum(max(t.height for t in r) + 4 for r in rows)
    W = max(sum(t.width + 4 for t in r) for r in rows)
    sheet = Image.new('RGB', (W, H), (245, 245, 245))
    y = 0
    for r in rows:
        x = 0
        for t in r:
            sheet.paste(t, (x, y))
            x += t.width + 4
        y += max(t.height for t in r) + 4
    sheet.save(sys.argv[1])
    print(sheet.size)
