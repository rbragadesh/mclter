"""Build stroke data for every Tamil grapheme the app teaches.

    python3 tools/build_strokes.py          -> writes src/data/strokes.json

Glyph strokes come from stroke_spec.SPEC (hand-authored) or are derived from a
base glyph (DERIVED) by re-routing the base waypoints on the derived glyph's
skeleton and appending the remaining, un-routed part (pulli dot, vowel-sign
tail) as extra stroke(s).
"""
import json
import math
import os
import sys
from functools import lru_cache

import numpy as np

from glyphlib import PX, shape, glyph_svg_path, ASC, DESC, K
from strokes import Skeleton, route, NEIGH, smooth, rdp
from stroke_spec import SPEC, DERIVED

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'src', 'data', 'strokes.json')


@lru_cache(maxsize=None)
def skel_for(name):
    return Skeleton([(name, 0)])


def build_from_spec(name, spec, skel=None):
    skel = skel or skel_for(name)
    out = []
    for st in spec:
        if isinstance(st, dict) and 'dot' in st:
            out.append({'dot': True, 'points': [tuple(st['dot'])]})
        else:
            out.append({'points': route(skel, st)})
    return out


def covered_mask(skel, strokes, radius_u):
    """Skeleton pixels within radius of any routed stroke."""
    sk = skel.sk
    cov = np.zeros_like(sk)
    ys, xs = np.nonzero(sk)
    pts = np.stack([xs / PX - skel.ox, ys / PX], 1)
    for st in strokes:
        P = np.array(st['points'])
        if len(P) == 1:
            dmin = np.hypot(*(pts - P[0]).T)
        else:
            # distance from each skeleton pixel to the polyline
            dmin = np.full(len(pts), 1e9)
            for a, b in zip(P, P[1:]):
                ab = b - a
                L = max(float(ab @ ab), 1e-9)
                t = np.clip(((pts - a) @ ab) / L, 0, 1)
                proj = a + t[:, None] * ab
                dmin = np.minimum(dmin, np.hypot(*(pts - proj).T))
        hit = dmin <= radius_u
        cov[ys[hit], xs[hit]] = True
    return cov


def components(mask):
    H, W = mask.shape
    seen = np.zeros_like(mask)
    comps = []
    for y, x in zip(*np.nonzero(mask)):
        if seen[y, x]:
            continue
        stack = [(x, y)]
        seen[y, x] = True
        comp = []
        while stack:
            cx, cy = stack.pop()
            comp.append((cx, cy))
            for dx, dy in NEIGH:
                nx, ny = cx + dx, cy + dy
                if 0 <= nx < W and 0 <= ny < H and mask[ny, nx] and not seen[ny, nx]:
                    seen[ny, nx] = True
                    stack.append((nx, ny))
        comps.append(comp)
    return comps


@lru_cache(maxsize=None)
def base_offset(name, base):
    """(dx, dy) in U that best aligns the base glyph's skeleton onto `name`'s."""
    from scipy.ndimage import distance_transform_edt
    a, b = skel_for(name), skel_for(base)
    dist = distance_transform_edt(~a.sk) / PX  # U distance to derived skeleton
    H, W = dist.shape
    bx = b.pts[:, 0] / PX - b.ox
    by = b.pts[:, 1] / PX
    best = (-1, 0, 0)
    for dx in np.arange(-60, 60.5, 1.0):
        for dy in np.arange(-20, 20.5, 1.0):
            cx = np.round((bx + dx + a.ox) * PX).astype(int)
            cy = np.round((by + dy) * PX).astype(int)
            ok = (cx >= 0) & (cx < W) & (cy >= 0) & (cy < H)
            score = int(np.sum(dist[cy[ok], cx[ok]] < 2.0))
            if score > best[0]:
                best = (score, dx, dy)
    return float(best[1]), float(best[2])


