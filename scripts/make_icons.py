"""Draw the app icon (a staircase of unit cubes with a flag) as PNGs and SVG.

Run: python3 scripts/make_icons.py   (needs Pillow)
"""
from pathlib import Path
from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parent.parent / "icons"
BG = (37, 99, 235)
CUBES = [(245, 184, 0), (240, 127, 29), (229, 72, 77)]
WHITE = (255, 255, 255)


def draw(size: int, scale: float = 1.0) -> Image.Image:
    big = size * 4  # supersample for smooth edges
    img = Image.new("RGB", (big, big), BG)
    d = ImageDraw.Draw(img)
    s = big * 0.17 * scale  # cube size
    gap = s * 0.1
    width = 3 * s + 2 * gap
    x0 = (big - width) / 2
    height = 3 * s + 2 * gap + 1.25 * s  # cubes plus the flag
    base = (big + height) / 2
    r = s * 0.16
    for col in range(3):
        for k in range(col + 1):
            x = x0 + col * (s + gap)
            y = base - (k + 1) * s - k * gap
            d.rounded_rectangle([x, y, x + s, y + s], radius=r, fill=CUBES[col])
            light = tuple(int(c + (255 - c) * 0.45) for c in CUBES[col])
            d.rounded_rectangle([x + s * 0.18, y + s * 0.18, x + s * 0.82, y + s * 0.82], radius=r * 0.6, outline=light, width=max(2, int(s * 0.05)))
    # flag on the top step
    px = x0 + 2 * (s + gap) + s * 0.5
    top = base - 3 * s - 2 * gap
    pole_top = top - s * 1.25
    d.rectangle([px - s * 0.05, pole_top, px + s * 0.05, top], fill=WHITE)
    d.polygon([(px + s * 0.05, pole_top), (px + s * 0.75, pole_top + s * 0.28), (px + s * 0.05, pole_top + s * 0.56)], fill=WHITE)
    return img.resize((size, size), Image.LANCZOS)


SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
<rect width="100" height="100" rx="22" fill="#2563eb"/>
<g>
<rect x="24" y="62" width="16" height="16" rx="3" fill="#f5b800"/>
<rect x="42" y="62" width="16" height="16" rx="3" fill="#f07f1d"/>
<rect x="42" y="44" width="16" height="16" rx="3" fill="#f07f1d"/>
<rect x="60" y="62" width="16" height="16" rx="3" fill="#e5484d"/>
<rect x="60" y="44" width="16" height="16" rx="3" fill="#e5484d"/>
<rect x="60" y="26" width="16" height="16" rx="3" fill="#e5484d"/>
<rect x="67" y="8" width="2" height="18" fill="#fff"/>
<path d="M69 8l11 4.5L69 17z" fill="#fff"/>
</g>
</svg>
"""

if __name__ == "__main__":
    OUT.mkdir(exist_ok=True)
    draw(180).save(OUT / "apple-touch-icon.png")
    draw(192).save(OUT / "icon-192.png")
    draw(512).save(OUT / "icon-512.png")
    draw(512, scale=0.78).save(OUT / "icon-maskable-512.png")
    (OUT / "icon.svg").write_text(SVG)
    print("icons written to", OUT)
