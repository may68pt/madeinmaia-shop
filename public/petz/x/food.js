/* CyberPet food: a pantry of ten foods, a free daily ration, a food bowl in the room and a real meal.
   - The bowl appears beside the pet, the food drops in, the pet walks over and eats in three bites.
   - Every pet has a favourite food and one it dislikes; you discover them by feeding it.
   - The same food three times in a row gets a bored "again?" and does less.
   - Foods sent from the back office (inventory items named food_<id>) land in the pantry. */
(function () {
  'use strict';
  const CP = window.CP;
  const A = () => CP.app();

  // id: [name, emoji, price ⚡, effects, trait, line]
  const FOODS = {
    crunch: ['Bio-crunch', '🍪', 5, { energy: 18 }, 'nature', 'Everyday kibble'],
    berry: ['Bio-berry', '🫐', 12, { energy: 25, health: 6 }, 'nature', 'Fresh and healthy'],
    chili: ['Ember chili', '🌶️', 12, { energy: 28, happy: 4 }, 'instinct', 'Spicy kick'],
    star: ['Starfruit', '⭐', 15, { energy: 24, happy: 8 }, 'cosmic', 'Sweet starlight'],
    milk: ['Moon milk', '🥛', 14, { energy: 15, rest: 15, happy: 3 }, 'cosmic', 'Calming, before bed'],
    paste: ['Nano-paste', '🧪', 18, { energy: 36 }, 'tech', 'Big energy'],
    soup: ['Spark soup', '🍲', 20, { energy: 22, health: 15 }, 'nature', 'Heals and warms'],
    sushi: ['Glow sushi', '🍣', 22, { energy: 30, bond: 6, happy: 4 }, 'tech', 'Shared treat · bond'],
    candy: ['Crystal candy', '🍬', 10, { energy: 8, happy: 15, health: -4 }, 'cosmic', 'Pure joy, not healthy'],
    cake: ['Galaxy cake', '🎂', 60, { energy: 40, happy: 15, bond: 5 }, 'all', 'A party in a bite'],
  };
  const ICON = { energy: '🍴', happy: '💗', health: '✨', rest: '🌙', bond: '🤝' };
  const RATION = 3;

  CP.css('cp-food-css', `
    .cpFoodHead{display:flex;justify-content:space-between;align-items:center;gap:8px;margin:2px 0 8px;font-size:14px}
    .cpFoodHead b{font-family:'Barlow Condensed',sans-serif;font-size:18px}
    .cpFoodGrid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;max-height:58vh;overflow:auto;padding:2px}
    .cpFood{position:relative;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.05);border-radius:16px;padding:10px 8px 8px;text-align:center;color:#fff;font:inherit}
    .cpFood:active{transform:scale(.97)}
    .cpFood .pl{width:58px;height:58px;margin:0 auto 4px;border-radius:50%;display:grid;place-items:center;font-size:32px;background:radial-gradient(circle at 50% 40%,rgba(255,255,255,.22),rgba(95,244,255,.08) 60%,transparent 70%);box-shadow:0 0 18px -6px #5ff4ff}
    .cpFood b{display:block;font-family:'Barlow Condensed',sans-serif;font-size:17px;line-height:1.05}
    .cpFood small{display:block;opacity:.65;font-size:12px;margin:2px 0 4px}
    .cpFood .fx{display:flex;flex-wrap:wrap;justify-content:center;gap:3px;font-size:12px}
    .cpFood .fx span{background:rgba(255,255,255,.08);border-radius:8px;padding:1px 5px}
    .cpFood .fx span.neg{color:#ff9fb0}
    .cpFood .pr{margin-top:6px;font-family:'Barlow Condensed',sans-serif;font-weight:800;font-size:15px;color:#ffd23f}
    .cpFood .pr.own{color:#8dff4a}
    .cpFood .tag{position:absolute;top:6px;right:8px;font-size:14px}
    .cpFood.off{opacity:.45}
    .cpBowl{position:absolute;z-index:60;pointer-events:none;transform:translate(-50%,-100%);width:64px;height:40px;transition:opacity .5s}
    .cpBowl .dish{position:absolute;left:0;right:0;bottom:0;height:22px;border-radius:0 0 32px 32px / 0 0 22px 22px;background:linear-gradient(#3fd0ff,#1a3a8a);box-shadow:0 0 14px -2px #3fd0ff,inset 0 3px 0 rgba(255,255,255,.35)}
    .cpBowl .rim{position:absolute;left:-3px;right:-3px;bottom:18px;height:8px;border-radius:50%;background:#7af7ff;box-shadow:0 0 10px #3ff0ff}
    .cpBowl .pile{position:absolute;left:50%;bottom:16px;font-size:26px;line-height:1;transform:translateX(-50%) scale(var(--k,1));transform-origin:50% 100%;transition:transform .25s;filter:drop-shadow(0 2px 2px rgba(0,0,0,.4))}
    .cpBowl .drop{animation:cpDrop .55s cubic-bezier(.3,1.4,.6,1) both}
    @keyframes cpDrop{0%{transform:translate(-50%,-140px) scale(1);opacity:0}25%{opacity:1}100%{transform:translateX(-50%) scale(1)}}
    .cpBowl.gone{opacity:0}
  `);

  /* ---------- state in the save ---------- */
  const F = () => {
    const S = CP.S();
    S.cpFood = S.cpFood || { pantry: {}, ration: { d: '', n: 0 }, last: [], known: {} };
    const f = S.cpFood;
    if (f.ration.d !== CP.today()) f.ration = { d: CP.today(), n: 0 };
    // gifts from the back office arrive as inventory items food_<id>
    for (const k of Object.keys(S.inv || {})) if (k.startsWith('food_') && FOODS[k.slice(5)]) { f.pantry[k.slice(5)] = (f.pantry[k.slice(5)] || 0) + S.inv[k]; delete S.inv[k]; }
    return f;
  };
  /** Each pet's favourite and disliked food, fixed per pet (seeded from its id or name). */
  function tastes() {
    const S = CP.S(), seed = [...String(S.id || S.name || 'pet')].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
    const pool = Object.keys(FOODS).filter(k => k !== 'crunch' && k !== 'cake');
    const fav = pool[seed % pool.length], dis = pool[(seed >>> 5) % pool.length === seed % pool.length ? (seed + 3) % pool.length : (seed >>> 5) % pool.length];
    return { fav, dis: dis === fav ? pool[(pool.indexOf(fav) + 2) % pool.length] : dis };
  }

  /* ---------- the menu ---------- */
  function open() {
    const a = A(), S = CP.S(); if (!S || S.stage === 'egg') { a.toast('Hatch your egg first'); return; }
    if (S.gone) return;
    if (S.asleep) { a.toast(`${S.name} is sleeping 💤`); return; }
    const f = F(), t = tastes(), freeLeft = RATION - f.ration.n;
    const card = k => {
      const [n, e, price, fx, , line] = FOODS[k], own = f.pantry[k] || 0, free = k === 'crunch' && freeLeft > 0;
      const tag = f.known[k] === 'fav' ? '❤️' : f.known[k] === 'dis' ? '👎' : '';
      const can = own || free || S.coins >= price;
      return `<button class="cpFood${can ? '' : ' off'}" data-cpfood="${k}">${tag ? `<span class="tag">${tag}</span>` : ''}<div class="pl">${e}</div><b>${n}</b><small>${line}</small>
        <div class="fx">${Object.entries(fx).map(([s, v]) => `<span class="${v < 0 ? 'neg' : ''}">${ICON[s]}${v > 0 ? '+' : ''}${v}</span>`).join('')}</div>
        <div class="pr${own || free ? ' own' : ''}">${free ? `Free · ${freeLeft} left today` : own ? `In pantry ×${own}` : `${price} ⚡`}</div></button>`;
    };
    const order = Object.keys(FOODS).sort((x, y) => ((f.pantry[y] || 0) > 0) - ((f.pantry[x] || 0) > 0));
    a.modal(`<h3>🍽️ Feed ${CP.esc(S.name)}</h3>
      <div class="cpFoodHead"><span>Hunger: <b>${Math.round(S.energy)}%</b> full</span><span><b>${S.coins}</b> ⚡</span></div>
      <div class="cpFoodGrid">${order.map(card).join('')}</div>
      <p class="muted" style="margin:8px 0 0;font-size:13px">${f.known[t.fav] ? `❤️ Loves ${FOODS[t.fav][0]}` : 'Every Cyberpet has a favourite food. Try different ones!'}${f.known[t.dis] ? ` · 👎 not keen on ${FOODS[t.dis][0]}` : ''}</p>
      <div class="btns"><button class="btn gh" data-x>Back</button></div>`);
    document.querySelectorAll('[data-cpfood]').forEach(b => b.onclick = () => choose(b.dataset.cpfood));
  }

  function choose(k) {
    const a = A(), S = CP.S(), f = F(), [name, , price] = FOODS[k];
    if (S.energy >= 95) { a.SFX.no(); a.closeM(); a.say("I'm full! 🙅", 1600); try { a.sprPlay('refuse'); } catch (e) { /* optional */ } return; }
    if (k === 'crunch' && RATION - f.ration.n > 0 && !(f.pantry.crunch > 0)) f.ration.n++;
    else if (f.pantry[k] > 0) f.pantry[k]--;
    else if (S.coins >= price) { S.coins -= price; a.renderHUD(); }
    else { a.SFX.no(); a.toast(`Not enough ⚡ for ${name}`); return; }
    a.closeM(); meal(k);
  }

  /* ---------- the meal ---------- */
  function meal(k) {
    const a = A(), S = CP.S(), RV = a.RV, world = document.getElementById('world');
    const [name, emoji] = FOODS[k];
    if (!world || !a.sprMode()) { legacy(k); return; }
    a.busy = true;
    // put the bowl on the side of the pet that faces the middle of the screen, and inside the visible part of the room
    const wr = world.getBoundingClientRect(), vw = Math.min(innerWidth, document.getElementById('stage').getBoundingClientRect().right);
    const visL = (24 - wr.left) / RV.worldW, visR = (vw - 80 - wr.left) / RV.worldW, mid = (visL + visR) / 2;
    // avoid furniture: the bowl needs an open patch of floor, so the pet isn't hidden behind a bed or sofa while it eats
    const blocked = [...document.querySelectorAll('#roomItems .ri')].map(el => { const r = el.getBoundingClientRect(); return [(r.left - wr.left) / RV.worldW - 0.03, (r.right - wr.left) / RV.worldW + 0.03]; });
    const free = x => blocked.every(([l, r]) => x < l || x > r) && blocked.every(([l, r]) => (x - 0.055 * Math.sign(x - RV.PX || 1)) < l || (x - 0.055 * Math.sign(x - RV.PX || 1)) > r);
    const lo = Math.max(0.06, visL + 0.04), hi = Math.min(0.94, visR - 0.02), cands = [];
    for (let x = lo; x <= hi; x += 0.015) cands.push(x);
    const pref = x => Math.abs(Math.abs(x - RV.PX) - 0.1) + (Math.sign(x - RV.PX) === Math.sign(mid - RV.PX) ? 0 : 0.04);
    const spot = cands.filter(free).sort((p, q) => pref(p) - pref(q))[0];
    const side0 = mid >= RV.PX ? 1 : -1, bx = spot !== undefined ? spot : a.clamp(RV.PX + side0 * 0.1, lo, hi), side = bx >= RV.PX ? 1 : -1, by = a.clamp(RV.PY, 0.8, 0.96);
    const bowl = document.createElement('div'); bowl.className = 'cpBowl';
    bowl.style.left = (bx * RV.worldW) + 'px'; bowl.style.top = (by * RV.H) + 'px';
    bowl.innerHTML = `<div class="dish"></div><div class="rim"></div><div class="pile drop">${emoji}</div>`;
    world.appendChild(bowl);
    const pile = bowl.querySelector('.pile');
    try { a.setExpr('wow', 900); a.tone(660, 0.06); } catch (e) { /* fx optional */ }
    setTimeout(() => { try { a.tone(320, 0.08, 0, 'triangle', 0.05); } catch (e) { /* muted */ } pile.classList.remove('drop'); }, 550);
    // the pet walks over, faces the bowl and takes three bites
    setTimeout(() => {
      a.walkTo(bx - side * 0.055, () => {
        a.turnTo(side < 0);
        let bite = 0;
        const crumbs = () => { const sc = document.getElementById('roomScroll'), r = bowl.getBoundingClientRect(), st = document.getElementById('stage').getBoundingClientRect(); try { a.burst('crumbs', 6, { x: r.left - st.left + r.width / 2, y: r.top - st.top + 10 }); } catch (e) { /* fx optional */ } void sc; };
        const chomp = () => {
          bite++;
          try { a.sprPose(bite % 2 ? 'eat' : 'chew', 640); a.SFX.munch(); a.setExpr('eat', 700); a.act('a-chew'); } catch (e) { /* optional */ }
          crumbs(); pile.style.setProperty('--k', String(Math.max(0, 1 - bite / 3)));
          if (bite < 3) setTimeout(chomp, 680); else setTimeout(() => finish(k, bowl), 700);
        };
        chomp();
      }, by);
    }, 650);
    void name;
  }

  function finish(k, bowl) {
    const a = A(), S = CP.S(), f = F(), t = tastes(), [name, , , fx, trait] = FOODS[k];
    const fav = k === t.fav, dis = k === t.dis, bored = f.last.length >= 2 && f.last.slice(-2).every(x => x === k) && k !== 'crunch';
    const mult = fav ? 1.25 : dis ? 0.5 : bored ? 0.6 : 1;
    for (const [s, v] of Object.entries(fx)) S[s] = a.clamp(S[s] + Math.round(v * (v > 0 ? mult : 1)));
    if (fav) S.happy = a.clamp(S.happy + 6);
    if (dis) S.happy = a.clamp(S.happy - 3);
    const tr = trait === 'all' ? ['nature', 'instinct', 'tech', 'cosmic'] : [trait];
    tr.forEach(x => { S.base[x] = (S.base[x] || 0) + (trait === 'all' ? 1 : 1.5) * mult; });
    f.last = [...f.last, k].slice(-3); S.lastFood = FOODS[k][1];
    let line;
    if (fav) {
      const first = f.known[k] !== 'fav'; f.known[k] = 'fav';
      try { a.sprPose('inlove', 1800); a.burst('hearts', 12); a.SFX.yay(); } catch (e) { /* fx */ }
      line = first ? `I LOVE ${name}! 😍` : a.pick(['My favourite! 😍', 'Best. Food. Ever!', '💖💖💖']);
      if (first) a.toast(`❤️ Discovered: ${S.name} loves ${name}!`);
    } else if (dis) {
      const first = f.known[k] !== 'dis'; f.known[k] = 'dis';
      try { a.sprPose('sad', 1400); a.SFX.no(); } catch (e) { /* fx */ }
      line = a.pick(['Bleh… 😖', 'Not this one…', '*sad chewing*']);
      if (first) a.toast(`👎 ${S.name} isn't keen on ${name}`);
    } else if (bored) {
      try { a.sprPose('bored', 1200) || a.sprPlay('bored'); } catch (e) { /* fx */ }
      line = a.pick(['Again…? 😐', 'Something else maybe?', 'Same again…']);
    } else {
      try { a.sprPose('happy', 1200); } catch (e) { /* fx */ }
      line = a.pick(['Yum! 😋', 'Delicious!', 'Nom nom!', 'Mmm!']);
    }
    a.say(line, 2200);
    a.mission('feed'); a.addXP(fav ? 12 : 8);
    CP.lang && CP.lang.gain(1, 'meal');
    CP.emit('food', { k, fav, dis, bored });
    setTimeout(() => { bowl.classList.add('gone'); setTimeout(() => bowl.remove(), 600); }, 900);
    setTimeout(() => { a.busy = false; a.save(); a.renderAll(); }, 1000);
  }

  /** Fallback when the room isn't shown: the original fly-to-mouth feeding. */
  function legacy(k) {
    const a = A(), S = CP.S(), [, emoji, , fx] = FOODS[k];
    for (const [s, v] of Object.entries(fx)) S[s] = a.clamp(S[s] + v);
    try { a.sprPose('eat', 1300); a.SFX.munch(); } catch (e) { /* fx */ }
    a.say('Yum! 😋'); a.mission('feed'); a.addXP(8); a.save(); a.renderAll(); void emoji;
  }

  CP.food = { open, FOODS, tastes, state: F };
  CP.on('start', () => { F(); });
})();