@lru_cache(maxsize=None)
def _dropped(base):
    """U points of the base skeleton that the base strokes do not visit."""
    sk = skel_for(base)
    strokes = build_from_spec(base, SPEC[base])
    cov = covered_mask(sk, strokes, 6.0)
    ys, xs = np.nonzero(sk.sk & ~cov)
    return np.stack([xs / PX - sk.ox, ys / PX], 1) if len(xs) else np.zeros((0, 2))


def dropped_points(base, dx, dy):
    d = _dropped(base)
    return d + np.array([dx, dy]) if len(d) else d


def shift_spec(spec, dx, dy):
    out = []
    for st in spec:
        if isinstance(st, dict):
            out.append({'dot': (st['dot'][0] + dx, st['dot'][1] + dy)})
        else:
            out.append([(x + dx, y + dy) for x, y in st])
    return out


def route_tolerant(skel, waypoints, tol=6.0):
    """Route waypoints, truncating the stroke at the first one that is off the skeleton."""
    kept = []
    for p in waypoints:
        try:
            skel.snap(p, max_dist=tol)
        except ValueError:
            break
        kept.append(p)
    if len(kept) < 2:
        return None
    return route(skel, kept)


def build_derived(name, rule):
    base = rule['base']
    skel = skel_for(name)
    base_spec = SPEC[base] if base in SPEC else None
    if base_spec is None:
        raise KeyError('derived glyph %s needs SPEC for base %s' % (name, base))
    spec = rule.get('spec')
    if spec is None:
        dx, dy = base_offset(name, base)
        spec = shift_spec(base_spec, dx, dy)
    strokes = []
    for st in spec:
        if isinstance(st, dict):
            strokes.append({'dot': True, 'points': [tuple(st['dot'])]})
        else:
            pts = route_tolerant(skel, st)
            if pts:
                strokes.append({'points': pts})
    for extra in rule.get('extra', []):
        if extra == 'auto':
            add_residual(skel, strokes, dropped_points(base, *base_offset(name, base)))
        else:
            strokes.extend(build_from_spec(name, [extra], skel))
    return strokes


def _u(skel, px):
    return (px[0] / PX - skel.ox, px[1] / PX)


def _px(skel, u):
    return (int(round((u[0] + skel.ox) * PX)), int(round(u[1] * PX)))


def skeleton_graph(mask):
    """Nodes (endpoint / junction pixel clusters) and edges (pixel chains) of a skeleton."""
    H, W = mask.shape
    pix = set(zip(*np.nonzero(mask.T)))  # (x, y)

    def nbrs(p):
        return [(p[0] + dx, p[1] + dy) for dx, dy in NEIGH if (p[0] + dx, p[1] + dy) in pix]

    deg = {p: len(nbrs(p)) for p in pix}
    node_pix = {p for p, d in deg.items() if d != 2}
    # cluster adjacent node pixels
    node_of = {}
    nodes = []
    for p in node_pix:
        if p in node_of:
            continue
        stack, comp = [p], []
        node_of[p] = len(nodes)
        while stack:
            q = stack.pop()
            comp.append(q)
            for r in nbrs(q):
                if r in node_pix and r not in node_of:
                    node_of[r] = len(nodes)
                    stack.append(r)
        nodes.append(comp)
    edges = []
    used = set()
    for ni, comp in enumerate(nodes):
        for q in comp:
            for r in nbrs(q):
                if r in node_pix or (q, r) in used:
                    continue
                chain = [q, r]
                used.add((q, r))
                prev, cur = q, r
                while cur not in node_pix:
                    nxt = [t for t in nbrs(cur) if t != prev and t not in chain[-3:]]
                    if not nxt:
                        break
                    # prefer the 4-neighbour to avoid diagonal shortcuts
                    nxt.sort(key=lambda t: abs(t[0] - cur[0]) + abs(t[1] - cur[1]))
                    prev, cur = cur, nxt[0]
                    chain.append(cur)
                if cur in node_pix:
                    used.add((cur, prev))
                    edges.append({'a': ni, 'b': node_of[cur], 'pix': chain})
    # pure cycles without any node
    in_edges = {p for e in edges for p in e['pix']}
    rest = pix - in_edges - node_pix
    while rest:
        p0 = next(iter(rest))
        chain, prev, cur = [p0], None, p0
        while True:
            nxt = [t for t in nbrs(cur) if t != prev and t in rest and t not in chain]
            if not nxt:
                break
            prev, cur = cur, nxt[0]
            chain.append(cur)
        rest -= set(chain)
        nodes.append([p0])
        edges.append({'a': len(nodes) - 1, 'b': len(nodes) - 1, 'pix': chain + [p0]})
    # contract tiny edges between junction clusters (one junction split in two)
    deg = {}
    for e in edges:
        deg[e['a']] = deg.get(e['a'], 0) + 1
        deg[e['b']] = deg.get(e['b'], 0) + 1
    parent = list(range(len(nodes)))

    def find(i):
        while parent[i] != i:
            parent[i] = parent[parent[i]]
            i = parent[i]
        return i
    keep = []
    for e in edges:
        if e['a'] != e['b'] and len(e['pix']) < 24 and deg[e['a']] >= 3 and deg[e['b']] >= 3:
            parent[find(e['a'])] = find(e['b'])
        else:
            keep.append(e)
    merged = {}
    for i in range(len(nodes)):
        merged.setdefault(find(i), []).extend(nodes[i])
    for e in keep:
        e['a'], e['b'] = find(e['a']), find(e['b'])
    nodes = [merged.get(i, nodes[i][:1]) if find(i) == i else nodes[i][:1] for i in range(len(nodes))]
    return nodes, keep


