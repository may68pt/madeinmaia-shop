/* CyberPet power sleep clouds.
   While the pet sleeps, dream clouds drift out of it and wander the room.
   Tap a cloud to power it up: it becomes a moving unit that roams on its own and sets off items it bumps into.
   Drag a cloud back onto the pet to herd it home for a deeper sleep. The dream mood sets their speed and colour;
   rare clouds carry sparkles and a small gift. */
(function () {
  'use strict';
  const CP = window.CP;
  CP.css('cp-cloud-css', `
    .cp-cloud{position:absolute;width:64px;height:40px;margin:-20px 0 0 -32px;z-index:55;touch-action:none;cursor:grab;transition:opacity .8s,filter .3s}
    .cp-cloud i{position:absolute;border-radius:50%;background:var(--cc);box-shadow:0 0 18px var(--cg)}
    .cp-cloud i:nth-child(1){left:6px;top:14px;width:26px;height:22px}.cp-cloud i:nth-child(2){left:18px;top:2px;width:30px;height:30px}
    .cp-cloud i:nth-child(3){left:36px;top:12px;width:24px;height:22px}.cp-cloud i:nth-child(4){left:10px;top:20px;width:46px;height:16px;border-radius:10px}
    .cp-cloud b{position:absolute;left:24px;top:8px;font:800 13px 'Barlow Condensed',sans-serif;color:#0c0a1f;opacity:.7;pointer-events:none}
    .cp-cloud.calm{--cc:#bfefff;--cg:#5ff4ff88}.cp-cloud.restless{--cc:#ffc2f1;--cg:#ff3fd888;animation:cpCloudFlick 1.6s steps(3) infinite}
    .cp-cloud.rare{--cc:#fff3b0;--cg:#ffd23fcc}.cp-cloud.rare::after{content:'✨';position:absolute;right:-6px;top:-8px;font-size:14px;animation:cpCloudSpark 1s ease-in-out infinite}
    .cp-cloud.on{filter:brightness(1.25) drop-shadow(0 0 10px var(--cg));transform:scale(1.15)}
    .cp-cloud.on b{content:'';opacity:1}
    .cp-cloud.gone{opacity:0}
    @keyframes cpCloudFlick{0%,100%{opacity:1}50%{opacity:.75}}
    @keyframes cpCloudSpark{0%,100%{transform:scale(.8) rotate(0)}50%{transform:scale(1.2) rotate(20deg)}}
  `);
  const A = () => CP.app();
  const clouds = [];
  let raf = 0, last = 0, spawnT = 0, herded = 0;
  const world = () => document.getElementById('world');
  const scroller = () => document.getElementById('roomScroll');

  /** Pet position in world pixels. */
  function petAt() {
    const p = A().heroPoint(0.5, 0.35), sc = scroller();
    return { x: p.x + (sc ? sc.scrollLeft : 0), y: p.y };
  }
  const bounds = () => { const w = world(); return { w: w ? w.clientWidth || A().RV.worldW : 800, h: w ? w.clientHeight || A().RV.H : 420 }; };

  function spawn() {
    const S = CP.S(), w = world(); if (!w || clouds.length >= CP.cfg('clouds_max', 5)) return;
    const calm = S.happy >= 55 && S.health >= 40;
    const rare = Math.random() < CP.cfg('clouds_rare_chance', 0.06);
    const el = document.createElement('div');
    el.className = 'cp-cloud ' + (rare ? 'rare' : calm ? 'calm' : 'restless');
    el.innerHTML = '<i></i><i></i><i></i><i></i><b>z</b>';
    const p = petAt();
    const c = { el, x: p.x, y: p.y - 20, vx: (Math.random() - 0.5) * 0.4, vy: -0.6, on: false, calm, rare, drag: null, age: 0, hits: new Map(), seed: Math.random() * 99 };
    w.appendChild(el); clouds.push(c); bind(c); place(c);
    if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); }
  }
  const place = c => { c.el.style.left = c.x + 'px'; c.el.style.top = c.y + 'px'; };

  function bind(c) {
    let downAt = 0, moved = false;
    c.el.addEventListener('pointerdown', e => {
      e.stopPropagation(); e.preventDefault(); c.el.setPointerCapture(e.pointerId);
      downAt = performance.now(); moved = false;
      c.drag = { ox: e.clientX, oy: e.clientY, x: c.x, y: c.y };
    });
    c.el.addEventListener('pointermove', e => {
      if (!c.drag) return;
      const dx = e.clientX - c.drag.ox, dy = e.clientY - c.drag.oy;
      if (Math.abs(dx) + Math.abs(dy) > 8) moved = true;
      if (moved) { c.x = c.drag.x + dx; c.y = c.drag.y + dy; place(c); }
    });
    const up = () => {
      if (!c.drag) return; c.drag = null;
      if (!moved && performance.now() - downAt < 400) activate(c);
      else { const p = petAt(); if (Math.hypot(c.x - p.x, c.y - p.y) < 70) herd(c); }
    };
    c.el.addEventListener('pointerup', up); c.el.addEventListener('pointercancel', up);
  }

  function activate(c) {
    if (c.on) { c.vx *= 1.4; c.vy *= 1.4; return; }
    c.on = true; c.el.classList.add('on');
    const sp = c.calm ? 1.4 : 2.6, a = Math.random() * Math.PI * 2;
    c.vx = Math.cos(a) * sp; c.vy = Math.sin(a) * sp * 0.6;
    try { A().tone(c.calm ? 740 : 980, .12, 0, 'sine', .04); } catch (e) { /* muted */ }
    CP.emit('cloud:on', { rare: c.rare });
  }

  function herd(c) {
    const S = CP.S(), a = A();
    remove(c, true);
    if (!S.asleep) return;
    herded++;
    if (herded <= 10) { S.rest = a.clamp(S.rest + CP.cfg('clouds_herd_rest', 2)); }
    if (c.rare && CP.daily('rareCloud', 1) <= 1) { S.gems += 1; a.toast('✨ A rare dream cloud! +1 💎'); }
    else if (c.rare) { S.coins += 15; a.toast('✨ Rare dream · +15 ⚡'); }
    try { a.burst('sparks', 10, a.heroPoint(0.5, 0.4)); a.tone(520, .2, 0, 'sine', .04); } catch (e) { /* fx optional */ }
    a.save(); a.renderHUD && a.renderHUD();
    CP.emit('cloud:herd', { rare: c.rare });
  }

  function remove(c, fast) {
    const i = clouds.indexOf(c); if (i >= 0) clouds.splice(i, 1);
    c.el.classList.add('gone'); setTimeout(() => c.el.remove(), fast ? 300 : 900);
  }

  /** Bump test against room items; each item reacts at most once every 2.5 s per cloud. */
  function bump(c) {
    const items = document.querySelectorAll('#roomItems .ri'), now = performance.now();
    for (const el of items) {
      const left = parseFloat(el.style.left) || 0, top = parseFloat(el.style.top) || 0, h = parseFloat(el.style.height) || 40, w = h * 0.8;
      if (c.x > left - w / 2 && c.x < left + w / 2 && c.y > top && c.y < top + h) {
        const key = el.dataset.u; if (now - (c.hits.get(key) || 0) < 2500) continue;
        c.hits.set(key, now); CP.reactItem && CP.reactItem(el); c.vx *= -1; c.vy *= -0.8;
        CP.emit('cloud:bump', { u: key });
      }
    }
  }

  function tick(ts) {
    const dt = Math.min(3, (ts - last) / 16.67); last = ts;
    const S = CP.S(), B = bounds();
    for (const c of [...clouds]) {
      if (c.drag) continue;
      c.age += dt;
      if (!S || !S.asleep) { c.vy = -1.2; c.y += c.vy * dt; place(c); if (c.y < -40 || c.age > 30) remove(c); else if (!c.leaving) { c.leaving = true; setTimeout(() => remove(c), 1600); } continue; }
      if (c.on) {
        // roaming unit: gentle steering noise, bounces off room edges, bumps items
        const n = Math.sin((ts / 900) + c.seed) * 0.05;
        const a = Math.atan2(c.vy, c.vx) + n * dt, sp = Math.hypot(c.vx, c.vy);
        c.vx = Math.cos(a) * sp; c.vy = Math.sin(a) * sp;
        c.x += c.vx * dt; c.y += c.vy * dt;
        if (c.x < 30 || c.x > B.w - 30) { c.vx *= -1; c.x = Math.max(30, Math.min(B.w - 30, c.x)); }
        if (c.y < 30 || c.y > B.h * 0.92) { c.vy *= -1; c.y = Math.max(30, Math.min(B.h * 0.92, c.y)); }
        bump(c);
      } else {
        // idle drift: rise out of the pet, then float lazily around the upper room
        const sp = c.calm ? 0.25 : 0.55;
        c.vx += (Math.sin(ts / 1700 + c.seed) * 0.02) * dt; c.vx = Math.max(-sp, Math.min(sp, c.vx));
        c.vy = c.y > B.h * 0.25 ? -0.35 : Math.sin(ts / 2100 + c.seed) * 0.15;
        c.x += c.vx * dt; c.y += c.vy * dt;
        if (c.x < 30 || c.x > B.w - 30) c.vx *= -1;
      }
      place(c);
    }
    raf = clouds.length ? requestAnimationFrame(tick) : 0;
  }

  let wasAsleep = false;
  setInterval(() => {
    const S = CP.S(); if (!S) return;
    if (S.asleep && !wasAsleep) { herded = 0; spawnT = 0; CP.emit('sleep'); }
    wasAsleep = !!S.asleep;
    if (!S.asleep || !CP.onHome() || document.hidden) return;
    spawnT += 2;
    if (spawnT >= (clouds.length ? 9 : 3)) { spawnT = 0; spawn(); }
  }, 2000);
  CP.clouds = { spawn, list: () => clouds };
})();
