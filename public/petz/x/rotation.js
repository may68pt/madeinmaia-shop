/* CyberPet game rotation, run from the back office.
   Config: games_open (how many rotating games open per day), games_disabled (hidden everywhere),
   games_forced (always open), games_hot (game of the day). Same seed per day for every player. */
(function () {
  'use strict';
  const CP = window.CP;
  const hidden = {};
  const seeded = seed => () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const list = v => (Array.isArray(v) ? v.map(String) : []);

  CP.rotation = (day, base) => {
    const a = CP.app(); if (!a) return null;
    const off = list(CP.cfg('games_disabled', [])), forced = list(CP.cfg('games_forced', [])), hot = String(CP.cfg('games_hot', '') || '');
    const open = Math.max(1, Number(CP.cfg('games_open', 4)) || 4);
    const pool = a.ROT_POOL.filter(g => !off.includes(g) && a.GAMES2[g] !== undefined);
    if (!pool.length) return { on: forced, feat: forced[0] || '' };
    const r = seeded(day * 7919 + 17), sh = arr => { arr = [...arr]; for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
    const train = sh(a.TRAIN_POOL.filter(g => pool.includes(g)))[0];
    const rest = sh(pool.filter(g => g !== train));
    const on = [...new Set([...(train ? [train] : []), ...rest].slice(0, open).concat(forced.filter(g => a.GAMES2[g] !== undefined)))];
    const feat = hot && on.includes(hot) ? hot : on[Math.floor(r() * on.length)];
    void base; return { on, feat };
  };

  /** Hide turned-off games from the Play list (and bring them back when turned on again). */
  function applyHidden() {
    const a = CP.app(); if (!a) return;
    const off = list(CP.cfg('games_disabled', []));
    for (const id of Object.keys(hidden)) if (!off.includes(id)) { a.GAMES2[id] = hidden[id]; delete hidden[id]; }
    for (const id of off) if (a.GAMES2[id] && id !== 'orbit') { hidden[id] = a.GAMES2[id]; delete a.GAMES2[id]; }
    try { a.renderPlay(); } catch (e) { /* play not rendered yet */ }
  }
  CP.on('config', applyHidden);
  CP.on('start', () => setTimeout(applyHidden, 50));
})();
