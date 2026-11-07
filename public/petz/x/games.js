/* CyberPet mini-games pack: Laser Chase, Echo Song, Snack Catch, Bubble Pop and Word Match.
   All run on the app's game engine (countdown, scoring, stars, rewards) and join the daily rotation. */
(function () {
  'use strict';
  const CP = window.CP;
  const A = () => CP.app();
  const R = (a, b) => a + Math.random() * (b - a);
  const bg = (E, c1, c2) => { const g = E.x.createLinearGradient(0, 0, 0, E.H); g.addColorStop(0, c1); g.addColorStop(1, c2); E.x.fillStyle = g; E.x.fillRect(0, 0, E.W, E.H); };
  const pet = (E, role, x, y, h, flip) => A().gPose(E.x, role, x, y, h, flip, E.filt) || A().gPose(E.x, 'idle', x, y, h, flip, E.filt);

  /* ---------- Laser Chase: drag the dot, the pet pounces, don't get caught ---------- */
  const LASER = {
    init(E) { Object.assign(E, { lx: E.W / 2, ly: E.H * 0.4, px: E.W / 2, py: E.H * 0.8, vx: 0, vy: 0, jump: 0, jt: 90, lives: 3, inv: 0, near: 0, trail: [] }); },
    down(E, x, y) { E.lx = x; E.ly = y; }, move(E, x, y, p) { if (p) { E.lx = x; E.ly = y; } },
    update(E, dt) {
      const sp = 1 + E.t / 1800; E.score += dt * 0.12 * sp; E.inv = Math.max(0, E.inv - dt);
      E.jt -= dt;
      if (!E.jump && E.jt <= 0) { E.jump = 1; E.jvx = (E.lx - E.px) / 28; E.jvy = (E.ly - E.py) / 28; E.jt = Math.max(28, 80 - E.t / 60) + R(0, 30); }
      if (E.jump) { E.px += E.jvx * dt; E.py += E.jvy * dt; E.jump += dt; if (E.jump > 28) { E.jump = 0; const d = Math.hypot(E.px - E.lx, E.py - E.ly); if (d < 40 && !E.inv) { E.lives--; E.inv = 70; E.shake = 8; A().SFX.no(); A().gText(E, E.lx, E.ly - 30, 'Caught!', '#ff4f7a'); if (E.lives <= 0) A().gEnd(E, false); } else if (d < 90) { E.score += 25; E.near++; A().gText(E, E.lx, E.ly - 30, 'Close one! +25', '#ffd23f', 22); } } }
      else { E.px += (E.lx - E.px) * 0.02 * sp * dt; E.py += (Math.max(E.H * 0.35, E.ly) - E.py) * 0.02 * sp * dt; }
      E.trail.push({ x: E.lx, y: E.ly, l: 1 }); E.trail = E.trail.filter(t => (t.l -= 0.06 * dt) > 0);
    },
    draw(E, dt, ts) {
      bg(E, '#1a1033', '#090614'); const x = E.x;
      for (const t of E.trail) { x.globalAlpha = t.l * 0.5; x.fillStyle = '#ff2050'; x.beginPath(); x.arc(t.x, t.y, 5 * t.l, 0, 7); x.fill(); }
      x.globalAlpha = 1; x.shadowColor = '#ff2050'; x.shadowBlur = 20; x.fillStyle = '#ff4060'; x.beginPath(); x.arc(E.lx, E.ly, 8, 0, 7); x.fill(); x.shadowBlur = 0;
      if (!(E.inv && Math.floor(ts / 80) % 2)) pet(E, E.jump ? 'jump' : 'chaseball', E.px, E.py + 40, 120, E.lx < E.px);
      A().gHint(E, 'Drag the laser. Dodge the pounce!', 1 - E.t / 240);
    },
    finish(E) { const sc = Math.floor(E.score); return { score: sc, coins: Math.floor(sc / 12), xp: Math.floor(sc / 6) + 5, lines: [`${E.near} close dodges`] }; },
  };

  /* ---------- Echo Song: repeat the pet's song ---------- */
  const PADS = [['#ff5fb8', 523], ['#5ff4ff', 659], ['#ffd23f', 784], ['#8dff4a', 1047]];
  const ECHO = {
    init(E) { Object.assign(E, { seq: [], step: 0, mode: 'listen', at: 0, lit: -1, litT: 0, round: 0, lives: 2 }); this.next(E); },
    next(E) { E.seq.push((Math.random() * 4) | 0); E.mode = 'listen'; E.at = 0; E.step = 0; E.round++; },
    pad(E, x, y) { const s = Math.min(E.W, E.H * 0.7) / 2.4, cx = E.W / 2, cy = E.H * 0.55; for (let i = 0; i < 4; i++) { const px = cx + (i % 2 ? 1 : -1) * s * 0.55, py = cy + (i < 2 ? -1 : 1) * s * 0.55; if (Math.abs(x - px) < s * 0.5 && Math.abs(y - py) < s * 0.5) return i; } return -1; },
    down(E, x, y) {
      if (E.mode !== 'play') return; const i = this.pad(E, x, y); if (i < 0) return;
      E.lit = i; E.litT = 14; A().tone(PADS[i][1], 0.2, 0, 'sine', 0.06);
      if (i === E.seq[E.step]) { E.step++; if (E.step >= E.seq.length) { E.score += E.seq.length * 20; E.combo++; A().gText(E, E.W / 2, E.H * 0.2, ['Yes!', 'Duet!', 'In tune!'][E.round % 3], '#8dff4a'); E.mode = 'wait'; E.at = 0; } }
      else { E.lives--; E.combo = 0; E.shake = 6; A().SFX.no(); if (E.lives <= 0) A().gEnd(E, false); else { E.mode = 'listen'; E.at = -30; E.step = 0; } }
    },
    update(E, dt) {
      E.litT = Math.max(0, E.litT - dt); if (!E.litT) E.lit = -1; E.at += dt;
      if (E.mode === 'listen' && E.at > 30) { const k = Math.floor((E.at - 30) / 32); if (k >= E.seq.length) { E.mode = 'play'; E.step = 0; } else if ((E.at - 30) % 32 < dt) { E.lit = E.seq[k]; E.litT = 18; A().tone(PADS[E.lit][1] * 1.0, 0.22, 0, 'triangle', 0.06); } }
      if (E.mode === 'wait' && E.at > 40) this.next(E);
    },
    draw(E) {
      bg(E, '#14102e', '#07060f'); const x = E.x, s = Math.min(E.W, E.H * 0.7) / 2.4, cx = E.W / 2, cy = E.H * 0.55;
      for (let i = 0; i < 4; i++) { const px = cx + (i % 2 ? 1 : -1) * s * 0.55, py = cy + (i < 2 ? -1 : 1) * s * 0.55; x.globalAlpha = E.lit === i ? 1 : 0.35; x.fillStyle = PADS[i][0]; x.shadowColor = PADS[i][0]; x.shadowBlur = E.lit === i ? 30 : 0; x.beginPath(); x.roundRect(px - s * 0.45, py - s * 0.45, s * 0.9, s * 0.9, 18); x.fill(); }
      x.globalAlpha = 1; x.shadowBlur = 0;
      pet(E, E.mode === 'listen' ? 'dance' : 'happy', E.W / 2, E.H * 0.26, 110, false);
      x.fillStyle = '#fff'; x.textAlign = 'center'; x.font = "800 20px 'Barlow Condensed',sans-serif"; x.fillText(E.mode === 'listen' ? 'Listen…' : E.mode === 'play' ? 'Your turn!' : '♪', E.W / 2, E.H * 0.92);
    },
    finish(E) { CP.lang && CP.lang.gain(Math.min(10, E.round), 'echo'); return { score: Math.floor(E.score), coins: Math.floor(E.score / 10), xp: E.round * 6, lines: [`${E.round - 1} songs echoed`] }; },
    hud(E) { return `Song ${E.round} · ${Math.floor(E.score)} pts`; },
  };

  /* ---------- Snack Catch: tilt (or drag) to catch food ---------- */
  const FOOD = ['🫐', '🌶️', '⭐', '🍙', '🧁'];
  let tilt = 0; addEventListener('deviceorientation', e => { if (typeof e.gamma === 'number') tilt = Math.max(-1, Math.min(1, e.gamma / 30)); });
  const SNACK = {
    init(E) { Object.assign(E, { px: E.W / 2, items: [], st: 30, lives: 3, drag: null, caught: 0, useTilt: false }); E.t0 = performance.now(); },
    down(E, x) { E.drag = x; }, move(E, x, y, p) { if (p) E.px = x; }, up(E) { E.drag = null; },
    update(E, dt) {
      if (Math.abs(tilt) > 0.08) { E.useTilt = true; E.px += tilt * 9 * dt; }
      E.px = Math.max(40, Math.min(E.W - 40, E.px));
      E.st -= dt; if (E.st <= 0) { E.st = Math.max(14, 40 - E.t / 50); const bad = Math.random() < 0.18 + E.t / 9000; E.items.push({ x: R(30, E.W - 30), y: -20, v: R(2, 3.2) + E.t / 900, bad, e: bad ? '👾' : A().pick(FOOD) }); }
      for (const it of E.items) { it.y += it.v * dt; if (!it.done && it.y > E.H * 0.8 - 30 && it.y < E.H * 0.8 + 10 && Math.abs(it.x - E.px) < 50) { it.done = true; if (it.bad) { E.lives--; E.shake = 8; A().SFX.no(); if (E.lives <= 0) A().gEnd(E, false); } else { E.caught++; E.combo++; E.score += 10 * Math.min(5, 1 + Math.floor(E.combo / 4)); A().SFX.munch(); A().gBurst(E, it.x, it.y, 8, '#ffd23f'); } } if (!it.done && it.y > E.H + 20 && !it.bad) { it.done = true; E.combo = 0; } }
      E.items = E.items.filter(i => !i.done && i.y < E.H + 40);
    },
    draw(E) {
      bg(E, '#16224a', '#0a0d1e'); const x = E.x; x.font = '34px serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
      for (const it of E.items) x.fillText(it.e, it.x, it.y);
      pet(E, 'eat', E.px, E.H * 0.8 + 30, 110, false);
      A().gHint(E, 'Tilt your phone or drag to catch snacks', 1 - E.t / 240); A().gCombo(E);
    },
    finish(E) { const S = CP.S(); S.energy = A().clamp(S.energy + Math.min(15, E.caught)); return { score: Math.floor(E.score), coins: Math.floor(E.score / 12), xp: Math.floor(E.score / 7) + 4, lines: [`${E.caught} snacks caught · +${Math.min(15, E.caught)} energy`] }; },
  };

  /* ---------- Bubble Pop: beat the pet to the holo-bubbles ---------- */
  const BUBBLE = {
    init(E) { Object.assign(E, { bubbles: [], bt: 0, px: E.W / 2, py: E.H * 0.8, goal: null, mine: 0, its: 0, time: 45 * 60 }); },
    down(E, x, y) {
      for (const b of E.bubbles) if (!b.pop && Math.hypot(x - b.x, y - b.y) < b.r + 10) { b.pop = 1; const pts = b.gold ? 50 : 10; E.score += pts; E.mine++; A().tone(b.gold ? 1600 : 900 + Math.random() * 300, 0.06); A().gBurst(E, b.x, b.y, b.gold ? 18 : 8, b.gold ? '#ffd23f' : '#5ff4ff'); A().gText(E, b.x, b.y, '+' + pts, '#fff', 20); return; }
    },
    update(E, dt) {
      E.time -= dt; if (E.time <= 0) { A().gEnd(E, false); return; }
      E.bt -= dt; if (E.bt <= 0) { E.bt = R(16, 34); E.bubbles.push({ x: R(30, E.W - 30), y: E.H + 20, r: R(16, 28), v: R(0.8, 1.6), gold: Math.random() < 0.08, w: Math.random() * 6 }); }
      for (const b of E.bubbles) { b.y -= b.v * dt; b.x += Math.sin(E.t / 30 + b.w) * 0.4; }
      if (!E.goal || E.goal.pop) E.goal = E.bubbles.filter(b => !b.pop && b.y < E.H * 0.85).sort((a, b) => Math.hypot(a.x - E.px, a.y - E.py) - Math.hypot(b.x - E.px, b.y - E.py))[0] || null;
      if (E.goal) { E.px += (E.goal.x - E.px) * 0.025 * dt; E.py += (E.goal.y + 40 - E.py) * 0.025 * dt; if (Math.hypot(E.goal.x - E.px, E.goal.y - E.py + 40) < 30) { E.goal.pop = 1; E.its++; A().tone(400, 0.05); } }
      E.bubbles = E.bubbles.filter(b => !b.pop && b.y > -40);
    },
    draw(E) {
      bg(E, '#0f2a3a', '#06121b'); const x = E.x;
      for (const b of E.bubbles) { x.strokeStyle = b.gold ? '#ffd23f' : '#9ff4ff'; x.lineWidth = 2; x.fillStyle = b.gold ? 'rgba(255,210,63,.18)' : 'rgba(95,244,255,.12)'; x.beginPath(); x.arc(b.x, b.y, b.r, 0, 7); x.fill(); x.stroke(); x.fillStyle = 'rgba(255,255,255,.5)'; x.beginPath(); x.arc(b.x - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.2, 0, 7); x.fill(); }
      pet(E, 'chaseball', E.px, E.py, 100, E.goal && E.goal.x < E.px);
      x.fillStyle = '#fff'; x.textAlign = 'center'; x.font = "800 18px 'Barlow Condensed',sans-serif"; x.fillText(`You ${E.mine} · ${CP.S().name} ${E.its} · ${Math.ceil(E.time / 60)}s`, E.W / 2, E.H * 0.95);
    },
    finish(E) { const win = E.mine > E.its; return { score: Math.floor(E.score), coins: Math.floor(E.score / 10) + (win ? 10 : 0), xp: Math.floor(E.score / 6) + 5, title: win ? 'You out-popped it!' : 'It was faster!', lines: [`You ${E.mine} – ${E.its} ${CP.S().name}`] }; },
    hud(E) { return Math.floor(E.score) + ' pts'; },
  };

  /* ---------- Word Match: which word is the pet trying to say? ---------- */
  const DEFAULT_WORDS = ['olá', 'comer', 'brincar', 'dormir', 'amigo', 'estrela', 'peixe', 'bola', 'lua', 'sol', 'gato', 'casa'];
  const WORDS = {
    init(E) {
      const l = CP.lang && CP.lang.state(), mine = l ? Object.keys(l.vocab) : [];
      E.pool = [...new Set([...mine, ...DEFAULT_WORDS])]; Object.assign(E, { q: 0, total: 10, wait: 0, opts: [], pick: -1 }); this.ask(E);
    },
    ask(E) {
      const a = A(), w = a.pick(E.pool), others = E.pool.filter(x => x !== w).sort(() => Math.random() - 0.5).slice(0, 2);
      E.word = w; E.opts = [w, ...others].sort(() => Math.random() - 0.5); E.pick = -1; E.wait = 0;
      E.said = CP.lang ? CP.lang.garble(w, 0.45) : w; E.q++;
    },
    down(E, x, y) {
      if (E.pick >= 0) return; const i = Math.floor((y - E.H * 0.55) / 64); if (i < 0 || i > 2) return;
      E.pick = i; const ok = E.opts[i] === E.word;
      if (ok) { E.score += 100; E.combo++; A().SFX.ok(); const l = CP.lang && CP.lang.state(); if (l && l.vocab[E.word]) l.vocab[E.word].s = Math.min(1, l.vocab[E.word].s + 0.05); }
      else { E.combo = 0; A().SFX.no(); E.shake = 4; }
    },
    update(E, dt) { if (E.pick >= 0) { E.wait += dt; if (E.wait > 50) { if (E.q >= E.total) A().gEnd(E, false); else this.ask(E); } } },
    draw(E) {
      bg(E, '#221338', '#0b0716'); const x = E.x;
      pet(E, 'think', E.W / 2, E.H * 0.36, 130, false);
      x.fillStyle = '#fff'; x.textAlign = 'center'; x.font = "italic 800 34px 'Barlow Condensed',sans-serif"; x.fillText('“' + E.said + '”', E.W / 2, E.H * 0.46);
      E.opts.forEach((o, i) => { const y = E.H * 0.55 + i * 64; const ok = E.pick >= 0 && o === E.word, bad = E.pick === i && !ok; x.fillStyle = ok ? 'rgba(141,255,74,.35)' : bad ? 'rgba(255,79,122,.35)' : 'rgba(255,255,255,.1)'; x.beginPath(); x.roundRect(24, y, E.W - 48, 54, 14); x.fill(); x.fillStyle = '#fff'; x.font = "800 24px 'Barlow Condensed',sans-serif"; x.fillText(o, E.W / 2, y + 35); });
    },
    finish(E) { CP.lang && CP.lang.gain(Math.floor(E.score / 100), 'words'); return { score: Math.floor(E.score), coins: Math.floor(E.score / 20), xp: Math.floor(E.score / 10), lines: [`${Math.floor(E.score / 100)} of ${E.total} understood`] }; },
    hud(E) { return `${E.q}/${E.total} · ${E.score}`; },
  };

  CP.on('start', () => {
    const a = A();
    Object.assign(a.GAMES2, {
      laser: { n: 'Laser Chase', d: 'Drag the laser dot. Your Cyberpet pounces: dodge at the last second!', pose: 'chaseball', bg: 'linear-gradient(135deg,#ff2050,#7a1fd0)', stars: [150, 400, 800], trait: 'instinct', rw: '⚡ XP · Instinct' },
      echo: { n: 'Echo Song', d: 'Your Cyberpet sings a tune. Sing it back on the pads. Helps it learn to talk.', pose: 'dance', bg: 'linear-gradient(135deg,#ff5fb8,#ffd23f)', stars: [100, 300, 600], trait: 'cosmic', rw: '🗣️ Language XP', train: 1 },
      snack: { n: 'Snack Catch', d: 'Tilt your phone (or drag) to catch falling snacks. Dodge the glitch bugs.', pose: 'eat', bg: 'linear-gradient(135deg,#3f8cff,#8dff4a)', stars: [150, 400, 800], trait: 'nature', rw: '⚡ XP · 🍴 Energy' },
      bubble: { n: 'Bubble Pop', d: 'Pop the holo-bubbles before your Cyberpet does. Gold ones are worth 5×.', pose: 'chaseball', bg: 'linear-gradient(135deg,#1fd0ff,#1fae8c)', stars: [200, 500, 900], trait: 'tech', rw: '⚡ XP · Tech' },
      words: { n: 'Word Match', d: 'Which word is your Cyberpet trying to say? Uses the words you taught it.', pose: 'think', bg: 'linear-gradient(135deg,#b06bff,#ff5fb8)', stars: [400, 700, 900], trait: 'cosmic', rw: '🗣️ Language XP', train: 1 },
    });
    Object.assign(a.GAMEOBJ, { laser: LASER, echo: ECHO, snack: SNACK, bubble: BUBBLE, words: WORDS });
    for (const id of ['laser', 'snack', 'bubble', 'echo', 'words']) if (!a.ROT_POOL.includes(id)) a.ROT_POOL.push(id);
    for (const id of ['echo', 'words']) if (!a.TRAIN_POOL.includes(id)) a.TRAIN_POOL.push(id);
    try { a.renderPlay(); } catch (e) { /* not on play */ }
  });
})();
