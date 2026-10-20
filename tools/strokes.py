"""Route hand-authored stroke waypoints along glyph skeletons.

Each stroke in tools/stroke_spec.py is a short list of waypoints (U units, see
glyphlib). Consecutive waypoints are snapped to the glyph's skeleton and joined
by the shortest path *along the skeleton*, so a handful of points is enough to
reproduce the exact centre-line of the printed letter. Parts of the skeleton
that no stroke visits (e.g. decorative overhangs of print fonts) are simply
dropped, which gives a clean handwriting model of the letter.
"""
import heapq
import math

import numpy as np

from glyphlib import PX, raster, skeleton

NEIGH = [(-1, -1), (-1, 0), (-1, 1), (0, -1), (0, 1), (1, -1), (1, 0), (1, 1)]


class Skeleton:
    def __init__(self, glyph_xs):
        self.mask, self.ox = raster(glyph_xs)
        self.sk = skeleton(self.mask)
        ys, xs = np.nonzero(self.sk)
        self.pts = np.stack([xs, ys], axis=1)  # pixel coords (x, y)

    def snap(self, p, max_dist=14.0):
        """Nearest skeleton pixel to U-point p."""
        px = np.array([(p[0] + self.ox) * PX, p[1] * PX])
        d = np.hypot(*(self.pts - px).T)
        i = int(np.argmin(d))
        if d[i] / PX > max_dist:
            raise ValueError('waypoint %r is %.1f U from the skeleton' % (p, d[i] / PX))
        return tuple(int(v) for v in self.pts[i])

    def path(self, a, b):
        """Dijkstra along skeleton pixels from a to b (pixel coords)."""
        if a == b:
            return [a]
        H, W = self.sk.shape
        dist = {a: 0.0}
        prev = {}
        pq = [(0.0, a)]
        while pq:
            d, u = heapq.heappop(pq)
            if u == b:
                break
            if d > dist[u]:
                continue
            x, y = u
            for dx, dy in NEIGH:
                v = (x + dx, y + dy)
                if 0 <= v[0] < W and 0 <= v[1] < H and self.sk[v[1], v[0]]:
                    nd = d + (1.4142 if dx and dy else 1.0)
                    if nd < dist.get(v, 1e18):
                        dist[v] = nd
                        prev[v] = u
                        heapq.heappush(pq, (nd, v))
        if b not in dist:
            raise ValueError('no skeleton path between %r and %r' % (a, b))
        out = [b]
        while out[-1] != a:
            out.append(prev[out[-1]])
        return out[::-1]


def smooth(pts, k=3):
    if len(pts) < 2 * k + 1:
        return pts
    arr = np.array(pts, dtype=float)
    out = arr.copy()
    for i in range(len(arr)):
        lo, hi = max(0, i - k), min(len(arr), i + k + 1)
        out[i] = arr[lo:hi].mean(axis=0)
    out[0], out[-1] = arr[0], arr[-1]
    return [tuple(p) for p in out]


def rdp(pts, eps):
    if len(pts) < 3:
        return pts
    a, b = np.array(pts[0]), np.array(pts[-1])
    ab = b - a
    n = np.hypot(*ab)
    best, idx = -1.0, 0
    for i in range(1, len(pts) - 1):
        p = np.array(pts[i])
        if n < 1e-9:
            d = np.hypot(*(p - a))
        else:
            d = abs(ab[0] * (a[1] - p[1]) - ab[1] * (a[0] - p[0])) / n
        if d > best:
            best, idx = d, i
    if best > eps:
        return rdp(pts[:idx + 1], eps)[:-1] + rdp(pts[idx:], eps)
    return [pts[0], pts[-1]]


def route(skel, waypoints):
    snapped = [skel.snap(p) for p in waypoints]
    pix = [snapped[0]]
    for a, b in zip(snapped, snapped[1:]):
        seg = skel.path(a, b)
        pix.extend(seg[1:])
    pts = [(x / PX - skel.ox, y / PX) for x, y in pix]
    pts = smooth(pts, 3)
    pts = rdp(pts, 0.35)
    return [(round(x, 1), round(y, 1)) for x, y in pts]


def polyline_length(pts):
    return sum(math.dist(a, b) for a, b in zip(pts, pts[1:]))
