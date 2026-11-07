# CyberPet sprite kit for ChatGPT

How to get art from ChatGPT that drops straight into the app. Generate in ChatGPT, send the PNGs to Claude, and Claude runs `scripts/cyberpet_sprites.py` to cut, clean, size and register them.

## 1. Start every chat the same way

Attach two or three existing CyberPet images as the style reference (for example `public/petz/c/faelix/idle.webp`, `greet.webp` and `happy.webp`), then paste this **style lock** first:

> You are drawing sprites for CyberPet, a mobile virtual pet. The pet is one hybrid creature: kitten body and face, small alien antennae, tiny dragon wing-nubs and a fox tail, with the glowing visor eyes shown in the reference images. Match the attached references exactly: same character, same proportions, same colours, same line weight and soft cel shading. Dark neon world, but the character itself is lit by soft, even front light.
>
> Rules for every image:
> - Background: solid flat pure green #00FF00, edge to edge. No gradient, no floor, no shadow on the ground, no text, no border.
> - The character never touches the green with glow or semi-transparent effects; keep glows inside the character outline.
> - Same scale and same baseline in every frame of a sheet: feet (or the bottom edge of the shape) on the same line.
> - Sheets are a strict grid with equal cells and empty green gutters between cells. Never let a pose cross into another cell.
> - Square 1024 × 1024 output unless I say otherwise.

If a result drifts off-model, reply: *"Off-model. Redraw matching the reference exactly: same face, same visor, same tail. Keep the green background."*

## 2. Sheets to make

Each block below is one prompt. The **name** column is the file name to save as (Claude uses it to map frames).

### Glass close-ups (set `glass`, block 7)

| File | Grid | Prompt |
| --- | --- | --- |
| `face.png` | 1 image | Extreme close-up of the pet's face pressed near a pane of glass, looking straight at the viewer, curious. Head fills 80% of the frame, slightly below centre. |
| `face_happy.png` | 1 image | Same framing, eyes squeezed happy, mouth open in a smile, ears up. |
| `face_sleep.png` | 1 image | Same framing, eyes closed, cheek squished as if leaning on the glass, sleepy. |
| `paw.png` | 1 image | One front paw pressed flat against glass, seen from the other side: pink paw pads squashed flat, toe beans visible, fur around it. Paw fills 70% of the frame. |
| `tongue.png` | 1 image | Just a small pink cat tongue, licking upward, isolated, centred. |
| `lick_sheet.png` | 4 × 1 | Four frames of the face licking the glass: tongue out low, tongue mid, tongue high and flattened, tongue back in. Same framing as `face.png`. |

### Petting / Paw Spa (set `petting`, block 9)

| File | Grid | Prompt |
| --- | --- | --- |
| `purr_sheet.png` | 4 × 1 | Pet lying down, eyes half closed, purring: four frames of slow breathing (chest up, up, down, down). |
| `rollover_sheet.png` | 4 × 2 | Eight frames of the pet rolling onto its back to show its belly, paws curled. |
| `stretch_sheet.png` | 4 × 1 | Four frames of a long front stretch, bum up, tail high. |
| `zones_sheet.png` | 3 × 2 | Six reaction poses: head pushing into a hand, chin up with slow blink, ears flattened happily, back arched for a scratch, paw offered, startled flinch. |

### Sleep clouds (set `clouds`, block 6)

| File | Grid | Prompt |
| --- | --- | --- |
| `clouds_sheet.png` | 3 × 2 | Six small fluffy neon dream clouds, cute, rounded: calm cyan, calm lilac, restless magenta with jagged edges, restless orange, rare golden with sparkles, rare rainbow. Each cloud alone in its cell. |

### Room interactions (set `room`, block 5)

| File | Grid | Prompt |
| --- | --- | --- |
| `use_sit_sheet.png` | 4 × 1 | Pet hopping onto and sitting on an invisible seat (keep the seat out of the image), four frames. |
| `use_play_sheet.png` | 4 × 1 | Pet batting at a toy with both paws, four frames. |
| `use_look_sheet.png` | 4 × 1 | Pet standing on hind legs peering at something at head height, four frames. |

### Rare items (back office → Rare items)

One item per image, standing on its base, centred, item fills 80% of the frame:

> A [item] for a cosy neon cyber bedroom, chunky toy-like proportions, the same soft cel shading as the references, [tier] rarity: [common = plain colours · rare = cyan glow accents · epic = purple glow and small particles · legendary = gold trim and sparkles · exclusive = magenta neon with the Made in Maia "M" mark]. Green #00FF00 background.

Upload the cleaned PNG in the item editor.

### Costume overlays (later, block 16)

Costumes are drawn once on the neutral pose and mapped onto the rig. Prompt:

> The pet in the exact neutral standing pose of the reference, wearing [costume]. Same scale and position as the reference. Green background.

## 3. Hand-off

Send Claude the PNGs with their file names. Claude runs:

```
python3 scripts/cyberpet_sprites.py sheet glass/lick_sheet.png --grid 4x1 --set glass --name lick --height 900
python3 scripts/cyberpet_sprites.py single glass/face.png --set glass --height 1000
```

which removes the green, trims every frame to a shared box with a shared baseline, writes WebP files plus half-size `@lo` copies for low-end phones into `public/petz/x/art/<set>/`, writes a frame strip and its JSON for animations, and adds them to `public/petz/x/sets.json`. The app picks them up on its next load: no code changes.
