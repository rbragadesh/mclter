"""Overlay composed grapheme strokes from src/data/strokes.json on the font rendering.

usage: python3 tools/check_graphemes.py out.png [grapheme ...]   (default: a sample)
"""
import json
import os
import sys

from PIL import Image, ImageDraw, ImageFont

from glyphlib import FONT, ASC, K

HERE = os.path.dirname(os.path.abspath(__file__))
data = json.load(open(os.path.join(HERE, '..', 'src', 'data', 'strokes.json'), encoding='utf-8'))
S = 1.2
COLORS = [(220, 40, 40), (30, 120, 220), (20, 160, 60), (200, 120, 0), (150, 50, 200), (0, 160, 170)]
font = ImageFont.truetype(FONT, int(200 * S), layout_engine=ImageFont.Layout.RAQM)


def tile(g):
    parts = data['graphemes'][g]
    w = int((max(x + data['glyphs'][n]['adv'] for n, x in parts) + 60) * S)
    img = Image.new('RGB', (w, int(260 * S)), 'white')
    d = ImageDraw.Draw(img)
    ox = 30
    # font baseline at y = ASC*K in our units; PIL draws text with ascender at top
    d.text((ox * S, 0), g, font=font, fill=(222, 226, 240), anchor='la')
    i = 0
    for n, x0 in parts:
        for st in data['glyphs'][n]['strokes']:
            col = COLORS[i % len(COLORS)]
            pts = [((x + x0 + ox) * S, y * S) for x, y in st['p']]
            if st.get('dot'):
                X, Y = pts[0]
                d.ellipse([X - 5, Y - 5, X + 5, Y + 5], fill=col)
            else:
                d.line(pts, fill=col, width=2)
                X, Y = pts[0]
                d.ellipse([X - 4, Y - 4, X + 4, Y + 4], outline=col, width=2)
            d.text((X + 5, Y - 12), str(i + 1), fill=col)
            i += 1
    return img


if __name__ == '__main__':
    gs = sys.argv[2:] or ['கொ', 'ணை', 'ஷௌ', 'ஜி', 'கி', 'ணி', 'ஙி', 'சோ', 'றை', 'ஸ்ரீ', 'க்ஷ', 'னூ']
    tiles = [tile(g) for g in gs]
    W = 1800
    rows, row, w = [], [], 0
    for t in tiles:
        if w + t.width > W and row:
            rows.append(row); row, w = [], 0
        row.append(t); w += t.width
    rows.append(row)
    sheet = Image.new('RGB', (max(sum(t.width for t in r) for r in rows), sum(r[0].height for r in rows)), 'white')
    y = 0
    for r in rows:
        x = 0
        for t in r:
            sheet.paste(t, (x, y)); x += t.width
        y += r[0].height
    sheet.save(sys.argv[1])
    print(sheet.size)
