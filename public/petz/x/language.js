/* CyberPet language: the pet starts with sounds and body language and slowly discovers words.
   Stages: 0 sounds & postures · 1 echo · 2 proto-words · 3 first words · 4 phrases · 5 its own voice.
   It learns whatever language you use with it: teach words by typing them, confirm its attempts,
   and the words you use most become its first real words. Your name is a milestone.
   Language XP comes from good care (bond, petting, glass, teaching) and is capped per day so it can't be rushed. */
(function () {
  'use strict';
  const CP = window.CP;
  const A = () => CP.app();
  const STAGES = ['Sounds', 'Echo', 'Proto-words', 'First words', 'Phrases', 'Its own voice'];
  const PROTO = { food: ['mrr-mm', 'nom-nom', 'mmh'], play: ['pa-pa', 'pi-pi!', 'brrp'], sleep: ['zz-zu', 'hmmn', 'fuu'], love: ['mrrrow', 'pur-pur', 'nyuu'], clean: ['pft', 'iik'], hi: ['prrt!', 'mew?', 'eep'] };
  const GLYPH = { food: '◐', play: '✦', sleep: '☾', love: '♡', clean: '✧', hi: '◌' };
  const SYL = ['mr', 'pi', 'nya', 'zu', 'ru', 'mi', 'pa', 'ku', 'fu'];

  const L = () => {
    const S = CP.S(); if (!S) return null;
    if (!S.lang) S.lang = { xp: 0, stage: 0, vocab: {}, owner: '', said: {}, day: '', dayXp: 0 };
    return S.lang;
  };
  const stageXp = () => { const s = CP.cfg('lang_stage_xp', [0, 120, 400, 1100, 2400, 4200]); return Array.isArray(s) && s.length >= 6 ? s : [0, 120, 400, 1100, 2400, 4200]; };
  function stageOf(xp) { const t = stageXp(); let s = 0; for (let i = 0; i < 6; i++) if (xp >= t[i]) s = i; return s; }

  /** Adds language XP from care. Capped per day; announces new stages. */
  function gain(n, why) {
    const l = L(); if (!l || CP.S().stage === 'egg') return;
    const today = CP.today(); if (l.day !== today) { l.day = today; l.dayXp = 0; decay(l); }
    const cap = CP.cfg('lang_xp_daily_cap', 60), add = Math.max(0, Math.min(n, cap - l.dayXp)); if (!add) return;
    l.dayXp += add; l.xp += add;
    const s = stageOf(l.xp);
    if (s > l.stage) {
      l.stage = s;
      const a = A(); a.toast(`🗣️ New language stage: ${STAGES[s]}!`); a.SFX.level();
      a.addLog('🗣️', 'Language: ' + STAGES[s], s === 3 ? 'It is ready for its first real word.' : s === 5 ? 'It speaks with its own voice now.' : 'It is finding new ways to talk.');
      setTimeout(() => speak(true), 1500);
    }
    CP.emit('lang:xp', { add, why });
  }
  function decay(l) {
    const days = CP.cfg('lang_decay_days', 10) * 864e5, now = Date.now();
    for (const w of Object.keys(l.vocab)) { const v = l.vocab[w]; if (now - v.t > days) { v.s *= 0.9; if (v.s < 0.05) delete l.vocab[w]; } }
  }

  /* ---------- voice: synth chirps for sounds, the browser's speech voice (high and fast) for real words ---------- */
  function chirp(pattern, mood) {
    const a = A(), S = CP.S(); if (!S || S.mute) return;
    const vi = Math.max(0, Object.keys(a.VAR).indexOf(S.variant)), base = 620 + vi * 45 - L().stage * 25;
    const n = Math.max(1, Math.min(6, pattern.length || 3));
    for (let i = 0; i < n; i++) {
      const up = mood === 'sad' ? -1 : mood === 'ask' && i === n - 1 ? 1.5 : Math.random() - 0.3;
      a.tone(base * (1 + up * 0.25) * (1 + (Math.random() - 0.5) * 0.1), 0.07 + Math.random() * 0.05, i * 0.11, i % 2 ? 'sine' : 'triangle', 0.045);
    }
  }
  function sayWords(text) {
    const S = CP.S(); if (!S || S.mute || !('speechSynthesis' in window)) { chirp(text, 'happy'); return; }
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = navigator.language || 'pt-PT'; u.pitch = 1.9; u.rate = 1.15 + Math.random() * 0.2; u.volume = 0.8;
      speechSynthesis.cancel(); speechSynthesis.speak(u);
    } catch (e) { chirp(text); }
  }

  /** How the pet says a word at its current strength: weak words come out as pet syllables. */
  function garble(word, s) {
    const l = L();
    if (l.stage <= 2) { const first = word.replace(/[^\p{L}]/gu, '').slice(0, 2).toLowerCase() || A().pick(SYL); return `${first}-${first}${s > 0.3 ? '?' : ''}`; }
    return [...word].map(ch => (/\p{L}/u.test(ch) && Math.random() > Math.min(1, s + 0.15) ? A().pick(SYL).slice(0, 1) : ch)).join('');
  }

  /* ---------- what it says by itself ---------- */
  function need() {
    const S = CP.S();
    if (S.energy < 35) return 'food'; if (S.rest < 30) return 'sleep'; if (S.mess >= 2) return 'clean';
    if (S.happy < 45) return 'play'; if (S.bond > 70) return 'love'; return 'hi';
  }
  const best = (min = 0.3) => Object.entries(L().vocab).filter(([, v]) => v.s >= min).sort((a, b) => b[1].s * Math.log(2 + b[1].n) - a[1].s * Math.log(2 + a[1].n));
  function speak(force) {
    const a = A(), S = CP.S(), l = L(); if (!S || !l || S.stage === 'egg' || S.gone) return;
    if (!force && (!CP.idle() || Math.random() > CP.cfg('lang_chatter', 0.25))) return;
    const nd = need(), mood = nd === 'love' || nd === 'hi' ? 'happy' : nd === 'play' ? 'ask' : 'sad';
    const words = best();
    let text = '', spoken = false;
    switch (l.stage) {
      case 0: {
        text = { food: '…grrmbl 🍴', sleep: '*yaaawn* 💤', clean: '*sniff sniff*', play: '!? ✦', love: '♡ prrr', hi: '♪' }[nd];
        try { a.sprPose({ food: 'beg', sleep: 'yawn', clean: 'curious', play: 'happy', love: 'inlove', hi: 'curious' }[nd], 1300); } catch (e) { /* pose optional */ }
        break;
      }
      case 1: text = (GLYPH[nd] + ' ').repeat(2) + a.pick(PROTO[nd]).split('-')[0] + '… ' + a.pick(PROTO[nd]).split('-')[0]; break;
      case 2: { const w = words[0]; text = (w && Math.random() < 0.5 ? garble(w[0], w[1].s) : a.pick(PROTO[nd])) + ' ' + GLYPH[nd]; break; }
      case 3: {
        const w = l.owner && l.vocab[l.owner.toLowerCase()] && Math.random() < 0.3 ? [l.owner.toLowerCase(), l.vocab[l.owner.toLowerCase()]] : words[0];
        if (w) { text = garble(w[0], w[1].s) + '!'; spoken = true; w[1].n++; w[1].t = Date.now(); milestone(w[0]); }
        else text = a.pick(PROTO[nd]);
        break;
      }
      default: {
        const pool = words.slice(0, 6).map(x => x[0]);
        const w1 = pool.length ? a.pick(pool) : a.pick(PROTO[nd]), owner = l.owner || '';
        const room = S.room && S.room.items.length ? (a.RI[a.pick(S.room.items).id] || {}).n : '';
        const lines = l.stage === 4
          ? [`${w1}?`, `${owner ? owner + '! ' : ''}${w1}!`, `more ${w1}`, `${w1} ${w1}!`]
          : [`${owner ? owner + ', ' : ''}${w1}… ♡`, room ? `${room}! ${w1}?` : `${w1} now?`, `I ${nd === 'love' ? '♡' : '…'} ${owner || w1}`, `${w1}, ${pool[1] || w1}!`];
        text = a.pick(lines); spoken = true; if (owner) milestone(owner.toLowerCase());
      }
    }
    a.say(text, 2600);
    if (spoken) sayWords(text.replace(/[^\p{L}\p{N}\s,!?']/gu, '')); else chirp(text, mood);
    CP.emit('lang:say', { text, stage: l.stage });
  }
  function milestone(word) {
    const l = L(), a = A(); if (l.said[word]) return; l.said[word] = Date.now();
    if (l.owner && word === l.owner.toLowerCase()) { a.toast(`🎉 ${CP.S().name} said your name!`); a.SFX.yay(); a.addLog('🎉', 'It said your name', `${CP.S().name} said “${l.owner}” for the first time.`); }
    else if (Object.keys(l.said).length === 1) { a.toast(`🎉 First word: “${word}”`); a.SFX.yay(); a.addLog('🗣️', 'First word', `“${word}”`); }
  }

  /* ---------- teaching ---------- */
  function teach(word, isName) {
    const l = L(), a = A(), w = String(word || '').trim().slice(0, 24); if (!w) return;
    const k = w.toLowerCase(); if (isName) l.owner = w;
    const v = l.vocab[k] = l.vocab[k] || { s: 0, n: 0, t: Date.now() }; v.t = Date.now();
    const attempt = l.stage === 0 ? a.pick(['mew?', '…?', 'prrt?']) : garble(w, v.s);
    a.say(attempt, 2200); if (l.stage >= 3 && v.s > 0.3) sayWords(attempt); else chirp(attempt, 'ask');
    return { k, attempt };
  }
  function openTeach() {
    const a = A(), S = CP.S(), l = L(); if (!S || S.stage === 'egg') { a.toast('Hatch your egg first'); return; }
    const t = stageXp(), next = t[l.stage + 1], pct = next ? Math.round(((l.xp - t[l.stage]) / (next - t[l.stage])) * 100) : 100;
    const words = Object.entries(l.vocab).sort((x, y) => y[1].s - x[1].s).slice(0, 24);
    const picks = ['olá', 'comer', 'brincar', 'dormir', 'amor', 'hello', 'food', 'play', 'sleep', 'love'];
    a.modal(`<h3>🗣️ Talk with ${CP.esc(S.name)}</h3>
      <p class="muted" style="margin:2px 0 8px">Stage ${l.stage + 1}/6 · <b>${STAGES[l.stage]}</b>${next ? ` · ${pct}% to ${STAGES[l.stage + 1]}` : ''}</p>
      <div style="height:6px;border-radius:6px;background:#fff2;overflow:hidden;margin-bottom:10px"><i style="display:block;height:100%;width:${pct}%;background:linear-gradient(90deg,#ff5fb8,#5ff4ff)"></i></div>
      <p class="muted" style="margin:0 0 8px">${l.stage < 2 ? 'It only makes sounds for now, but it is listening. Teach it words anyway: they stick for later.' : 'Type a word in any language. Confirm when it gets close.'}</p>
      <div style="display:flex;gap:6px"><input id="cpWord" maxlength="24" placeholder="A word…" style="flex:1;padding:10px;border-radius:10px;border:1px solid #fff3;background:#0006;color:#fff;font-size:16px"><button class="btn" id="cpTeach">Teach</button></div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin:8px 0">${picks.map(p => `<button class="btn gh" data-pick="${p}" style="padding:4px 10px;font-size:13px">${p}</button>`).join('')}</div>
      <button class="btn gh" id="cpName" style="width:100%">${l.owner ? `Your name: <b>${CP.esc(l.owner)}</b> · teach again` : 'Teach it your name'}</button>
      <div id="cpTry" style="display:none;margin:10px 0;text-align:center"><div class="h" id="cpTryW" style="font-size:28px"></div><div class="btns"><button class="btn o" id="cpYes">That's it! ✓</button><button class="btn gh" id="cpAgain">Try again</button></div></div>
      <div style="margin-top:10px;max-height:160px;overflow:auto">${words.length ? words.map(([w, v]) => `<div style="display:flex;justify-content:space-between;font-size:14px;padding:3px 0;border-bottom:1px solid #fff1"><span>${CP.esc(w)}</span><span class="muted">${'●'.repeat(Math.ceil(v.s * 5))}${'○'.repeat(5 - Math.ceil(v.s * 5))}</span></div>`).join('') : '<p class="muted">No words yet.</p>'}</div>
      <div class="btns"><button class="btn gh" data-x>Done</button></div>`);
    let cur = null;
    const run = (word, isName) => { const r = teach(word, isName); if (!r) return; cur = r; document.getElementById('cpTry').style.display = 'block'; document.getElementById('cpTryW').textContent = '“' + r.attempt + '”'; gain(2, 'teach'); };
    document.getElementById('cpTeach').onclick = () => run(document.getElementById('cpWord').value);
    document.getElementById('cpWord').onkeydown = e => { if (e.key === 'Enter') run(e.target.value); };
    document.querySelectorAll('[data-pick]').forEach(b => b.onclick = () => run(b.dataset.pick));
    document.getElementById('cpName').onclick = () => { const n = prompt('Your name?', l.owner || ''); if (n) run(n, true); };
    document.getElementById('cpYes').onclick = () => { if (!cur) return; const v = l.vocab[cur.k]; v.s = Math.min(1, v.s + 0.25); v.n++; gain(6, 'confirm'); a.SFX.ok(); a.burst('hearts', 6); a.save(); document.getElementById('cpTry').style.display = 'none'; };
    document.getElementById('cpAgain').onclick = () => { if (!cur) return; const v = l.vocab[cur.k]; v.s = Math.min(1, v.s + 0.08); const r = teach(cur.k); document.getElementById('cpTryW').textContent = '“' + r.attempt + '”'; };
  }

  /* ---------- where language XP comes from ---------- */
  CP.on('bond', e => gain(Math.max(1, (e && e.n) || 1) * 2, 'bond'));
  CP.on('discover', () => gain(4, 'discover'));
  CP.on('cloud:herd', () => gain(2, 'dream'));
  CP.on('start', () => {
    L();
    CP.sideButton('sTalk', '💬', 'Talk and teach words', openTeach);
    const q = document.getElementById('quick');
    if (q) q.addEventListener('click', e => { if (e.target.closest('[data-q]')) gain(2, 'care'); });
    setInterval(() => speak(false), 25000);
  });
  CP.lang = { gain, speak, teach, openTeach, garble, STAGES, state: L };
})();
