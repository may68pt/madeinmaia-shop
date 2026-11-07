#!/usr/bin/env python3
"""CyberPet sprite pipeline: turn ChatGPT green-screen images into app-ready sprites.

  single  IMAGE --set SET [--name NAME] [--height PX]
  sheet   IMAGE --grid COLSxROWS --set SET --name NAME [--height PX] [--fps N] [--frames a,b,c]

What it does:
  1. removes the #00FF00 background (soft edge + green spill removal)
  2. trims frames to one shared box with a shared bottom baseline, so animations don't jitter
  3. scales to --height, writes WebP plus a half-size @lo copy into public/petz/x/art/<set>/
  4. for sheets: also writes NAME_strip.webp (frames side by side) and NAME.json {w,h,n,fps,ax}
  5. adds the files to public/petz/x/sets.json
Needs Pillow (pip install pillow).
"""
import argparse
import json
import os
import sys

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ART = os.path.join(ROOT, "public", "petz", "x", "art")
SETS = os.path.join(ROOT, "public", "petz", "x", "sets.json")


def key_green(im, tol=110, soft=60):
    """Alpha from distance to pure green; also pulls green spill out of edge pixels."""
    im = im.convert("RGBA")
    px = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            greenness = g - max(r, b)
            if greenness > tol:
                px[x, y] = (0, 0, 0, 0)
            elif greenness > tol - soft:
                k = (tol - greenness) / soft
                px[x, y] = (r, min(g, max(r, b)), b, int(a * k))
            elif greenness > 0:
                px[x, y] = (r, min(g, max(r, b) + 10), b, a)
    return im


def bbox(im):
    return im.getchannel("A").point(lambda v: 255 if v > 12 else 0).getbbox()


def union(boxes):
    boxes = [b for b in boxes if b]
    if not boxes:
        return None
    return (min(b[0] for b in boxes), min(b[1] for b in boxes), max(b[2] for b in boxes), max(b[3] for b in boxes))


def save_pair(im, folder, name):
    os.makedirs(folder, exist_ok=True)
    hi = os.path.join(folder, name + ".webp")
    im.save(hi, "WEBP", quality=88, method=6)
    lo = im.resize((max(1, im.width // 2), max(1, im.height // 2)), Image.LANCZOS)
    lo.save(os.path.join(folder, name + "@lo.webp"), "WEBP", quality=82, method=6)
    return name + ".webp"


def scale_to(im, height):
    if not height or im.height == height:
        return im
    k = height / im.height
    return im.resize((max(1, round(im.width * k)), height), Image.LANCZOS)


def register(set_name, files, json_file=None):
    data = json.load(open(SETS)) if os.path.exists(SETS) else {"sets": {}}
    s = data["sets"].setdefault(set_name, {"files": [], "json": None, "lo": True})
    for f in files:
        if f not in s["files"]:
            s["files"].append(f)
    s["lo"] = True
    if json_file:
        s["json"] = json_file
    with open(SETS, "w") as fh:
        json.dump(data, fh, indent=2)
        fh.write("\n")


def cmd_single(a):
    im = key_green(Image.open(a.image))
    b = bbox(im)
    if not b:
        sys.exit("No artwork found after removing the green background")
    im = scale_to(im.crop(b), a.height)
    name = a.name or os.path.splitext(os.path.basename(a.image))[0]
    f = save_pair(im, os.path.join(ART, a.set), name)
    register(a.set, [f])
    print(f"{a.set}/{f}  {im.width}x{im.height}")


def cmd_sheet(a):
    cols, rows = (int(v) for v in a.grid.lower().split("x"))
    sheet = key_green(Image.open(a.image))
    cw, ch = sheet.width // cols, sheet.height // rows
    cells = [sheet.crop((c * cw, r * ch, (c + 1) * cw, (r + 1) * ch)) for r in range(rows) for c in range(cols)]
    boxes = [bbox(c) for c in cells]
    keep = [i for i, b in enumerate(boxes) if b]
    box = union([boxes[i] for i in keep])
    if not box:
        sys.exit("No frames found")
    frames = [scale_to(cells[i].crop(box), a.height) for i in keep]
    names = a.frames.split(",") if a.frames else [f"{a.name}_{i}" for i in range(len(frames))]
    folder = os.path.join(ART, a.set)
    files = [save_pair(fr, folder, names[i] if i < len(names) else f"{a.name}_{i}") for i, fr in enumerate(frames)]
    # animation strip + frame data (ax = anchor x in the frame, baseline is the bottom edge)
    w, h = frames[0].size
    strip = Image.new("RGBA", (w * len(frames), h), (0, 0, 0, 0))
    for i, fr in enumerate(frames):
        strip.paste(fr, (i * w, 0))
    files.append(save_pair(strip, folder, a.name + "_strip"))
    meta = {"w": w, "h": h, "n": len(frames), "fps": a.fps, "ax": w // 2, "strip": a.name + "_strip.webp"}
    jpath = os.path.join(folder, a.name + ".json")
    allj = {}
    index = os.path.join(folder, "frames.json")
    if os.path.exists(index):
        allj = json.load(open(index))
    allj[a.name] = meta
    json.dump(meta, open(jpath, "w"), indent=2)
    json.dump(allj, open(index, "w"), indent=2)
    register(a.set, files, "frames.json")
    print(f"{a.set}: {len(frames)} frames {w}x{h} -> {a.name}_strip.webp")


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest="cmd", required=True)
    s1 = sub.add_parser("single")
    s1.add_argument("image"); s1.add_argument("--set", required=True); s1.add_argument("--name"); s1.add_argument("--height", type=int, default=0)
    s2 = sub.add_parser("sheet")
    s2.add_argument("image"); s2.add_argument("--grid", required=True); s2.add_argument("--set", required=True); s2.add_argument("--name", required=True)
    s2.add_argument("--height", type=int, default=0); s2.add_argument("--fps", type=int, default=8); s2.add_argument("--frames")
    a = p.parse_args()
    (cmd_single if a.cmd == "single" else cmd_sheet)(a)


if __name__ == "__main__":
    main()
