/* CyberPet sprite sets: load art only when a scene needs it.
   - Sets are listed in /petz/x/sets.json, plus any extra sets pushed from the back office (config "asset_sets").
   - Phones are sorted into a "lo" or "hi" tier once; sets that ship @lo files use them on the lo tier.
   - An LRU keeps the last few sets decoded and drops the rest, so memory stays flat on long sessions. */
(function () {
  'use strict';
  const CP = window.CP;
  const BASE = '/petz/x/';
  const KEEP = 3; // sets kept decoded besides pinned ones
  let manifest = { sets: {} };
  const loaded = new Map(); // set -> { imgs: {name: Image}, used: ms }
  const pending = new Map();
  const pinned = new Set(['core']);

  const tier = (() => {
    try {
      const saved = localStorage.getItem('cyberpet.tier'); if (saved) return saved;
      const mem = navigator.deviceMemory || 4, cores = navigator.hardwareConcurrency || 4;
      const save = navigator.connection && navigator.connection.saveData;
      const t = save || mem <= 3 || cores <= 4 ? 'lo' : 'hi';
      localStorage.setItem('cyberpet.tier', t); return t;
    } catch (e) { return 'hi'; }
  })();

  const merged = () => {
    const extra = CP.cfg('asset_sets', {}) || {};
    return Object.assign({}, manifest.sets, typeof extra === 'object' ? extra : {});
  };
  const urlOf = (set, def, file) => {
    if (/^(https?:)?\//.test(file)) return file;
    const dir = def.dir || (BASE + 'art/' + set + '/');
    return dir + (tier === 'lo' && def.lo ? file.replace(/(\.\w+)$/, '@lo$1') : file);
  };
  const nameOf = f => f.split('/').pop().replace(/(@lo)?\.\w+$/, '');

  function evict() {
    const free = [...loaded.entries()].filter(([k]) => !pinned.has(k)).sort((a, b) => a[1].used - b[1].used);
    while (free.length > KEEP) {
      const [k, v] = free.shift();
      Object.values(v.imgs).forEach(im => { im.src = ''; });
      loaded.delete(k);
    }
  }

  function decode(src) {
    return new Promise(res => {
      const im = new Image(); im.decoding = 'async';
      im.onload = () => res(im); im.onerror = () => res(null); im.src = src;
    });
  }

  const assets = CP.assets = {
    tier,
    has: set => !!(merged()[set] && (merged()[set].files || []).length),
    list: () => merged(),
    /** Loads a set; resolves to {name: Image}. Missing sets or files resolve to an empty map, never reject. */
    load(set) {
      const hit = loaded.get(set); if (hit) { hit.used = performance.now(); return Promise.resolve(hit.imgs); }
      if (pending.has(set)) return pending.get(set);
      const def = merged()[set];
      const p = (async () => {
        const imgs = {};
        if (def && Array.isArray(def.files)) {
          const got = await Promise.all(def.files.map(f => decode(urlOf(set, def, f))));
          def.files.forEach((f, i) => { if (got[i]) imgs[nameOf(f)] = got[i]; });
          if (def.json) { try { imgs.__json = await (await fetch(urlOf(set, def, def.json))).json(); } catch (e) { /* optional */ } }
        }
        loaded.set(set, { imgs, used: performance.now() }); pending.delete(set); evict();
        CP.emit('asset:loaded', set); return imgs;
      })();
      pending.set(set, p); return p;
    },
    /** Sync access for render loops; null until loaded. */
    img(set, name) { const s = loaded.get(set); if (!s) return null; s.used = performance.now(); return s.imgs[name] || null; },
    json(set) { const s = loaded.get(set); return s ? s.imgs.__json || null : null; },
    /** Warm a set while the phone is idle (e.g. entering the room preloads the glass set). */
    prefetch(set) { const go = () => assets.load(set); (window.requestIdleCallback || (f => setTimeout(f, 800)))(go); },
    pin(set) { pinned.add(set); },
    stats: () => ({ tier, loaded: [...loaded.keys()], pending: [...pending.keys()] }),
  };

  fetch(BASE + 'sets.json', { cache: 'no-store' }).then(r => r.ok ? r.json() : { sets: {} }).then(j => { manifest = j && j.sets ? j : { sets: {} }; CP.emit('assets:manifest'); }).catch(() => {});
  // likely-next preloads
  CP.on('start', () => { assets.prefetch('glass'); });
  CP.on('enter:glass', () => assets.load('glass'));
  CP.on('sleep', () => assets.prefetch('clouds'));
})();
