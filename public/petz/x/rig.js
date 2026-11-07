/* CyberPet mesh-deform rig: animations stored once as bone motion over a shared mesh, skins swapped like UV maps.
   - A rig = bones (pivot points in image pixels, with parents) + a mesh (grid or explicit) whose vertices are
     weighted to up to two bones + animations (keyframed rotation, offset and scale per bone).
   - Any skin drawn in the same pose and framing reuses every animation: setSkin(img) just swaps the texture.
   - WebGL renderer with a Canvas 2D fallback (affine-mapped triangles).
   - CP.rig.auto(img) builds a usable rig from a single standing-pose image, so it works before hand-rigging.
   Works standalone (rig preview page) or inside the app (glass close-up when config rig_enabled is on). */
(function () {
  'use strict';
  const CP = window.CP = window.CP || {};

  /* ---------- 2D affine helpers: [a, b, c, d, e, f] ---------- */
  const mul = (m, n) => [m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1], m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3], m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5]];
  const T = (x, y) => [1, 0, 0, 1, x, y], Rr = a => [Math.cos(a), Math.sin(a), -Math.sin(a), Math.cos(a), 0, 0], Sc = (x, y) => [x, 0, 0, y, 0, 0];
  const apply = (m, x, y) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
  const ease = t => t * t * (3 - 2 * t);

  /* ---------- automatic rig from one image ---------- */
  const BONES = [
    // name, parent, x, y as fractions of the image
    ['root', null, 0.5, 0.95], ['body', 'root', 0.5, 0.66], ['head', 'body', 0.5, 0.38],
    ['earL', 'head', 0.36, 0.14], ['earR', 'head', 0.64, 0.14], ['tail', 'body', 0.8, 0.7],
    ['pawL', 'body', 0.4, 0.86], ['pawR', 'body', 0.6, 0.86],
  ];
  const ANIMS = {
    idle: { dur: 2.4, tracks: { body: [[0, 0, 0, 0, 1, 1], [0.5, 0, 0, -2, 1.01, 1.025], [1, 0, 0, 0, 1, 1]], head: [[0, 0, 0, 0, 1, 1], [0.5, -0.03, 0, -2, 1, 1], [1, 0, 0, 0, 1, 1]], tail: [[0, -0.08, 0, 0, 1, 1], [0.5, 0.1, 0, 0, 1, 1], [1, -0.08, 0, 0, 1, 1]] } },
    happy: { dur: 0.9, tracks: { body: [[0, 0, 0, 0, 1, 1], [0.5, 0, 0, -10, 0.98, 1.04], [1, 0, 0, 0, 1, 1]], head: [[0, -0.08, 0, 0, 1, 1], [0.5, 0.08, 0, -4, 1, 1], [1, -0.08, 0, 0, 1, 1]], tail: [[0, -0.35, 0, 0, 1, 1], [0.25, 0.35, 0, 0, 1, 1], [0.5, -0.35, 0, 0, 1, 1], [0.75, 0.35, 0, 0, 1, 1], [1, -0.35, 0, 0, 1, 1]], earL: [[0, 0, 0, 0, 1, 1], [0.5, -0.15, 0, 0, 1, 1], [1, 0, 0, 0, 1, 1]], earR: [[0, 0, 0, 0, 1, 1], [0.5, 0.15, 0, 0, 1, 1], [1, 0, 0, 0, 1, 1]] } },
    curious: { dur: 2, tracks: { head: [[0, 0, 0, 0, 1, 1], [0.3, 0.22, 4, 0, 1, 1], [0.8, 0.22, 4, 0, 1, 1], [1, 0, 0, 0, 1, 1]], earL: [[0, 0, 0, 0, 1, 1], [0.35, -0.2, 0, 0, 1, 1], [0.6, 0.05, 0, 0, 1, 1], [1, 0, 0, 0, 1, 1]], tail: [[0, 0, 0, 0, 1, 1], [0.5, 0.25, 0, 0, 1, 1], [1, 0, 0, 0, 1, 1]] } },
    sleep: { dur: 4, tracks: { body: [[0, 0, 0, 6, 1.03, 0.97], [0.5, 0, 0, 4, 1.05, 0.99], [1, 0, 0, 6, 1.03, 0.97]], head: [[0, 0.1, 0, 14, 1, 1], [0.5, 0.12, 0, 12, 1, 1], [1, 0.1, 0, 14, 1, 1]], tail: [[0, 0.3, 0, 0, 1, 1], [1, 0.3, 0, 0, 1, 1]] } },
    lick: { dur: 1.2, tracks: { head: [[0, 0, 0, 0, 1, 1], [0.3, -0.05, 0, -12, 1.05, 1.05], [0.6, 0.05, 0, -12, 1.05, 1.05], [1, 0, 0, 0, 1, 1]], body: [[0, 0, 0, 0, 1, 1], [0.45, 0, 0, -6, 1, 1.02], [1, 0, 0, 0, 1, 1]] } },
  };

  function auto(img, opt = {}) {
    const w = img.naturalWidth || img.width, h = img.naturalHeight || img.height, cols = opt.cols || 14, rows = opt.rows || 14;
    const bones = BONES.map(([n, p, fx, fy]) => ({ n, p, x: fx * w, y: fy * h }));
    const verts = [], uvs = [], weights = [], tris = [];
    for (let r = 0; r <= rows; r++) for (let c = 0; c <= cols; c++) {
      const x = (c / cols) * w, y = (r / rows) * h; verts.push(x, y); uvs.push(c / cols, r / rows);
      // weight to the two nearest bones (head region favours the head, the bottom favours the paws/root)
      const d = bones.map((b, i) => [i, 1 / (1e-3 + ((x - b.x) / w) ** 2 + ((y - b.y) / h) ** 2 * 1.4)]).filter(([i]) => bones[i].n !== 'root' || y > h * 0.9);
      d.sort((a, b) => b[1] - a[1]); const [a, b] = d, s = a[1] + b[1];
      weights.push(a[0], b[0], a[1] / s, b[1] / s);
    }
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const i = r * (cols + 1) + c; tris.push(i, i + 1, i + cols + 1, i + 1, i + cols + 2, i + cols + 1); }
    return { size: [w, h], bones, mesh: { verts, uvs, weights, tris }, anims: JSON.parse(JSON.stringify(opt.anims || ANIMS)) };
  }

  /* ---------- pose evaluation ---------- */
  function sample(track, t) {
    if (!track || !track.length) return [0, 0, 0, 1, 1];
    let i = 0; while (i < track.length - 1 && track[i + 1][0] <= t) i++;
    const a = track[i], b = track[Math.min(track.length - 1, i + 1)], k = b[0] === a[0] ? 0 : ease((t - a[0]) / (b[0] - a[0]));
    return [1, 2, 3, 4, 5].map(j => a[j] + (b[j] - a[j]) * k);
  }
  function boneMatrices(rig, anim, time, mix) {
    const out = {}, A = rig.anims[anim] || rig.anims.idle, t = ((time / (A.dur || 1)) % 1 + 1) % 1;
    for (const b of rig.bones) {
      const [rot, dx, dy, sx, sy] = sample(A.tracks[b.n], t).map((v, j) => (mix !== undefined ? (j < 3 ? v * mix : 1 + (v - 1) * mix) : v));
      const local = mul(mul(mul(T(b.x + dx, b.y + dy), Rr(rot)), Sc(sx, sy)), T(-b.x, -b.y));
      out[b.n] = b.p ? mul(out[b.p], local) : local;
    }
    return out;
  }
  function deform(rig, mats, out) {
    const v = rig.mesh.verts, w = rig.mesh.weights, idx = rig.bones.map(b => mats[b.n]);
    for (let i = 0, n = v.length / 2; i < n; i++) {
      const x = v[i * 2], y = v[i * 2 + 1], m1 = idx[w[i * 4]], m2 = idx[w[i * 4 + 1]], k1 = w[i * 4 + 2], k2 = w[i * 4 + 3];
      const p = apply(m1, x, y), q = apply(m2, x, y);
      out[i * 2] = p[0] * k1 + q[0] * k2; out[i * 2 + 1] = p[1] * k1 + q[1] * k2;
    }
    return out;
  }

  /* ---------- renderers ---------- */
  function glRenderer(canvas, rig) {
    const gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true }); if (!gl) return null;
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, 'attribute vec2 p;attribute vec2 u;uniform vec4 m;varying vec2 v;void main(){vec2 c=(p*m.xy+m.zw);gl_Position=vec4(c.x*2.0-1.0,1.0-c.y*2.0,0,1);v=u;}'));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, 'precision mediump float;uniform sampler2D t;varying vec2 v;void main(){vec4 c=texture2D(t,v);gl_FragColor=vec4(c.rgb*c.a,c.a);}'));
    gl.linkProgram(prog); if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null; gl.useProgram(prog);
    const pb = gl.createBuffer(), ub = gl.createBuffer(), ib = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, ub); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(rig.mesh.uvs), gl.STATIC_DRAW);
    const uL = gl.getAttribLocation(prog, 'u'); gl.enableVertexAttribArray(uL); gl.vertexAttribPointer(uL, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(rig.mesh.tris), gl.STATIC_DRAW);
    const pL = gl.getAttribLocation(prog, 'p'), mL = gl.getUniformLocation(prog, 'm');
    const tex = gl.createTexture();
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    return {
      kind: 'webgl',
      skin(img) { gl.bindTexture(gl.TEXTURE_2D, tex); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img); ['TEXTURE_MIN_FILTER', 'TEXTURE_MAG_FILTER'].forEach(k => gl.texParameteri(gl.TEXTURE_2D, gl[k], gl.LINEAR)); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); },
      draw(pos, fit) {
        gl.viewport(0, 0, canvas.width, canvas.height); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
        gl.bindBuffer(gl.ARRAY_BUFFER, pb); gl.bufferData(gl.ARRAY_BUFFER, pos, gl.DYNAMIC_DRAW);
        gl.enableVertexAttribArray(pL); gl.vertexAttribPointer(pL, 2, gl.FLOAT, false, 0, 0);
        gl.uniform4f(mL, fit.s / canvas.width, fit.s / canvas.height, fit.x / canvas.width, fit.y / canvas.height);
        gl.drawElements(gl.TRIANGLES, rig.mesh.tris.length, gl.UNSIGNED_SHORT, 0);
      },
      destroy() { const l = gl.getExtension('WEBGL_lose_context'); l && l.loseContext(); },
    };
  }
  function canvasRenderer(canvas, rig) {
    const x = canvas.getContext('2d'); let img = null;
    const uvs = rig.mesh.uvs, tris = rig.mesh.tris, [W, H] = rig.size;
    return {
      kind: 'canvas',
      skin(i) { img = i; },
      draw(pos, fit) {
        x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, canvas.width, canvas.height); if (!img) return;
        const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
        for (let t = 0; t < tris.length; t += 3) {
          const i0 = tris[t], i1 = tris[t + 1], i2 = tris[t + 2];
          const sx0 = uvs[i0 * 2] * iw, sy0 = uvs[i0 * 2 + 1] * ih, sx1 = uvs[i1 * 2] * iw, sy1 = uvs[i1 * 2 + 1] * ih, sx2 = uvs[i2 * 2] * iw, sy2 = uvs[i2 * 2 + 1] * ih;
          const dx0 = pos[i0 * 2] * fit.s + fit.x, dy0 = pos[i0 * 2 + 1] * fit.s + fit.y, dx1 = pos[i1 * 2] * fit.s + fit.x, dy1 = pos[i1 * 2 + 1] * fit.s + fit.y, dx2 = pos[i2 * 2] * fit.s + fit.x, dy2 = pos[i2 * 2 + 1] * fit.s + fit.y;
          const den = sx0 * (sy1 - sy2) + sx1 * (sy2 - sy0) + sx2 * (sy0 - sy1); if (!den) continue;
          const a = (dx0 * (sy1 - sy2) + dx1 * (sy2 - sy0) + dx2 * (sy0 - sy1)) / den, b = (dy0 * (sy1 - sy2) + dy1 * (sy2 - sy0) + dy2 * (sy0 - sy1)) / den;
          const c = (dx0 * (sx2 - sx1) + dx1 * (sx0 - sx2) + dx2 * (sx1 - sx0)) / den, d = (dy0 * (sx2 - sx1) + dy1 * (sx0 - sx2) + dy2 * (sx1 - sx0)) / den;
          const e = (dx0 * (sx1 * sy2 - sx2 * sy1) + dx1 * (sx2 * sy0 - sx0 * sy2) + dx2 * (sx0 * sy1 - sx1 * sy0)) / den;
          const f = (dy0 * (sx1 * sy2 - sx2 * sy1) + dy1 * (sx2 * sy0 - sx0 * sy2) + dy2 * (sx0 * sy1 - sx1 * sy0)) / den;
          // grow the clip triangle a hair to hide seams between triangles
          const cx = (dx0 + dx1 + dx2) / 3, cy = (dy0 + dy1 + dy2) / 3, g = (px, py) => [px + (px - cx) * 0.02, py + (py - cy) * 0.02];
          const [p0, p1, p2] = [g(dx0, dy0), g(dx1, dy1), g(dx2, dy2)];
          x.save(); x.beginPath(); x.moveTo(p0[0], p0[1]); x.lineTo(p1[0], p1[1]); x.lineTo(p2[0], p2[1]); x.closePath(); x.clip();
          x.setTransform(a, b, c, d, e, f); x.drawImage(img, 0, 0); x.restore();
        }
        void W; void H;
      },
      destroy() { /* nothing to free */ },
    };
  }

  /** A living rig on a canvas. opt: { anim, webgl:false to force canvas, fit:'contain'|'cover' } */
  function create(canvas, rig, skin, opt = {}) {
    let r = opt.webgl === false ? null : glRenderer(canvas, rig);
    if (!r) r = canvasRenderer(canvas, rig);
    const pos = new Float32Array(rig.mesh.verts.length);
    let anim = opt.anim || 'idle', t0 = performance.now(), prev = null, blend = 1;
    r.skin(skin);
    const fitOf = () => { const [w, h] = rig.size, s = Math.min(canvas.width / w, canvas.height / h) * (opt.zoom || 1); return { s, x: (canvas.width - w * s) / 2, y: canvas.height - h * s - (opt.lift || 0) }; };
    return {
      renderer: r.kind,
      play(name) { if (!rig.anims[name] || name === anim) return; prev = anim; anim = name; blend = 0; t0 = performance.now(); },
      setSkin(img) { r.skin(img); },
      render(now = performance.now(), fit) {
        const time = (now - t0) / 1000;
        blend = Math.min(1, blend + 0.08);
        const mats = boneMatrices(rig, anim, time, blend < 1 ? blend : undefined);
        if (prev && blend < 1) { const pm = boneMatrices(rig, prev, time, 1 - blend); for (const k in mats) mats[k] = mul(mats[k], pm[k]); }
        deform(rig, mats, pos); r.draw(pos, fit || fitOf());
      },
      destroy() { r.destroy(); },
    };
  }

  CP.rig = { auto, create, ANIMS, boneMatrices, deform };

  /* ---------- in the app: the glass close-up comes alive when rig_enabled is on ---------- */
  if (CP.on) CP.on('enter:glass', () => {
    if (!CP.cfg || !CP.cfg('rig_enabled', false) || !CP.glass) return;
    const S = CP.S(); if (!S) return;
    const rigJson = CP.assets && CP.assets.json('rig');
    const img = new Image(); img.src = `/petz/a/v_${S.variant || 'core'}.webp`;
    img.onload = () => {
      const off = document.createElement('canvas'); off.width = 720; off.height = 900;
      const live = create(off, rigJson || auto(img), img, { anim: S.asleep ? 'sleep' : 'idle' });
      CP.glass.customDraw = (ctx, cx, by, h, st) => {
        live.play(S.asleep ? 'sleep' : st.tongue ? 'lick' : st.mood === 'happy' ? 'happy' : st.finger ? 'curious' : 'idle');
        live.render();
        const k = h / off.height; ctx.drawImage(off, cx - (off.width * k) / 2, by - h, off.width * k, h);
        return true;
      };
    };
  });
  if (CP.on) CP.on('exit:glass', () => { if (CP.glass) CP.glass.customDraw = null; });
})();
