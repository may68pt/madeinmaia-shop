/* CyberPet mini-games pack (v2): Laser Chase, Echo Song, Snack Catch, Bubble Pop, Word Match.
   Built on the app's game engine (countdown, pause on tab switch, scoring, stars, rewards).
   Every timing is in seconds of game time (E.t counts frames at 60 fps; dt is in frames), so slow phones
   play the same game as fast ones. */
(function () {
  'use strict';
  const CP = window.CP;
  const A = () => CP.app();
  const R = (a, b) => a + Math.random() * (b - a);
  const SEC = 60; // frames per second of game time
  const clampN = (v, a, b) => Math.max(a, Math.min(b, v));
  const font = (w, s) => `${w} ${s}px 'Barlow Condensed',sans-serif`;

  function bg(E, c1, c2, stars) {
    const x = E.x, g = x.createLinearGradient(0, 0, 0, E.H); g.addColorStop(0, c1); g.addColorStop(1, c2);
    x.fillStyle = g; x.fillRect(0, 0, E.W, E.H);
    if (stars) { x.fillStyle = 'rgba(255,255,255,.35)'; for (let i = 0; i < 40; i++) { const sx = (i * 97.3) % E.W, sy = (i * 53.7 + E.t * 0.05 * (1 + (i % 3))) % E.H; x.fillRect(sx, sy, 1.5, 1.5); } }
  }
  /** Draws the pet with its feet at (cx, by), h tall. Falls back to idle, then to an emoji. */
  function pet(E, role, cx, by, h, flip) {
    const a = A();
    if (a.gPose(E.x, role, cx, by, h, flip, E.filt) || a.gPose(E.x, 'idle', cx, by, h, flip, E.filt)) return;
    E.x.font = `${h * 0.8}px serif`; E.x.textAlign = 'center'; E.x.textBaseline = 'alphabetic'; E.x.fillText('🐱', cx, by);
  }
  const label = (E, t, x, y, size = 20, col = '#fff', align = 'center') => {
    const c = E.x; c.font = font(800, size); c.textAlign = align; c.textBaseline = 'middle';
    c.lineWidth = 4; c.strokeStyle = 'rgba(0,0,0,.55)'; c.strokeText(t, x, y); c.fillStyle = col; c.fillText(t, x, y);
  };
  const timerBar = (E, left, total, col = '#5ff4ff') => {
    const c = E.x, w = E.W - 28; c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(14, 54, w, 5);
    c.fillStyle = left / total < 0.2 ? '#ff4f7a' : col; c.fillRect(14, 54, w * clampN(left / total, 0, 1), 5);
  };
  const tone = (f, d, delay = 0, type = 'triangle', v = 0.05) => { try { A().tone(f, d, delay, type, v); } catch (e) { /* muted */ } };
  const buzz = ms => { try { CP.vib && CP.vib(ms); } catch (e) { /* no haptics */ } };
  /** "How to play" card shown during the 3-2-1 countdown, with the player's best score. */
  function intro(E, title, lines) {
    if (E.count <= 0) return;
    const x = E.x, w = E.W - 40, h = 34 + lines.length * 26 + 30, y0 = E.H - h - 30;
    x.fillStyle = 'rgba(8,6,20,.82)'; x.strokeStyle = 'rgba(95,244,255,.45)'; x.lineWidth = 1.5;
    x.beginPath(); x.roundRect(20, y0, w, h, 16); x.fill(); x.stroke();
    label(E, title, E.W / 2, y0 + 22, 22, '#5ff4ff');
    lines.forEach((l, i) => label(E, l, E.W / 2, y0 + 52 + i * 26, 18, '#fff'));
    const best = (CP.S().bests || {})[E.id];
    label(E, best ? `Your best: ${best}` : 'First try: no best yet', E.W / 2, y0 + h - 16, 16, '#ffd23f');
  }
  /** Small power-up timer chips under the HUD. */
  function chips(E, list) {
    let xx = 14;
    for (const [ic, left, tot] of list) {
      if (left <= 0) continue;
      const c = E.x; c.fillStyle = 'rgba(0,0,0,.45)'; c.beginPath(); c.roundRect(xx, 96, 64, 24, 12); c.fill();
      c.fillStyle = '#8dff4a'; c.fillRect(xx + 30, 106, 28 * (left / tot), 4);
      label(E, ic, xx + 15, 108, 16); xx += 72;
    }
  }

  /* =========================================================================================
     LASER CHASE: move the laser dot with your finger. Your pet stalks it, wiggles, then pounces
     at where the dot was when the target ring locks. Move away after the lock to dodge.
     Sweep the dot over light orbs for points. 3 lives.
     ========================================================================================= */
  const LASER = {
    init(E) {
      Object.assign(E, {
        lives: 3, time: 90 * SEC, lx: E.W / 2, ly: E.H * 0.35, px: E.W / 2, py: E.H * 0.85,
        state: 'stalk', st: 2.2 * SEC, lock: null, jump: null, inv: 0, orbs: [], orbT: SEC, near: 0, dodges: 0, trail: [], slow: 0,
      });
    },
    down(E, x, y) { E.lx = x; E.ly = clampN(y, 70, E.H - 30); },
    move(E, x, y, p) { if (p) { E.lx = clampN(x, 10, E.W - 10); E.ly = clampN(y, 70, E.H - 30); } },
    level: E => Math.min(1, E.t / (70 * SEC)), // 0 → 1 over 70 s
    update(E, dt) {
      const lv = this.level(E), a = A();
      E.slow = Math.max(0, E.slow - dt); const pdt = E.slow ? dt * 0.45 : dt; // the pet moves in slow motion
      E.time -= dt;
      if (E.time <= 0) { E.score += E.lives * 100; a.gText(E, E.W / 2, E.H * 0.4, `Survived! +${E.lives * 100}`, '#8dff4a', 30); a.gEnd(E, false); return; }
      E.inv = Math.max(0, E.inv - dt); E.score += dt / SEC * (4 + lv * 6);
      // orbs to collect with the dot
      E.orbT -= dt;
      if (E.orbT <= 0 && E.orbs.length < 4) { E.orbT = R(1.2, 2.2) * SEC; const r = Math.random(); E.orbs.push({ x: R(30, E.W - 30), y: R(130, E.H * 0.75), life: 6 * SEC, gold: r < 0.12, clock: r > 0.94 && !E.slow }); }
      for (const o of E.orbs) {
        o.life -= dt;
        if (Math.hypot(o.x - E.lx, o.y - E.ly) < 26) {
          o.life = 0;
          if (o.clock) { E.slow = 5 * SEC; a.gText(E, o.x, o.y - 18, 'Slow-mo!', '#8dff4a', 24); tone(392, 0.25, 0, 'sine', 0.06); buzz(20); continue; }
          const pts = o.gold ? 50 : 15; E.combo++; E.score += pts * Math.min(4, 1 + Math.floor(E.combo / 5));
          a.gBurst(E, o.x, o.y, o.gold ? 18 : 8, o.gold ? '#ffd23f' : '#5ff4ff'); a.gText(E, o.x, o.y - 18, '+' + pts, o.gold ? '#ffd23f' : '#fff', 20);
          tone(o.gold ? 1568 : 988 + E.combo * 20, 0.06);
        }
      }
      E.orbs = E.orbs.filter(o => o.life > 0);
      // the pet: stalk → wiggle (ring follows dot) → lock (ring stops) → leap → land
      const head = () => ({ x: E.px, y: E.py - 70 });
      if (E.state === 'stalk') {
        const sp = (0.9 + lv * 1.6) * pdt, h = head(), d = Math.hypot(E.lx - h.x, E.ly - h.y) || 1;
        E.px += ((E.lx - h.x) / d) * Math.min(sp, d); E.py = clampN(E.py + ((E.ly + 70 - E.py) / d) * Math.min(sp, d), 150, E.H - 10);
        E.st -= pdt; if (E.st <= 0) { E.state = 'wiggle'; E.st = (0.75 - lv * 0.35) * SEC; tone(300, 0.08, 0, 'square', 0.03); }
      } else if (E.state === 'wiggle') {
        E.st -= pdt; if (E.st <= 0) { E.state = 'locked'; E.lock = { x: E.lx, y: E.ly }; E.st = (0.38 - lv * 0.16) * SEC; tone(520, 0.06, 0, 'square', 0.04); }
      } else if (E.state === 'locked') {
        E.st -= pdt; if (E.st <= 0) { const h = head(); E.state = 'leap'; E.jump = { x0: E.px, y0: E.py, x1: E.lock.x, y1: E.lock.y + 70, t: 0, dur: (0.42 - lv * 0.1) * SEC }; void h; tone(700, 0.1, 0, 'sawtooth', 0.03); }
      } else if (E.state === 'leap') {
        const j = E.jump; j.t += pdt; const k = Math.min(1, j.t / j.dur);
        E.px = j.x0 + (j.x1 - j.x0) * k; E.py = j.y0 + (j.y1 - j.y0) * k - Math.sin(k * Math.PI) * 60;
        if (k >= 1) {
          const d = Math.hypot(E.lx - E.lock.x, E.ly - E.lock.y);
          if (d < 34 && !E.inv) {
            E.lives--; E.inv = 1.5 * SEC; E.combo = 0; E.shake = 9; E.flash = 14; a.SFX.no(); buzz([40, 30, 60]); a.gText(E, E.lock.x, E.lock.y - 34, 'Caught!', '#ff4f7a', 30);
            if (E.lives <= 0) { a.gEnd(E, false); return; }
          } else if (d < 95) { E.near++; E.score += 30; a.gText(E, E.lx, E.ly - 30, 'Close one! +30', '#ffd23f', 22); tone(1320, 0.08); }
          else E.dodges++;
          // late in the run it sometimes pounces twice in a row
          if (lv > 0.55 && !E.second && Math.random() < 0.4) { E.second = true; E.state = 'wiggle'; E.st = 0.3 * SEC; a.gText(E, E.px, E.py - 140, 'Again!', '#ff5070', 22); }
          else { E.second = false; E.state = 'stalk'; E.st = R(1.2, 2.4) * (1 - lv * 0.45) * SEC; E.lock = null; }
        }
      }
      E.trail.push({ x: E.lx, y: E.ly, l: 1 }); E.trail = E.trail.filter(t => (t.l -= 0.08 * dt) > 0).slice(-30);
    },
    draw(E, dt, ts) {
      bg(E, '#1a1033', '#090614', true); const x = E.x;
      // floor
      x.fillStyle = 'rgba(255,255,255,.04)'; x.fillRect(0, E.H * 0.82, E.W, E.H * 0.18);
      for (const o of E.orbs) {
        const p = 0.7 + Math.sin(ts / 200 + o.x) * 0.3, fade = Math.min(1, o.life / 40); x.globalAlpha = fade;
        if (o.clock) { x.shadowBlur = 0; x.font = '24px serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('⏱️', o.x, o.y); continue; }
        x.fillStyle = o.gold ? '#ffd23f' : '#5ff4ff'; x.shadowColor = x.fillStyle; x.shadowBlur = 14; x.beginPath(); x.arc(o.x, o.y, 9 * p, 0, 7); x.fill();
      }
      if (E.slow) { x.fillStyle = 'rgba(141,255,74,.06)'; x.fillRect(0, 0, E.W, E.H); }
      x.globalAlpha = 1; x.shadowBlur = 0;
      // target ring: follows the dot while wiggling, freezes when locked
      if (E.state === 'wiggle' || E.state === 'locked' || E.state === 'leap') {
        const t = E.state === 'wiggle' ? { x: E.lx, y: E.ly } : E.lock, locked = E.state !== 'wiggle';
        x.strokeStyle = locked ? '#ff2050' : 'rgba(255,32,80,.5)'; x.lineWidth = locked ? 3 : 2; x.setLineDash(locked ? [] : [6, 6]);
        x.beginPath(); x.arc(t.x, t.y, 34 + (locked ? 0 : Math.sin(ts / 60) * 4), 0, 7); x.stroke(); x.setLineDash([]);
      }
      // the pet (wiggles before a pounce, blinks while invulnerable)
      const wig = E.state === 'wiggle' ? Math.sin(ts / 30) * 4 : 0;
      if (!(E.inv && Math.floor(ts / 90) % 2)) {
        x.save(); x.translate(wig, 0);
        pet(E, E.state === 'leap' ? 'jump' : E.state === 'stalk' ? 'chaseball' : 'pounce', E.px, E.py, 120, E.lx < E.px);
        x.restore();
      }
      // the laser and its trail
      for (const t of E.trail) { x.globalAlpha = t.l * 0.5; x.fillStyle = '#ff2050'; x.beginPath(); x.arc(t.x, t.y, 6 * t.l, 0, 7); x.fill(); }
      x.globalAlpha = 1; x.shadowColor = '#ff2050'; x.shadowBlur = 22; x.fillStyle = '#ff5070'; x.beginPath(); x.arc(E.lx, E.ly, 8, 0, 7); x.fill(); x.fillStyle = '#fff'; x.beginPath(); x.arc(E.lx, E.ly, 3, 0, 7); x.fill(); x.shadowBlur = 0;
      timerBar(E, E.time, 90 * SEC, '#ff5070');
      chips(E, [['⏱️', E.slow, 5 * SEC]]);
      A().gCombo(E, 86);
      intro(E, 'Laser Chase', ['Drag the red dot. Sweep up the light.', 'Ring turns solid: move away, it pounces!', '⏱️ slows your pet down']);
    },
    finish(E) { const sc = Math.floor(E.score); return { score: sc, coins: Math.floor(sc / 15), xp: Math.floor(sc / 8) + 5, title: E.time <= 0 ? 'Survived the chase!' : undefined, lines: [`${E.dodges + E.near} pounces dodged · ${E.near} close calls`] }; },
    hud(E) { return `${Math.ceil(Math.max(0, E.time) / SEC)}s · ${Math.floor(E.score)}`; },
  };

  /* =========================================================================================
     ECHO SONG: your pet sings a tune on four glowing pads; sing it back. Each round adds a note
     and plays a little faster. A wrong pad costs a life and replays the tune. 3 lives.
     ========================================================================================= */
  const PADS = [{ c: '#ff5fb8', f: 523, g: '♡' }, { c: '#5ff4ff', f: 659, g: '✦' }, { c: '#ffd23f', f: 784, g: '☾' }, { c: '#8dff4a', f: 1047, g: '◐' }];
  const ECHO = {
    init(E) { Object.assign(E, { lives: 3, seq: [], step: 0, mode: 'wait', wt: 0.8 * SEC, play: null, lit: -1, litT: 0, press: -1, round: 0, best: 0, perfect: 0, mistakes: 0 }); this.add(E); },
    add(E) { E.seq.push(Math.floor(Math.random() * 4)); E.round = E.seq.length; },
    /** Schedules the whole tune: one entry per note with its start time. */
    listen(E) {
      const gap = Math.max(0.28, 0.6 - E.round * 0.025) * SEC;
      E.play = { notes: E.seq.map((p, i) => ({ p, at: i * gap, done: false })), t: 0, len: E.seq.length * gap, gap };
      E.mode = 'listen'; E.step = 0;
    },
    geo(E) {
      const s = Math.min(E.W * 0.42, E.H * 0.24), cx = E.W / 2, cy = E.H * 0.64;
      return PADS.map((_, i) => ({ x: cx + (i % 2 ? 0.55 : -0.55) * s, y: cy + (i < 2 ? -0.55 : 0.55) * s, r: s * 0.47 }));
    },
    flash(E, i, len) { E.lit = i; E.litT = len; tone(PADS[i].f, len / SEC * 0.9, 0, 'triangle', 0.07); },
    down(E, x, y) {
      if (E.mode !== 'input') return;
      const i = this.geo(E).findIndex(p => Math.abs(x - p.x) < p.r && Math.abs(y - p.y) < p.r); if (i < 0) return;
      this.flash(E, i, 0.22 * SEC); E.press = i; buzz(8);
      const a = A();
      if (i === E.seq[E.step]) {
        E.step++;
        if (E.step >= E.seq.length) {
          const took = (E.t - (E.inputAt || E.t)) / SEC, fast = !E.roundMiss && took < E.seq.length * 0.55;
          E.score += E.seq.length * 20 + (E.roundMiss ? 0 : 10) + (fast ? E.seq.length * 5 : 0);
          if (fast) a.gText(E, E.W / 2, E.H * 0.36, `Quick! +${E.seq.length * 5}`, '#5ff4ff', 20); if (!E.roundMiss) E.perfect++;
          E.combo++; E.best = Math.max(E.best, E.seq.length);
          a.gText(E, E.W / 2, E.H * 0.3, ['In tune!', 'Duet!', 'Perfect pitch!', 'Encore!'][E.round % 4], '#8dff4a', 30);
          a.gBurst(E, E.W / 2, E.H * 0.3, 16, PADS.map(p => p.c));
          if (E.seq.length >= 20) { E.score += 300; E.maestro = true; a.gEnd(E, false); return; }
          E.mode = 'wait'; E.wt = 0.9 * SEC; E.roundMiss = false; this.add(E);
        }
      } else {
        E.lives--; E.combo = 0; E.mistakes++; E.roundMiss = true; E.shake = 6; E.flash = 10; a.SFX.no();
        a.gText(E, E.W / 2, E.H * 0.3, 'Oops! Listen again', '#ff4f7a', 26);
        if (E.lives <= 0) { a.gEnd(E, false); return; }
        E.mode = 'wait'; E.wt = 1 * SEC;
      }
    },
    update(E, dt) {
      E.litT = Math.max(0, E.litT - dt); if (!E.litT) E.lit = -1;
      if (E.mode === 'wait') { E.wt -= dt; if (E.wt <= 0) this.listen(E); return; }
      if (E.mode === 'listen') {
        const P = E.play; P.t += dt;
        for (const n of P.notes) if (!n.done && P.t >= n.at) { n.done = true; this.flash(E, n.p, P.gap * 0.7); }
        if (P.t >= P.len + 0.15 * SEC) { E.mode = 'input'; E.step = 0; E.inputAt = E.t; }
      }
    },
    draw(E, dt, ts) {
      bg(E, '#14102e', '#07060f', true); const x = E.x;
      const listening = E.mode === 'listen';
      const ph = Math.min(120, E.H * 0.16), pby = E.H * 0.3;
      pet(E, listening ? 'dance' : 'idle', E.W / 2, pby + (listening ? Math.sin(ts / 120) * 3 : 0), ph, false);
      if (listening && E.lit >= 0) { label(E, PADS[E.lit].g, E.W / 2 + ph * 0.55, pby - ph * 0.85 + Math.sin(ts / 90) * 4, 30, PADS[E.lit].c); label(E, '♪', E.W / 2 - ph * 0.55, pby - ph * 0.7, 24, PADS[E.lit].c); }
      this.geo(E).forEach((p, i) => {
        const on = E.lit === i, k = on ? 1 : 0.32;
        x.globalAlpha = k; x.fillStyle = PADS[i].c; x.shadowColor = PADS[i].c; x.shadowBlur = on ? 36 : 0;
        x.beginPath(); x.roundRect(p.x - p.r, p.y - p.r, p.r * 2, p.r * 2, 22); x.fill();
        x.shadowBlur = 0; x.globalAlpha = on ? 1 : 0.7; label(E, PADS[i].g, p.x, p.y, p.r * 0.7, on ? '#0c0a1f' : '#fff');
      });
      x.globalAlpha = 1;
      // progress dots for the current tune
      const n = E.seq.length, gap = Math.min(18, (E.W - 40) / Math.max(1, n));
      for (let i = 0; i < n; i++) { x.fillStyle = E.mode === 'input' && i < E.step ? '#8dff4a' : 'rgba(255,255,255,.25)'; x.beginPath(); x.arc(E.W / 2 - ((n - 1) * gap) / 2 + i * gap, E.H * 0.335, 4, 0, 7); x.fill(); }
      if (E.count <= 0) label(E, listening ? 'Listen…' : E.mode === 'input' ? 'Your turn!' : `Tune ${E.round}`, E.W / 2, E.H * 0.93, 24);
      intro(E, 'Echo Song', ['Watch and listen to the tune.', 'Then tap the same pads in order.', 'One more note every round']);
    },
    finish(E) {
      const tunes = Math.max(0, E.best);
      CP.lang && CP.lang.gain(Math.min(12, tunes * 2), 'echo');
      return { score: Math.floor(E.score), coins: Math.floor(E.score / 10), xp: tunes * 8 + 4, title: E.maestro ? 'Maestro! 20-note duet' : undefined, lines: [`Longest tune: ${tunes} notes · ${E.perfect} perfect`] };
    },
    hud(E) { return `Tune ${E.round} · ${Math.floor(E.score)} pts`; },
  };

  /* =========================================================================================
     SNACK CATCH: slide your finger to move your pet (or tilt, on phones that allow it) and
     catch falling snacks in its mouth. Golden stars are worth 5×, hearts give a life back,
     glitch bugs cost a life. 60 seconds.
     ========================================================================================= */
  const FOOD = ['🫐', '🍙', '🧁', '🍓', '🐟', '🌶️'];
  let tilt = null, tilt0 = null;
  addEventListener('deviceorientation', e => {
    if (typeof e.gamma !== 'number') return;
    if (tilt0 === null) tilt0 = e.gamma;
    tilt = clampN((e.gamma - tilt0) / 25, -1, 1);
  });
  const SNACK = {
    init(E) {
      tilt0 = null; // re-centre tilt on the way the phone is held now
      Object.assign(E, { lives: 3, px: E.W / 2, tx: E.W / 2, items: [], st: 0.6 * SEC, time: 60 * SEC, caught: 0, stars: 0, chew: 0, finger: false, misses: 0, magnet: 0, fire: 0, burned: 0 });
    },
    down(E, x) { E.finger = true; E.tx = clampN(x, 40, E.W - 40); },
    move(E, x, y, p) { if (p) E.tx = clampN(x, 40, E.W - 40); },
    up(E) { E.finger = false; },
    mouthY: E => E.H * 0.88 - 62,
    update(E, dt) {
      const a = A();
      E.time -= dt; if (E.time <= 0) { a.gEnd(E, false); return; }
      if (!E.finger && tilt !== null && Math.abs(tilt) > 0.12) E.tx = clampN(E.tx + tilt * 10 * dt, 40, E.W - 40);
      E.px += (E.tx - E.px) * Math.min(1, 0.25 * dt);
      E.chew = Math.max(0, E.chew - dt);
      const lv = Math.min(1, E.t / (50 * SEC));
      E.st -= dt;
      if (E.st <= 0) {
        E.st = (0.75 - lv * 0.4) * SEC * R(0.7, 1.3);
        const r = Math.random(), b = 0.16 + lv * 0.14;
        const kind = r < b ? 'bug' : r < b + 0.06 ? 'star' : r < b + 0.08 && E.lives < 3 ? 'heart' : r < b + 0.1 && !E.magnet ? 'magnet' : r < b + 0.12 && !E.fire && E.t > 10 * SEC ? 'chili' : 'food';
        E.items.push({ x: R(30, E.W - 30), y: -24, v: R(2.2, 3) + lv * 2.4, kind, e: { bug: '👾', star: '⭐', heart: '💗', magnet: '🧲', chili: '🌶️' }[kind] || a.pick(FOOD.filter(f => f !== '🌶️')), spin: R(-0.05, 0.05), r: 0 });
      }
      const my = this.mouthY(E);
      E.magnet = Math.max(0, E.magnet - dt); E.fire = Math.max(0, E.fire - dt);
      if (E.fire) for (const it of E.items) if (it.kind === 'bug' && !it.done && Math.abs(it.x - E.px) < 50 && it.y > my - 260 && it.y < my) { it.done = true; E.burned++; E.score += 15; a.gBurst(E, it.x, it.y, 14, ['#ff7a1a', '#ffd23f']); a.gText(E, it.x, it.y, 'Toasted! +15', '#ff9a3c', 18); tone(160, 0.12, 0, 'sawtooth', 0.03); }
      for (const it of E.items) {
        // magnet pulls good things toward the mouth
        if (E.magnet && it.kind !== 'bug' && it.y > E.H * 0.25 && it.y < my) it.x += (E.px - it.x) * Math.min(1, 0.08 * dt);
        const prev = it.y; it.y += it.v * dt; it.r += it.spin * dt;
        if (!it.done && prev < my && it.y >= my - 4 && Math.abs(it.x - E.px) < 46) {
          it.done = true;
          if (it.kind === 'bug') { E.lives--; E.combo = 0; E.shake = 8; E.flash = 12; a.SFX.no(); buzz([40, 30, 60]); a.gText(E, it.x, my - 30, 'Glitch!', '#ff4f7a'); if (E.lives <= 0) { a.gEnd(E, false); return; } }
          else if (it.kind === 'heart') { E.lives = Math.min(3, E.lives + 1); a.gText(E, it.x, my - 30, '+1 ❤️', '#ff9fd2'); tone(880, 0.12); buzz(15); }
          else if (it.kind === 'chili') { E.fire = 3 * SEC; a.gText(E, it.x, my - 30, 'Fire breath!', '#ff7a1a', 26); tone(220, 0.25, 0, 'sawtooth', 0.04); buzz(30); }
          else if (it.kind === 'magnet') { E.magnet = 6 * SEC; a.gText(E, it.x, my - 30, 'Magnet!', '#8dff4a', 26); tone(523, 0.1); tone(784, 0.1, 0.1); buzz(20); }
          else {
            const pts = it.kind === 'star' ? 50 : 10; E.combo++; if (it.kind === 'star') E.stars++; else E.caught++;
            const mult = Math.min(4, 1 + Math.floor(E.combo / 6)); E.score += pts * mult; E.chew = 0.35 * SEC;
            a.gBurst(E, it.x, my, it.kind === 'star' ? 16 : 7, it.kind === 'star' ? '#ffd23f' : '#ffffff'); a.gText(E, it.x, my - 30, `+${pts * mult}`, it.kind === 'star' ? '#ffd23f' : '#fff', 22);
            try { a.SFX.munch(); } catch (e) { tone(300, 0.05); }
          }
        }
        if (!it.done && it.y > E.H + 30) { it.done = true; if (it.kind === 'food' || it.kind === 'star') { E.combo = 0; E.misses++; } }
      }
      E.items = E.items.filter(i => !i.done);
    },
    draw(E, dt, ts) {
      bg(E, '#16224a', '#0a0d1e', true); const x = E.x;
      x.fillStyle = 'rgba(255,255,255,.05)'; x.fillRect(0, E.H * 0.88, E.W, E.H * 0.12);
      x.textAlign = 'center'; x.textBaseline = 'middle';
      for (const it of E.items) { x.save(); x.translate(it.x, it.y); x.rotate(it.r); x.font = '34px serif'; x.fillText(it.e, 0, 0); x.restore(); }
      if (E.magnet) { const g = x.createRadialGradient(E.px, this.mouthY(E), 10, E.px, this.mouthY(E), 140); g.addColorStop(0, 'rgba(141,255,74,.18)'); g.addColorStop(1, 'rgba(141,255,74,0)'); x.fillStyle = g; x.fillRect(0, 0, E.W, E.H); }
      if (E.fire) { const my = this.mouthY(E), fg = x.createLinearGradient(0, my, 0, my - 260); fg.addColorStop(0, 'rgba(255,200,60,.85)'); fg.addColorStop(0.5, 'rgba(255,90,30,.5)'); fg.addColorStop(1, 'rgba(255,40,80,0)'); x.fillStyle = fg; x.beginPath(); x.moveTo(E.px - 14, my); x.lineTo(E.px - 50 - Math.sin(ts / 40) * 8, my - 260); x.lineTo(E.px + 50 + Math.sin(ts / 50) * 8, my - 260); x.lineTo(E.px + 14, my); x.fill(); }
      pet(E, E.chew ? 'eat' : 'happy', E.px, E.H * 0.88, 100, E.tx < E.px - 4);
      timerBar(E, E.time, 60 * SEC);
      chips(E, [['🧲', E.magnet, 6 * SEC], ['🌶️', E.fire, 3 * SEC]]);
      A().gCombo(E, 86);
      intro(E, 'Snack Catch', [tilt !== null ? 'Slide your finger (or tilt) to move.' : 'Slide your finger to move.', 'Catch snacks · ⭐ ×5 · 💗 heals · 🧲 pulls', 'Dodge 👾 bugs · 🌶️ = fire breath!']);
    },
    finish(E) {
      const S = CP.S(), gain = Math.min(15, E.caught + E.stars * 2); S.energy = A().clamp(S.energy + gain);
      return { score: Math.floor(E.score), coins: Math.floor(E.score / 12), xp: Math.floor(E.score / 7) + 4, lines: [`${E.caught} snacks · ${E.stars} stars · +${gain} energy`, E.burned ? `🔥 ${E.burned} bugs toasted` : ''].filter(Boolean) };
    },
    hud(E) { return `${Math.ceil(E.time / SEC)}s · ${Math.floor(E.score)}`; },
  };

  /* =========================================================================================
     BUBBLE POP: race your pet to the holo-bubbles. Gold bubbles are worth 5×. Don't tap the
     glitch bubbles (−20), but if your pet pops one it gets dizzy for a moment. 45 seconds.
     ========================================================================================= */
  const BUBBLE = {
    init(E) { Object.assign(E, { bubbles: [], bt: 0.3 * SEC, px: E.W / 2, py: E.H * 0.75, goal: null, think: 0.8 * SEC, dizzy: 0, mine: 0, its: 0, time: 45 * SEC, lastPop: -99, frozen: 0 }); },
    down(E, x, y) {
      const a = A();
      let hit = null, best = 1e9;
      for (const b of E.bubbles) { const d = Math.hypot(x - b.x, y - b.y); if (!b.pop && d < b.r + 14 && d < best) { best = d; hit = b; } }
      if (!hit) return;
      hit.pop = true;
      if (hit.kind === 'ice') { E.frozen = 3 * SEC; a.gText(E, hit.x, hit.y, 'Freeze!', '#9ff4ff', 26); a.gBurst(E, hit.x, hit.y, 16, ['#ffffff', '#9ff4ff']); tone(1760, 0.15, 0, 'sine', 0.05); buzz(20); return; }
      if (hit.kind === 'glitch') { E.score = Math.max(0, E.score - 20); E.combo = 0; E.shake = 6; a.SFX.no(); buzz(40); a.gText(E, hit.x, hit.y, '−20', '#ff4f7a', 24); a.gBurst(E, hit.x, hit.y, 10, '#b06bff'); return; }
      const quick = E.t - E.lastPop < 0.7 * SEC; E.lastPop = E.t; E.combo = quick ? E.combo + 1 : 1;
      if (hit.kind === 'gold') { // chain reaction: nearby bubbles burst with it
        let chain = 0;
        for (const b of E.bubbles) if (!b.pop && b !== hit && b.kind !== 'glitch' && Math.hypot(b.x - hit.x, b.y - hit.y) < 120) { b.pop = true; chain++; E.mine++; E.score += 10; a.gBurst(E, b.x, b.y, 8, '#ffd23f'); }
        if (chain) { a.gText(E, hit.x, hit.y - 34, `Chain ×${chain}! +${chain * 10}`, '#ffd23f', 22); tone(1760, 0.1, 0.05); E.shake = 3; }
      }
      const pts = (hit.kind === 'gold' ? 50 : 10) * Math.min(4, 1 + Math.floor(E.combo / 4)); E.score += pts; E.mine++;
      tone(hit.kind === 'gold' ? 1568 : 880 + Math.min(10, E.combo) * 40, 0.06);
      a.gBurst(E, hit.x, hit.y, hit.kind === 'gold' ? 18 : 9, hit.kind === 'gold' ? '#ffd23f' : '#9ff4ff'); a.gText(E, hit.x, hit.y, '+' + pts, '#fff', 20);
    },
    update(E, dt) {
      const a = A();
      E.time -= dt; if (E.time <= 0) { a.gEnd(E, false); return; }
      const lv = Math.min(1, E.t / (40 * SEC));
      E.bt -= dt;
      if (E.bt <= 0) {
        E.bt = R(0.35, 0.8) * SEC * (1 - lv * 0.3);
        const r = Math.random();
        E.bubbles.push({ x: R(34, E.W - 34), y: E.H + 30, r: R(18, 30), v: R(0.9, 1.5) + lv * 0.8, kind: r < 0.08 ? 'gold' : r < 0.2 ? 'glitch' : r < 0.23 && !E.frozen ? 'ice' : 'plain', w: Math.random() * 6 });
      }
      E.frozen = Math.max(0, E.frozen - dt); const bdt = E.frozen ? dt * 0.12 : dt; // freeze: bubbles and pet almost stop
      for (const b of E.bubbles) { b.y -= b.v * bdt; b.x += Math.sin(E.t / 30 + b.w) * 0.35 * bdt; }
      // the pet: picks a bubble in the top two thirds, thinks a moment, floats over and pops it
      E.dizzy = Math.max(0, E.dizzy - dt);
      if (!E.dizzy && !E.frozen) {
        if (!E.goal || E.goal.pop || E.goal.y < 40) {
          E.goal = null; E.think -= dt;
          if (E.think <= 0) {
            const opts = E.bubbles.filter(b => !b.pop && b.y < E.H * 0.7 && b.y > 80);
            opts.sort((p, q) => (q.kind === 'gold') - (p.kind === 'gold') || Math.hypot(p.x - E.px, p.y - E.py) - Math.hypot(q.x - E.px, q.y - E.py));
            E.goal = opts[0] || null; E.think = (0.55 - lv * 0.25) * SEC;
          }
        } else {
          const sp = (2.2 + lv * 1.6) * dt, gx = E.goal.x, gy = E.goal.y + 50, d = Math.hypot(gx - E.px, gy - E.py) || 1;
          E.px += ((gx - E.px) / d) * Math.min(sp, d); E.py += ((gy - E.py) / d) * Math.min(sp, d);
          if (d < 20) {
            E.goal.pop = true; const g = E.goal; E.goal = null;
            if (g.kind === 'glitch') { E.dizzy = 2 * SEC; a.gText(E, g.x, g.y, 'Dizzy!', '#b06bff', 22); a.gBurst(E, g.x, g.y, 10, '#b06bff'); tone(220, 0.2, 0, 'sawtooth', 0.03); }
            else { E.its++; tone(440, 0.05); a.gBurst(E, g.x, g.y, 6, '#ff9fd2'); }
          }
        }
      }
      E.bubbles = E.bubbles.filter(b => !b.pop && b.y > -50);
    },
    draw(E, dt, ts) {
      bg(E, '#0f2a3a', '#06121b', false); const x = E.x;
      for (const b of E.bubbles) {
        const col = b.kind === 'gold' ? '#ffd23f' : b.kind === 'glitch' ? '#b06bff' : b.kind === 'ice' ? '#ffffff' : '#9ff4ff';
        x.strokeStyle = col; x.lineWidth = 2; x.fillStyle = col + '22'; x.beginPath(); x.arc(b.x, b.y, b.r, 0, 7); x.fill(); x.stroke();
        x.fillStyle = 'rgba(255,255,255,.5)'; x.beginPath(); x.arc(b.x - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.2, 0, 7); x.fill();
        if (b.kind === 'glitch' || b.kind === 'ice') { x.font = `${b.r}px serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(b.kind === 'ice' ? '❄️' : '👾', b.x, b.y + 1); }
      }
      x.save(); if (E.dizzy) { x.translate(E.px, E.py - 50); x.rotate(Math.sin(ts / 80) * 0.3); x.translate(-E.px, -(E.py - 50)); }
      pet(E, E.dizzy ? 'refuse' : 'chaseball', E.px, E.py, 96, E.goal && E.goal.x < E.px);
      x.restore();
      if (E.dizzy) label(E, '💫', E.px, E.py - 110, 24);
      // score race bar
      const tot = Math.max(1, E.mine + E.its), w = E.W - 28;
      x.fillStyle = '#5ff4ff'; x.fillRect(14, 62, w * (E.mine / tot), 8); x.fillStyle = '#ff9fd2'; x.fillRect(14 + w * (E.mine / tot), 62, w * (E.its / tot), 8);
      label(E, `You ${E.mine}`, 16, 84, 16, '#5ff4ff', 'left'); label(E, `${CP.S().name} ${E.its}`, E.W - 16, 84, 16, '#ff9fd2', 'right');
      if (E.frozen) { x.fillStyle = 'rgba(159,244,255,.08)'; x.fillRect(0, 0, E.W, E.H); }
      timerBar(E, E.time, 45 * SEC);
      chips(E, [['❄️', E.frozen, 3 * SEC]]);
      intro(E, 'Bubble Pop', ['Pop bubbles before your pet does.', 'Gold ×5 and chain-pops its neighbours', '❄️ freezes all · leave 👾 to your pet']);
    },
    finish(E) {
      const win = E.mine > E.its, sc = Math.floor(E.score);
      return { score: sc, coins: Math.floor(sc / 10) + (win ? 10 : 0), xp: Math.floor(sc / 6) + 5, title: win ? 'You out-popped it!' : E.mine === E.its ? 'A tie!' : 'It was faster!', lines: [`You ${E.mine} – ${E.its} ${CP.S().name}`] };
    },
    hud(E) { return `${Math.ceil(E.time / SEC)}s · ${Math.floor(E.score)}`; },
  };

  /* =========================================================================================
     WORD MATCH: your pet thinks of something (the picture in its bubble) and tries to say the
     word. Pick the right word to teach it. Fast answers score more; every right answer
     strengthens that word in its vocabulary. 10 rounds.
     ========================================================================================= */
  const DICT = {
    pt: [['comer', '🍙'], ['brincar', '⚽'], ['dormir', '😴'], ['água', '💧'], ['bola', '🏀'], ['lua', '🌙'], ['sol', '☀️'], ['peixe', '🐟'], ['estrela', '⭐'], ['flor', '🌸'], ['casa', '🏠'], ['amor', '💗'], ['música', '🎵'], ['chuva', '🌧️'], ['bolo', '🎂'], ['gato', '🐱']],
    en: [['food', '🍙'], ['play', '⚽'], ['sleep', '😴'], ['water', '💧'], ['ball', '🏀'], ['moon', '🌙'], ['sun', '☀️'], ['fish', '🐟'], ['star', '⭐'], ['flower', '🌸'], ['home', '🏠'], ['love', '💗'], ['music', '🎵'], ['rain', '🌧️'], ['cake', '🎂'], ['cat', '🐱']],
  };
  const ROUND_T = 7 * SEC;
  /** A pet-like attempt at a word: the first syllable clear, the rest softened. Always readable as a hint. */
  function attempt(word) {
    const w = word.toLowerCase(), cut = Math.max(2, Math.ceil(w.length * 0.5));
    const tail = w.slice(cut).replace(/[aeiouáéíóúãõ]/g, 'u').replace(/[^a-zu]/g, '');
    return w.slice(0, cut) + (tail ? '-' + tail.slice(0, 3) : '') + '?';
  }
  const WORDS = {
    init(E) {
      const lang = (navigator.language || 'pt').toLowerCase().startsWith('pt') ? 'pt' : 'en';
      E.dict = DICT[lang].slice().sort(() => Math.random() - 0.5);
      Object.assign(E, { q: 0, total: 10, wait: 0, opts: [], pick: -1, rt: ROUND_T, right: 0, fast: 0 });
      this.ask(E);
    },
    ask(E) {
      const pair = E.dict[E.q % E.dict.length], others = E.dict.filter(p => p[0] !== pair[0]).sort(() => Math.random() - 0.5).slice(0, 2);
      // every third round is reversed: it says the word clearly and you pick the picture
      E.reverse = E.q % 3 === 2;
      E.word = pair[0]; E.emoji = pair[1]; E.pairs = [pair, ...others].sort(() => Math.random() - 0.5); E.opts = E.pairs.map(p => p[0]);
      E.pick = -1; E.wait = 0; E.rt = ROUND_T; E.said = E.reverse ? pair[0] + '!' : attempt(pair[0]); E.q++;
      tone(700, 0.06); tone(900, 0.06, 0.08);
    },
    rows(E) {
      if (E.reverse) { const s = Math.min(100, (E.W - 72) / 3), y = E.H * 0.6; return E.opts.map((o, i) => ({ x: 24 + i * (s + 12), y, w: s, h: s })); }
      const top = E.H * 0.56, h = Math.min(62, (E.H * 0.36) / 3); return E.opts.map((o, i) => ({ x: 24, y: top + i * (h + 10), w: E.W - 48, h }));
    },
    down(E, x, y) {
      if (E.pick >= 0) return;
      const i = this.rows(E).findIndex(r => y >= r.y && y <= r.y + r.h && x >= r.x && x <= r.x + r.w); if (i < 0) return;
      this.answer(E, i);
    },
    answer(E, i) {
      const a = A(); E.pick = i; const ok = i >= 0 && E.opts[i] === E.word;
      if (ok) {
        E.combo++; const speed = E.rt / ROUND_T, mult = E.combo >= 6 ? 2 : E.combo >= 3 ? 1.5 : 1, pts = Math.round((50 + speed * 50) * mult); E.score += pts; E.right++; if (speed > 0.6) E.fast++;
        if (mult > 1) a.gText(E, E.W / 2, E.H * 0.42, `Streak ×${mult}`, '#ffd23f', 20);
        a.SFX.ok(); buzz(10); a.gText(E, E.W / 2, E.H * 0.47, '+' + pts, '#8dff4a', 28); a.gBurst(E, E.W / 2, E.H * 0.3, 14, ['#8dff4a', '#5ff4ff']);
        const l = CP.lang && CP.lang.state();
        if (l) { const v = l.vocab[E.word] = l.vocab[E.word] || { s: 0, n: 0, t: Date.now() }; v.s = Math.min(1, v.s + 0.1); v.n++; v.t = Date.now(); }
      } else { E.combo = 0; a.SFX.no(); E.shake = 4; }
    },
    update(E, dt) {
      if (E.pick < 0) { E.rt -= dt; if (E.rt <= 0) this.answer(E, -1); return; }
      E.wait += dt; if (E.wait > 1.1 * SEC) { if (E.q >= E.total) A().gEnd(E, false); else this.ask(E); }
    },
    draw(E, dt, ts) {
      bg(E, '#221338', '#0b0716', true); const x = E.x;
      // thought bubble with what it wants
      const bx = E.W / 2 + 70, by = E.H * 0.17;
      x.fillStyle = 'rgba(255,255,255,.92)'; x.beginPath(); x.ellipse(bx, by, 46, 38, 0, 0, 7); x.fill();
      x.beginPath(); x.arc(bx - 40, by + 40, 8, 0, 7); x.fill(); x.beginPath(); x.arc(bx - 54, by + 56, 5, 0, 7); x.fill();
      x.font = E.reverse ? '800 34px serif' : '40px serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
      if (E.reverse) { x.fillStyle = '#7a3cff'; x.fillText('?', bx, by + 2); } else x.fillText(E.emoji, bx, by + 2 + Math.sin(ts / 300) * 2);
      pet(E, E.pick < 0 ? 'think' : E.opts[E.pick] === E.word ? 'happy' : 'curious', E.W / 2 - 30, E.H * 0.42, Math.min(140, E.H * 0.2), false);
      label(E, '“' + E.said + '”', E.W / 2, E.H * 0.48, 30, '#ffd6f2');
      this.rows(E).forEach((r, i) => {
        const o = E.opts[i], show = E.pick >= 0, ok = show && o === E.word, bad = show && E.pick === i && !ok;
        x.fillStyle = ok ? 'rgba(141,255,74,.35)' : bad ? 'rgba(255,79,122,.35)' : 'rgba(255,255,255,.1)';
        x.beginPath(); x.roundRect(r.x, r.y, r.w, r.h, 14); x.fill();
        if (E.reverse) { x.font = `${r.h * 0.55}px serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(E.pairs[i][1], r.x + r.w / 2, r.y + r.h / 2); if (show) label(E, o, r.x + r.w / 2, r.y + r.h + 16, 16); }
        else label(E, o, E.W / 2, r.y + r.h / 2, 26);
      });
      if (E.reverse && E.pick < 0) label(E, 'Which one is it?', E.W / 2, E.H * 0.555, 18, '#9ff4ff');
      if (E.pick < 0) timerBar(E, E.rt, ROUND_T, '#ffd23f');
      label(E, `${E.q}/${E.total}`, 16, 76, 18, '#fff', 'left');
      intro(E, 'Word Match', ['Your pet tries to say a word.', 'Pick the right word to teach it.', 'Every 3rd round: pick the picture']);
    },
    finish(E) {
      CP.lang && CP.lang.gain(E.right, 'words');
      return { score: Math.floor(E.score), coins: Math.floor(E.score / 20), xp: E.right * 6 + 4, lines: [`${E.right} of ${E.total} words taught · ${E.fast} quick answers`] };
    },
    hud(E) { return `${E.q}/${E.total} · ${Math.floor(E.score)}`; },
  };

  CP.on('start', () => {
    const a = A();
    Object.assign(a.GAMES2, {
      laser: { n: 'Laser Chase', d: 'Drag the laser dot and sweep up light. When the ring turns solid, move: your Cyberpet pounces!', pose: 'chaseball', bg: 'linear-gradient(135deg,#ff2050,#7a1fd0)', stars: [400, 900, 1500], trait: 'instinct', rw: '⚡ XP · Instinct' },
      echo: { n: 'Echo Song', d: 'Your Cyberpet sings a tune on four pads. Sing it back, one more note each round. Helps it learn to talk.', pose: 'dance', bg: 'linear-gradient(135deg,#ff5fb8,#ffd23f)', stars: [150, 450, 900], trait: 'cosmic', rw: '🗣️ Language XP', train: 1 },
      snack: { n: 'Snack Catch', d: 'Slide to catch falling snacks in its mouth. Stars are 5×, hearts heal, glitch bugs hurt. 60 seconds.', pose: 'eat', bg: 'linear-gradient(135deg,#3f8cff,#8dff4a)', stars: [300, 700, 1300], trait: 'nature', rw: '⚡ XP · 🍴 Energy' },
      bubble: { n: 'Bubble Pop', d: 'Race your Cyberpet to the holo-bubbles. Gold is 5×. Leave the 👾 bubbles for your pet: they make it dizzy.', pose: 'chaseball', bg: 'linear-gradient(135deg,#1fd0ff,#1fae8c)', stars: [250, 550, 950], trait: 'tech', rw: '⚡ XP · Tech' },
      words: { n: 'Word Match', d: 'Your Cyberpet thinks of something and tries to say it. Pick the right word to teach it.', pose: 'think', bg: 'linear-gradient(135deg,#b06bff,#ff5fb8)', stars: [550, 900, 1300], trait: 'cosmic', rw: '🗣️ Language XP', train: 1 },
    });
    Object.assign(a.GAMEOBJ, { laser: LASER, echo: ECHO, snack: SNACK, bubble: BUBBLE, words: WORDS });
    for (const id of ['laser', 'snack', 'bubble', 'echo', 'words']) if (!a.ROT_POOL.includes(id)) a.ROT_POOL.push(id);
    for (const id of ['echo', 'words']) if (!a.TRAIN_POOL.includes(id)) a.TRAIN_POOL.push(id);
    try { a.renderPlay(); } catch (e) { /* not on play */ }
  });
  CP.games = { LASER, ECHO, SNACK, BUBBLE, WORDS, attempt };
})();