def _dir(pixels, n=10):
    a = np.array(pixels[0], float)
    b = np.array(pixels[min(n, len(pixels) - 1)], float)
    v = b - a
    return v / (np.hypot(*v) + 1e-9)


def _is_overhang(e, deg):
    """A short horizontal top bar ending in a free end on the right (print overhang)."""
    pix = e['pix']
    if deg.get(e['a']) == 1:
        pix = pix[::-1]
    elif deg.get(e['b']) != 1:
        return False
    P = np.array(pix, float) / PX
    return (np.ptp(P[:, 1]) < 4 and np.ptp(P[:, 0]) < 46 and P[-1, 0] > P[0, 0]
            and P[:, 1].mean() < 100)


def _reachable_edges(edges, unused, node):
    seen_n, seen_e, stack = {node}, set(), [node]
    while stack:
        n = stack.pop()
        for i in unused:
            e = edges[i]
            if n in (e['a'], e['b']):
                seen_e.add(i)
                for m in (e['a'], e['b']):
                    if m not in seen_n:
                        seen_n.add(m)
                        stack.append(m)
    return seen_e


def walk_graph(nodes, edges, start_node, in_dir, min_spur_px=12):
    """Walk the edges reachable from start_node (Fleury: avoid bridges while possible),
    preferring the straightest continuation at each junction."""
    deg = {}
    for e in edges:
        deg[e['a']] = deg.get(e['a'], 0) + 1
        deg[e['b']] = deg.get(e['b'], 0) + 1
    unused = set()
    for i, e in enumerate(edges):
        spur = (deg[e['a']] == 1 or deg[e['b']] == 1) and len(e['pix']) < min_spur_px
        if (not spur and not _is_overhang(e, deg)) or start_node in (e['a'], e['b']):
            unused.add(i)
    path = list(nodes[start_node][:1])
    cur, d = start_node, in_dir
    while True:
        cands = []
        for i in unused:
            e = edges[i]
            if e['a'] == cur:
                cands.append((i, e['pix'], e['b']))
            if e['b'] == cur:
                cands.append((i, e['pix'][::-1], e['a']))
        if not cands:
            break
        if len(cands) > 1:
            total = len(_reachable_edges(edges, unused, cur))
            safe = []
            for c in cands:
                rest = unused - {c[0]}
                if len(_reachable_edges(edges, rest, c[2])) == total - 1 or not rest:
                    safe.append(c)
            cands = safe or cands
        if d is None:
            i, pixs, nxt = max(cands, key=lambda c: len(c[1]))
        else:
            i, pixs, nxt = max(cands, key=lambda c: float(_dir(c[1]) @ d))
        unused.discard(i)
        path.extend(pixs)
        cur = nxt
        d = -_dir(pixs[::-1])
    return path, unused


