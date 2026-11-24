/* MiMBO Mockups — configurable garment mockups for MiMBO - The Good Stuff Machine
 * Every garment in every mockup gets its own design + fabric colour.
 *
 *   MiMBOMockups.init({ base: 'mockups/' })            -> loads manifest.json
 *   MiMBOMockups.render(canvas, mockupId, config)        -> draws one mockup
 *   MiMBOMockups.mountSettings(el, opts)                 -> settings panel for a MiMBO page
 *   MiMBOMockups.defaultConfig(mockupId)                 -> fresh config
 *
 * config = {
 *   mockup: '10-tshirt-trio-douro',
 *   showText: true,            // template header/footer text from the PSD
 *   warp: 3,                   // fabric displacement strength (px at 1600 wide)
 *   garments: [ { color:'#b4503c', design:'<url|dataURL|null>', scale:1, x:0, y:0 }, ... ]
 * }
 * The pipeline reproduces the PSD stack: plate -> COLOR fill (mask) -> fabric texture (multiply)
 * -> PRINT (fit into the PSD print area, displaced by the fabric map, clipped to the garment)
 * -> print shading (Photoshop soft light, clipped to the print) -> template text.
 */
(function (g) {
  'use strict';
  const S = { base: 'mockups/', manifest: null, imgs: {}, px: {} };

  const loadImg = (src) => S.imgs[src] || (S.imgs[src] = new Promise((res, rej) => {
    const i = new Image();
    i.decoding = 'async';
    i.onload = () => res(i);
    i.onerror = () => { delete S.imgs[src]; rej(new Error('Could not load ' + String(src).slice(0, 80))); };
    i.src = src;
  }));

  async function pixels(src) {
    if (S.px[src]) return S.px[src];
    const im = await loadImg(src);
    const c = document.createElement('canvas');
    c.width = im.naturalWidth; c.height = im.naturalHeight;
    const x = c.getContext('2d', { willReadFrequently: true });
    x.drawImage(im, 0, 0);
    const d = { w: c.width, h: c.height, data: x.getImageData(0, 0, c.width, c.height).data };
    S.px[src] = d;
    return d;
  }

  async function init(opts = {}) {
    if (opts.base) S.base = opts.base.replace(/\/?$/, '/');
    if (!S.manifest) {
      const r = await fetch(S.base + 'manifest.json');
      if (!r.ok) throw new Error('manifest.json not found in ' + S.base);
      S.manifest = await r.json();
    }
    return S.manifest;
  }
  const get = (id) => S.manifest.find((m) => m.id === id);
  const file = (m, f) => S.base + m.id + '/' + f;

  function defaultConfig(id) {
    const m = get(id);
    return {
      mockup: id, showText: true, warp: 3,
      garments: m.garments.map((ga) => ({ color: ga.color, design: null, scale: 1, x: 0, y: 0 })),
    };
  }

  const hexRgb = (h) => {
    const v = String(h || '#ffffff').replace('#', '');
    const n = parseInt(v.length === 3 ? v.replace(/./g, '$&$&') : v, 16) || 0;
    return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
  };
  // Photoshop soft light
  const soft = (b, s) => s <= 0.5 ? 2 * b * s + b * b * (1 - 2 * s) : 2 * b * (1 - s) + Math.sqrt(b) * (2 * s - 1);

  async function drawGarment(ctx, m, ga, gc, warp) {
    const [x0, y0, x1, y1] = ga.bbox, w = x1 - x0, h = y1 - y0;
    const [mask, shade, light] = await Promise.all([
      pixels(file(m, `g${ga.n}_mask.png`)), pixels(file(m, `g${ga.n}_shade.png`)), pixels(file(m, `g${ga.n}_printlight.png`)),
    ]);
    const reg = ctx.getImageData(x0, y0, w, h), o = reg.data;
    const [cr, cg, cb] = hexRgb(gc.color);

    // design layer, rendered into garment-bbox space
    let dd = null, disp = null;
    const [px0, py0, px1, py1] = ga.print, pw = px1 - px0, ph = py1 - py0;
    if (gc.design) {
      // a URL / data URL, or an already-loaded image or canvas (MiMBO passes its own, e.g. inverted art)
      const im0 = typeof gc.design === 'string' ? await loadImg(gc.design) : gc.design;
      const im = { img: im0, naturalWidth: im0.naturalWidth || im0.width, naturalHeight: im0.naturalHeight || im0.height };
      disp = await pixels(file(m, `g${ga.n}_disp.png`));
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      const x = c.getContext('2d', { willReadFrequently: true });
      const sc = Math.min(pw / im.naturalWidth, ph / im.naturalHeight) * (gc.scale || 1);
      const dw = im.naturalWidth * sc, dh = im.naturalHeight * sc;
      const cx = px0 + pw / 2 + (gc.x || 0) * pw - x0, cy = py0 + ph / 2 + (gc.y || 0) * ph - y0;
      x.imageSmoothingQuality = 'high';
      x.drawImage(im.img, cx - dw / 2, cy - dh / 2, dw, dh);
      dd = x.getImageData(0, 0, w, h).data;
    }
    const sample = (fx, fy, ch) => { // bilinear, premultiplied by alpha
      const ix = Math.floor(fx), iy = Math.floor(fy), ax = fx - ix, ay = fy - iy;
      let r = 0, gg = 0, b = 0, a = 0;
      for (let j = 0; j < 4; j++) {
        const xx = ix + (j & 1), yy = iy + (j >> 1);
        if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
        const wt = ((j & 1) ? ax : 1 - ax) * ((j >> 1) ? ay : 1 - ay), k = (yy * w + xx) * 4, al = dd[k + 3] * wt;
        r += dd[k] * al; gg += dd[k + 1] * al; b += dd[k + 2] * al; a += al;
      }
      ch[3] = a / 255;
      if (a > 0) { ch[0] = r / a / 255; ch[1] = gg / a / 255; ch[2] = b / a / 255; }
    };
    const ch = [0, 0, 0, 0];
    for (let yy = 0; yy < h; yy++) {
      for (let xx = 0; xx < w; xx++) {
        const i = yy * w + xx, k = i * 4, mk = mask.data[k] / 255;
        if (mk <= 0) continue;
        const M = shade.data[k] / 255;
        let r = (o[k] / 255 * (1 - mk) + cr * mk) * M;
        let gn = (o[k + 1] / 255 * (1 - mk) + cg * mk) * M;
        let b = (o[k + 2] / 255 * (1 - mk) + cb * mk) * M;
        if (dd) {
          let fx = xx, fy = yy;
          const X = xx + x0, Y = yy + y0;
          if (warp && X >= px0 && X < px1 && Y >= py0 && Y < py1) {
            const u = Math.min(disp.w - 1, ((X - px0) / pw * disp.w) | 0), v = Math.min(disp.h - 1, ((Y - py0) / ph * disp.h) | 0);
            const d = (disp.data[(v * disp.w + u) * 4] - 128) / 128 * warp;
            fx += d; fy += d;
          }
          sample(fx, fy, ch);
          const da = ch[3] * mk;
          if (da > 0) {
            r = r * (1 - da) + ch[0] * da; gn = gn * (1 - da) + ch[1] * da; b = b * (1 - da) + ch[2] * da;
            const sl = light.data[k] / 255, sa = light.data[k + 3] / 255 * da;
            if (sa > 0) {
              r = soft(r, sl) * sa + r * (1 - sa); gn = soft(gn, sl) * sa + gn * (1 - sa); b = soft(b, sl) * sa + b * (1 - sa);
            }
          }
        }
        o[k] = r * 255 + 0.5; o[k + 1] = gn * 255 + 0.5; o[k + 2] = b * 255 + 0.5;
      }
    }
    ctx.putImageData(reg, x0, y0);
  }

  // full-resolution composite (1600×2000) as an offscreen canvas
  async function compose(id, config) {
    await init();
    const m = get(id);
    if (!m) throw new Error('Unknown mockup ' + id);
    const cfg = config || defaultConfig(id);
    const off = document.createElement('canvas'); off.width = m.w; off.height = m.h;
    const ctx = off.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(await loadImg(file(m, 'plate.jpg')), 0, 0);
    for (let i = 0; i < m.garments.length; i++) {
      await drawGarment(ctx, m, m.garments[i], cfg.garments[i] || { color: m.garments[i].color }, cfg.warp ?? 3);
    }
    if (cfg.showText !== false) ctx.drawImage(await loadImg(file(m, 'text.png')), 0, 0);
    return off;
  }

  const jobs = new WeakMap();
  async function render(canvas, id, config) {
    await init();
    const m = get(id);
    if (!m) throw new Error('Unknown mockup ' + id);
    const cfg = config || defaultConfig(id);
    const ticket = {}; jobs.set(canvas, ticket);
    const off = document.createElement('canvas'); off.width = m.w; off.height = m.h;
    const ctx = off.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(await loadImg(file(m, 'plate.jpg')), 0, 0);
    for (let i = 0; i < m.garments.length; i++) {
      await drawGarment(ctx, m, m.garments[i], cfg.garments[i] || { color: m.garments[i].color }, cfg.warp ?? 3);
    }
    if (cfg.showText !== false) ctx.drawImage(await loadImg(file(m, 'text.png')), 0, 0);
    if (jobs.get(canvas) !== ticket) return null; // a newer render started
    if (!canvas.width || canvas.dataset.full) { canvas.width = m.w; canvas.height = m.h; }
    const out = canvas.getContext('2d');
    out.imageSmoothingQuality = 'high';
    out.clearRect(0, 0, canvas.width, canvas.height);
    out.drawImage(off, 0, 0, canvas.width, canvas.height);
    return off;
  }

  // ---------- settings panel ----------
  const FABRICS = [
    ['White', '#f2f0ea'], ['Natural', '#eadcc3'], ['Sand', '#d7cbbb'], ['Butter', '#e7dbc1'], ['Heather', '#b9b8b3'],
    ['Black', '#1e1f21'], ['Navy', '#1f2a44'], ['Petrol', '#34454c'], ['Denim', '#35586c'], ['Teal', '#315465'],
    ['Sage', '#597467'], ['Bottle', '#24443a'], ['Terracotta', '#b4503c'], ['Burgundy', '#5e2230'], ['Mustard', '#d4b346'], ['Pink', '#e7b7b4'],
  ];
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  async function mountSettings(el, opts = {}) {
    await init();
    const slots = opts.slots || 16;
    const designs = (opts.designs || []).slice();
    let cfg = opts.config && get(opts.config.mockup) ? opts.config : defaultConfig(opts.mockup || S.manifest[0].id);
    el.classList.add('mm');
    el.innerHTML = `
      <div class="mm-stage"><canvas class="mm-canvas" width="800" height="1000" aria-label="Mockup preview"></canvas><div class="mm-busy" hidden>Rendering…</div></div>
      <div class="mm-side">
        <div class="mm-h">Mockup</div>
        <div class="mm-picks" role="listbox" aria-label="Mockups"></div>
        <div class="mm-row">
          <label class="mm-check"><input type="checkbox" class="mm-text"> Template text</label>
          <label class="mm-warp">Fabric warp <input type="range" min="0" max="12" step="1" class="mm-warpv"></label>
        </div>
        <div class="mm-garments"></div>
        <div class="mm-actions">
          <button type="button" class="mm-btn mm-reset">Reset colours</button>
          <button type="button" class="mm-btn mm-png">Export PNG</button>
        </div>
      </div>
      <dialog class="mm-dlg"><img alt="Exported mockup"><p>Right-click or long-press the image to save it.</p><button type="button" class="mm-btn mm-close">Close</button></dialog>`;
    const $ = (s) => el.querySelector(s);
    const canvas = $('.mm-canvas'), busy = $('.mm-busy');

    const picks = $('.mm-picks');
    const thumbs = [];
    for (let i = 0; i < slots; i++) {
      const m = S.manifest[i];
      if (m) {
        thumbs.push(`<button type="button" class="mm-pick" data-id="${esc(m.id)}" role="option" title="${esc(m.name)}">
          <img loading="lazy" src="${esc(file(m, 'thumb.jpg'))}" alt=""><span>${String(m.num).padStart(2, '0')} ${esc(m.name)}<b>${m.garments.length}×</b></span></button>`);
      } else {
        thumbs.push(`<div class="mm-pick mm-empty"><span>${String(i + 1).padStart(2, '0')}<br>awaiting PSD</span></div>`);
      }
    }
    picks.innerHTML = thumbs.join('');

    let timer = 0;
    const changed = () => { opts.onChange && opts.onChange(JSON.parse(JSON.stringify(cfg))); clearTimeout(timer); timer = setTimeout(draw, 60); };
    async function draw() {
      busy.hidden = false;
      try { await render(canvas, cfg.mockup, cfg); } catch (e) { console.error(e); busy.textContent = e.message; return; }
      busy.hidden = true;
    }

    function designOptions(sel) {
      return `<option value="">— none —</option>` + designs.map((d) => `<option value="${esc(d.src)}"${d.src === sel ? ' selected' : ''}>${esc(d.name)}</option>`).join('');
    }
    function garmentsUI() {
      const m = get(cfg.mockup);
      $('.mm-text').checked = cfg.showText !== false;
      $('.mm-warpv').value = cfg.warp ?? 3;
      picks.querySelectorAll('.mm-pick[data-id]').forEach((b) => b.setAttribute('aria-selected', b.dataset.id === cfg.mockup));
      $('.mm-garments').innerHTML = m.garments.map((ga, i) => {
        const gc = cfg.garments[i];
        return `<fieldset class="mm-g" data-i="${i}">
          <legend><i style="background:${esc(gc.color)}"></i>Garment ${ga.n}<small>${i === 0 && m.garments.length > 1 ? 'left' : i === m.garments.length - 1 && m.garments.length > 1 ? 'right' : m.garments.length > 1 ? 'middle' : 'solo'}</small></legend>
          <div class="mm-sw">${FABRICS.map(([n, c]) => `<button type="button" class="mm-c" data-c="${c}" title="${n}" aria-label="${n}" aria-pressed="${c.toLowerCase() === String(gc.color).toLowerCase()}" style="background:${c}"></button>`).join('')}
            <label class="mm-c mm-custom" title="Custom colour"><input type="color" value="${esc(gc.color)}" aria-label="Custom colour">+</label></div>
          <div class="mm-dz">
            <select class="mm-dsel" aria-label="Design">${designOptions(gc.design)}</select>
            <label class="mm-btn mm-up">Upload<input type="file" accept="image/png,image/svg+xml,image/webp,image/jpeg" hidden></label>
          </div>
          <div class="mm-sl">
            <label>Size <input type="range" class="mm-s" data-k="scale" min="0.3" max="1.8" step="0.01" value="${gc.scale}"></label>
            <label>Left / right <input type="range" class="mm-s" data-k="x" min="-0.5" max="0.5" step="0.01" value="${gc.x}"></label>
            <label>Up / down <input type="range" class="mm-s" data-k="y" min="-0.5" max="0.5" step="0.01" value="${gc.y}"></label>
          </div>
          ${m.garments.length > 1 ? `<button type="button" class="mm-link mm-all">Copy this design to all garments</button>` : ''}
        </fieldset>`;
      }).join('');
    }

    picks.addEventListener('click', (e) => {
      const b = e.target.closest('.mm-pick[data-id]'); if (!b || b.dataset.id === cfg.mockup) return;
      const prev = cfg; cfg = defaultConfig(b.dataset.id);
      cfg.showText = prev.showText; cfg.warp = prev.warp;
      // carry designs over garment by garment
      cfg.garments.forEach((gc, i) => { const p = prev.garments[i] || prev.garments[0]; if (p && p.design) gc.design = p.design; });
      garmentsUI(); changed();
    });
    $('.mm-text').addEventListener('change', (e) => { cfg.showText = e.target.checked; changed(); });
    $('.mm-warpv').addEventListener('input', (e) => { cfg.warp = +e.target.value; changed(); });
    const G = $('.mm-garments');
    G.addEventListener('click', (e) => {
      const fs = e.target.closest('.mm-g'); if (!fs) return; const i = +fs.dataset.i, gc = cfg.garments[i];
      const c = e.target.closest('.mm-c[data-c]');
      if (c) { gc.color = c.dataset.c; garmentsUI(); changed(); }
      if (e.target.closest('.mm-all')) { cfg.garments.forEach((o) => { o.design = gc.design; o.scale = gc.scale; o.x = gc.x; o.y = gc.y; }); garmentsUI(); changed(); }
    });
    G.addEventListener('input', (e) => {
      const fs = e.target.closest('.mm-g'); if (!fs) return; const gc = cfg.garments[+fs.dataset.i];
      if (e.target.type === 'color') { gc.color = e.target.value; fs.querySelector('legend i').style.background = gc.color; changed(); }
      if (e.target.classList.contains('mm-s')) { gc[e.target.dataset.k] = +e.target.value; changed(); }
    });
    G.addEventListener('change', (e) => {
      const fs = e.target.closest('.mm-g'); if (!fs) return; const gc = cfg.garments[+fs.dataset.i];
      if (e.target.type === 'color') garmentsUI();
      if (e.target.classList.contains('mm-dsel')) { gc.design = e.target.value || null; changed(); }
      if (e.target.type === 'file' && e.target.files[0]) {
        const f = e.target.files[0], r = new FileReader();
        r.onload = () => {
          const d = { name: f.name.replace(/\.[^.]+$/, ''), src: r.result };
          designs.push(d); opts.onDesignAdded && opts.onDesignAdded(d);
          gc.design = d.src; garmentsUI(); changed();
        };
        r.readAsDataURL(f);
      }
    });
    $('.mm-reset').addEventListener('click', () => { const m = get(cfg.mockup); cfg.garments.forEach((gc, i) => { gc.color = m.garments[i].color; }); garmentsUI(); changed(); });
    $('.mm-png').addEventListener('click', async () => {
      const full = await render(document.createElement('canvas'), cfg.mockup, cfg);
      const url = full.toDataURL('image/png');
      if (opts.onExport) return opts.onExport(url, cfg);
      $('.mm-dlg img').src = url; $('.mm-dlg').showModal();
    });
    $('.mm-close').addEventListener('click', () => $('.mm-dlg').close());

    garmentsUI(); draw();
    return {
      get config() { return JSON.parse(JSON.stringify(cfg)); },
      set config(c) { if (c && get(c.mockup)) { cfg = JSON.parse(JSON.stringify(c)); garmentsUI(); changed(); } },
      addDesign(d) { designs.push(d); garmentsUI(); },
      redraw: draw,
    };
  }

  g.MiMBOMockups = { init, render, compose, mountSettings, defaultConfig, get manifest() { return S.manifest; }, FABRICS };
})(window);
