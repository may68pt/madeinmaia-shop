/* CyberPet glass: the phone screen as a pane of glass between you and the pet.
   The pet runs up to the glass (when you come back, or now and then), fills the screen,
   presses a paw flat, licks the glass, boops it with its nose and fogs it with its breath.
   Smears and prints stay on the glass until they fade or you wipe them away.
   Close-up art comes from the "glass" sprite set when it exists; until then the pet's own sprite is drawn big. */
(function () {
  'use strict';
  const CP = window.CP;
  CP.css('cp-glass-css', `
    #cpGlass{position:fixed;inset:0;z-index:9000;display:none;background:radial-gradient(120% 90% at 50% 40%,#1b1640,#07060f);touch-action:none;user-select:none;-webkit-user-select:none}
    #cpGlass.on{display:block;animation:cpGlassIn .35s ease-out}
    #cpGlass canvas{position:absolute;inset:0;width:100%;height:100%}
    #cpGlass .cpgTop{position:absolute;left:0;right:0;top:0;display:flex;justify-content:space-between;align-items:center;padding:calc(env(safe-area-inset-top) + 10px) 14px 10px;z-index:3;pointer-events:none}
    #cpGlass .cpgTop *{pointer-events:auto}
    #cpGlass .cpgX{background:#0008;border:1px solid #fff3;color:#fff;border-radius:99px;width:40px;height:40px;font-size:18px}
    #cpGlass .cpgHint{font:700 15px 'Barlow Condensed',sans-serif;color:#fffc;background:#0006;padding:6px 12px;border-radius:99px;transition:opacity .6s}
    #cpGlass .cpgBond{position:absolute;bottom:calc(env(safe-area-inset-bottom) + 18px);left:50%;transform:translateX(-50%);width:min(60%,260px);height:8px;border-radius:9px;background:#fff2;z-index:3;overflow:hidden}
    #cpGlass .cpgBond i{display:block;height:100%;background:linear-gradient(90deg,#ff5fb8,#5ff4ff);width:0;transition:width .4s}
    @keyframes cpGlassIn{from{opacity:0;transform:scale(1.04)}to{opacity:1;transform:none}}
  `);
  const A = () => CP.app();
  let root, pc, gc, px, gx, W = 0, H = 0, dpr = 1, raf = 0, open = false;
  const st = { t: 0, near: 0, target: 1, bob: 0, look: { x: 0, y: 0 }, squash: 0, mood: 'idle', actT: 0, act: null, paw: null, tongue: null, finger: null, fog: 0, hintT: 0, bondGot: 0 };

  function build() {
    root = document.createElement('div'); root.id = 'cpGlass';
    root.innerHTML = `<canvas id="cpgPet"></canvas><canvas id="cpgGlass"></canvas>
      <div class="cpgTop"><span class="cpgHint" id="cpgHint">Touch the glass</span><button class="cpgX" id="cpgX" aria-label="Close">✕</button></div>
      <div class="cpgBond"><i id="cpgBond"></i></div>`;
    document.body.appendChild(root);
    pc = root.querySelector('#cpgPet'); gc = root.querySelector('#cpgGlass');
    px = pc.getContext('2d'); gx = gc.getContext('2d');
    root.querySelector('#cpgX').onclick = close;
    gc.addEventListener('pointerdown', down); gc.addEventListener('pointermove', move);
    gc.addEventListener('pointerup', up); gc.addEventListener('pointercancel', up);
    addEventListener('resize', () => open && size());
  }
  function size() {
    dpr = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight;
    for (const c of [pc, gc]) { c.width = W * dpr; c.height = H * dpr; }
    px.setTransform(dpr, 0, 0, dpr, 0, 0); gx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  const hint = t => { const h = root.querySelector('#cpgHint'); h.textContent = t; h.style.opacity = 1; st.hintT = 220; };

  /* ---------- open / close ---------- */
  function show(reason) {
    const S = CP.S(); if (!S || S.stage === 'egg' || S.gone) return false;
    if (!root) build();
    open = true; root.classList.add('on'); size(); gx.clearRect(0, 0, W, H);
    Object.assign(st, { t: 0, near: 0, target: 1, act: null, paw: null, tongue: null, finger: null, fog: S.asleep ? 1 : 0, bondGot: 0 });
    st.mood = S.asleep ? 'sleep' : S.happy > 60 ? 'happy' : 'idle';
    hint(reason === 'visit' ? `${S.name} ran to the glass!` : S.asleep ? 'Shh… it is sleeping on the glass' : 'Touch the glass');
    CP.emit('enter:glass', { reason });
    CP.daily('glass', 1);
    if (!S.asleep) setTimeout(() => queue(['paw', 'lick', 'boop']), 900);
    last = performance.now(); raf = requestAnimationFrame(frame);
    return true;
  }
  function close() {
    open = false; root && root.classList.remove('on'); cancelAnimationFrame(raf);
    try { A().save(); A().renderAll(); } catch (e) { /* app busy */ }
    CP.emit('exit:glass');
  }

  /* ---------- the pet's own moves on the glass ---------- */
  let actQueue = [];
  function queue(list) { actQueue = actQueue.concat(list); if (!st.act) nextAct(); }
  function nextAct() {
    const a = actQueue.shift(); st.act = a || null; st.actT = 0; if (!a) return;
    if (a === 'paw') { st.paw = { x: W * (Math.random() < 0.5 ? 0.3 : 0.7), y: H * 0.62, press: 0, follow: false }; tone(420, .08); }
    if (a === 'lick') { st.tongue = { p: 0, x: W * (0.4 + Math.random() * 0.2) }; }
    if (a === 'boop') { st.squash = 1; if (!(CP.glass2 && CP.glass2.stamp(gx, 'nose', W / 2, H * 0.5, 0.9))) smudge(W / 2, H * 0.47, 26, 'rgba(255,255,255,.22)'); tone(1400, .05); CP.vib(15); }
  }
  const tone = (f, d) => { try { A().tone(f, d, 0, 'triangle', .04); } catch (e) { /* muted */ } };

  /* ---------- glass surface: smears, prints and fog live on their own canvas ---------- */
  function smudge(x, y, r, col) { const g = gx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col); g.addColorStop(1, 'rgba(255,255,255,0)'); gx.fillStyle = g; gx.beginPath(); gx.arc(x, y, r, 0, 7); gx.fill(); }
  function lickStreak(x, y) {
    if (CP.glass2 && CP.glass2.stamp(gx, Math.random() < 0.3 ? 'lick2' : 'lick', x, y, 0.8)) return;
    gx.save(); gx.globalAlpha = 0.18; gx.fillStyle = '#e8f6ff';
    gx.beginPath(); gx.ellipse(x, y, 34, 16, -0.25, 0, 7); gx.fill();
    gx.globalAlpha = 0.28; for (let i = 0; i < 4; i++) { gx.beginPath(); gx.arc(x - 20 + i * 13, y + 10 + Math.random() * 10, 2 + Math.random() * 2, 0, 7); gx.fill(); }
    gx.restore();
  }
  function pawPrint(x, y, s = 1) {
    if (CP.glass2 && CP.glass2.stamp(gx, 'paw', x, y, s)) return;
    gx.save(); gx.globalAlpha = 0.16; gx.fillStyle = '#fff';
    gx.beginPath(); gx.ellipse(x, y + 10 * s, 22 * s, 18 * s, 0, 0, 7); gx.fill();
    [[-20, -14], [-7, -24], [7, -24], [20, -14]].forEach(([dx, dy]) => { gx.beginPath(); gx.ellipse(x + dx * s, y + dy * s, 7 * s, 9 * s, 0, 0, 7); gx.fill(); });
    gx.restore();
  }
  function wipe(x, y, r) { gx.save(); gx.globalCompositeOperation = 'destination-out'; gx.beginPath(); gx.arc(x, y, r, 0, 7); gx.fill(); gx.restore(); }
  function fadeGlass(dt) { gx.save(); gx.globalCompositeOperation = 'destination-out'; gx.fillStyle = `rgba(0,0,0,${0.0025 * dt})`; gx.fillRect(0, 0, W, H); gx.restore(); }

  /* ---------- owner touch (Block 8 adds the full gesture engine on top) ---------- */
  const touches = new Map();
  function down(e) {
    gc.setPointerCapture(e.pointerId);
    touches.set(e.pointerId, { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, t0: performance.now(), path: 0 });
    st.finger = { x: e.clientX, y: e.clientY };
    if (st.paw && Math.hypot(e.clientX - st.paw.x, e.clientY - st.paw.y) < 70) { st.paw.follow = true; hint('It is pressing its paw back ♥'); bond(2, 'paw'); CP.vib(10); }
    CP.emit('glass:down', { x: e.clientX, y: e.clientY, id: e.pointerId, n: touches.size });
  }
  function move(e) {
    const t = touches.get(e.pointerId); if (!t) return;
    const d = Math.hypot(e.clientX - t.x, e.clientY - t.y); t.path += d; t.x = e.clientX; t.y = e.clientY;
    st.finger = { x: e.clientX, y: e.clientY };
    if (st.paw && st.paw.follow) { st.paw.x += (e.clientX - st.paw.x) * 0.25; st.paw.y += (e.clientY - st.paw.y) * 0.25; }
    else if (d > 6) wipe(e.clientX, e.clientY, 26);
    CP.emit('glass:move', { x: e.clientX, y: e.clientY, id: e.pointerId, n: touches.size, speed: d });
  }
  function up(e) {
    const t = touches.get(e.pointerId); touches.delete(e.pointerId);
    if (st.paw && st.paw.follow && !touches.size) { st.paw.follow = false; pawPrint(st.paw.x, st.paw.y); }
    if (!touches.size) st.finger = null;
    if (t && t.path < 12 && performance.now() - t.t0 < 300 && !CP.glass.gestures) {
      // simple tap: boop where the face is, otherwise a fingerprint
      if (Math.abs(t.x - W / 2) < W * 0.25 && Math.abs(t.y - H * 0.45) < H * 0.18) { st.squash = 1; tone(1200 + Math.random() * 400, .06); bond(1, 'boop'); }
      else smudge(t.x, t.y, 14, 'rgba(255,255,255,.18)');
    }
    CP.emit('glass:up', { x: e.clientX, y: e.clientY, id: e.pointerId, n: touches.size, tap: t && t.path < 12 });
  }
  function bond(n, src) {
    const S = CP.S(), cap = CP.cfg('glass_daily_bond', 12);
    const got = CP.daily('glassBond'); if (got >= cap) return;
    const mult = CP.emotion ? CP.emotion.bondMult() : 1; n = Math.max(mult < 1 ? 0.5 : 1, n * mult);
    const add = Math.min(Math.round(n * 2) / 2, cap - got); CP.daily('glassBond', add); st.bondGot += add;
    S.bond = A().clamp(S.bond + add); S.happy = A().clamp(S.happy + add * 0.5);
    root.querySelector('#cpgBond').style.width = Math.min(100, (CP.daily('glassBond') / cap) * 100) + '%';
    CP.emit('bond', { n: add, src: 'glass:' + src });
  }

  /* ---------- drawing the pet up close ---------- */
  function drawPet(dt) {
    const a = A(), S = CP.S();
    st.near += (st.target - st.near) * 0.06 * dt; st.bob += dt * (S.asleep ? 0.02 : 0.05);
    st.squash = Math.max(0, st.squash - 0.06 * dt);
    const f = st.finger, lx = f ? (f.x - W / 2) / W : Math.sin(st.t / 140) * 0.1, ly = f ? (f.y - H / 2) / H : 0;
    st.look.x += (lx - st.look.x) * 0.08 * dt; st.look.y += (ly - st.look.y) * 0.08 * dt;
    px.clearRect(0, 0, W, H);
    const art = CP.assets && CP.assets.img('glass', S.asleep ? 'face_sleep' : st.mood === 'happy' ? 'face_happy' : 'face');
    const h = H * (0.55 + 1.05 * st.near) * (1 + Math.sin(st.bob) * 0.012);
    const cx = W / 2 + st.look.x * 40, by = H * (0.78 + 0.5 * st.near) + st.look.y * 20;
    px.save(); px.translate(cx, by); px.scale(1 + st.squash * 0.08, 1 - st.squash * 0.1); px.translate(-cx, -by);
    if (CP.glass.customDraw && CP.glass.customDraw(px, cx, by, h, st)) { /* mesh-deform rig (block 16) */ }
    else if (art) { const s = h / art.height; px.drawImage(art, cx - art.width * s / 2, by - h, art.width * s, h); }
    else {
      const role = S.asleep ? 'sleep' : st.mood === 'happy' ? 'happy' : 'idle';
      const ok = a.gPose(px, role, cx, by, h, st.look.x < -0.05, a.sprFilter()) || a.gPose(px, 'idle', cx, by, h, false, a.sprFilter());
      if (!ok) { px.font = `${h * 0.5}px serif`; px.textAlign = 'center'; px.fillText('🐾', cx, by - h * 0.4); }
    }
    px.restore();
    // glass reflection
    const g = px.createLinearGradient(0, 0, W, H); g.addColorStop(0, 'rgba(255,255,255,.07)'); g.addColorStop(0.35, 'rgba(255,255,255,0)'); g.addColorStop(0.6, 'rgba(255,255,255,.04)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    px.fillStyle = g; px.fillRect(0, 0, W, H);
  }
  function drawPaw(dt) {
    const p = st.paw; if (!p) return;
    p.press = Math.min(1, p.press + 0.05 * dt);
    if (st.act === 'paw' && st.actT > 160 && !p.follow) { pawPrint(p.x, p.y); st.paw = null; return; }
    if (CP.glass.artMode) return; // the painted shot already shows the paw
    const s = 1 + p.press * 0.25, img = CP.assets && CP.assets.img('glass', 'paw');
    px.save(); px.translate(p.x, p.y + (1 - p.press) * 80);
    if (img) { const w = 150 * s; px.drawImage(img, -w / 2, -w / 2, w, w); }
    else {
      px.fillStyle = '#2b2350'; px.beginPath(); px.ellipse(0, 40, 62 * s, 80 * s, 0, 0, 7); px.fill();
      px.fillStyle = '#ff9fd2';
      px.beginPath(); px.ellipse(0, 12, 26 * s, 21 * s * (1 + p.press * 0.2), 0, 0, 7); px.fill();
      [[-26, -16], [-9, -30], [9, -30], [26, -16]].forEach(([dx, dy]) => { px.beginPath(); px.ellipse(dx * s, dy * s, 9 * s, 11 * s * (1 + p.press * 0.25), 0, 0, 7); px.fill(); });
    }
    px.restore();
  }
  function drawTongue(dt) {
    const t = st.tongue; if (!t) return;
    t.p += 0.018 * dt; const k = Math.sin(Math.min(1, t.p) * Math.PI);
    const x = t.x + (t.p - 0.5) * 120, y = H * 0.56 - k * 50;
    const img = CP.assets && CP.assets.img('glass', 'tongue');
    if (CP.glass.artMode) { if (k > 0.6 && Math.random() < 0.25) lickStreak(x, y - 20); if (t.p >= 1) { st.tongue = null; tone(300, .1); } return; }
    px.save(); px.translate(x, y); px.rotate((t.p - 0.5) * 0.6);
    if (img) px.drawImage(img, -50, -70 * k, 100, 140 * k);
    else { px.fillStyle = '#ff6fae'; px.beginPath(); px.ellipse(0, 0, 30, 46 * k + 4, 0, 0, 7); px.fill(); px.fillStyle = '#ff4f96'; px.fillRect(-2, -40 * k, 4, 44 * k); }
    px.restore();
    if (k > 0.6 && Math.random() < 0.5) lickStreak(x, y - 20);
    if (t.p >= 1) { st.tongue = null; tone(300, .1); }
  }

  let last = 0;
  function frame(ts) {
    if (!open) return;
    const dt = Math.min(3, (ts - last) / 16.67); last = ts; st.t += dt;
    if (st.act) { st.actT += dt; if ((st.act === 'lick' && !st.tongue) || (st.act === 'paw' && !st.paw) || (st.act === 'boop' && st.actT > 40)) nextAct(); }
    drawPet(dt); drawPaw(dt); drawTongue(dt);
    if (st.fog > 0) { smudge(W / 2 + Math.sin(st.t / 60) * 20, H * 0.5, 120, `rgba(220,235,255,${0.012 * st.fog})`); }
    fadeGlass(dt);
    if (st.hintT > 0 && (st.hintT -= dt) <= 0) root.querySelector('#cpgHint').style.opacity = 0;
    if (!st.act && !actQueue.length && Math.random() < 0.002 * dt && !CP.S().asleep) queue([A().pick(['paw', 'lick', 'boop'])]);
    raf = requestAnimationFrame(frame);
  }

  /* ---------- when does the pet come to the glass? ---------- */
  let hiddenAt = 0, lastVisit = 0;
  const canVisit = () => CP.idle() && performance.now() - lastVisit > (CP.emotion && CP.emotion.state() && CP.emotion.state().cling > Date.now() ? 2 : 10) * 60e3 && CP.daily('glassAuto') < 4;
  function visit() { if (!canVisit()) return; lastVisit = performance.now(); CP.daily('glassAuto', 1); setTimeout(() => CP.idle() && show('visit'), 1200); }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { hiddenAt = Date.now(); return; }
    if (hiddenAt && Date.now() - hiddenAt > CP.cfg('glass_visit_minutes', 20) * 60e3) visit();
  });
  setInterval(() => { if (!document.hidden && Math.random() < CP.cfg('glass_random_chance', 0.04) * (CP.emotion && CP.emotion.state() && CP.emotion.state().cling > Date.now() ? 4 : 1)) visit(); }, 60e3);

  CP.glass = { show, close, queue, bond, smudge, pawPrint, wipe, state: st, get open() { return open; }, gestures: null, hint: t => root && hint(t) };
  CP.on('start', () => { CP.sideButton('sGlass', '🪟', 'Glass close-up', () => show('button')); });
})();