def add_residual(skel, strokes, dropped=None):
    """Append strokes for skeleton parts not covered by `strokes` (dots, vowel-sign tails).

    `dropped` is a list of U points that belong to parts of the base letter the
    handwriting model leaves out on purpose (print overhangs); they stay out.
    """
    cov = covered_mask(skel, strokes, 6.0)
    if dropped is not None and len(dropped):
        cov |= covered_mask(skel, [{'points': [tuple(p)]} for p in dropped], 4.0)
    # filled dots (pulli) have no useful skeleton: find small blobs in the glyph mask
    for comp in components(skel.mask):
        P = np.array(comp)
        span = (P.max(0) - P.min(0)) / PX
        if max(span) < 32 and not np.any(cov[P[:, 1], P[:, 0]]):
            c = _u(skel, P.mean(0))
            if not any(st.get('dot') and math.dist(st['points'][0], c) < 5 for st in strokes):
                strokes.append({'dot': True, 'points': [(round(c[0], 1), round(c[1], 1))]})
            cov[P[:, 1], P[:, 0]] = True
    resid = skel.sk & ~cov
    comps = [c for c in components(resid) if len(c) >= 6 * PX]
    comps.sort(key=lambda c: (min(p[0] for p in c), min(p[1] for p in c)))
    for comp in comps:
        P = np.array(comp)
        span = (P.max(0) - P.min(0)) / PX
        if max(span) < 16 and not any(_near_stroke(skel, st, P, 7.0) for st in strokes if not st.get('dot')):
            c = _u(skel, P.mean(0))
            strokes.append({'dot': True, 'points': [(round(c[0], 1), round(c[1], 1))]})
            continue
        sub = np.zeros_like(resid)
        for x, y in comp:
            sub[y, x] = True
        nodes, edges = skeleton_graph(sub)
        # attachment: the residual node closest to an existing stroke
        best = None
        for si, st in enumerate(strokes):
            if st.get('dot'):
                continue
            Q = np.array([_px(skel, q) for q in st['points']], float)
            for ni, nd in enumerate(nodes):
                for p in nd:
                    dd = np.hypot(*(Q - np.array(p, float)).T)
                    j = int(np.argmin(dd))
                    if best is None or dd[j] < best[0]:
                        best = (dd[j], si, j, ni)
        if best is None:
            nodes_sorted = 0
            path, _ = walk_graph(nodes, edges, 0, None)
            attach_stroke, attach_idx = None, None
        else:
            _, attach_stroke, attach_idx, ni = best
            st = strokes[attach_stroke]['points']
            # bridge from the stroke point to the residual along the full skeleton
            a = skel.snap(st[attach_idx], max_dist=20)
            b = nodes[ni][0]
            bridge = skel.path(a, b)
            in_dir = _dir(bridge[::-1][:12][::-1]) if len(bridge) > 3 else None
            path, _ = walk_graph(nodes, edges, ni, in_dir)
            path = bridge[:-1] + path
        pts = [_u(skel, p) for p in path]
        pts = rdp(smooth(pts, 3), 0.35)
        pts = [(round(x, 1), round(y, 1)) for x, y in pts]
        last = strokes[attach_stroke]['points'] if attach_stroke is not None else None
        if last is not None and attach_stroke == len(strokes) - 1 and \
                math.dist(last[attach_idx], last[-1]) < 8:
            strokes[attach_stroke]['points'] = last[:attach_idx + 1] + pts[1:]
        else:
            strokes.append({'points': pts})
        _leftovers(skel, nodes, edges, path, strokes)


