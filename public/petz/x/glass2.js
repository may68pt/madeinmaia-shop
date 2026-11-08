/* CyberPet illustrated glass close-ups (2026-11-07 art boards).
   When the glass2 set is loaded, the close-up shows painted shots instead of the stretched room sprite:
   the pet walks up (approach), fills the glass (face_fill), presses one or two paws, licks left/right and
   smears its tongue, boops its nose, follows your finger with its eyes, nuzzles when stroked, knocks when you
   tap, cuddles the glass while asleep, clings after time away, and greets you on a reunion.
   On top of the shot it draws glass FX from the glassfx set: paw prints, lick streaks, nose smudges, hearts,
   zzz, anger puffs, sneeze puffs, sweat, sparkles, a reflection band and edge mist while it sleeps.
   Shots share the base palette and are tinted per variant with the same filter as the room sprite.
   The mesh rig (rig_enabled) still wins when it's on. */
(function () {
  'use strict';
  const CP = window.CP;
  const A = () => CP.app();
  const img = (set, k) => (CP.assets ? CP.assets.img(set, k) : null);
  const now = () => performance.now();

  let cur = null, prev = null, fade = 1, openedAt = 0, reunionAt = 0, gest = null, fxs = [], filt = '', on = false;
  // a recent owner gesture overrides the shot for a moment
  const gestShot = (k, ms = 1600, expr = false) => { gest = { k, expr, until: now() + ms }; };

  function pick(st, S) {
    const t = now(), G = CP.glass, W = innerWidth;
    if (S.asleep) return ['glass2', 'sleepy_cuddle'];
    if (t - openedAt < 1300) return ['glass2', t - reunionAt < 4000 ? 'reunion' : 'approach'];
    if (gest && t < gest.until) return [gest.expr ? 'expr' : 'glass2', gest.k];
    if (st.act === 'paw' && st.paw) return ['glass2', st.paw.follow ? 'double_paw' : 'paw_press'];
    if (st.tongue) return ['glass2', st.tongue.p > 0.62 ? 'tongue_smear' : st.tongue.x < W / 2 ? 'lick_left' : 'lick_right'];
    if (st.act === 'boop' || st.squash > 0.5) return ['glass2', 'nose_boop'];
    if (st.finger && G.open) { if (st.finger.x < W * 0.33) return ['glass2', 'eye_left']; if (st.finger.x > W * 0.67) return ['glass2', 'eye_right']; }
    if (st.fog > 0.5) return ['glass2', 'fog'];
    const emo = CP.emotion ? CP.emotion.current().k : 'neutral';
    if (emo === 'clingy') return ['glass2', 'cling'];
    if (['neutral', 'happy', 'calm'].includes(emo)) return ['glass2', 'face_fill'];
    return ['expr', emo];
  }

  // draws one shot fitted to the screen width, faded into the dark at the edges
  function drawShot(ctx, im, alpha, cx, by, h, st) {
    const W = innerWidth, H = innerHeight;
    const zoom = 0.92 + 0.12 * Math.min(1.4, st.near) + st.squash * 0.03;
    let w = W * 1.08 * zoom, hh = w * (im.height / im.width);
    if (hh < H * 0.6) { hh = H * 0.6; w = hh * (im.width / im.height); }
    const x = cx - w / 2, y = H * 0.48 - hh / 2 + Math.sin(st.bob) * 4 + (by - H * 1.28) * 0.05;
    ctx.save(); ctx.globalAlpha = alpha; ctx.filter = filt || 'none';
    ctx.drawImage(im, x, y, w, hh);
    ctx.filter = 'none'; ctx.globalAlpha = 1;
    // soft edges so the painted panel melts into the dark glass
    const fadeTop = ctx.createLinearGradient(0, y, 0, y + hh);
    fadeTop.addColorStop(0, 'rgba(7,4,20,1)'); fadeTop.addColorStop(0.12, 'rgba(7,4,20,0)'); fadeTop.addColorStop(0.86, 'rgba(7,4,20,0)'); fadeTop.addColorStop(1, 'rgba(7,4,20,1)');
    ctx.fillStyle = fadeTop; ctx.fillRect(x - 2, y - 2, w + 4, hh + 4);
    const side = ctx.createLinearGradient(x, 0, x + w, 0);
    side.addColorStop(0, 'rgba(7,4,20,.9)'); side.addColorStop(0.08, 'rgba(7,4,20,0)'); side.addColorStop(0.92, 'rgba(7,4,20,0)'); side.addColorStop(1, 'rgba(7,4,20,.9)');
    ctx.fillStyle = side; ctx.fillRect(x - 2, y - 2, w + 4, hh + 4);
    ctx.restore();
  }

  function addFx(k, x, y, s = 1, life = 1400, dy = -0.04) { if (img('glassfx', k)) fxs.push({ k, x, y, s, t0: now(), life, dy }); }
  function drawFx(ctx) {
    const t = now();
    fxs = fxs.filter(f => t - f.t0 < f.life);
    for (const f of fxs) {
      const im = img('glassfx', f.k), p = (t - f.t0) / f.life; if (!im) continue;
      const w = 150 * f.s, h = w * im.height / im.width;
      ctx.save(); ctx.globalAlpha = Math.min(1, (1 - p) * 2.2) * Math.min(1, p * 6); ctx.globalCompositeOperation = 'screen';
      ctx.drawImage(im, f.x - w / 2, f.y - h / 2 + f.dy * (t - f.t0), w, h); ctx.restore();
    }
  }

  function install() {
    const G = CP.glass; if (!G) return;
    const before = G.customDraw;
    G.customDraw = (ctx, cx, by, h, st) => {
      if (before && before(ctx, cx, by, h, st)) { G.artMode = false; return true; }
      const S = CP.S(), [set, k] = pick(st, S), im = img(set, k) || img('glass2', 'face_fill');
      if (!im) { G.artMode = false; return false; }
      G.artMode = true;
      if (im !== cur) { prev = cur; cur = im; fade = 0; }
      fade = Math.min(1, fade + 0.09);
      // glass.js squashes around (cx,by); draw in screen space so the painted panel stays put
      ctx.save(); const d = Math.min(2, devicePixelRatio || 1); ctx.setTransform(d, 0, 0, d, 0, 0);
      ctx.fillStyle = '#070414'; ctx.fillRect(0, 0, innerWidth, innerHeight);
      if (prev && fade < 1) drawShot(ctx, prev, 1, innerWidth / 2, by, h, st);
      drawShot(ctx, cur, fade, innerWidth / 2 + st.look.x * 16, by, h, st);
      // ambient FX
      const W = innerWidth, H = innerHeight, refl = img('glassfx', 'reflection');
      if (refl) { ctx.save(); ctx.globalAlpha = 0.35; ctx.globalCompositeOperation = 'screen'; ctx.drawImage(refl, W * 0.05, H * 0.08, W * 0.55, W * 0.55 * refl.height / refl.width); ctx.restore(); }
      if (S.asleep) {
        const mist = img('glassfx', 'edge_mist');
        if (mist) { ctx.save(); ctx.globalAlpha = 0.5; ctx.globalCompositeOperation = 'screen'; ctx.drawImage(mist, 0, H * 0.62, W, W * mist.height / mist.width); ctx.restore(); }
        if (Math.random() < 0.012) addFx('zzz', W * 0.68, H * 0.3, 0.8, 2600, -0.02);
      }
      drawFx(ctx);
      ctx.restore();
      return true;
    };
  }

  // glass.js asks for fx images when it stamps prints and streaks on the glass layer
  const FX_STAMP = { paw: 'paw_print', paw2: 'paw_double', lick: 'lick_short', lick2: 'lick_long', nose: 'nose_smudge', finger: 'fingerprints', fog: 'fog_soft', fog2: 'fog_heavy', wipe: 'wipe' };
  const stamp = (gx, kind, x, y, s = 1) => {
    const im = img('glassfx', FX_STAMP[kind] || kind); if (!im || !on) return false;
    const w = 130 * s, h = w * im.height / im.width;
    gx.save(); gx.globalAlpha = 0.55; gx.globalCompositeOperation = 'screen'; gx.drawImage(im, x - w / 2, y - h / 2, w, h); gx.restore();
    return true;
  };

  CP.on('enter:glass', ev => {
    on = true; openedAt = now(); fxs = []; cur = prev = null; gest = null;
    try { filt = A().sprFilter() || ''; } catch (e) { filt = ''; }
    Promise.all(['glass2', 'glassfx', 'expr'].map(s => { CP.assets.pin(s); return CP.assets.load(s); })).then(() => {
      // run after rig.js's own enter:glass so it can still take over when rig_enabled is on
      setTimeout(install, 0);
    });
    void ev;
  });
  CP.on('exit:glass', () => { on = false; if (CP.glass) CP.glass.artMode = false; ['glass2', 'glassfx'].forEach(s => CP.assets.unpin && CP.assets.unpin(s)); });
  CP.on('emotion:reunion', () => { reunionAt = now(); openedAt = now(); const W = innerWidth, H = innerHeight; addFx('hearts', W * 0.5, H * 0.3, 1.2, 2200); addFx('sparkles', W * 0.3, H * 0.4, 1, 1800); });
  CP.on('bond', b => { if (!on || !b || !String(b.src || '').startsWith('glass')) return; addFx(Math.random() < 0.5 ? 'hearts' : 'purr_sparkle', innerWidth * (0.35 + Math.random() * 0.3), innerHeight * 0.32, 0.7, 1500); });
  CP.on('glass:gesture', g => {
    if (!on || !g) return;
    const W = innerWidth, H = innerHeight;
    switch (g.type) {
      case 'rough': gestShot('startled', 1500, true); addFx('surprise_lines', W * 0.5, H * 0.28, 1.1, 900, 0); setTimeout(() => on && addFx('anger', W * 0.66, H * 0.26, 0.8, 1600), 600); break;
      case 'stroke': if (g.zone !== 'glass') gestShot('nuzzle', 1800); break;
      case 'tap':
        if (g.zone === 'nose') {
          if (g.react === 'sneeze') { gestShot('sneeze_windup', 500, true); setTimeout(() => { if (!on) return; gestShot('sneeze', 1100, true); addFx('sneeze_puff', W * 0.5, H * 0.55, 1.2, 1200, 0.02); }, 480); }
          else if (g.react === 'giggle') gestShot('giggle', 1300, true);
          else gestShot('annoyed', 1100, true);
        } else if (g.zone === 'glass') { gestShot('knock', 1100); addFx('ripple', g.x, g.y, 0.9, 900, 0); }
        break;
      case 'hold': if (g.zone === 'chest') gestShot('calm', 2600, true); break;
      case 'circle': if (g.zone === 'chin') gestShot('purr', 2200, true); break;
      case 'knead': case 'rake': gestShot('purr', 1800, true); break;
      case 'spread': gestShot('surprised', 1000, true); break;
      default: break;
    }
  });
  CP.on('emotion', m => { if (on && m && m.k === 'scared') addFx('sweat', innerWidth * 0.62, innerHeight * 0.3, 0.7, 1600); if (on && m && m.k === 'proud') addFx('sparkles', innerWidth * 0.5, innerHeight * 0.25, 1, 1600); });

  CP.glass2 = { stamp, addFx, get on() { return on; } };
})();
