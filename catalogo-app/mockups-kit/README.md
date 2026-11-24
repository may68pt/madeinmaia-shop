# MiMBO Mockups (configurable)

Mockups 01–10 of 16, built from the Photoshop files. Every garment in every mockup has its own
**design** and **fabric colour**. Solos have 1 garment, duos 2, the trio 3: 15 configurable garments in total.

| # | Mockup | Garments |
|---|--------|----------|
| 01 | Ribeira | 1 |
| 02 | Azulejo | 1 |
| 03 | Steps | 1 |
| 04 | Bridge | 1 |
| 05 | Balcony | 1 |
| 06 | Tram | 1 |
| 07 | Riverside | 2 |
| 08 | Stone | 2 |
| 09 | Tiles | 2 |
| 10 | Douro | 3 |
| 11–16 | awaiting PSDs | – |

## Drop into catalogo-16

Copy into the MiMBO project (for example `madeinmaia/catalogo-16/public/mockups-kit/`):

```
mimbo-mockups.js      engine + settings panel (no dependencies)
mockups/manifest.json one entry per mockup, garments with print area + default colour
mockups/<id>/...      plate.jpg, text.png, thumb.jpg, g<n>_mask|shade|printlight|disp.png
designs/              sample designs (optional)
index.html            standalone demo; the CSS in it styles the panel (.mm-*)
```

```html
<script src="/mockups-kit/mimbo-mockups.js"></script>
<script>
  await MiMBOMockups.init({ base: '/mockups-kit/mockups/' });

  // 1. Page settings panel: picker + one card per garment (colour, design, size, position)
  const panel = await MiMBOMockups.mountSettings(document.querySelector('#page-settings-mockup'), {
    config: page.settings.mockup,           // saved config, or omit for defaults
    designs: mimboDesigns.map(d => ({ name: d.name, src: d.imageUrl })), // your design library
    onChange: (cfg) => savePageSetting('mockup', cfg),
    onExport: (pngDataUrl, cfg) => download(pngDataUrl),                 // optional
    onDesignAdded: (d) => uploadToLibrary(d),                            // optional, uploads are data URLs
  });

  // 2. Draw it on a catalog page / print export (renders at 1600×2000, scales to the canvas)
  await MiMBOMockups.render(canvasOnPage, cfg.mockup, cfg);
</script>
```

### Config saved per page

```json
{
  "mockup": "10-tshirt-trio-douro",
  "showText": true,
  "warp": 3,
  "garments": [
    { "color": "#1e1f21", "design": "designs/made-in-maia.svg", "scale": 1, "x": 0, "y": 0 },
    { "color": "#e7dbc1", "design": "designs/mim-squares.png",  "scale": 1, "x": 0, "y": 0 },
    { "color": "#e7b7b4", "design": "designs/nata.svg",         "scale": 1, "x": 0, "y": 0 }
  ]
}
```

`scale` is relative to "fit the PSD print area"; `x`/`y` move the design by a fraction of the print area.
Uploaded designs come through as data URLs. Store them in your design library and save the URL instead,
so page configs stay small.

## How it matches the PSD

Each layer stack was decoded and re-composited (Over / Multiply / Photoshop Soft Light). The recomposite
matches Photoshop's own composite to under 1 level on average, so the colour and print steps behave like
double-clicking COLOR and the Smart Object:

1. `plate.jpg`: paper, photo, people, every decoration, footer/header art (they never touch a garment)
2. COLOR fill through `g<n>_mask.png` (edge smoothed and grown ~1.5 px so the original shirt's fringe doesn't show)
3. Fabric texture/lighting as a multiply map (`g<n>_shade.png`)
4. The design, fitted into the Smart Object's print rectangle, displaced by the garment's fabric map
   (`g<n>_disp.png`, the "Fabric warp" slider) and clipped to the garment
5. The print shading and grain layer, in soft light, clipped to the print (`g<n>_printlight.png`)
6. `text.png`: the template type layers (DESIGN NAME, tagline…), with an on/off toggle so MiMBO can set its own text

Note: the PSD Smart Objects stretch the 700×650 artwork into a taller box, which squashes the circle into an
oval. Here designs keep their own proportions.

## Adding mockups 11–16

Use the same PSD structure (COLOR + Fabric texture pairs, `PRINT | GARMENT n` Smart Objects, the
`fabric shading` layers, `garment-n-fabric-displacement.psd`) and the build script regenerates
`mockups/` and `manifest.json`. Hoodies work the same way; `garmentType` in the manifest says which kind it is.
