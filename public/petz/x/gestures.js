/* CyberPet gesture engine: multi-finger tracking and a recogniser shared by the glass and the massage game.
   Each finger keeps a short history; from it we read speed, direction, curvature (circles), stillness (holds),
   pressure (real force where the browser gives it, otherwise contact size and speed) and how fingers move
   together (spread / pinch, two-finger knead, three-finger rake).

   CP.gestures(el, { zoneAt(x, y) -> string, on(g) }) where g = { type, zone, x, y, fingers, speed, pressure, dir }
   Types: tap, hold, stroke, circle, rough, spread, pinch, knead, rake. A continuous "touch" event fires every frame. */
(function () {
  'use strict';
  const CP = window.CP;
  const HIST = 18;

  /* soft purr: two detuned low oscillators with a fast tremolo; volume follows how good the touch is */
  let AC, purrG, purrOn = false;
  function purr(level) {
    try {
      if (CP.S() && CP.S().mute) level = 0;
      if (!AC) {
        AC = new (window.AudioContext || window.webkitAudioContext)();
        purrG = AC.createGain(); purrG.gain.value = 0; purrG.connect(AC.destination);
        const trem = AC.createGain(); trem.gain.value = 0.5; trem.connect(purrG);
        [48, 52].forEach(f => { const o = AC.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 180; o.connect(lp); lp.connect(trem); o.start(); });
        const lfo = AC.createOscillator(); lfo.frequency.value = 24; const lg = AC.createGain(); lg.gain.value = 0.5; lfo.connect(lg); lg.connect(trem.gain); lfo.start();
      }
      const v = Math.max(0, Math.min(1, level)) * 0.12;
      purrG.gain.setTargetAtTime(v, AC.currentTime, 0.15); purrOn = v > 0;
    } catch (e) { /* audio unavailable */ }
  }
  CP.sound = Object.assign(CP.sound || {}, { purr, get purring() { return purrOn; } });

  CP.gestures = function (el, opt) {
    const fingers = new Map();
    const zoneAt = opt.zoneAt || (() => 'any');
    const emit = g => { try { opt.on && opt.on(g); } catch (e) { console.warn('[gesture]', e); } };
    const pressureOf = (e, f) => {
      if (e.pressure && e.pressure !== 0.5 && e.pointerType !== 'mouse') return e.pressure;
      const r = Math.max(e.width || 0, e.height || 0);
      const fromSize = r > 1 ? Math.min(1, (r - 8) / 40) : 0.4;
      const fromSpeed = f && f.speed ? Math.max(0, 0.6 - f.speed * 0.25) : 0.4;
      return Math.max(0.05, Math.min(1, fromSize * 0.6 + fromSpeed * 0.4));
    };

    function down(e) {
      el.setPointerCapture && el.setPointerCapture(e.pointerId);
      const t = performance.now();
      fingers.set(e.pointerId, { id: e.pointerId, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, t0: t, h: [[e.clientX, e.clientY, t]], path: 0, turn: 0, lastA: null, speed: 0, held: false, p: 0.4 });
      if (fingers.size === 2) { const [a, b] = [...fingers.values()]; pair = { d0: Math.hypot(a.x - b.x, a.y - b.y), fired: false, osc: 0, lastSign: 0 }; }
    }
    let pair = null;
    function move(e) {
      const f = fingers.get(e.pointerId); if (!f) return;
      const t = performance.now(), dx = e.clientX - f.x, dy = e.clientY - f.y, d = Math.hypot(dx, dy), dtm = Math.max(1, t - f.h[f.h.length - 1][2]);
      f.speed = f.speed * 0.7 + (d / dtm) * 0.3; f.path += d; f.x = e.clientX; f.y = e.clientY;
      if (d > 1.5) { const a = Math.atan2(dy, dx); if (f.lastA !== null) { let da = a - f.lastA; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI; f.turn += da; } f.lastA = a; f.dir = a; }
      f.h.push([e.clientX, e.clientY, t]); if (f.h.length > HIST) f.h.shift();
      f.p = pressureOf(e, f);
      classify(f);
    }
    function up(e) {
      const f = fingers.get(e.pointerId); if (!f) return; fingers.delete(e.pointerId);
      const dur = performance.now() - f.t0;
      if (f.path < 12 && dur < 320 && !f.held) emit({ type: 'tap', zone: zoneAt(f.x, f.y), x: f.x, y: f.y, fingers: fingers.size + 1, speed: 0, pressure: f.p });
      if (fingers.size < 2) pair = null;
      emit({ type: 'release', zone: zoneAt(f.x, f.y), x: f.x, y: f.y, fingers: fingers.size });
    }

    const lastFire = {};
    const fire = (type, f, extra, gap = 450) => {
      const t = performance.now(); if (t - (lastFire[type] || 0) < gap) return; lastFire[type] = t;
      emit(Object.assign({ type, zone: zoneAt(f.x, f.y), x: f.x, y: f.y, fingers: fingers.size, speed: f.speed, pressure: f.p, dir: f.dir }, extra));
    };
    function classify(f) {
      const n = fingers.size;
      if (n >= 3) {
        // rake: three or more fingers moving the same way
        const v = [...fingers.values()].map(g => g.dir).filter(a => a !== undefined);
        if (v.length >= 3) { const mx = Math.cos(v[0]), my = Math.sin(v[0]); const same = v.every(a => Math.cos(a) * mx + Math.sin(a) * my > 0.7); if (same && f.speed > 0.15) fire('rake', f, {}, 600); }
        return;
      }
      if (n === 2 && pair) {
        const [a, b] = [...fingers.values()], d = Math.hypot(a.x - b.x, a.y - b.y), k = d / Math.max(1, pair.d0);
        if (k > 1.35) { fire('spread', f, { scale: k }, 700); pair.d0 = d; return; }
        if (k < 0.7) { fire('pinch', f, { scale: k }, 700); pair.d0 = d; return; }
        // knead: the two fingers take turns moving (one moves while the other rests), back and forth
        const sign = Math.sign((a.speed - b.speed));
        if (sign && sign !== pair.lastSign && Math.max(a.speed, b.speed) > 0.08) { pair.osc++; pair.lastSign = sign; }
        if (pair.osc >= 4) { pair.osc = 0; fire('knead', f, {}, 500); }
        return;
      }
      if (Math.abs(f.turn) > 5.5 && f.path > 120) { const cw = f.turn > 0; f.turn = 0; fire('circle', f, { cw }, 400); return; }
      if (f.speed > 2.2 && f.path > 60) { fire('rough', f, {}, 700); return; }
      if (f.path > 40 && f.speed < 1.2 && f.speed > 0.05) fire('stroke', f, {}, 380);
    }

    // holds and the continuous touch stream run on a timer, so a perfectly still finger still counts
    const iv = setInterval(() => {
      const t = performance.now();
      for (const f of fingers.values()) {
        const still = f.h.length < 3 || Math.hypot(f.x - f.h[0][0], f.y - f.h[0][1]) < 14;
        if (!f.held && still && t - f.t0 > 650 && f.path < 30) { f.held = true; emit({ type: 'hold', zone: zoneAt(f.x, f.y), x: f.x, y: f.y, fingers: fingers.size, speed: 0, pressure: f.p }); }
        f.speed *= 0.85;
      }
      if (fingers.size) {
        const fs = [...fingers.values()], c = fs.reduce((o, f) => ({ x: o.x + f.x / fs.length, y: o.y + f.y / fs.length }), { x: 0, y: 0 });
        emit({ type: 'touch', zone: zoneAt(c.x, c.y), x: c.x, y: c.y, fingers: fs.length, speed: fs.reduce((s, f) => s + f.speed, 0) / fs.length, pressure: fs.reduce((s, f) => s + f.p, 0) / fs.length, list: fs });
      }
    }, 60);

    el.addEventListener('pointerdown', down); el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    return {
      detach() { clearInterval(iv); el.removeEventListener('pointerdown', down); el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up); fingers.clear(); },
      get count() { return fingers.size; },
    };
  };

  /* ---------- the glass gesture table ---------- */
  CP.on('enter:glass', () => {
    const G = CP.glass; if (!G || G.gestures) return;
    const el = document.getElementById('cpgGlass'), st = G.state, A = () => CP.app();
    const zoneAt = (x, y) => {
      const W = innerWidth, H = innerHeight, cx = W / 2, cy = H * 0.45;
      if (st.paw && Math.hypot(x - st.paw.x, y - st.paw.y) < 70) return 'paw';
      const dx = (x - cx) / W, dy = (y - cy) / H;
      if (Math.abs(dx) < 0.07 && Math.abs(dy) < 0.05) return 'nose';
      if (dy < -0.1 && Math.abs(dx) < 0.3) return 'head';
      if (Math.abs(dx) >= 0.12 && Math.abs(dx) < 0.35 && Math.abs(dy) < 0.12) return 'cheek';
      if (dy >= 0.05 && dy < 0.16 && Math.abs(dx) < 0.18) return 'chin';
      if (dy >= 0.16) return 'chest';
      return 'glass';
    };
    let calm = 0;
    G.gestures = CP.gestures(el, {
      zoneAt,
      on(g) {
        const S = CP.S(), a = A();
        switch (g.type) {
          case 'stroke':
            if (g.zone === 'head' || g.zone === 'cheek') { st.target = 1.12; calm = Math.min(1, calm + 0.15); G.hint(g.zone === 'head' ? 'It leans into your hand…' : 'Eyes closing, purring'); G.bond(1, 'stroke'); }
            break;
          case 'circle':
            if (g.zone === 'chin') { st.look.y = -0.3; calm = Math.min(1, calm + 0.2); G.hint('Chin up, slow blink ♥'); G.bond(1, 'chin'); }
            else if (g.zone === 'paw') { G.hint('Thumb circles on the paw pads'); G.bond(1, 'pawcircle'); }
            break;
          case 'tap':
            if (g.zone === 'nose') { st.squash = 1; const r = a.pick(['sneeze', 'giggle', 'flick']); G.hint(r === 'sneeze' ? 'Ah… ACHOO!' : r === 'giggle' ? 'Hehe!' : 'Hey! *ear flick*'); a.tone(r === 'sneeze' ? 300 : 1500, .08); if (r !== 'flick') G.bond(1, 'boop'); }
            else if (g.zone === 'glass') G.smudge(g.x, g.y, 14, 'rgba(255,255,255,.18)');
            else { st.squash = 0.6; a.tone(1100, .05); }
            break;
          case 'spread': st.target = Math.min(1.5, st.target + 0.2); break;
          case 'pinch': st.target = Math.max(0.6, st.target - 0.2); break;
          case 'hold':
            if (g.zone === 'chest') { G.hint('Feel its heartbeat'); const beat = () => { CP.vib([30, 120, 30]); }; beat(); setTimeout(beat, 900); setTimeout(beat, 1800); calm = 1; G.bond(2, 'heartbeat'); }
            break;
          case 'rough': st.target = 0.65; calm = 0; G.hint('Gently… it got startled'); a.tone(200, .15, 0, 'square', .03); CP.vib(60); setTimeout(() => { st.target = 1; }, 1500); break;
          case 'knead': case 'rake': calm = Math.min(1, calm + 0.2); G.hint(g.type === 'knead' ? 'Two-finger knead: so good' : 'Back scratch!'); G.bond(1, g.type); break;
          case 'touch': if (g.zone !== 'glass' && g.speed < 1.2) calm = Math.min(1, calm + 0.01); break;
          default: break;
        }
        calm = Math.max(0, calm - 0.004);
        purr(S && !S.asleep ? calm : calm * 0.4);
        CP.emit('glass:gesture', g);
      },
    });
  });
  CP.on('exit:glass', () => { const G = CP.glass; if (G && G.gestures) { G.gestures.detach(); G.gestures = null; } purr(0); });
})();
