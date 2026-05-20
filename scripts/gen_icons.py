#!/usr/bin/env python3
"""Otterly Wallet icon generator.

Renders the otter character SVG (white) onto a soft blue squircle background
at 16/32/48/128 px for the Chrome MV3 manifest.
Requires: PIL + rsvg-convert (librsvg).
"""
import os
import subprocess
import tempfile
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(ROOT, "src", "assets")
SVG_SRC = os.path.join(ASSETS, "otter.svg")

# Brand gradient — light Arctic cyan → deep ocean blue
TOP = (108, 178, 255)
MID = (77, 142, 233)
BOT = (28, 78, 196)

def lerp(a, b, t):
    return int(a + (b - a) * t)

def gradient_layer(size):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    px = img.load()
    for y in range(size):
        t = y / max(size - 1, 1)
        if t < 0.5:
            tt = t / 0.5
            r = lerp(TOP[0], MID[0], tt)
            g = lerp(TOP[1], MID[1], tt)
            b = lerp(TOP[2], MID[2], tt)
        else:
            tt = (t - 0.5) / 0.5
            r = lerp(MID[0], BOT[0], tt)
            g = lerp(MID[1], BOT[1], tt)
            b = lerp(MID[2], BOT[2], tt)
        for x in range(size):
            px[x, y] = (r, g, b, 255)
    return img

def squircle_mask(size):
    mask = Image.new("L", (size, size), 0)
    d = ImageDraw.Draw(mask)
    radius = max(1, int(round(size * 0.225)))
    d.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=255)
    return mask

def add_gloss(img, mask, size):
    gloss = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    px = gloss.load()
    h = int(size * 0.55)
    for y in range(h):
        t = y / max(h - 1, 1)
        alpha = int(55 * (1 - t) ** 2)
        for x in range(size):
            px[x, y] = (255, 255, 255, alpha)
    masked = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    masked.paste(gloss, (0, 0), mask)
    img.alpha_composite(masked)

def render_otter_png(target_px):
    """Render the otter SVG with white fill via rsvg-convert."""
    with open(SVG_SRC, "r") as f:
        svg = f.read()
    # Override default fill to white so it pops on the blue background
    svg = svg.replace('fill="currentColor"', 'fill="#ffffff"')
    with tempfile.NamedTemporaryFile(suffix=".svg", delete=False, mode="w") as tmp:
        tmp.write(svg)
        tmp_path = tmp.name
    out_png = tmp_path.replace(".svg", ".png")
    subprocess.check_call([
        "rsvg-convert",
        "-w", str(target_px),
        "-h", str(target_px),
        tmp_path,
        "-o", out_png,
    ])
    img = Image.open(out_png).convert("RGBA")
    os.unlink(tmp_path)
    os.unlink(out_png)
    return img

def make_icon(size):
    grad = gradient_layer(size)
    mask = squircle_mask(size)
    base = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    base.paste(grad, (0, 0), mask)
    add_gloss(base, mask, size)

    # Otter scaled to ~72% of icon and centered
    otter_px = max(8, int(round(size * 0.72)))
    otter = render_otter_png(otter_px)
    ox = (size - otter.width) // 2
    oy = (size - otter.height) // 2
    base.alpha_composite(otter, (ox, oy))

    out_path = os.path.join(ASSETS, f"icon-{size}.png")
    base.save(out_path, "PNG")
    print(f"  → {out_path}")

if __name__ == "__main__":
    print("Generating Otterly icons:")
    for s in (16, 32, 48, 128):
        make_icon(s)
    print("Done.")
