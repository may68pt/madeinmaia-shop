/* CyberPet home hub: everything under the room, built so the game only grows with time.
   Loops, short to long, all feeding each other:
   - Room wings bar  : jump between room sections; locked wings show what they need.
   - Pet's wish      : one daily wish that points at a different system each day. Streaks give gems.
   - Weekly quest    : a 7-step chain. Finishing it gives a Star Core (needed for the new room wings).
   - Season track    : monthly points from XP, wishes, quest steps and park visits; 10 claimable tiers.
   - Growth path     : the next milestone in every system, closest first.
   - Cyber Park      : what friends gave you, daily visit bonus.
   - Memories        : milestones captured forever (evolutions, wings, streaks, seasons…).
   - Collection      : overall completion.
   Actions arrive as CP 'act' events (emitted by the app's mission()) plus a few state diffs. */
(function () {
  'use strict';
  const CP = window.CP;
  const A = () => CP.app();
  const esc = t => CP.esc(t);
  const $ = q => document.querySelector(q);
  const c01 = v => Math.max(0, Math.min(1, Number(v) || 0));
  const xpNeed = l => 100 + (l - 1) * 60;
  const xpTo = l => { let t = 0; for (let i = 1; i < l; i++) t += xpNeed(i); return t; };
  const hash = str => { let h = 2166136261; for (const ch of String(str)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  const rng = seed => () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const dkey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const mkey = (d = new Date()) => dkey(d).slice(0, 7);
  const wkey = (d = new Date()) => { const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); const day = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - day); const y = new Date(Date.UTC(t.getUTCFullYear(), 0, 1)); return t.getUTCFullYear() + '-W' + Math.ceil(((t - y) / 864e5 + 1) / 7); };
  const daysLeftWeek = () => { const d = new Date().getDay() || 7; return 8 - d; };
  const daysLeftMonth = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate() - d.getDate() + 1; };
  const online = () => { const a = A(); return !!(a && a.CLOUD && a.CLOUD.id); };

  /* ---------- where each action is done ---------- */
  const top = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  const quick = k => () => { top(); setTimeout(() => { const b = $(`#quick [data-q="${k}"]`); if (b) b.click(); }, 250); };
  const GO = {
    feed: quick('feed'), fav: quick('feed'), bond: quick('bond'), clean: quick('clean'), sleep: quick('rest'),
    game: () => A().go('play'), train: () => A().go('play'), explore: () => A().go('explore'), craft: () => A().go('lab'),
    calibrate: () => { top(); setTimeout(() => $('#sCal') && $('#sCal').click(), 250); },
    station: () => { top(); A().toast('Tap a station in the room 🛋️'); },
    decor: () => A().openRoom('shop'),
    park: () => { top(); setTimeout(() => $('#sSocial') && $('#sSocial').click(), 250); }
  };
  const STEP = {
    feed: n => `Feed ${n} meals`, bond: n => `Cuddle ${n} times`, game: n => `Play ${n} mini-games`, explore: n => `Go on ${n} expeditions`,
    clean: n => `Clean up ${n} times`, train: n => `Train ${n}× in Signal Sync`, station: n => `Use room stations ${n}×`, craft: () => 'Craft or equip a module',
    sleep: n => `${n} naps or bedtimes`, calibrate: () => 'Calibrate once', decor: () => 'Get a new room item', park: () => 'Visit the Cyber Park'
  };
  const STEP_E = { feed: '🍴', bond: '💗', game: '🎮', explore: '🧭', clean: '🧼', train: '🎵', station: '🛋️', craft: '🔧', sleep: '🌙', calibrate: '🔲', decor: '🪴', park: '🌿', fav: '😋' };

  /* ---------- save state ---------- */
  function H() {
    const S = CP.S(); if (!S) return null;
    const h = S.hub = S.hub || {};
    h.mem = h.mem || [];
    h.wish = h.wish || { streak: 0, last: '' };
    h.season = h.season || { m: '', pts: 0, got: [] };
    if (h.season.m !== mkey()) h.season = { m: mkey(), pts: 0, got: [] };
    return h;
  }
  const save = () => { try { A().save(); } catch (e) { /* saved later */ } };

  function give(r, why) {
    const a = A(), S = CP.S(), bits = [];
    if (r.coins) { S.coins += r.coins; bits.push(`+${r.coins} ⚡`); }
    if (r.gems) { S.gems += r.gems; bits.push(`+${r.gems} 💎`); }
    if (r.bond) { S.bond = a.clamp(S.bond + r.bond); bits.push(`+${r.bond} bond`); }
    for (const [k, q] of Object.entries(r.inv || {})) { S.inv[k] = (S.inv[k] || 0) + q; bits.push(`${(a.ITEMS[k] || ['', '🎁'])[1]}×${q}`); }
    if (r.effect) { S.effects = S.effects || []; if (!S.effects.includes(r.effect)) { S.effects.push(r.effect); bits.push('new aura effect'); } else { S.gems += 2; bits.push('+2 💎'); } }
    if (r.pts) addPts(r.pts);
    try { a.SFX.coin(); a.renderHUD(); } catch (e) { /* hud later */ }
    a.toast(`${why} · ${bits.join(' · ')}`);
  }
  function addPts(n) { const h = H(); if (!h || n <= 0) return; h.season.pts += Math.round(n); }
  function addMem(e, ti, tx) {
    const h = H(), S = CP.S(); if (!h) return;
    if (h.mem.some(m => m.ti === ti)) return;
    h.mem.unshift({ t: Date.now(), e, ti, tx});
    h.mem = h.mem.slice(0, 40); void S;
  }
  const safe = (f, d) => { try { return f(); } catch (e) { return d; } };

  /* ---------- Pet's wish (daily) ---------- */
  function food() { const F = CP.food, S = CP.S(); if (!F || !S) return null; const t = safe(() => F.tastes()); if (!t || !t.fav) return null; const known = S.cpFood && S.cpFood.known && S.cpFood.known[t.fav] === 'fav'; const f = F.FOODS[t.fav]; return { id: t.fav, known, name: f[0], e: f[1] }; }
  function wishDef(k) {
    const S = CP.S();
    if (k === 'fav') { const f = food(); return { e: '😋', t: f && f.known ? `I'm craving ${f.e} ${f.name}!` : 'Help me find my favourite food', n: 1 }; }
    return {
      game: { e: '🎮', t: 'Play a mini-game with me!', n: 1 }, explore: { e: '🧭', t: 'Take me exploring today', n: 1 },
      bond: { e: '💗', t: 'Give me 3 cuddles', n: 3 }, clean: { e: '🧼', t: 'Can we tidy the room?', n: 1 },
      station: { e: '🛋️', t: 'Use something in the room with me', n: 1 }, park: { e: '🌿', t: 'Take me to the Cyber Park!', n: 1 },
      train: { e: '🎵', t: 'Let\'s train in Signal Sync', n: 1 }, sleep: { e: '🌙', t: 'Tuck me in for a nap', n: 1 }
    }[k] || { e: '💭', t: (S && S.name) + ' is thinking…', n: 1 };
  }
  function ensureWish() {
    const h = H(), S = CP.S(); if (!h || S.stage === 'egg') return null;
    const today = dkey();
    if (h.wish.d !== today) {
      const pool = ['game', 'explore', 'bond', 'clean', 'station', 'train', 'sleep'];
      if (food()) pool.push('fav', 'fav');
      if (online()) pool.push('park');
      const r = rng(hash(today + S.seed));
      let k = pool[Math.floor(r() * pool.length)];
      if (k === h.wish.k && pool.length > 1) k = pool[(pool.indexOf(k) + 1) % pool.length];
      Object.assign(h.wish, { d: today, k, p: 0, done: false, said: false });
    }
    return h.wish;
  }
  function wishProgress(id, n) {
    const w = ensureWish(); if (!w || w.done || w.k !== id) return;
    const def = wishDef(w.k); w.p = Math.min(def.n, (w.p || 0) + n);
    if (w.p >= def.n) {
      w.done = true;
      const yest = dkey(new Date(Date.now() - 864e5));
      w.streak = w.last === yest ? (w.streak || 0) + 1 : 1; w.last = w.d;
      const S = CP.S();
      give({ bond: 12, coins: 40, pts: 60 }, `💭 Wish granted`);
      try { A().say(['Yay! You remembered! 💖', 'Best day ever!', 'Thank you!! 🥹'][w.streak % 3], 2200); A().burst('hearts', 12); } catch (e) { /* fx */ }
      if (w.streak % 7 === 0) { give({ gems: 1 }, `🔥 ${w.streak}-day wish streak`); addMem('🔥', `${w.streak}-day wish streak`, `${S.name} got a wish granted ${w.streak} days in a row.`); }
    }
  }

  /* ---------- Weekly quest chain ---------- */
  function ensureWeek() {
    const h = H(), S = CP.S(); if (!h || S.stage === 'egg') return null;
    const wk = wkey();
    if (!h.week || h.week.w !== wk) {
      const pool = [['feed', 4], ['bond', 6], ['game', 3], ['explore', 2], ['clean', 3], ['train', 2], ['station', 3], ['craft', 1], ['sleep', 2], ['calibrate', 1], ['decor', 1]];
      if (online()) pool.push(['park', 1]);
      const r = rng(hash(wk + S.seed)), sh = [...pool];
      for (let i = sh.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [sh[i], sh[j]] = [sh[j], sh[i]]; }
      h.week = { w: wk, steps: sh.slice(0, 7), i: 0, p: 0, done: false };
    }
    return h.week;
  }
  function weekProgress(id, n) {
    const w = ensureWeek(); if (!w || w.done) return;
    const [k, need] = w.steps[w.i]; if (k !== id) return;
    w.p = Math.min(need, w.p + n);
    if (w.p >= need) {
      w.i++; w.p = 0;
      const mat = w.i % 2 ? { shard: 1 } : { scrap: 1 };
      if (w.i >= w.steps.length) {
        w.done = true;
        give({ inv: { starcore: 1 }, gems: 2, pts: 150 }, '🏆 Weekly quest complete');
        addMem('🏆', `Weekly quest ${w.w}`, `${CP.S().name} finished all 7 steps and earned a Star Core.`);
      } else give({ coins: 60, inv: mat, pts: 80 }, `✅ Quest step ${w.i}/7`);
    }
  }

  /* ---------- Season (monthly) ---------- */
  const SEASONS = ['Frost Signal', 'Heart Circuit', 'Bloom Boot', 'Rain Code', 'Petal Pulse', 'Solar Drift', 'Neon Summer', 'Starfall', 'Harvest Glitch', 'Ember Night', 'Neon Harvest', 'Aurora Winter'];
  const TIERS = [300, 800, 1500, 2400, 3500, 4800, 6300, 8000, 10000, 12500];
  const TRW = [{ coins: 60 }, { inv: { shard: 2 } }, { coins: 120 }, { gems: 1 }, { inv: { scrap: 3, leaf: 3 } }, { inv: { starcore: 1 } }, { coins: 250 }, { gems: 2 }, { inv: { spore: 3, shard: 3 } }, { inv: { starcore: 1 }, gems: 3, effect: 'aurora' }];
  const TRW_E = ['⚡', '🔷', '⚡', '💎', '⚙️', '🌟', '⚡', '💎', '💠', '👑'];
  function claimTier(i) {
    const h = H(); if (!h || h.season.got.includes(i) || h.season.pts < TIERS[i]) return;
    h.season.got.push(i);
    give(TRW[i], `🎖️ Season tier ${i + 1}`);
    if (i === 4 || i === 9) addMem(i === 9 ? '👑' : '🎖️', `${SEASONS[new Date().getMonth()]} · tier ${i + 1}`, i === 9 ? 'Season champion! The whole track, done.' : 'Halfway up the season track.');
    save(); render();
  }

  /* ---------- actions in ---------- */
  function act(id, n = 1) {
    const S = CP.S(); if (!S || S.stage === 'egg') return;
    wishProgress(id, n); weekProgress(id, n);
    if (id === 'feed') { const f = food(), last = S.cpFood && S.cpFood.last && S.cpFood.last[S.cpFood.last.length - 1]; if (f && last === f.id) act('fav'); }
    if (id === 'park' && CP.daily('hubPark', 0) === 0) { CP.daily('hubPark', 1); give({ coins: 20, pts: 40 }, '🌿 Daily park visit'); }
    save(); soon();
  }

  // state diffs for things the app does not report as missions
  let snap = null, snapS = null;
  function readSnap(S) {
    const a = A();
    return {
      sleeps: S.sleeps || 0, xp: S.xp, lv: a.lvInfo().l, stage: a.stageKey(), room: (S.room && S.room.lv) || 1,
      owned: S.room ? Object.values(S.room.owned).reduce((t, n) => t + (n || 0), 0) : 0,
      cool: S.room ? Object.assign({}, S.room.cool) : {}, zones: Object.keys(S.zones || {}).filter(k => S.zones[k])
    };
  }
  function diff() {
    const S = CP.S(), a = A(); if (!S || !a) return;
    if (snapS !== S) { snapS = S; snap = readSnap(S); seedMem(); return; }
    const n = readSnap(S), o = snap; snap = n;
    if (S.stage === 'egg') return;
    if (n.sleeps > o.sleeps) act('sleep', n.sleeps - o.sleeps);
    const used = Object.keys(n.cool).filter(k => n.cool[k] !== o.cool[k]).length; if (used) act('station', used);
    if (n.owned > o.owned) act('decor', n.owned - o.owned);
    if (n.xp > o.xp) { addPts(n.xp - o.xp); soon(); }
    if (n.room > o.room) addMem('🏠', `Room grew: ${(a.ROOMLV[n.room] || {}).n}`, `${S.name}'s home got bigger.`);
    if (n.stage !== o.stage && o.stage !== 'egg') addMem('🧬', `Evolved: ${a.stageName()}`, `${S.name} grew into a ${a.stageName()}.`);
    if (o.stage === 'egg' && n.stage !== 'egg') addMem('🐣', 'Hatched!', `${S.name} opened its eyes for the first time.`);
    n.zones.filter(k => !o.zones.includes(k)).forEach(k => addMem('🗺️', `First trip: ${(a.ZONES[k] || {}).n || k}`, 'A new region on the map.'));
    if (Math.floor(n.lv / 5) > Math.floor(o.lv / 5)) addMem('⭐', `Reached Lv.${Math.floor(n.lv / 5) * 5}`, `${S.name} keeps getting stronger.`);
    if (JSON.stringify(n) !== JSON.stringify(o)) save();
  }
  function seedMem() {
    const h = H(), S = CP.S(); if (!h || h.memSeeded) return;
    h.memSeeded = true;
    if (S.hatchedAt) h.mem.push({ t: S.hatchedAt, e: '🐣', ti: 'Hatched!', tx: `${S.name} opened its eyes for the first time.` });
    (S.log || []).filter(l => l.ti === 'Evolved!' || l.ti === 'Room expanded').forEach(l => h.mem.push({ t: l.t, e: l.ti === 'Evolved!' ? '🧬' : '🏠', ti: l.ti === 'Evolved!' ? 'Evolved' : 'Room grew', tx: l.tx }));
    h.mem.sort((x, y) => y.t - x.t);
  }

  /* ---------- CSS ---------- */
  CP.css('cp-hub', `
#hub .sec,#hubWish .sec{margin-top:20px}
.hrow{display:flex;gap:10px;overflow-x:auto;scroll-snap-type:x mandatory;margin:0 -12px;padding:2px 12px 8px;scrollbar-width:none}
.hrow::-webkit-scrollbar{display:none}
.mcard{flex:0 0 46%;min-width:150px;scroll-snap-align:start;background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:10px;cursor:pointer;display:flex;flex-direction:column;gap:4px;position:relative;text-align:left;color:var(--txt);font:inherit}
.mcard:active,.hgo:active,.rnav button:active{transform:scale(.96)}
.mcard .gk{font-family:'Barlow Condensed';font-weight:700;font-size:12px;text-transform:uppercase;letter-spacing:.5px;color:var(--mute)}
.mcard .ge{font-size:26px;line-height:1.1}
.mcard .gt{font-family:'Barlow Condensed';font-weight:800;font-size:17px;line-height:1.05}
.mcard .gs{font-size:12px;color:var(--mute);line-height:1.25;min-height:30px}
.mcard .bar{margin-top:auto}
.mcard.ready,.tnode.claim{border-color:var(--lm);box-shadow:0 0 14px rgba(166,255,60,.35)}
.mcard.ready::after{content:'READY';position:absolute;top:8px;right:8px;font-family:'Barlow Condensed';font-weight:800;font-size:11px;background:var(--lm);color:#14112e;border-radius:6px;padding:1px 6px}
.hgo{border:0;border-radius:12px;padding:8px 14px;font-family:'Barlow Condensed';font-weight:800;font-size:15px;text-transform:uppercase;background:linear-gradient(135deg,var(--or),#ff3fd8);color:#fff;cursor:pointer;flex:none}
.hgo.done{background:rgba(166,255,60,.15);color:var(--lm);border:1px solid var(--lm)}
.hmute{color:var(--mute);font-size:12px}
/* room wings */
.rnav{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:8px}
.rnav button{position:relative;height:46px;border-radius:12px;border:1.5px solid var(--line);background:#1a1433 center/cover no-repeat;overflow:hidden;cursor:pointer;padding:0;color:#fff;font-family:'Barlow Condensed';font-weight:800;font-size:12px}
.rnav button i{position:absolute;inset:0;background-size:cover;background-position:center}
.rnav button.m i{transform:scaleX(-1)}
.rnav button span{position:absolute;left:0;right:0;bottom:0;padding:2px 4px;background:linear-gradient(transparent,rgba(8,6,20,.9));text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.rnav button.on{border-color:var(--cy);box-shadow:0 0 12px rgba(63,240,255,.45)}
.rnav button.lock i{filter:grayscale(1) brightness(.35)}
.rnav button.lock b{position:absolute;top:4px;left:0;right:0;text-align:center;font-size:14px}
/* wish */
.wish{display:flex;align-items:center;gap:10px}
.wish .wav{width:52px;height:52px;border-radius:50%;overflow:hidden;border:2px solid var(--mg);flex:none;position:relative;background:#120f2b}
.wish .wav img{position:absolute;width:150%;left:-35%;top:-12%}
.wish .wb{flex:1;min-width:0;position:relative;background:rgba(255,255,255,.06);border:1px solid var(--line);border-radius:14px;padding:7px 10px}
.wish .wb::before{content:'';position:absolute;left:-7px;top:18px;border:7px solid transparent;border-right-color:rgba(255,255,255,.12);border-left:0}
.wish .wt{font-family:'Barlow Condensed';font-weight:800;font-size:17px;line-height:1.1}
.wish .bar{margin-top:5px}
/* weekly */
.qnodes{display:flex;align-items:center;gap:4px;margin-bottom:10px}
.qnodes i{flex:1;height:6px;border-radius:4px;background:rgba(255,255,255,.1)}
.qnodes i.d{background:var(--lm);box-shadow:0 0 8px var(--lm)}
.qnodes i.c{background:var(--or);animation:lowp 1.2s infinite}
.qstep{display:flex;align-items:center;gap:10px}
.qstep .qe{font-size:28px}
.qstep .qt{flex:1;min-width:0}
.qstep .qt b{font-family:'Barlow Condensed';font-weight:800;font-size:17px;display:block}
/* season */
.strack{display:flex;gap:8px;overflow-x:auto;margin:10px -12px 0;padding:4px 12px 6px;scrollbar-width:none}
.strack::-webkit-scrollbar{display:none}
.tnode{flex:none;width:58px;border-radius:12px;border:1px solid var(--line);background:rgba(255,255,255,.04);text-align:center;padding:6px 2px;font-family:'Barlow Condensed';font-weight:800;font-size:12px;color:var(--mute);cursor:pointer}
.tnode em{display:block;font-style:normal;font-size:22px;line-height:1.2}
.tnode.got{opacity:.45}.tnode.got em::after{content:' ✓';font-size:12px;color:var(--lm)}
.tnode.claim{color:var(--lm);animation:lowp 1.1s infinite}
/* park */
.park{display:flex;align-items:center;gap:12px;background:linear-gradient(120deg,rgba(25,50,65,.9),rgba(22,19,52,.85)),url(r/cyber-park.webp) center/cover}
.park .pt{flex:1}.park .pt b{font-family:'Barlow Condensed';font-weight:800;font-size:18px;display:block}
/* memories */
.memc{flex:0 0 120px;scroll-snap-align:start;background:#f4f0ff;color:#1b1638;border-radius:6px;padding:8px 8px 10px;transform:rotate(var(--r));box-shadow:0 6px 14px rgba(0,0,0,.4);cursor:pointer}
.memc .mi{height:74px;border-radius:3px;background:linear-gradient(135deg,#2a1d5c,#5b2a7a);display:flex;align-items:center;justify-content:center;font-size:34px}
.memc b{display:block;font-family:'Barlow Condensed';font-weight:800;font-size:14px;line-height:1.05;margin-top:6px}
.memc small{color:#6c6496;font-size:11px}
/* collection */
.gcoll{display:flex;align-items:center;gap:14px;cursor:pointer}
.gcoll svg{width:92px;height:92px;flex:none}
.gcoll svg circle{fill:none;stroke-width:9;stroke-linecap:round}
.gcoll svg text{fill:#fff;font-family:'Barlow Condensed';font-weight:800;font-size:24px;text-anchor:middle;dominant-baseline:middle}
.gcoll svg text.s{font-size:11px;fill:var(--mute);font-weight:700}
.gcoll .gparts{flex:1;display:grid;gap:5px}
.gcoll .gp{display:grid;grid-template-columns:76px 1fr 34px;align-items:center;gap:6px;font-family:'Barlow Condensed';font-weight:700;font-size:13px}
.gcoll .gp b{text-align:right;color:var(--mute)}
`);

  /* ---------- Growth path cards ---------- */
  function cards(a, S) {
    const out = [], L = a.lvInfo(), lv = L.l;
    const add = (key, emoji, kind, title, sub, prog, color, onTap) => out.push({ key, emoji, kind, title, sub, prog: prog == null ? null : c01(prog), color, onTap });
    if (S.stage === 'egg') { add('hatch', '🥚', 'First step', 'Hatch your egg', 'Tap the egg in the room to wake your Cyberpet', 0, '#3ff0ff', top); return out; }
    const ST = a.STAGES, i = a.stageIdx(), nx = ST[i + 1];
    if (nx) { const from = ST[i][3], to = nx[3], left = Math.max(0, to - S.growth), days = Math.ceil(left / 24); add('stage', '🧬', 'Evolution', `${a.stageName()} → ${nx[1]}`, left < 1 ? 'Any moment now…' : `~${days} day${days > 1 ? 's' : ''} · grows faster when fed & happy`, (S.growth - from) / (to - from), '#ff3fd8', () => a.openProfile()); }
    const m = (Math.floor(lv / 5) + 1) * 5;
    add('gem', '💎', 'Level reward', `Lv.${m} → +1 💎`, `${xpTo(m) - S.xp} XP to go · games & care give XP`, (S.xp - xpTo(m - 5)) / (xpTo(m) - xpTo(m - 5)), '#3ff0ff', () => a.go('play'));
    const R = S.room, N = R && a.ROOMLV[R.lv + 1];
    if (N) {
      const req = [[lv, N.lv], [S.coins, N.cost]]; if (N.gems) req.push([S.gems, N.gems]);
      for (const [k, q] of Object.entries(N.mat || {})) req.push([(S.inv || {})[k] || 0, q]);
      const p = req.reduce((t, [h, n]) => t + c01(h / n), 0) / req.length;
      const core = (N.mat || {}).starcore && ((S.inv || {}).starcore || 0) < N.mat.starcore;
      const miss = lv < N.lv ? `Needs pet Lv.${N.lv}` : S.coins < N.cost ? `${N.cost - S.coins} ⚡ more` : core ? '🌟 Star Core: weekly quest & season' : p < 1 ? 'Gather materials in Explore' : 'Tap to build it';
      add('room', '🏗️', 'Room wing', a.ROOM_SEC_NAMES()[a.roomSecs()] && R.lv >= 2 ? a.ROOM_SEC_NAMES()[a.roomSecs()] : N.n, miss, p, '#ffc93c', () => a.openRoom('up'));
    }
    const Z = Object.entries(a.ZONES), fresh = Z.find(([k, z]) => lv >= z.lv && !S.zones[k]), locked = Z.filter(([, z]) => lv < z.lv).sort((x, y) => x[1].lv - y[1].lv)[0];
    if (fresh) add('zone', '🧭', 'Explore', fresh[1].n, 'New region open · relics & lore inside', 1, fresh[1].c, () => a.go('explore'));
    else if (locked) add('zone', '🗺️', 'Explore', locked[1].n, `Opens at Lv.${locked[1].lv}`, lv / locked[1].lv, locked[1].c, () => a.go('explore'));
    const bests = S.bests || {}, flags = S.flags || {};
    const GP = { hatch: () => 1, lv5: () => lv / 5, lv10: () => lv / 10, orbit: () => (bests.orbit || 0) / 900, run: () => (bests.run || 0) / 1200, catch: () => (bests.catch || 0) / 800, sync: () => ((S.gstars || {}).sync || 0) / 3, wins: () => (flags.wins || 0) / 5, expl: () => Object.values(S.zones || {}).reduce((t, n) => t + n, 0) / 5, bond: () => S.bond / 90, games: () => (flags.games || 0) / 20, decor: () => Object.keys((R && R.owned) || {}).length / 12 };
    const goals = a.GOALS.filter(g => !(R && R.goals[g.id])).map(g => ({ g, p: c01(GP[g.id] ? GP[g.id]() : 0) })).sort((x, y) => y.p - x.p);
    if (goals[0]) { const { g, p } = goals[0], item = a.RI[g.it]; add('goal', '🎁', 'Room goal', g.d, `Unlocks: ${item ? item.n : 'a room item'}`, p, '#a6ff3c', () => a.openRoom('goals')); }
    const ch = (a.ROSTER || []).filter(r => r.unlock && !a.charUnlocked(r)).map(r => { const u = r.unlock, ps = []; if (u.level) ps.push(lv / u.level); if (u.bond) ps.push(S.bond / u.bond); if (u.zone) ps.push(S.zones[u.zone] ? 1 : 0); const why = u.level && lv < u.level ? `Reach Lv.${u.level}` : u.bond && S.bond < u.bond ? `Reach ${u.bond}% bond` : u.zone ? `Explore ${(a.ZONES[u.zone] || {}).n || u.zone}` : 'Keep growing'; return { r, why, p: ps.length ? ps.reduce((t, v) => t + c01(v), 0) / ps.length : 0 }; }).sort((x, y) => y.p - x.p)[0];
    if (ch) add('char', '✨', 'New look', ch.r.name, ch.why, ch.p, '#b06bff', () => a.go('journal'));
    return out.sort((x, y) => (y.prog >= 1) - (x.prog >= 1) || (y.prog ?? -1) - (x.prog ?? -1));
  }
  const bar = (p, c) => `<div class="bar"><i style="width:${Math.round(c01(p) * 100)}%;background:${c};color:${c}"></i></div>`;
  const sec = (t, s) => `<div class="sec"><h2>${t}<span class="stripes"></span></h2><small>${s}</small></div>`;

  /* ---------- room wings bar ---------- */
  function renderNav() {
    const a = A(), S = CP.S(); if (!a || !S || !S.room) return;
    let nav = $('#roomNav');
    if (!nav) { nav = document.createElement('div'); nav.id = 'roomNav'; nav.className = 'rnav'; $('#stage').after(nav); $('#roomScroll').addEventListener('scroll', markNav, { passive: true }); }
    const names = a.ROOM_SEC_NAMES(), ws = a.wingSkins(), main = a.roomArt(S.room.skin), arts = [main, main, a.roomArt(ws[0]), a.roomArt(ws[1])], open = a.roomSecs();
    const needLv = [1, 6, 10, 15];
    const html = names.map((n, i) => `<button data-sec="${i}" class="${i === 1 || i === 3 ? 'm ' : ''}${i >= open ? 'lock' : ''}"><i style="background-image:url(${arts[i]})"></i>${i >= open ? `<b>🔒</b>` : ''}<span>${esc(i >= open ? n + ' · Lv.' + needLv[i] : n)}</span></button>`).join('');
    if (nav._h !== html) {
      nav._h = html; nav.innerHTML = html;
      nav.querySelectorAll('[data-sec]').forEach(b => b.onclick = () => {
        const k = +b.dataset.sec; try { a.SFX.tap(); } catch (e) { /* sound */ }
        if (k >= a.roomSecs()) { a.openRoom('up'); return; }
        const RV = a.RV, sc = $('#roomScroll'), n = a.roomSecs();
        RV.userT = performance.now();
        sc.scrollTo({ left: Math.max(0, RV.imgW * k + RV.imgW / 2 - sc.clientWidth / 2), behavior: 'smooth' });
        if (CP.idle()) setTimeout(() => a.walkTo((k + 0.5) / n, null, undefined, true), 350);
      });
    }
    markNav();
  }
  function markNav() {
    const a = A(), nav = $('#roomNav'), sc = $('#roomScroll'); if (!a || !nav || !sc || !a.RV.imgW) return;
    const k = Math.floor((sc.scrollLeft + sc.clientWidth / 2) / a.RV.imgW);
    nav.querySelectorAll('[data-sec]').forEach(b => b.classList.toggle('on', +b.dataset.sec === k));
  }

  /* ---------- render ---------- */
  let list = [];
  function render() {
    const a = A(), S = CP.S(), box = $('#hub'); if (!a || !S || !box || !S.room) return;
    try {
      renderNav();
      const egg = S.stage === 'egg';
      // wish (sits above the daily missions)
      let wb = $('#hubWish');
      if (!wb) { wb = document.createElement('div'); wb.id = 'hubWish'; const ms = $('#missions'); ms.previousElementSibling.before(wb); }
      const w = ensureWish();
      const wHtml = w ? (() => { const d = wishDef(w.k); return `${sec("Pet's wish", w.streak ? `🔥 ${w.streak} day streak` : 'New every day')}<div class="panel wish"><div class="wav"><img src="${esc(($('#avImg') || {}).src || '')}" alt=""></div><div class="wb"><div class="wt">${d.e} ${esc(d.t)}</div>${w.done ? '<div class="hmute">Granted! Come back tomorrow for a new wish 💖</div>' : `${d.n > 1 ? bar(w.p / d.n, '#ff3fd8') : '<div class="hmute">+12 bond · +40 ⚡ · +60 season pts</div>'}`}</div>${w.done ? '<button class="hgo done" disabled>✓</button>' : '<button class="hgo" id="wishGo">Go</button>'}</div>`; })() : '';
      if (wb._h !== wHtml) { wb._h = wHtml; wb.innerHTML = wHtml; const g = $('#wishGo'); if (g) g.onclick = () => { try { a.SFX.tap(); } catch (e) { /* sound */ } (GO[w.k] || top)(); }; }

      list = cards(a, S);
      let html = '';
      if (!egg) {
        // weekly quest
        const wk = ensureWeek();
        if (wk) {
          const cur = wk.steps[wk.i];
          html += sec('Weekly quest', `${daysLeftWeek()} day${daysLeftWeek() > 1 ? 's' : ''} left`) + `<div class="panel"><div class="qnodes">${wk.steps.map((s, i) => `<i class="${i < wk.i || wk.done ? 'd' : i === wk.i ? 'c' : ''}"></i>`).join('')}</div>` +
            (wk.done ? `<div class="qstep"><span class="qe">🏆</span><div class="qt"><b>All 7 steps done!</b><span class="hmute">New chain on Monday. Star Core earned 🌟</span></div></div>`
              : `<div class="qstep"><span class="qe">${STEP_E[cur[0]]}</span><div class="qt"><b>Step ${wk.i + 1}/7 · ${esc(STEP[cur[0]](cur[1]))}</b>${bar(wk.p / cur[1], '#ff7a1a')}<span class="hmute">${wk.p}/${cur[1]} · finish all 7 → 🌟 Star Core + 2 💎</span></div><button class="hgo" id="weekGo">Go</button></div>`) + `</div>`;
        }
        // season
        const h = H(), sp = h.season.pts, nxt = TIERS.findIndex(t => sp < t), from = nxt > 0 ? TIERS[nxt - 1] : 0;
        html += sec('Season', `${SEASONS[new Date().getMonth()]} · ${daysLeftMonth()}d left`) + `<div class="panel"><div style="display:flex;justify-content:space-between;align-items:baseline"><b class="h" style="font-size:18px">${sp.toLocaleString()} pts</b><span class="hmute">${nxt < 0 ? 'Track complete 👑' : `${(TIERS[nxt] - sp).toLocaleString()} to tier ${nxt + 1}`}</span></div>${bar(nxt < 0 ? 1 : (sp - from) / (TIERS[nxt] - from), '#ffc93c')}<div class="hmute" style="margin-top:4px">XP, wishes, quest steps & park visits all give points</div><div class="strack">${TIERS.map((t, i) => { const got = h.season.got.includes(i), can = !got && sp >= t; return `<div class="tnode ${got ? 'got' : can ? 'claim' : ''}" data-tier="${i}"><em>${TRW_E[i]}</em>${can ? 'CLAIM' : 'T' + (i + 1)}</div>`; }).join('')}</div></div>`;
      }
      html += sec('Growth path', "What's next") + `<div class="hrow">${list.map((c, i) => `<button class="mcard ${c.prog != null && c.prog >= 1 ? 'ready' : ''}" data-mc="${i}"><span class="gk">${esc(c.kind)}</span><span class="ge">${c.emoji}</span><span class="gt">${esc(c.title)}</span><span class="gs">${esc(c.sub)}</span>${c.prog == null ? '' : bar(c.prog, c.color)}</button>`).join('')}</div>`;
      if (!egg) {
        const sr = S.socialRewards || {}, visited = CP.daily('hubPark', 0) > 0;
        html += sec('Cyber Park', 'Friends & visits') + `<div class="panel park"><span style="font-size:34px">🌿</span><div class="pt"><b>${visited ? 'Visited today ✓' : 'Daily visit: +20 ⚡ · +40 pts'}</b><span class="hmute">${sr.bond || sr.xp ? `Friends have given ${S.name} +${Math.round(sr.bond || 0)} bond · +${Math.round(sr.xp || 0)} XP` : 'Meet other Cyberpets, visit homes, trade cuddles'}</span></div><button class="hgo" id="parkGo">Visit</button></div>`;
        const mem = H().mem;
        html += sec('Memories', `${mem.length} saved`) + (mem.length ? `<div class="hrow">${mem.map((m, i) => `<div class="memc" data-mem="${i}" style="--r:${((hash(m.ti) % 7) - 3) * .8}deg"><div class="mi">${m.e}</div><b>${esc(m.ti)}</b><small>${new Date(m.t).toLocaleDateString()}</small></div>`).join('')}</div>` : `<div class="panel hmute">Big moments land here: evolutions, new wings, streaks, seasons.</div>`);
        const P = a.progressScore(), C = 2 * Math.PI * 40;
        html += sec('Collection', 'Forever progress') + `<div class="panel gcoll" id="gColl"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,.1)"/><circle cx="50" cy="50" r="40" stroke="#3ff0ff" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - P.total)}" transform="rotate(-90 50 50)"/><text x="50" y="46">${Math.round(P.total * 100)}%</text><text x="50" y="66" class="s">COMPLETE</text></svg><div class="gparts">${P.parts.map(([n, v]) => `<div class="gp"><span>${esc(n)}</span>${bar(v, '#3ff0ff')}<b>${Math.round(c01(v) * 100)}%</b></div>`).join('')}</div></div>`;
      }
      if (box._html === html) return;
      const keep = [...box.querySelectorAll('.hrow,.strack')].map(e => e.scrollLeft);
      box._html = html; box.innerHTML = html;
      box.querySelectorAll('.hrow,.strack').forEach((e, i) => { e.scrollLeft = keep[i] || 0; });
      const tap = () => { try { a.SFX.tap(); } catch (e) { /* sound */ } };
      box.querySelectorAll('[data-mc]').forEach(b => b.onclick = () => { tap(); const c = list[+b.dataset.mc]; if (c) c.onTap(); });
      box.querySelectorAll('[data-tier]').forEach(b => b.onclick = () => { const i = +b.dataset.tier, h = H(); if (h.season.pts >= TIERS[i] && !h.season.got.includes(i)) claimTier(i); else { tap(); a.toast(`Tier ${i + 1} at ${TIERS[i].toLocaleString()} pts`); } });
      box.querySelectorAll('[data-mem]').forEach(b => b.onclick = () => { tap(); const m = H().mem[+b.dataset.mem]; if (m) a.modal(`<div style="text-align:center"><div style="font-size:64px">${m.e}</div><h3>${esc(m.ti)}</h3><p>${esc(m.tx || '')}</p><p class="muted">${new Date(m.t).toLocaleString()}</p></div><div class="btns"><button class="btn" data-x>Close</button></div>`); });
      const wg = $('#weekGo'); if (wg) wg.onclick = () => { tap(); const wk = ensureWeek(); (GO[wk.steps[wk.i][0]] || top)(); };
      const pg = $('#parkGo'); if (pg) pg.onclick = () => { tap(); GO.park(); };
      const gc = $('#gColl'); if (gc) gc.onclick = () => a.openProfile();
    } catch (e) { console.warn('[cp hub]', e); }
  }

  let queued = false;
  function soon() { if (queued) return; queued = true; requestAnimationFrame(() => { queued = false; render(); }); }
  CP.hub = { act, render, state: H, claimTier };
  CP.on('act', e => { if (e && !e.set) act(e.id, e.amt || 1); });
  CP.on('start', () => {
    const m = $('#missions'); if (m) new MutationObserver(soon).observe(m, { childList: true });
    document.addEventListener('click', e => { if (e.target.closest && e.target.closest('#sSocial')) act('park'); }, true);
    diff(); render();
    setInterval(() => { diff(); }, 2000);
    setTimeout(() => { const w = ensureWish(); if (w && !w.done && !w.said && CP.idle()) { w.said = true; try { A().say('💭 ' + wishDef(w.k).t, 2800); } catch (e) { /* busy */ } save(); } }, 9000);
  });
})();
