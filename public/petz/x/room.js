/* CyberPet room engine: every item answers a tap, the pet uses items on its own,
   shared moments (combo), hidden triple-tap secrets, phone-shake quakes and rarity glow. */
(function () {
  'use strict';
  const CP = window.CP;
  CP.css('cp-room-css', `
    @keyframes cpWiggle{0%,100%{transform:rotate(0)}20%{transform:rotate(-7deg)}40%{transform:rotate(6deg)}60%{transform:rotate(-4deg)}80%{transform:rotate(2deg)}}
    @keyframes cpBounce{0%,100%{transform:translateY(0) scale(1,1)}30%{transform:translateY(-10%) scale(.96,1.05)}55%{transform:translateY(0) scale(1.06,.93)}75%{transform:translateY(-3%)}}
    @keyframes cpFlicker{0%,100%{filter:brightness(1)}15%{filter:brightness(1.9) drop-shadow(0 0 14px #fff6)}30%{filter:brightness(.6)}45%{filter:brightness(1.7)}60%{filter:brightness(.9)}}
    @keyframes cpPulse{0%,100%{transform:scale(1);filter:none}40%{transform:scale(1.06);filter:drop-shadow(0 0 16px #5ff4ff)}}
    @keyframes cpSecret{0%{transform:rotate(0) scale(1)}50%{transform:rotate(180deg) scale(1.15);filter:hue-rotate(160deg) drop-shadow(0 0 18px #ff3fd8)}100%{transform:rotate(360deg) scale(1)}}
    @keyframes cpQuake{0%,100%{transform:translate(0,0) rotate(0)}25%{transform:translate(-3px,1px) rotate(-2deg)}50%{transform:translate(3px,-1px) rotate(2deg)}75%{transform:translate(-2px,0) rotate(-1deg)}}
    @keyframes cpRare{0%,100%{filter:drop-shadow(0 0 4px var(--cpr))}50%{filter:drop-shadow(0 0 14px var(--cpr))}}
    #roomItems .ri.cp-wiggle .riVisual{animation:cpWiggle .6s ease-out;transform-origin:50% 100%}
    #roomItems .ri.cp-bounce .riVisual{animation:cpBounce .55s ease-out;transform-origin:50% 100%}
    #roomItems .ri.cp-flicker .riVisual{animation:cpFlicker .6s steps(6)}
    #roomItems .ri.cp-pulse .riVisual{animation:cpPulse .7s ease-in-out}
    #roomItems .ri.cp-secret .riVisual{animation:cpSecret .9s ease-in-out}
    #roomItems .ri.cp-quake .riVisual{animation:cpQuake .18s linear 5;transform-origin:50% 100%}
    #roomItems .ri[data-cprare] .riArt{animation:cpRare 2.4s ease-in-out infinite}
    #roomItems .ri[data-cprare="rare"]{--cpr:#3fd0ff} #roomItems .ri[data-cprare="epic"]{--cpr:#b06bff}
    #roomItems .ri[data-cprare="legendary"]{--cpr:#ffd23f} #roomItems .ri[data-cprare="exclusive"]{--cpr:#ff3fd8}
    .cp-heart{position:absolute;pointer-events:none;font-size:22px;z-index:60;animation:cpHeart 1.2s ease-out forwards}
    @keyframes cpHeart{0%{opacity:0;transform:translate(-50%,0) scale(.5)}20%{opacity:1;transform:translate(-50%,-10px) scale(1.1)}100%{opacity:0;transform:translate(-50%,-70px) scale(.9)}}
  `);

  const A = () => CP.app();
  const itemOf = el => { const S = CP.S(); return el && S && S.room ? S.room.items.find(i => String(i.u) === el.dataset.u) : null; };
  const elOf = it => document.querySelector(`#roomItems .ri[data-u="${it.u}"]`);
  const reactionFor = id => {
    const d = A().RI[id] || {};
    if (d.react) return d.react;
    if (d.fn === 'light' || (d.anim && d.anim.flick)) return 'flicker';
    if (d.cat === 'station') return 'pulse';
    if (d.cat === 'furniture') return 'bounce';
    return 'wiggle';
  };
  const SOUNDS = { wiggle: [900, .05], bounce: [420, .08], flicker: [1500, .04], pulse: [660, .1], secret: [1320, .2] };

  /** Plays an item's reaction animation; used by taps, the pet, sleep clouds and quakes. */
  CP.reactItem = (it, kind) => {
    const el = typeof it === 'object' && it && it.nodeType ? it : elOf(it); if (!el) return;
    const k = kind || reactionFor((itemOf(el) || {}).id);
    el.classList.remove('cp-' + k); void el.offsetWidth; el.classList.add('cp-' + k);
    setTimeout(() => el.classList.remove('cp-' + k), 950);
    const s = SOUNDS[k]; if (s) try { A().tone(s[0], s[1], 0, 'triangle', .035); } catch (e) { /* muted */ }
  };

  const heart = (el, emoji = '💗') => {
    const world = document.getElementById('world'); if (!world || !el) return;
    const h = document.createElement('div'); h.className = 'cp-heart'; h.textContent = emoji;
    h.style.left = el.style.left; h.style.top = (parseFloat(el.style.top) || 0) + 'px'; world.appendChild(h); setTimeout(() => h.remove(), 1300);
  };

  /* ---------- owner taps ---------- */
  let petNear = null; // {u, until} set while the pet is using an item on its own
  const taps = new Map();
  function onTap(e) {
    const a = A(); if (!a || a.RV.edit) return;
    const el = e.target.closest('.ri'); if (!el) return;
    const it = itemOf(el); if (!it) return;
    const t = performance.now(), list = (taps.get(it.u) || []).filter(x => t - x < 1200); list.push(t); taps.set(it.u, list);
    if (list.length >= 3) { taps.set(it.u, []); secret(it, el); return; }
    CP.reactItem(el);
    if (petNear && petNear.u === it.u && t < petNear.until) combo(it, el);
    CP.emit('item:tap', { id: it.id, u: it.u });
  }
  function combo(it, el) {
    const S = CP.S(); petNear = null;
    heart(el); heart(el, '✨');
    if (CP.daily('combo', 1) <= 10) { S.bond = A().clamp(S.bond + 1); A().save(); }
    try { A().sprPose('happy', 900); A().say('Together! ♥', 1200); } catch (e) { /* pose optional */ }
    CP.emit('bond', { n: 1, src: 'combo' });
  }
  function secret(it, el) {
    const S = CP.S(); CP.reactItem(el, 'secret'); heart(el, '🌀');
    S.cpSecrets = S.cpSecrets || {};
    if (!S.cpSecrets[it.id]) {
      S.cpSecrets[it.id] = Date.now(); S.coins += 10; A().save(); A().renderHUD();
      A().toast(`🌀 Secret found: ${(A().RI[it.id] || {}).n || 'item'} · +10 ⚡`);
      CP.emit('discover', { id: it.id });
    }
  }

  /* ---------- the pet uses items on its own ---------- */
  const POSES = { station: ['happy', 'think', 'curious'], furniture: ['sitdown', 'curious', 'happy'], decor: ['curious', 'inlove', 'think'] };
  function autoUse() {
    const a = A(), S = CP.S();
    if (!CP.idle() || !S.room || !S.room.items.length || !a.sprMode()) return;
    const choices = S.room.items.filter(i => a.RI[i.id] && a.RI[i.id].kind !== 'wall');
    if (!choices.length) return;
    const it = a.pick(choices), d = a.RI[it.id], RV = a.RV;
    const x = it.x + (it.x > RV.PX ? -0.07 : 0.07), y = a.clamp(it.y + 0.03, 0.74, 0.97);
    a.walkTo(x, () => {
      if (!CP.idle()) return;
      a.turnTo(it.x < a.RV.PX);
      try { a.sprPose(a.pick(POSES[d.cat] || POSES.decor), 1400); } catch (e) { /* pose optional */ }
      CP.reactItem(it);
      petNear = { u: it.u, until: performance.now() + 2500 };
    }, y);
  }

  /* ---------- rarity glow on items from the rare shop ---------- */
  function decorate() {
    const a = A(); if (!a) return;
    document.querySelectorAll('#roomItems .ri').forEach(el => {
      const it = itemOf(el), d = it && a.RI[it.id];
      if (d && d.rarity && ['rare', 'epic', 'legendary', 'exclusive'].includes(d.rarity)) el.dataset.cprare = d.rarity;
    });
  }

  /* ---------- shake the phone: room quake ---------- */
  let lastQuake = 0;
  function quake() {
    const now = performance.now(); if (now - lastQuake < 4000 || !CP.onHome() || !CP.cfg('room_shake', true)) return; lastQuake = now;
    document.querySelectorAll('#roomItems .ri').forEach((el, i) => setTimeout(() => CP.reactItem(el, 'quake'), i * 30));
    CP.vib([40, 30, 40]);
    const S = CP.S(); if (S && !S.asleep && S.stage !== 'egg') try { A().sprPlay('jump'); A().say('Whoa!', 1000); } catch (e) { /* optional */ }
    CP.emit('quake');
  }
  window.addEventListener('devicemotion', e => {
    const g = e.accelerationIncludingGravity || e.acceleration; if (!g) return;
    const m = Math.sqrt((g.x || 0) ** 2 + (g.y || 0) ** 2 + (g.z || 0) ** 2);
    if (m > 28) quake();
  });

  CP.on('start', () => {
    const box = document.getElementById('roomItems'); if (!box) return;
    box.addEventListener('pointerup', onTap);
    new MutationObserver(decorate).observe(box, { childList: true });
    decorate();
    setInterval(() => { if (Math.random() < CP.cfg('room_autouse', 0.35) / 4) autoUse(); }, 15000);
  });
  CP.room = { autoUse, quake, decorate };
})();
