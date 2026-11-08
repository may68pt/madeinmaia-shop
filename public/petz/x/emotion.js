/* CyberPet emotional layer.
   The pet keeps three feelings that move with what happens to it, then settle back toward what its stats say:
     valence   (-1 upset … +1 joyful)   arousal (0 calm … 1 wired)   affection (0 distant … 1 bonded)
   plus timed states: sulking (after rough handling or neglect), proud (after a great game), clingy (after time away).
   From these it picks one of the 20 close-up expressions (with class-flavoured choices: Wildheart gets proud,
   Starbloom playful, Orbitron curious…), which drives: the mood chip and mood card, the visor face, the glass
   close-ups, the petting reaction cam, chatter and a few gameplay effects:
     happy / blissful / proud → +10% coins from games      sulky → half bond from touch until it forgives you
     clingy → comes to the glass more, and answering within 30 s gives a reunion bonus      hungry → pleading */
(function () {
  'use strict';
  const CP = window.CP;
  const A = () => CP.app();
  const c = (v, a = -1, b = 1) => Math.max(a, Math.min(b, v));

  // id → [label, emoji, visor face, what it usually means]
  const EXP = {
    neutral: ['Curious', '🙂', 'content', 'Watching the world'], happy: ['Happy', '😄', 'happy', 'Feeling good'],
    purr: ['Blissful', '🥰', 'love', 'Loved and content'], sleepy: ['Sleepy', '😴', 'asleep', 'Dozing'],
    drowsy: ['Drowsy', '🥱', 'yawn', 'Needs rest'], startled: ['Startled', '😳', 'surprised', 'Something made it jump'],
    surprised: ['Surprised', '😲', 'surprised', 'Whoa!'], confused: ['Confused', '🤔', 'content', 'Something is off'],
    proud: ['Proud', '😎', 'proud', 'Just did something great'], clingy: ['Clingy', '🥺', 'love', 'Missed you'],
    sulky: ['Sulky', '😒', 'grumpy', 'Upset with you'], annoyed: ['Annoyed', '😤', 'grumpy', 'That was too rough'],
    giggle: ['Giggling', '😆', 'happy', 'That tickled'], sneeze_windup: ['About to sneeze', '😣', 'content', 'Ah… ah…'],
    sneeze: ['Sneeze!', '🤧', 'content', 'ACHOO'], nuzzle_ready: ['Affectionate', '😊', 'love', 'Wants to nuzzle'],
    tongue_playful: ['Playful', '😛', 'happy', 'Wants to play'], pleading: ['Pleading', '🥺', 'sad', 'Hungry'],
    scared: ['Scared', '😨', 'surprised', 'Frightened'], calm: ['Calm', '😌', 'content', 'Peaceful'],
  };
  // what each class leans toward when it's simply in a good mood (from the six-class close-up guide)
  const CLASS_GOOD = { Gearfang: ['tongue_playful', 'happy'], Mosskeeper: ['calm', 'nuzzle_ready'], Orbitron: ['neutral', 'surprised'], Starbloom: ['tongue_playful', 'giggle'], Voidrunner: ['calm', 'neutral'], Wildheart: ['proud', 'happy'] };
  const WANTS = {
    pleading: ['🍴 Feed', 'feed'], drowsy: ['🌙 Rest', 'rest'], sleepy: ['🌙 Let it sleep', null], sulky: ['💗 Gentle cuddles or its favourite food', 'bond'],
    annoyed: ['💗 Be gentle', 'bond'], clingy: ['🪟 Visit the glass', 'glass'], confused: ['🧼 Clean up', 'clean'], scared: ['💗 Comfort it', 'bond'],
    tongue_playful: ['🎮 Play a game', 'play'], neutral: ['💗 A cuddle', 'bond'], calm: ['🪟 Quiet time at the glass', 'glass'],
  };

  const E = () => {
    const S = CP.S(); if (!S) return null;
    S.emo = S.emo || { v: 0.3, a: 0.3, aff: 0.4, sulk: 0, proud: 0, cling: 0, mom: null, log: [], day: '' };
    if (S.emo.day !== CP.today()) { S.emo.day = CP.today(); S.emo.log = []; }
    return S.emo;
  };
  const now = () => Date.now();

  /** Push the feelings; optionally show a momentary expression for a few seconds. */
  function nudge(dv, da, daff, moment, ms = 3500, why = '') {
    const e = E(); if (!e) return;
    e.v = c(e.v + dv); e.a = c(e.a + da, 0, 1); e.aff = c(e.aff + daff, 0, 1);
    if (moment) e.mom = { k: moment, until: now() + ms, why };
    refresh(why);
  }

  /** Where the stats alone would put it; feelings drift toward this every tick. */
  function baseline() {
    const S = CP.S();
    const v = ((S.happy - 50) / 50) * 0.6 + ((S.health - 50) / 50) * 0.2 + ((S.energy - 40) / 60) * 0.2 - (S.mess || 0) * 0.08;
    const a = c(0.25 + (S.energy - 50) / 200 + ((S.rest || 50) - 50) / 250, 0, 1);
    return { v: c(v), a, aff: c((S.bond || 0) / 100, 0, 1) };
  }

  /** The expression right now, and why. */
  function current() {
    const S = CP.S(), e = E(); if (!S || !e) return { k: 'neutral', why: '' };
    const t = now(), build = (() => { try { return A().buildName ? A().buildName() : ''; } catch (x) { return ''; } })();
    if (S.stage === 'egg') return { k: 'calm', why: 'Still an egg' };
    if (S.asleep) return { k: e.aff > 0.6 ? 'calm' : 'sleepy', why: 'Sleeping' };
    if (e.mom && t < e.mom.until) return { k: e.mom.k, why: e.mom.why || EXP[e.mom.k][3] };
    if (e.sulk > t) return { k: t - (e.sulkAt || 0) < 6000 ? 'annoyed' : 'sulky', why: e.sulkWhy || 'Upset with you' };
    if (S.energy < 28) return { k: 'pleading', why: 'Hungry' };
    if ((S.rest || 50) < 22) return { k: 'drowsy', why: 'Tired' };
    if ((S.mess || 0) >= 3) return { k: 'confused', why: 'Its corner is messy' };
    if (S.health < 25) return { k: 'scared', why: 'Not feeling well' };
    if (e.cling > t) return { k: 'clingy', why: 'Missed you' };
    if (e.proud > t) return { k: 'proud', why: e.proudWhy || 'Did something great' };
    if (e.v > 0.62 && e.aff > 0.6) return { k: 'purr', why: 'Loved and content' };
    if (e.v > 0.42) return { k: e.a > 0.55 ? (CLASS_GOOD[build] || CLASS_GOOD.Mosskeeper)[0] : (CLASS_GOOD[build] || CLASS_GOOD.Mosskeeper)[1], why: 'In a good mood' };
    if (e.v > 0.15) return { k: e.aff > 0.55 ? 'nuzzle_ready' : 'happy', why: 'Feeling good' };
    if (e.v > -0.2) return { k: 'neutral', why: 'Watching the world' };
    return { k: 'sulky', why: 'Not happy lately' };
  }

  let last = '';
  function refresh(why) {
    const m = current(), e = E(); if (!e) return m;
    if (m.k !== last) {
      last = m.k;
      e.log.push({ t: now(), k: m.k, why: m.why || why || '' }); e.log = e.log.slice(-14);
      try { A().faceFx && A().faceFx(EXP[m.k][2], 2600); } catch (x) { /* visor optional */ }
      paintChip(); paintPanel();
      CP.emit('emotion', m);
    }
    return m;
  }

  /* ---------- the mood chip on the room and the mood card ---------- */
  const portrait = (k, size, round = true) => {
    const has = CP.assets && CP.assets.has('expr');
    const f = (() => { try { return A().sprFilter(); } catch (x) { return ''; } })();
    return has ? `<img src="/petz/x/art/expr/${k}${CP.assets.tier === 'lo' ? '@lo' : ''}.webp" alt="" style="width:${size}px;height:${size}px;object-fit:cover;object-position:40% 45%;border-radius:${round ? '50%' : '14px'};filter:${f};vertical-align:middle">` : EXP[k][1];
  };
  function paintChip() {
    const el = document.getElementById('moodChip'), S = CP.S(); if (!el || !S || S.stage === 'egg') return;
    const m = current(), d = EXP[m.k];
    const html = `<span style="display:inline-flex;align-items:center;gap:5px">${portrait(m.k, 22)}<span>${d[0]}</span></span>`;
    const key = m.k + (CP.assets && CP.assets.has('expr') ? '+art' : '');
    if (el.dataset.k !== key) { el.dataset.k = key; el.innerHTML = html; el.style.cursor = 'pointer'; el.style.pointerEvents = 'auto'; el.onclick = card; }
  }
  function card() {
    const a = A(), S = CP.S(), m = current(), d = EXP[m.k], e = E(), w = WANTS[m.k];
    const fx = [];
    if (['happy', 'purr', 'proud', 'tongue_playful', 'giggle', 'calm', 'nuzzle_ready'].includes(m.k)) fx.push('🎮 +10% coins from games while it feels this good');
    if (e.sulk > now()) fx.push(`💔 Half bond from touch for ${Math.ceil((e.sulk - now()) / 1000)}s, or until you make it up`);
    if (e.cling > now()) fx.push('🪟 Visit the glass soon for a reunion bonus');
    if (e.proud > now()) fx.push('🏆 Proud: it will brag about it');
    const bar = (lbl, v, col) => `<div style="display:flex;align-items:center;gap:8px;font-size:13px;margin:3px 0"><span style="width:76px;opacity:.7">${lbl}</span><div style="flex:1;height:6px;border-radius:6px;background:#fff2;overflow:hidden"><i style="display:block;height:100%;width:${Math.round(v * 100)}%;background:${col}"></i></div></div>`;
    a.modal(`<div style="text-align:center">${portrait(m.k, 150, false)}</div>
      <h3 style="text-align:center;margin:8px 0 2px">${CP.esc(S.name)} feels ${d[0].toLowerCase()} ${d[1]}</h3>
      <p class="muted" style="text-align:center;margin:0 0 8px">${CP.esc(m.why || d[3])}</p>
      ${bar('Joy', (e.v + 1) / 2, 'linear-gradient(90deg,#ff4f7a,#8dff4a)')}${bar('Energy', e.a, 'linear-gradient(90deg,#5ff4ff,#ffd23f)')}${bar('Bond', e.aff, 'linear-gradient(90deg,#b06bff,#ff5fb8)')}
      ${fx.length ? `<div style="margin:8px 0;font-size:13px;line-height:1.5">${fx.join('<br>')}</div>` : ''}
      ${e.log.length > 1 ? `<div style="margin-top:6px"><small class="muted">Today</small><div style="display:flex;gap:4px;overflow-x:auto;padding:4px 0">${e.log.slice(-10).map(x => `<span title="${EXP[x.k][0]}">${portrait(x.k, 34)}</span>`).join('')}</div></div>` : ''}
      <div class="btns">${w && w[1] ? `<button class="btn" id="emoDo">${w[0]}</button>` : ''}<button class="btn gh" data-x>Close</button></div>`);
    const b = document.getElementById('emoDo');
    if (b) b.onclick = () => { a.closeM(); const k = w[1]; if (k === 'glass') CP.glass && CP.glass.show('button'); else if (k === 'play') a.go('play'); else setTimeout(() => { const q = document.querySelector(`#quick [data-q="${k}"]`); q && q.click(); }, 150); };
  }

  /* ---------- home panel: "How {name} feels" sits at the top of the hub ---------- */
  function paintPanel() {
    const S = CP.S(), hub = document.getElementById('hub'); if (!S || !hub) return;
    let box = document.getElementById('emoPanel');
    if (S.stage === 'egg') { if (box) box.remove(); return; }
    if (!box) { box = document.createElement('div'); box.id = 'emoPanel'; hub.before(box); }
    const m = current(), d = EXP[m.k], e = E(), w = WANTS[m.k];
    const tags = [];
    if (coinMult() > 1) tags.push('🎮 +10% game coins');
    if (e.sulk > now()) tags.push('💔 sulking');
    if (e.cling > now()) tags.push('🪟 wants a visit');
    if (e.proud > now()) tags.push('🏆 proud');
    const html = `<div class="sec"><h2>How ${CP.esc(S.name)} feels<span class="stripes"></span></h2><small>Tap for details</small></div>
      <div class="panel" id="emoCard" style="display:flex;gap:12px;align-items:center;cursor:pointer">${portrait(m.k, 64, false)}
        <div style="flex:1;min-width:0"><b class="h" style="font-size:19px">${d[0]} ${d[1]}</b><div class="hmute">${CP.esc(m.why || d[3])}</div>
        ${tags.length ? `<div style="margin-top:4px;font-size:12px;display:flex;flex-wrap:wrap;gap:4px">${tags.map(t => `<span style="padding:2px 7px;border-radius:9px;background:#ffffff14">${t}</span>`).join('')}</div>` : ''}</div>
        ${w && w[1] ? `<button class="hgo" id="emoGo">${w[0].split(' ')[0]}</button>` : ''}</div>`;
    if (box._h === html) return;
    box._h = html; box.innerHTML = html;
    box.querySelector('#emoCard').onclick = ev => { if (ev.target.id !== 'emoGo') card(); };
    const g = box.querySelector('#emoGo');
    if (g) g.onclick = () => { const k = w[1]; if (k === 'glass') CP.glass && CP.glass.show('button'); else if (k === 'play') A().go('play'); else { window.scrollTo({ top: 0, behavior: 'smooth' }); setTimeout(() => { const q = document.querySelector(`#quick [data-q="${k}"]`); q && q.click(); }, 250); } };
  }

  /* ---------- what moves the feelings ---------- */
  CP.on('bond', ev => {
    const e = E(); if (!e) return; const n = (ev && ev.n) || 1;
    if (e.sulk > now()) { e.sulk -= 6000 * n; if (e.sulk <= now()) { e.sulk = 0; nudge(0.15, 0, 0.05, 'nuzzle_ready', 3000, 'Forgave you'); A().say('…okay, I forgive you 💗', 2200); return; } }
    nudge(0.03 * n, 0.01, 0.025 * n);
  });
  CP.on('glass:gesture', g => {
    if (!g) return;
    if (g.type === 'rough') return upset('Startled by a rough swipe');
    if (g.type === 'tap' && g.zone === 'nose') nudge(0.04, 0.1, 0.01, Math.random() < 0.3 ? 'sneeze_windup' : 'giggle', 1600);
    if (g.type === 'stroke' && (g.zone === 'head' || g.zone === 'cheek')) nudge(0.04, -0.04, 0.03, 'purr', 2500, 'Loves the strokes');
    if (g.type === 'circle' && g.zone === 'chin') nudge(0.04, -0.05, 0.02, 'calm', 2500, 'Chin rubs');
    if (g.type === 'hold' && g.zone === 'chest') nudge(0.03, -0.1, 0.04, 'calm', 3000, 'Your warm hand');
    if (g.type === 'spread') nudge(0, 0.1, 0, 'surprised', 1200);
  });
  function upset(why) {
    const e = E(); if (!e) return;
    e.sulk = now() + CP.cfg('emotion_sulk_seconds', 45) * 1000; e.sulkAt = now(); e.sulkWhy = why;
    nudge(-0.25, 0.3, -0.05, 'startled', 1400, why);
  }
  CP.on('food', f => {
    if (!f) return;
    if (f.fav) { const e = E(); if (e.sulk > now()) { e.sulk = 0; A().say('My favourite… you are forgiven 💗', 2400); } nudge(0.3, 0.1, 0.06, 'purr', 4000, 'Ate its favourite food'); }
    else if (f.dis) nudge(-0.15, 0, -0.02, 'sulky', 3500, 'Did not like that food');
    else if (f.bored) nudge(-0.05, -0.05, 0, 'neutral', 2500, 'Same food again');
    else nudge(0.12, 0.05, 0.02, 'happy', 2500, 'Good meal');
  });
  CP.on('game', g => {
    if (!g) return; const e = E();
    if (g.quit) return;
    if (g.nb || g.stars >= 2) { e.proud = now() + CP.cfg('emotion_proud_minutes', 10) * 60e3; e.proudWhy = g.nb ? `New best in ${g.name}!` : `${g.stars} stars in ${g.name}`; nudge(0.2, 0.2, 0.02, 'proud', 4000, e.proudWhy); }
    else if (g.stars === 0) nudge(-0.08, 0.05, 0, 'confused', 3000, `Struggled in ${g.name}`);
    else nudge(0.08, 0.1, 0.01);
  });
  CP.on('quake', () => nudge(-0.1, 0.4, 0, 'scared', 2500, 'The room shook!'));
  CP.on('discover', () => nudge(0.1, 0.2, 0, 'surprised', 2500, 'Found a secret'));
  CP.on('cloud:herd', () => nudge(0.05, -0.1, 0.02));
  CP.on('lang:say', () => { /* chatter already reflects mood */ });

  // time away: coming back after a long gap makes it clingy (and it runs to the glass more)
  let hiddenAt = 0, clingVisitAt = 0;
  document.addEventListener('visibilitychange', () => {
    const e = E(); if (!e) return;
    if (document.hidden) { hiddenAt = now(); return; }
    const away = hiddenAt ? (now() - hiddenAt) / 60e3 : 0;
    if (away > CP.cfg('emotion_cling_minutes', 90)) { e.cling = now() + 10 * 60e3; nudge(-0.05, 0.2, -0.05, 'clingy', 5000, 'Missed you'); clingVisitAt = now(); }
  });
  CP.on('enter:glass', ev => {
    const e = E(); if (!e) return;
    if (e.cling > now() || (clingVisitAt && now() - clingVisitAt < 30000)) {
      e.cling = 0; clingVisitAt = 0; const S = CP.S(); S.bond = A().clamp(S.bond + 3);
      nudge(0.25, 0.2, 0.08, 'happy', 3000, 'Reunited!'); CP.emit('emotion:reunion', {});
    }
    void ev;
  });

  /* ---------- gameplay effects other modules read ---------- */
  const coinMult = () => (CP.cfg('emotion_effects', true) && ['happy', 'purr', 'proud', 'tongue_playful', 'giggle', 'calm', 'nuzzle_ready'].includes(current().k) ? 1.1 : 1);
  const bondMult = () => (E() && E().sulk > now() ? 0.5 : 1);

  /* ---------- drift + periodic refresh ---------- */
  setInterval(() => {
    const e = E(), S = CP.S(); if (!e || !S || S.stage === 'egg') return;
    const b = baseline(), k = 0.06;
    e.v += (b.v - e.v) * k; e.a += (b.a - e.a) * k; e.aff += (b.aff - e.aff) * k;
    if (S.asleep) e.a += (0.05 - e.a) * 0.2;
    // rare little moments: a sneeze, a curious look
    if (CP.idle() && Math.random() < 0.012) nudge(0, 0.05, 0, Math.random() < 0.5 ? 'sneeze_windup' : 'confused', 1800);
    if (e.mom && e.mom.k === 'sneeze_windup' && now() > e.mom.until - 200) { e.mom = { k: 'sneeze', until: now() + 1200 }; try { A().tone(300, 0.15, 0, 'sawtooth', 0.03); } catch (x) { /* muted */ } }
    refresh(); paintPanel();
  }, 2000);

  CP.emotion = { paint: () => { paintChip(); }, current, nudge, upset, card, coinMult, bondMult, EXP, portrait, state: E };
  CP.on('assets:manifest', () => { paintChip(); paintPanel(); });
  CP.on('start', () => { E(); refresh(); setTimeout(() => { last = ''; refresh(); paintChip(); paintPanel(); }, 400); });
})();
