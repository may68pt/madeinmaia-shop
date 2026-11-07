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

  /** Where the pet is drawn: feet at by, h tall. Sized so the sprite stays crisp on phones. */
  const petBox = E => { const h = Math.min(E.H * 0.46, E.W * 0.95); return { cx: E.W / 2, by: E.H * 0.84, h, top: E.H * 0.84 - h }; };
  const ZONE_NAME = { head: 'Head', chin: 'Chin', back: 'Back', chest: 'Chest', paw: 'Paw' };
  function zones(E) {
    const b = petBox(E), h = b.h;
    return {
      head: { x: b.cx, y: b.top + h * 0.24, r: h * 0.2 },
      chin: { x: b.cx, y: b.top + h * 0.47, r: h * 0.1 },
      chest: { x: b.cx - h * 0.04, y: b.top + h * 0.64, r: h * 0.12 },
      back: { x: b.cx + h * 0.2, y: b.top + h * 0.66, r: h * 0.15 },
      paw: { x: b.cx - h * 0.14, y: b.by - h * 0.07, r: h * 0.09 },
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
        // each passed lesson teaches the pet that technique for the glass too
        if (passed) { const S = CP.S(); S.cpTech = S.cpTech || {}; S.cpTech[L.id] = (S.cpTech[L.id] || 0) + 1; }
      }
    },
    draw(E, dt, ts) {
      const x = E.x, a = CP.app(), L = E.lessons[E.li], Z = zones(E);
      const g = x.createLinearGradient(0, 0, 0, E.H); g.addColorStop(0, '#1d1640'); g.addColorStop(1, '#0a0818'); x.fillStyle = g; x.fillRect(0, 0, E.W, E.H);
      // soft spotlight + cushion under the pet
      const B = petBox(E);
      const sg = x.createRadialGradient(B.cx, B.by - B.h * 0.45, 10, B.cx, B.by - B.h * 0.45, B.h * 0.8); sg.addColorStop(0, 'rgba(255,95,184,.14)'); sg.addColorStop(1, 'rgba(255,95,184,0)'); x.fillStyle = sg; x.fillRect(0, 0, E.W, E.H);
      x.fillStyle = 'rgba(176,107,255,.22)'; x.beginPath(); x.ellipse(B.cx, B.by + 4, B.h * 0.42, B.h * 0.07, 0, 0, 7); x.fill();
      // the pet: relaxed, leans in as bliss grows, flinches when startled
      const lean = Math.min(1, E.bliss / E.need), bob = Math.sin(ts / 600) * 3 * (1 - lean * 0.5);
      x.save(); if (E.startle) x.translate(Math.sin(ts / 20) * 6, 0);
      x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
      const role = lean > 0.6 ? 'inlove' : E.startle ? 'refuse' : lean > 0.25 ? 'happy' : 'idle';
      const ok = a.gPose(x, role, B.cx, B.by + bob, B.h, false, E.filt) || a.gPose(x, 'idle', B.cx, B.by + bob, B.h, false, E.filt);
      if (!ok) { x.font = `${B.h * 0.7}px serif`; x.textAlign = 'center'; x.textBaseline = 'alphabetic'; x.fillText('🐱', B.cx, B.by); }
      x.restore();
      // target zone: pulsing ring, glow fills as you get it right, zone name and finger count
      if (L) {
        const z = Z[L.zone], p = 0.5 + Math.sin(ts / 300) * 0.5, good = E.fingers.length && E.quality > 0.7;
        x.save(); x.fillStyle = good ? 'rgba(255,95,184,.22)' : 'rgba(95,244,255,.10)'; x.beginPath(); x.arc(z.x, z.y, z.r, 0, 7); x.fill();
        x.strokeStyle = good ? '#ff5fb8' : `rgba(95,244,255,${0.55 + p * 0.4})`; x.lineWidth = 3; x.setLineDash([10, 7]); x.lineDashOffset = -ts / 40;
        x.beginPath(); x.arc(z.x, z.y, z.r * (0.96 + p * 0.06), 0, 7); x.stroke(); x.restore();
        const fingers = '☝️'.repeat(Math.min(3, L.fingers));
        x.font = "800 15px 'Barlow Condensed',sans-serif"; x.textAlign = 'center'; x.textBaseline = 'middle';
        const tag = `${ZONE_NAME[L.zone]} ${fingers}`, tw = x.measureText(tag).width + 18, ty = z.y - z.r - 14;
        x.fillStyle = 'rgba(8,6,20,.75)'; x.beginPath(); x.roundRect(z.x - tw / 2, ty - 11, tw, 22, 11); x.fill();
        x.fillStyle = '#9ff4ff'; x.fillText(tag, z.x, ty);
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
      if (E.count > 0) {
        const w = E.W - 40, y0 = E.H - 150;
        x.fillStyle = 'rgba(8,6,20,.85)'; x.beginPath(); x.roundRect(20, y0, w, 120, 16); x.fill();
        x.textAlign = 'center'; x.fillStyle = '#5ff4ff'; x.font = "800 22px 'Barlow Condensed',sans-serif"; x.fillText('Paw Spa', E.W / 2, y0 + 26);
        x.fillStyle = '#fff'; x.font = "700 17px 'Barlow Condensed',sans-serif";
        x.fillText('Touch the glowing spot with the right', E.W / 2, y0 + 54); x.fillText('number of fingers, at the right speed.', E.W / 2, y0 + 76);
        x.fillStyle = '#ffd23f'; x.fillText('Gentle wins. Rough swipes startle it.', E.W / 2, y0 + 102);
      }
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
