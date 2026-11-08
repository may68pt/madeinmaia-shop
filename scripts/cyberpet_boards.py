#!/usr/bin/env python3
"""Extract game assets from the CyberPet concept boards (design batch of 2026-11-07).

  python3 scripts/cyberpet_boards.py <boards_dir> [--qa out_dir]

The boards are presentation sheets: each illustration sits in a framed panel with a title strip
(and, on the petting board, a zone footer) on a dark navy background. This script:
  1. crops each panel's artwork (inside the frame, below the title, above any footer)
  2. upscales 2x (Lanczos + light unsharp) so close-ups hold up full-screen on phones
  3. character shots stay opaque (the app blends their edges with a soft mask);
     FX overlays get a real alpha channel keyed from the dark background (glows, fog, smears)
  4. writes WebP (+ half-size @lo for low-end phones) into public/petz/x/art/<set>/
  5. writes <set>/frames.json with ids, labels, sizes and per-set metadata, and registers the sets in sets.json
Needs Pillow + numpy.
"""
import json
import os
import sys

import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ART = os.path.join(ROOT, "public", "petz", "x", "art")
SETS = os.path.join(ROOT, "public", "petz", "x", "sets.json")

# panel boxes (x0, x1) per column and (y0, y1) per row, measured from the border lines on each board
BOARDS = {
    "expr": {
        "file": "cyberpet_expressions_atlas.png", "kind": "shot",
        "cols": [(14, 300), (310, 580), (590, 863), (872, 1146), (1156, 1433)],
        "rows": [(108, 304), (315, 511), (522, 718), (729, 924)], "head": 38, "foot": 0,
        "ids": ["neutral", "happy", "purr", "sleepy", "drowsy", "startled", "surprised", "confused", "proud", "clingy",
                "sulky", "annoyed", "giggle", "sneeze_windup", "sneeze", "nuzzle_ready", "tongue_playful", "pleading", "scared", "calm"],
        "labels": ["Neutral curious", "Happy", "Blissful purr", "Sleepy", "Drowsy", "Startled", "Surprised", "Confused", "Proud", "Clingy",
                   "Sulky", "Annoyed flick", "Giggling", "Sneeze windup", "Sneeze release", "Nuzzle-ready", "Tongue-out playful", "Pleading", "Scared startle", "Calm eyes-closed"],
    },
    "glass2": {
        "file": "cyberpet_glass_interaction_atlas.png", "kind": "shot",
        "cols": [(13, 362), (372, 719), (729, 1077), (1087, 1434)],
        "rows": [(107, 292), (302, 492), (502, 677), (686, 884)], "head": 34, "foot": 0,
        "ids": ["approach", "face_fill", "lick_left", "lick_right", "tongue_smear", "paw_press", "double_paw", "nose_boop",
                "fog", "nuzzle", "eye_left", "eye_right", "knock", "sleepy_cuddle", "reunion", "cling"],
        "labels": ["Approach to glass", "Face-fill idle", "Lick left", "Lick right", "Tongue smear", "Paw press flat", "Double-paw press", "Nose boop",
                   "Breath fog", "Nuzzle against glass", "Eye-follow left", "Eye-follow right", "Tap-back knock", "Sleepy fogged cuddle", "Happy reunion press", "Wants-attention cling"],
    },
    "petting": {
        "file": "cyberpet_petting_reactions_atlas.png", "kind": "shot",
        "cols": [(10, 246), (256, 486), (495, 723), (731, 959), (968, 1197), (1206, 1439)],
        "rows": [(106, 339), (350, 580), (590, 833)], "head": 36, "foot": 31,
        "ids": ["head_lean", "cheek_bliss", "chin_lift", "ear_scratch", "paw_rub", "chest_heartbeat", "belly_roll", "kneading", "purr_curl",
                "stretch", "back_arch", "tail_twitch", "giggle_nose", "sneeze_nose", "pull_away", "flinch", "massage_melt", "blissed"],
        "labels": ["Slow head stroke lean", "Cheek rub bliss", "Chin-lift slow blink", "Ear scratch delight", "Paw rub back", "Chest calm heartbeat", "Belly roll over", "Kneading", "Purr curl",
                   "Soft stretch", "Back stroke arch", "Tail-base delighted twitch", "Giggle at nose tap", "Sneeze from nose tap", "Annoyed pull-away", "Startled flinch", "Sleepy massage melt", "Fully blissed combo"],
        "headx": {"blissed": 16, "pull_away": 12},  # two-line titles
        "zones": ["head", "cheek", "chin", "ears", "paw", "chest", "belly", "paw", "body", "body", "back", "tail", "nose", "nose", "any", "any", "back", "combo"],
    },
    "glassfx": {
        "file": "cyberpet_glass_fx_atlas.png", "kind": "fx",
        "cols": [(13, 296), (307, 578), (590, 861), (872, 1143), (1154, 1434)],
        "rows": [(109, 296), (306, 499), (509, 682), (691, 887)], "head": 36, "foot": 0,
        "ids": ["fog_soft", "fog_heavy", "lick_short", "lick_long", "nose_smudge", "paw_print", "paw_double", "fingerprints", "ripple", "hearts",
                "purr_sparkle", "zzz", "surprise_lines", "anger", "sneeze_puff", "sparkles", "sweat", "reflection", "wipe", "edge_mist"],
        "labels": ["Soft breath fog", "Heavy fog", "Lick smear short", "Lick smear long", "Nose boop smudge", "Paw print", "Paw print double", "Fingerprint cluster", "Tap ripple", "Heart bubbles",
                   "Purr sparkle", "Sleepy Z trail", "Comic surprise lines", "Annoyed red flick", "Sneeze puff", "Sparkle star pair", "Tear-drop sweat", "Reflection stripe", "Wipe-clean", "Cold-glass edge mist"],
    },
}


