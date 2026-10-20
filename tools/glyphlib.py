"""Shared helpers: shape Tamil text with HarfBuzz, rasterize glyphs, skeletonize.

Coordinate system ("U" units, 200 per em): x = font_x * K measured from the
glyph origin, y = (ascent - font_y) * K measured downward from the ascent line.
"""
import os
import numpy as np
import pathops
import uharfbuzz as hb
from fontTools.ttLib import TTFont
from fontTools.pens.basePen import BasePen
from fontTools.pens.svgPathPen import SVGPathPen
from PIL import Image, ImageDraw
from skimage.morphology import skeletonize

HERE = os.path.dirname(os.path.abspath(__file__))
FONT = os.path.join(HERE, 'fonts', 'NotoSansTamil-Regular.ttf')
TT = TTFont(FONT)
UPEM = TT['head'].unitsPerEm
ASC = TT['hhea'].ascent
DESC = TT['hhea'].descent
ORDER = TT.getGlyphOrder()
K = 200.0 / UPEM
GS = TT.getGlyphSet()
_face = hb.Face(hb.Blob.from_file_path(FONT))
_font = hb.Font(_face)

PX = 2  # raster pixels per U unit


def shape(text):
    buf = hb.Buffer()
    buf.add_str(text)
    buf.guess_segment_properties()
    hb.shape(_font, buf, {})
    out = []
    x = 0
    for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
        out.append({'glyph': ORDER[info.codepoint], 'x': (x + pos.x_offset) * K,
                    'adv': pos.x_advance * K})
        x += pos.x_advance
    return out


class _PolyPen(BasePen):
    def __init__(self, gs):
        super().__init__(gs)
        self.polys = []
        self.cur = []

    def _moveTo(self, p):
        self.cur = [p]

    def _lineTo(self, p):
        self.cur.append(p)

    def _curveToOne(self, p1, p2, p3):
        p0 = self.cur[-1]
        for t in np.linspace(0, 1, 12)[1:]:
            mt = 1 - t
            self.cur.append((mt**3*p0[0] + 3*mt*mt*t*p1[0] + 3*mt*t*t*p2[0] + t**3*p3[0],
                             mt**3*p0[1] + 3*mt*mt*t*p1[1] + 3*mt*t*t*p2[1] + t**3*p3[1]))

    def _qCurveToOne(self, p1, p2):
        p0 = self.cur[-1]
        for t in np.linspace(0, 1, 10)[1:]:
            mt = 1 - t
            self.cur.append((mt*mt*p0[0] + 2*mt*t*p1[0] + t*t*p2[0], mt*mt*p0[1] + 2*mt*t*p1[1] + t*t*p2[1]))

    def _closePath(self):
        if self.cur:
            self.polys.append(self.cur)
        self.cur = []

    _endPath = _closePath


def glyph_polys(name):
    # remove overlaps first so that an even-odd fill is correct
    path = pathops.Path()
    GS[name].draw(pathops.PathPen(path, GS))
    path.simplify(fix_winding=True)
    pen = _PolyPen(GS)
    path.draw(pen)
    return [[(x * K, (ASC - y) * K) for x, y in poly] for poly in pen.polys]


def glyph_svg_path(name, dx=0.0):
    """SVG path data in U units (y down)."""
    pen = SVGPathPen(GS)
    GS[name].draw(pen)
    # transform by re-drawing through polys is lossy; instead emit transformed commands
    from fontTools.pens.transformPen import TransformPen
    pen2 = SVGPathPen(GS, ntos=lambda v: ('%.1f' % v).rstrip('0').rstrip('.'))
    tp = TransformPen(pen2, (K, 0, 0, -K, dx, ASC * K))
    GS[name].draw(tp)
    return pen2.getCommands()


def raster(glyph_xs, width_u=None, height_u=None):
    """Rasterize a list of (glyph, x_offset) at PX px per U.

    Returns (mask, ox): pixel column c corresponds to U x = c / PX - ox, so
    glyph parts left of the origin (vowel signs) are not cut off.
    """
    polys = [[(x + x0, y) for x, y in poly] for g, x0 in glyph_xs for poly in glyph_polys(g)]
    minx = min((x for poly in polys for x, _ in poly), default=0)
    ox = max(0.0, -minx) + 8 if minx < 4 else 0.0
    if height_u is None:
        height_u = (ASC - DESC) * K
    if width_u is None:
        width_u = max(x + GS[g].width * K for g, x in glyph_xs) + 10 + ox
        width_u = max(width_u, max((x for poly in polys for x, _ in poly), default=0) + ox + 10)
    W, H = int(width_u * PX), int(height_u * PX)
    acc = np.zeros((H, W), dtype=bool)
    for g, x0 in glyph_xs:
        gl = np.zeros((H, W), dtype=bool)
        for poly in glyph_polys(g):
            im = Image.new('1', (W, H), 0)
            ImageDraw.Draw(im).polygon([((x + x0 + ox) * PX, y * PX) for x, y in poly], fill=1)
            gl ^= np.array(im, dtype=bool)
        acc |= gl
    return acc, ox


def skeleton(mask):
    return skeletonize(mask)
