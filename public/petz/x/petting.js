/* CyberPet massage game: a touch game that teaches real massage dynamics.
   Each lesson asks for one technique on one zone (slow strokes on the head, small circles under the chin,
   a two-finger knead on the back, a three-finger rake, thumb circles on a paw, a still hand on the chest).
   The right zone, finger count, speed and pressure fill the bliss meter; rough or wrong moves break the combo. */
(function () {
  'use strict';
  const CP = window.CP;
  const LESSONS = [
    { id: 'head', zone: 'head', fingers: 1, speed: [0.05, 0.9], type: 'stroke', t: 'Slow strokes on the head', tip: 'One finger, long and slow' },
    { id: 'chin', zone: 'chin', fingers: 1, speed: [0.1, 1.1], type: 'circle', t: 'Small circles under the chin', tip: 'Draw little circles' },
    { id: 'knead', zone: 'back', fingers: 2, speed: [0.05, 1.2], type: 'knead', t: 'Two-finger knead on the back', tip: 'Two fingers, take turns pressing' },
    { id: 'rake', zone: 'back', fingers: 3, speed: [0.15, 1.6], type: 'rake', t: 'Three-finger back scratch', tip: 'Three fingers, sweep together' },
    { id: 'paw', zone: 'paw', fingers: 1, speed: [0.05, 0.8], type: 'circle', t: 'Thumb circles on the paw pads', tip: 'Gentle circles on the paw' },
    { id: 'chest', zone: 'chest', fingers: 1, speed: [0, 0.12], type: 'hold', t: 'A still, warm hand on the chest', tip: 'Hold still and breathe' },
    { id: 'ears', zone: 'head', fingers: 2, speed: [0.05, 0.7], type: 'stroke', t: 'Two-finger ear rub', tip: 'Two fingers, slow' },
  ];
  const LESSON_TIME = 9 * 60; // frames at 60fps

  function zones(E) {
    const cx = E.W / 2, top = E.H * 0.2, h = E.H * 0.62;
    return {
      head: { x: cx, y: top + h * 0.18, r: E.W * 0.17 },
      chin: { x: cx, y: top + h * 0.4, r: E.W * 0.1 },
      back: { x: cx + E.W * 0.12, y: top + h * 0.58, r: E.W * 0.17 },
      chest: { x: cx - E.W * 0.06, y: top + h * 0.6, r: E.W * 0.12 },
      paw: { x: cx - E.W * 0.2, y: top + h * 0.9, r: E.W * 0.09 },
    };
  }

  const MASSAGE = {
    init(E) {
      const diff = CP.cfg('petting_difficulty', 1);
      const order = LESSONS.slice().sort(() => Math.random() - 0.5).slice(0, 5);
      Object.assign(E, { lessons: order, li: 0, lt: 0, bliss: 0, need: 100 * diff, quality: 0, purr: 0, fingers: [], score: 0, combo: 0, good: 0, startle: 0, done: 0, trail: [] });
      const cv = E.x.canvas; E.oldTA = cv.style.touchAction; cv.style.touchAction = 'none';
      const rect = () => cv.getBoundingClientRect();
      const Z = zones(E);
      const zoneAt = (x, y) => { const r = rect(), lx = x - r.left, ly = y - r.top; let best = 'none', bd = 1e9; for (const k in Z) { const d = Math.hypot(lx - Z[k].x, ly - Z[k].y); if (d < Z[k].r * 1.25 && d < bd) { bd = d; best = k; } } return best; };
      E.g = CP.gestures(cv, {
        zoneAt,
        on(g) {
          if (E.count > 0 || E.over) return;
          const L = E.lessons[E.li]; if (!L) return;
          const r = rect();
          if (g.type === 'touch') {
            E.fingers = (g.list || []).map(f => ({ x: f.x - r.left, y: f.y - r.top }));
            const okZone = g.zone === L.zone, okN = g.fingers === L.fingers, okSp = g.speed >= L.speed[0] && g.speed <= L.speed[1];
            const q = (okZone ? 0.5 : 0) + (okN ? 0.25 : 0) + (okSp ? 0.25 : 0);
            E.quality = E.quality * 0.8 + q * 0.2;
            E.hintMiss = !okZone ? 'Wrong spot' : !okN ? `${L.fingers} finger${L.fingers > 1 ? 's' : ''}` : !okSp ? (g.speed > L.speed[1] ? 'Slower…' : 'Keep moving') : '';
            E.fingers.forEach(f => E.trail.push({ x: f.x, y: f.y, life: 1 }));
          } else if (g.type === L.type && g.zone === L.zone) {
            E.bliss += 12 / CP.cfg('petting_difficulty', 1); E.combo++; E.score += 10 * Math.min(5, E.combo);
            CP.app().gText(E, g.x - r.left, g.y - r.top - 30, ['Nice!', 'Purrfect', 'Mmm…', '♥'][E.combo % 4], '#ffd23f', 24);
          } else if (g.type === 'rough') {
            E.bliss = Math.max(0, E.bliss - 25); E.combo = 0; E.startle = 30; E.shake = 6; CP.vib(50);
            CP.app().gText(E, E.W / 2, E.H * 0.3, 'Too rough!', '#ff4f7a', 30);
          }
        },
      });
    },
    update(E, dt) {
      const L = E.lessons[E.li];
      if (!L) { CP.app().gEnd(E, false); return; }
      E.lt += dt; E.startle = Math.max(0, E.startle - dt);
      if (E.fingers.length && E.quality > 0.7) { E.bliss += 0.35 * dt * E.quality / CP.cfg('petting_difficulty', 1); E.score += 0.4 * dt * E.quality; E.good += dt; }
      if (!E.fingers.length) E.quality *= 0.95;
      E.purr += ((E.fingers.length ? E.quality : 0) - E.purr) * 0.05 * dt;
      CP.sound && CP.sound.purr(E.purr);
      E.trail = E.trail.filter(t => (t.life -= 0.04 * dt) > 0).slice(-80);
      if (E.bliss >= E.need || E.lt >= LESSON_TIME) {
        const passed = E.bliss >= E.need;
        if (passed) { E.done++; E.score += Math.round(200 * (1 - E.lt / LESSON_TIME)) + 100; CP.app().gBanner(E, 'Lesson learned!', L.t); CP.app().SFX.yay(); CP.app().gBurst(E, E.W / 2, E.H * 0.4, 30, ['#ff5fb8', '#5ff4ff', '#ffd23f']); }
        else CP.app().gBanner(E, 'Next one', 'It wanted: ' + L.tip);
        E.li++; E.lt = 0; E.bliss = 0; E.combo = 0; E.fingers = [];
        E.fingers.length = 0;
        // each passed lesson teaches the pet that technique for the glass too
        if (passed) { const S = CP.S(); S.cpTech = S.cpTech || {}; S.cpTech[L.id] = (S.cpTech[L.id] || 0) + 1; }
      }
    },
    draw(E, dt, ts) {
      const x = E.x, a = CP.app(), L = E.lessons[E.li], Z = zones(E);
      const g = x.createLinearGradient(0, 0, 0, E.H); g.addColorStop(0, '#1d1640'); g.addColorStop(1, '#0a0818'); x.fillStyle = g; x.fillRect(0, 0, E.W, E.H);
      // the pet, big and relaxed; it leans in as bliss grows and flinches when startled
      const lean = Math.min(1, E.bliss / E.need), bob = Math.sin(ts / 600) * 4 * (1 - lean * 0.5);
      x.save(); if (E.startle) x.translate(Math.sin(ts / 20) * 6, 0);
      const ok = a.gPose(x, lean > 0.6 ? 'inlove' : E.startle ? 'refuse' : 'happy', E.W / 2, E.H * 0.86 + bob, E.H * 0.66, false, E.filt) || a.gPose(x, 'idle', E.W / 2, E.H * 0.86 + bob, E.H * 0.66, false, E.filt);
      if (!ok) { x.font = `${E.H * 0.3}px serif`; x.textAlign = 'center'; x.fillText('🐱', E.W / 2, E.H * 0.6); }
      x.restore();
      // target zone
      if (L) {
        const z = Z[L.zone], p = 0.5 + Math.sin(ts / 300) * 0.5;
        x.save(); x.strokeStyle = `rgba(95,244,255,${0.4 + p * 0.4})`; x.lineWidth = 3; x.setLineDash([8, 8]); x.lineDashOffset = -ts / 40;
        x.beginPath(); x.arc(z.x, z.y, z.r * (0.95 + p * 0.08), 0, 7); x.stroke(); x.restore();
        x.fillStyle = 'rgba(95,244,255,.08)'; x.beginPath(); x.arc(z.x, z.y, z.r, 0, 7); x.fill();
      }
      // finger trails
      for (const t of E.trail) { x.globalAlpha = t.life * 0.6; x.fillStyle = E.quality > 0.7 ? '#ff9fd2' : '#ffffff'; x.beginPath(); x.arc(t.x, t.y, 6 * t.life + 2, 0, 7); x.fill(); }
      x.globalAlpha = 1;
      // lesson card + bliss meter
      if (L) {
        x.fillStyle = 'rgba(0,0,0,.45)'; x.fillRect(12, 56, E.W - 24, 62);
        x.fillStyle = '#fff'; x.textAlign = 'left'; x.font = "800 20px 'Barlow Condensed',sans-serif"; x.fillText(`${E.li + 1}/${E.lessons.length} · ${L.t}`, 22, 80);
        x.font = "600 15px 'Barlow Condensed',sans-serif"; x.fillStyle = E.hintMiss && E.fingers.length ? '#ffb3c7' : '#9ff4ff';
        x.fillText(E.fingers.length && E.hintMiss ? E.hintMiss : L.tip, 22, 102);
        const w = E.W - 44, k = Math.min(1, E.bliss / E.need), tl = 1 - E.lt / LESSON_TIME;
        x.fillStyle = 'rgba(255,255,255,.15)'; x.fillRect(22, 108, w, 5); x.fillStyle = '#ff5fb8'; x.fillRect(22, 108, w * k, 5);
        x.fillStyle = 'rgba(255,255,255,.35)'; x.fillRect(22, 115, w * tl, 2);
      }
      a.gCombo(E, 150);
    },
    finish(E, quit) {
      if (E.g) E.g.detach(); CP.sound && CP.sound.purr(0); E.x.canvas.style.touchAction = E.oldTA || '';
      const S = CP.S(), sc = Math.round(E.score);
      if (!quit && E.done) { S.bond = CP.app().clamp(S.bond + 2 + E.done); S.happy = CP.app().clamp(S.happy + 4 * E.done); }
      CP.emit('bond', { n: E.done * 2, src: 'massage' });
      return { score: sc, coins: Math.floor(sc / 25) + E.done * 4, xp: Math.floor(sc / 12) + E.done * 6, title: E.done >= 4 ? 'Massage master!' : E.done ? 'So relaxed' : 'Keep practising', lines: [`${E.done} of ${E.lessons.length} lessons learned`] };
    },
    hud(E) { return Math.floor(E.score) + ' bliss'; },
  };

  CP.on('start', () => {
    const a = CP.app();
    a.GAMES2.massage = { n: 'Paw Spa', d: 'A massage lesson game: right spot, right fingers, right speed. Teaches real massage moves.', pose: 'inlove', bg: 'linear-gradient(135deg,#ff5fb8,#5ff4ff)', stars: [600, 1400, 2400], trait: 'nature', rw: '💗 Bond XP', train: 1 };
    a.GAMEOBJ.massage = MASSAGE;
    try { a.renderPlay(); } catch (e) { /* play tab not built yet */ }
  });
  CP.massage = { LESSONS };
})();