def inner_box(im, box):
    """Shrink a panel box past its rounded border (skip pixels that still look like the frame line)."""
    x0, y0, x1, y1 = box
    a = np.asarray(im.crop(box).convert("RGB")).astype(int)
    frame = lambda px: (px[..., 2] > 110) & (px[..., 1] > 100) & (px[..., 0] < 160)
    pad = 3
    while pad < 12 and frame(a[:, pad]).mean() > 0.2: pad += 1
    return (x0 + pad + 2, y0, x1 - pad - 2, y1)


def key_dark(im):
    """Alpha from brightness over the panel's own background (for glows, fog, smears and other light effects)."""
    a = np.asarray(im.convert("RGB")).astype(np.float32)
    edge = np.concatenate([a[:6].reshape(-1, 3), a[-6:].reshape(-1, 3), a[:, :6].reshape(-1, 3), a[:, -6:].reshape(-1, 3)])
    bg = np.median(edge, axis=0)
    diff = np.clip(a - bg, 0, None)
    alpha = np.clip(diff.max(axis=2) / np.maximum(1, 255 - bg.max()), 0, 1)
    alpha = np.clip((alpha - 0.06) / 0.94, 0, 1) ** 0.85
    # recover the colour as if it had been drawn over black (premultiplied → straight)
    col = np.where(alpha[..., None] > 0.01, np.clip((a - bg * (1 - alpha[..., None])) / np.maximum(alpha[..., None], 0.01), 0, 255), 0)
    out = np.dstack([col, alpha * 255]).astype(np.uint8)
    return Image.fromarray(out, "RGBA")


def up2(im):
    big = im.resize((im.width * 2, im.height * 2), Image.LANCZOS)
    return big.filter(ImageFilter.UnsharpMask(radius=1.6, percent=60, threshold=2))


def save(im, folder, name):
    os.makedirs(folder, exist_ok=True)
    im.save(os.path.join(folder, name + ".webp"), "WEBP", quality=86, method=6)
    lo = im.resize((max(1, im.width // 2), max(1, im.height // 2)), Image.LANCZOS)
    lo.save(os.path.join(folder, name + "@lo.webp"), "WEBP", quality=80, method=6)
    return name + ".webp"


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    src = sys.argv[1]
    qa = sys.argv[sys.argv.index("--qa") + 1] if "--qa" in sys.argv else None
    sets = json.load(open(SETS)) if os.path.exists(SETS) else {"sets": {}}
    for set_name, B in BOARDS.items():
        board = Image.open(os.path.join(src, B["file"])).convert("RGB")
        folder = os.path.join(ART, set_name)
        frames, files, crops = {}, [], []
        i = 0
        for (y0, y1) in B["rows"]:
            for (x0, x1) in B["cols"]:
                if i >= len(B["ids"]):
                    break
                hx = B.get("headx", {}).get(B["ids"][i], 0)
                bx = inner_box(board, (x0, y0 + B["head"] + hx, x1, y1 - B["foot"] - 3))
                crop = board.crop(bx)
                img = up2(key_dark(crop) if B["kind"] == "fx" else crop)
                fid = B["ids"][i]
                files.append(save(img, folder, fid))
                frames[fid] = {"label": B["labels"][i], "w": img.width, "h": img.height, "src": list(bx), **({"zone": B["zones"][i]} if "zones" in B else {})}
                crops.append((fid, img))
                i += 1
        meta = {"set": set_name, "kind": B["kind"], "board": B["file"], "scale": 2,
                "note": "Cut from the 2026-11-07 concept board; base palette, tinted per variant at runtime", "frames": frames}
        json.dump(meta, open(os.path.join(folder, "frames.json"), "w"), indent=1)
        sets["sets"][set_name] = {"files": files, "json": "frames.json", "lo": True, "use": f"{B['file']} ({len(files)} {B['kind']}s)"}
        print(f"{set_name}: {len(files)} {B['kind']}s")
        if qa:  # contact sheets on dark and light backgrounds
            os.makedirs(qa, exist_ok=True)
            cw, ch = 300, 220
            for bgname, bgc in (("dark", (12, 10, 31)), ("light", (235, 235, 240))):
                sheet = Image.new("RGB", (cw * 5, ch * ((len(crops) + 4) // 5)), bgc)
                for k, (fid, img) in enumerate(crops):
                    t = img.copy(); t.thumbnail((cw - 10, ch - 10))
                    sheet.paste(t, ((k % 5) * cw + 5, (k // 5) * ch + 5), t if t.mode == "RGBA" else None)
                sheet.save(os.path.join(qa, f"{set_name}_{bgname}.png"))
    with open(SETS, "w") as fh:
        json.dump(sets, fh, indent=2); fh.write("\n")


if __name__ == "__main__":
    main()
