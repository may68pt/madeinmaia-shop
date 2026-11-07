/* CyberPet extension core.
   Loads after the main app, talks to it only through window.__cp, and gives every module:
   live config from the back office, an event bus, a side-button rail and a CSS helper. */
(function () {
  'use strict';
  const CP = window.CP = window.CP || {};
  const listeners = {};
  CP.on = (ev, fn) => { (listeners[ev] = listeners[ev] || []).push(fn); return () => { listeners[ev] = listeners[ev].filter(f => f !== fn); }; };
  CP.emit = (ev, data) => { (listeners[ev] || []).forEach(fn => { try { fn(data); } catch (e) { console.warn('[cp]', ev, e); } }); };

  /* ---------- live config (Block 3) ---------- */
  CP.config = {};
  CP.cfg = (key, fallback) => (CP.config && key in CP.config ? CP.config[key] : fallback);
  CP.loadConfig = async () => {
    try {
      const r = await fetch('/api/petz/config', { cache: 'no-store' });
      if (r.ok) { const j = await r.json(); if (j && j.ok) { CP.config = j.config || {}; CP.emit('config', CP.config); } }
    } catch (e) { /* offline: keep defaults */ }
  };

  /* ---------- helpers ---------- */
  CP.app = () => window.__cp;
  CP.S = () => window.__cp && window.__cp.S;
  CP.css = (id, text) => { if (document.getElementById(id)) return; const st = document.createElement('style'); st.id = id; st.textContent = text; document.head.appendChild(st); };
  CP.esc = t => String(t ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  CP.onHome = () => { const h = document.getElementById('p-home'); const ov = document.getElementById('ov'); return !!(h && h.classList.contains('on') && !(ov && ov.classList.contains('on')) && !document.getElementById('game')?.classList.contains('on')); };
  CP.idle = () => { const a = CP.app(), S = CP.S(); return !!(a && S && S.stage !== 'egg' && !S.gone && !S.asleep && !a.busy && CP.onHome()); };
  CP.stage = () => document.getElementById('stage');
  CP.vib = ms => { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) { /* no haptics */ } };
  CP.today = () => new Date().toISOString().slice(0, 10);
  /** Per-day counter kept in the save: CP.daily('glass') -> how many times today. */
  CP.daily = (key, add = 0) => {
    const S = CP.S(); if (!S) return 0;
    S.cpDaily = S.cpDaily && S.cpDaily.d === CP.today() ? S.cpDaily : { d: CP.today() };
    S.cpDaily[key] = (S.cpDaily[key] || 0) + add; return S.cpDaily[key];
  };

  /* side-button rail next to Social / Room / Share */
  CP.sideButton = (id, emoji, label, onClick) => {
    const ref = document.getElementById('sRoom'); if (!ref || document.getElementById(id)) return null;
    const b = document.createElement('button'); b.id = id; b.setAttribute('aria-label', label); b.style.fontSize = '20px'; b.textContent = emoji;
    b.onclick = e => { e.stopPropagation(); try { CP.app().SFX.tap(); } catch (x) { /* sound optional */ } onClick(); };
    ref.parentNode.insertBefore(b, ref.nextSibling); return b;
  };

  CP.ready = new Promise(res => {
    const go = () => res(window.__cp);
    if (window.__cp) go(); else document.addEventListener('cp:ready', go, { once: true });
  });
  CP.ready.then(async () => {
    await CP.loadConfig();
    setInterval(() => { if (!document.hidden) CP.loadConfig(); }, 5 * 60e3);
    CP.emit('start');
  });
})();
