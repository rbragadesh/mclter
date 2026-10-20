"""Debug viewer: draw glyph skeleton with labelled endpoints / junctions / edge points.

usage: python3 tools/inspect_glyph.py out.png glyph1,glyph2,...
"""
import sys

import numpy as np
from PIL import Image, ImageDraw

from glyphlib import PX, raster, skeleton
from strokes import NEIGH

S = 3  # display px per U


def graph_nodes(sk):
    H, W = sk.shape
    ys, xs = np.nonzero(sk)
    deg = {}
    for x, y in zip(xs, ys):
        n = 0
        for dx, dy in NEIGH:
            if 0 <= x + dx < W and 0 <= y + dy < H and sk[y + dy, x + dx]:
                n += 1
        deg[(x, y)] = n
    ends = [p for p, d in deg.items() if d == 1]
    juncs = [p for p, d in deg.items() if d >= 3]
    return deg, ends, juncs


def cluster(points, r):
    out = []
    for p in points:
        for c in out:
            if abs(c[0][0] - p[0]) <= r and abs(c[0][1] - p[1]) <= r:
                c.append(p)
                break
        else:
            out.append([p])
    return [tuple(np.mean(c, axis=0)) for c in out]


def edge_samples(sk, juncs_px, step=18):
    """Walk skeleton pixels excluding junction neighbourhoods; sample every `step` px."""
    H, W = sk.shape
    blocked = np.zeros_like(sk)
    for x, y in juncs_px:
        blocked[max(0, int(y) - 3):int(y) + 4, max(0, int(x) - 3):int(x) + 4] = True
    seen = np.zeros_like(sk)
    samples = []
    ys, xs = np.nonzero(sk & ~blocked)
    for sx, sy in zip(xs, ys):
        if seen[sy, sx]:
            continue
        # flood the component, collect in BFS order
        comp = []
        stack = [(sx, sy)]
        seen[sy, sx] = True
        while stack:
            x, y = stack.pop()
            comp.append((x, y))
            for dx, dy in NEIGH:
                nx, ny = x + dx, y + dy
                if 0 <= nx < W and 0 <= ny < H and sk[ny, nx] and not blocked[ny, nx] and not seen[ny, nx]:
                    seen[ny, nx] = True
                    stack.append((nx, ny))
        if len(comp) < 6:
            continue
        for p in comp[::step]:
            samples.append(p)
    return samples


def render(name):
    m, ox = raster([(name, 0)])
    sk = skeleton(m)
    H, W = m.shape
    scale = S / PX
    img = Image.new('RGB', (int(W * scale), int(H * scale)), 'white')
    big = np.array(Image.fromarray(m).resize(img.size, Image.NEAREST))
    a = np.array(img)
    a[big] = (215, 218, 235)
    img = Image.fromarray(a)
    d = ImageDraw.Draw(img)
    for g in range(-int(ox) // 10 * 10, int(W / PX - ox) + 1, 10):
        gx = (g + ox) * S
        d.line([(gx, 0), (gx, img.height)], fill=(150, 190, 150) if g % 50 == 0 else (232, 240, 232))
        if g % 50 == 0:
            d.text((gx + 2, 2), str(g), fill=(0, 120, 0))
    for g in range(0, int(H / PX) + 1, 10):
        d.line([(0, g * S), (img.width, g * S)], fill=(150, 190, 150) if g % 50 == 0 else (232, 240, 232))
        if g % 50 == 0:
            d.text((2, g * S + 2), str(g), fill=(0, 120, 0))
    ys, xs = np.nonzero(sk)
    for x, y in zip(xs, ys):
        d.point((x * scale, y * scale), fill=(200, 0, 0))
    deg, ends, juncs = graph_nodes(sk)
    for x, y in edge_samples(sk, juncs):
        d.ellipse([x * scale - 1.5, y * scale - 1.5, x * scale + 1.5, y * scale + 1.5], fill=(90, 90, 90))
        d.text((x * scale + 3, y * scale - 5), '%d,%d' % (round(x / PX - ox), round(y / PX)), fill=(90, 90, 90))
    for x, y in cluster(juncs, 6):
        d.ellipse([x * scale - 4, y * scale - 4, x * scale + 4, y * scale + 4], outline=(0, 0, 220), width=2)
        d.text((x * scale + 5, y * scale + 3), 'J%d,%d' % (round(x / PX - ox), round(y / PX)), fill=(0, 0, 220))
    for x, y in ends:
        d.rectangle([x * scale - 3, y * scale - 3, x * scale + 3, y * scale + 3], outline=(220, 120, 0), width=2)
        d.text((x * scale + 5, y * scale + 3), 'E%d,%d' % (round(x / PX - ox), round(y / PX)), fill=(200, 100, 0))
    d.text((img.width - 140, img.height - 14), name, fill='blue')
    return img


if __name__ == '__main__':
    tiles = [render(n) for n in sys.argv[2].split(',')]
    maxw = 2000
    rows, row, w = [], [], 0
    for t in tiles:
        if w + t.width > maxw and row:
            rows.append(row)
            row, w = [], 0
        row.append(t)
        w += t.width + 6
    rows.append(row)
    H = sum(max(t.height for t in r) + 6 for r in rows)
    W = max(sum(t.width + 6 for t in r) for r in rows)
    sheet = Image.new('RGB', (W, H), 'white')
    y = 0
    for r in rows:
        x = 0
        for t in r:
            sheet.paste(t, (x, y))
            x += t.width + 6
        y += max(t.height for t in r) + 6
    # crop away empty top area (above y=0..40 rarely used) -- keep simple
    sheet.save(sys.argv[1])
    print(sheet.size)