def _leftovers(skel, nodes, edges, path, strokes):
    """Edges the walk could not reach in one stroke become extra strokes, except
    short horizontal print overhangs, which are dropped."""
    on_path = set(path)
    left = [e for e in edges if sum(p in on_path for p in e['pix']) < 0.5 * len(e['pix'])]
    for e in left:
        P = np.array(e['pix'], float) / PX
        if len(e['pix']) < 36:
            continue  # junction stub
        if np.ptp(P[:, 1]) < 4 and np.ptp(P[:, 0]) < 45:
            continue  # overhang of a top bar
        pix = e['pix']
        # draw downward / rightward
        if (pix[-1][1] - pix[0][1]) < -abs(pix[-1][0] - pix[0][0]) or \
                (abs(pix[-1][1] - pix[0][1]) < abs(pix[-1][0] - pix[0][0]) and pix[-1][0] < pix[0][0]):
            pix = pix[::-1]
        pts = rdp(smooth([_u(skel, p) for p in pix], 3), 0.35)
        strokes.append({'points': [(round(x, 1), round(y, 1)) for x, y in pts]})


def _near_stroke(skel, st, P, r):
    Q = np.array([_px(skel, q) for q in st['points']], float)
    for p in P[::4]:
        if np.min(np.hypot(*(Q - p).T)) < r * PX:
            return True
    return False


def build_glyph(name):
    if name in SPEC:
        return build_from_spec(name, SPEC[name])
    if name in DERIVED:
        return build_derived(name, DERIVED[name])
    raise KeyError('no stroke spec for glyph ' + name)


def all_glyph_names():
    from glyphlib import GS
    return list(SPEC.keys()) + [n for n in DERIVED if n not in SPEC and n in GS]


VOWELS = 'அஆஇஈஉஊஎஏஐஒஓஔ'
CONSONANTS = 'கஙசஞடணதநபமயரலவழளறன'
GRANTHA = ['ஜ', 'ஷ', 'ஸ', 'ஹ', 'க்ஷ']
SIGNS = ['', '\u0bcd', '\u0bbe', '\u0bbf', '\u0bc0', '\u0bc1', '\u0bc2', '\u0bc6', '\u0bc7', '\u0bc8',
         '\u0bca', '\u0bcb', '\u0bcc']


def all_graphemes():
    out = list(VOWELS) + ['ஃ']
    for c in list(CONSONANTS) + GRANTHA:
        out += [c + sg for sg in SIGNS]
    out.append('ஸ்ரீ')
    return out


def export():
    glyphs = {}
    graphemes = {}
    for g in all_graphemes():
        parts = shape(g)
        graphemes[g] = [[p['glyph'], round(p['x'], 1)] for p in parts]
        for p in parts:
            if p['glyph'] not in glyphs:
                st = build_glyph(p['glyph'])
                glyphs[p['glyph']] = {
                    'adv': round(p['adv'], 1),
                    'strokes': [
                        {'dot': True, 'p': [[round(x), round(y)] for x, y in s['points']]} if s.get('dot')
                        else {'p': [[round(x), round(y)] for x, y in rdp(s['points'], 0.6)]}
                        for s in st
                    ],
                }
    data = {
        'unitsPerEm': 200,
        'ascent': 0, 'baseline': round(ASC * K, 1), 'descent': round((ASC - DESC) * K, 1),
        'note': 'Generated by tools/build_strokes.py from Noto Sans Tamil (SIL OFL). '
                'Coordinates: 200 units per em, y down from the ascent line.',
        'glyphs': glyphs,
        'graphemes': graphemes,
    }
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, separators=(',', ':'))
    print('wrote', OUT, len(glyphs), 'glyphs', len(graphemes), 'graphemes',
          os.path.getsize(OUT) // 1024, 'KB')


if __name__ == '__main__':
    if len(sys.argv) > 1:
        for n in sys.argv[1:]:
            st = build_glyph(n)
            print(n, [len(s['points']) for s in st])
    else:
        export()
