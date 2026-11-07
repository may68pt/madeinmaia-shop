/* CyberPet home hub: the panels under the room that turn daily care into long-term growth.
   - Growth path: the next milestone in every system (life stage, level gem, room size, zones,
     room goals, characters), sorted by how close it is. Each card opens the place that moves it.
   - Collection: the overall completion ring, broken down, opening the pet profile.
   Re-renders whenever the main app re-renders the daily missions. */
(function () {
  'use strict';
  const CP = window.CP;
  const A = () => CP.app();
  const esc = t => CP.esc(t);
  const c01 = v => Math.max(0, Math.min(1, Number(v) || 0));
  const xpNeed = l => 100 + (l - 1) * 60;
  const xpTo = l => { let t = 0; for (let i = 1; i < l; i++) t += xpNeed(i); return t; };

  CP.css('cp-hub', `
#hub .sec{margin-top:20px}
.gpath{display:flex;gap:10px;overflow-x:auto;scroll-snap-type:x mandatory;padding:2px 2px 8px;margin:0 -12px;padding-left:12px;padding-right:12px;scrollbar-width:none}
.gpath::-webkit-scrollbar{display:none}
.mcard{flex:0 0 46%;min-width:150px;scroll-snap-align:start;background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:10px;cursor:pointer;display:flex;flex-direction:column;gap:4px;position:relative;text-align:left;color:var(--txt);font:inherit}
.mcard:active{transform:scale(.96)}
.mcard .gk{font-family:'Barlow Condensed';font-weight:700;font-size:12px;text-transform:uppercase;letter-spacing:.5px;color:var(--mute)}
.mcard .ge{font-size:26px;line-height:1.1}
.mcard .gt{font-family:'Barlow Condensed';font-weight:800;font-size:17px;line-height:1.05}
.mcard .gs{font-size:12px;color:var(--mute);line-height:1.25;min-height:30px}
.mcard .bar{margin-top:auto}
.mcard.ready{border-color:var(--lm);box-shadow:0 0 14px rgba(166,255,60,.35)}
.mcard.ready::after{content:'READY';position:absolute;top:8px;right:8px;font-family:'Barlow Condensed';font-weight:800;font-size:11px;background:var(--lm);color:#14112e;border-radius:6px;padding:1px 6px}
.gcoll{display:flex;align-items:center;gap:14px;cursor:pointer}
.gcoll svg{width:92px;height:92px;flex:none}
.gcoll svg circle{fill:none;stroke-width:9;stroke-linecap:round}
.gcoll svg text{fill:#fff;font-family:'Barlow Condensed';font-weight:800;font-size:24px;text-anchor:middle;dominant-baseline:middle}
.gcoll svg text.s{font-size:11px;fill:var(--mute);font-weight:700}
.gcoll .gparts{flex:1;display:grid;gap:5px}
.gcoll .gp{display:grid;grid-template-columns:76px 1fr 34px;align-items:center;gap:6px;font-family:'Barlow Condensed';font-weight:700;font-size:13px}
.gcoll .gp b{text-align:right;color:var(--mute)}
`);

  /* ---------- milestone cards ---------- */
  function cards(a, S) {
    const out = [], L = a.lvInfo(), lv = L.l;
    const add = (key, emoji, kind, title, sub, prog, color, onTap) => out.push({ key, emoji, kind, title, sub, prog: prog == null ? null : c01(prog), color, onTap });

    if (S.stage === 'egg') {
      add('hatch', '🥚', 'First step', 'Hatch your egg', 'Tap the egg in the room to wake your Cyberpet', 0, '#3ff0ff', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
      return out;
    }

    // life stage
    const ST = a.STAGES, i = a.stageIdx(), nx = ST[i + 1];
    if (nx) {
      const from = ST[i][3], to = nx[3], left = Math.max(0, to - S.growth), days = Math.ceil(left / 24);
      add('stage', '🧬', 'Evolution', `${a.stageName()} → ${nx[1]}`, left < 1 ? 'Any moment now…' : `~${days} day${days > 1 ? 's' : ''} · grows faster when fed & happy`, (S.growth - from) / (to - from), '#ff3fd8', () => a.openProfile());
    }

    // next gem level
    const m = (Math.floor(lv / 5) + 1) * 5;
    add('gem', '💎', 'Level reward', `Lv.${m} → +1 💎`, `${xpTo(m) - S.xp} XP to go · games & care give XP`, (S.xp - xpTo(m - 5)) / (xpTo(m) - xpTo(m - 5)), '#3ff0ff', () => a.go('play'));

    // room expansion
    const R = S.room, N = R && a.ROOMLV[R.lv + 1];
    if (N) {
      const req = [[lv, N.lv], [S.coins, N.cost]];
      if (N.gems) req.push([S.gems, N.gems]);
      for (const [k, q] of Object.entries(N.mat || {})) req.push([(S.inv || {})[k] || 0, q]);
      const p = req.reduce((t, [h, n]) => t + c01(h / n), 0) / req.length;
      const miss = lv < N.lv ? `Needs pet Lv.${N.lv}` : S.coins < N.cost ? `${N.cost - S.coins} ⚡ more` : p < 1 ? 'Gather materials in Explore' : 'Tap to build it';
      add('room', '🏗️', 'Room', N.n, miss, p, '#ffc93c', () => a.openRoom('up'));
    }

    // zones: an open unexplored one beats the next locked one
    const Z = Object.entries(a.ZONES);
    const fresh = Z.find(([k, z]) => lv >= z.lv && !S.zones[k]);
    const locked = Z.filter(([, z]) => lv < z.lv).sort((x, y) => x[1].lv - y[1].lv)[0];
    if (fresh) add('zone', '🧭', 'Explore', fresh[1].n, 'New region open · relics & lore inside', 1, fresh[1].c, () => a.go('explore'));
    else if (locked) add('zone', '🗺️', 'Explore', locked[1].n, `Opens at Lv.${locked[1].lv}`, lv / locked[1].lv, locked[1].c, () => a.go('explore'));

    // room goals: the closest unfinished one, with the furniture it unlocks
    const bests = S.bests || {}, flags = S.flags || {};
    const GP = {
      hatch: () => 1, lv5: () => lv / 5, lv10: () => lv / 10, orbit: () => (bests.orbit || 0) / 900, run: () => (bests.run || 0) / 1200,
      catch: () => (bests.catch || 0) / 800, sync: () => ((S.gstars || {}).sync || 0) / 3, wins: () => (flags.wins || 0) / 5,
      expl: () => Object.values(S.zones || {}).reduce((t, n) => t + n, 0) / 5, bond: () => S.bond / 90, games: () => (flags.games || 0) / 20,
      decor: () => Object.keys((R && R.owned) || {}).length / 12
    };
    const goals = a.GOALS.filter(g => !(R && R.goals[g.id])).map(g => ({ g, p: c01(GP[g.id] ? GP[g.id]() : 0) })).sort((x, y) => y.p - x.p);
    if (goals[0]) {
      const { g, p } = goals[0], item = a.RI[g.it];
      add('goal', '🎁', 'Room goal', g.d, `Unlocks: ${item ? item.n : 'a room item'}`, p, '#a6ff3c', () => a.openRoom('goals'));
    }

    // characters
    const ch = (a.ROSTER || []).filter(r => r.unlock && !a.charUnlocked(r)).map(r => {
      const u = r.unlock, ps = [];
      if (u.level) ps.push(lv / u.level);
      if (u.bond) ps.push(S.bond / u.bond);
      if (u.zone) ps.push(S.zones[u.zone] ? 1 : 0);
      const why = u.level && lv < u.level ? `Reach Lv.${u.level}` : u.bond && S.bond < u.bond ? `Reach ${u.bond}% bond` : u.zone ? `Explore ${(a.ZONES[u.zone] || {}).n || u.zone}` : 'Keep growing';
      return { r, why, p: ps.length ? ps.reduce((t, v) => t + c01(v), 0) / ps.length : 0 };
    }).sort((x, y) => y.p - x.p)[0];
    if (ch) add('char', '✨', 'New look', ch.r.name, ch.why, ch.p, '#b06bff', () => a.go('journal'));

    // closest first; nothing finished hides at the back
    return out.sort((x, y) => (y.prog >= 1) - (x.prog >= 1) || (y.prog ?? -1) - (x.prog ?? -1));
  }

  function card(c, i) {
    const ready = c.prog != null && c.prog >= 1;
    return `<button class="mcard ${ready ? 'ready' : ''}" data-mc="${i}"><span class="gk">${esc(c.kind)}</span><span class="ge">${c.emoji}</span><span class="gt">${esc(c.title)}</span><span class="gs">${esc(c.sub)}</span>${c.prog == null ? '' : `<div class="bar"><i style="width:${Math.round(c.prog * 100)}%;background:${c.color};color:${c.color}"></i></div>`}</button>`;
  }

  function ring(p) {
    const C = 2 * Math.PI * 40;
    return `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,.1)"/><circle cx="50" cy="50" r="40" stroke="#3ff0ff" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - p)}" transform="rotate(-90 50 50)"/><text x="50" y="46">${Math.round(p * 100)}%</text><text x="50" y="66" class="s">COMPLETE</text></svg>`;
  }

  let list = [];
  function render() {
    const a = A(), S = CP.S(), box = document.getElementById('hub');
    if (!a || !S || !box || !S.room) return;
    try {
      list = cards(a, S);
      let html = `<div class="sec"><h2>Growth path<span class="stripes"></span></h2><small>What's next</small></div><div class="gpath">${list.map(card).join('')}</div>`;
      if (S.stage !== 'egg') {
        const P = a.progressScore();
        html += `<div class="sec"><h2>Collection<span class="stripes"></span></h2><small>Forever progress</small></div><div class="panel gcoll" id="gColl">${ring(P.total)}<div class="gparts">${P.parts.map(([n, v]) => `<div class="gp"><span>${esc(n)}</span><div class="bar"><i style="width:${Math.round(c01(v) * 100)}%;background:#3ff0ff;color:#3ff0ff"></i></div><b>${Math.round(c01(v) * 100)}%</b></div>`).join('')}</div></div>`;
      }
      const keepX = box.querySelector('.gpath')?.scrollLeft || 0;
      if (box._html === html) return;
      box._html = html; box.innerHTML = html;
      const gp = box.querySelector('.gpath'); if (gp) gp.scrollLeft = keepX;
      box.querySelectorAll('[data-mc]').forEach(b => b.onclick = () => { try { a.SFX.tap(); } catch (e) { /* sound optional */ } const c = list[+b.dataset.mc]; if (c) c.onTap(); });
      const gc = document.getElementById('gColl'); if (gc) gc.onclick = () => a.openProfile();
    } catch (e) { console.warn('[cp hub]', e); }
  }

  let queued = false;
  const soon = () => { if (queued) return; queued = true; requestAnimationFrame(() => { queued = false; render(); }); };
  CP.on('start', () => {
    const m = document.getElementById('missions');
    if (m) new MutationObserver(soon).observe(m, { childList: true });
    render();
  });
})();
