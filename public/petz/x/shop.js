/* CyberPet rare shop and rare items in the room.
   Items come from the back office. Bought with ⚡/💎 (checked on the server) or with euros through Stripe.
   Owned items are stored in the save (cpItems) with their art and size, so they render offline and on every device. */
(function () {
  'use strict';
  const CP = window.CP;
  const A = () => CP.app();
  const TIER = { common: '#c9c9d6', uncommon: '#8dff4a', rare: '#3fd0ff', epic: '#b06bff', legendary: '#ffd23f', exclusive: '#ff3fd8' };
  CP.css('cp-shop-css', `
    .cpShopGrid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;max-height:60vh;overflow:auto;margin-top:8px}
    .cpShopCard{border-radius:14px;padding:10px;background:#ffffff0d;border:1px solid var(--t);box-shadow:0 0 14px -6px var(--t);text-align:center}
    .cpShopCard img{height:72px;max-width:100%;object-fit:contain;filter:drop-shadow(0 0 8px var(--t))}
    .cpShopCard b{display:block;font-size:15px;margin-top:4px}.cpShopCard small{display:block;color:var(--t);font-weight:700;text-transform:uppercase;font-size:11px;letter-spacing:.06em}
    .cpShopCard .btn{width:100%;margin-top:6px;padding:6px;font-size:13px}
  `);

  /** Make every owned rare item a real room item (RI entry with its own art). */
  function register() {
    const a = A(), S = CP.S(); if (!a || !S || !S.cpItems) return 0;
    let n = 0;
    for (const [id, d] of Object.entries(S.cpItems)) {
      if (!d || a.RI[id]) continue;
      a.RI[id] = { n: d.n, h: d.h || 0.14, cat: d.cat === 'furniture' ? 'furniture' : 'decor', comfort: d.comfort || 2, src: 'rare', kind: d.kind === 'wall' ? 'wall' : undefined, img: d.img || 'r/vase.webp', rarity: d.tier, react: d.react };
      n++;
    }
    if (n) try { a.renderItems(); } catch (e) { /* room not ready */ }
    return n;
  }

  async function call(method, body, q = '') {
    const r = await fetch('/api/petz/items' + q, { method, headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined, cache: 'no-store' });
    let j = {}; try { j = await r.json(); } catch (e) { /* empty */ } j.status = r.status; return j;
  }

  /** Apply a server grant locally so the item appears now; the server already saved the same change. */
  function applyPatch(p) {
    const a = A(), S = CP.S();
    S.coins = p.coins; S.gems = p.gems;
    S.room.owned[p.def.id] = p.owned;
    S.cpItems = S.cpItems || {}; S.cpItems[p.def.id] = p.def;
    for (const k in p.def.stats || {}) if (k in S) S[k] = a.clamp(S[k] + p.def.stats[k]);
    register(); a.CLOUD.dirty = true; S.t = Date.now(); a.store.set(S); a.renderHUD();
  }

  async function open() {
    const a = A(), S = CP.S(), C = a.CLOUD;
    if (!C.id) { a.toast('Turn on cloud sync first: Journal → Settings'); return; }
    a.modal('<h3>💎 Rare shop</h3><p class="muted">Loading…</p>');
    const j = await call('GET', null, `?id=${C.id}&key=${C.key}`);
    if (!j.ok) { a.modal('<h3>💎 Rare shop</h3><p>The shop is not reachable right now.</p><div class="btns"><button class="btn gh" data-x>OK</button></div>'); return; }
    if (!j.open) { a.modal('<h3>💎 Rare shop</h3><p>The shop is closed. Come back soon!</p><div class="btns"><button class="btn gh" data-x>OK</button></div>'); return; }
    const owned = new Set(j.owned || []);
    const cards = (j.items || []).map(it => {
      const have = owned.has(it.id), out = it.left === 0;
      const price = [it.coins && `${it.coins} ⚡`, it.gems && `${it.gems} 💎`].filter(Boolean).join(' + ') || 'Free';
      return `<div class="cpShopCard" style="--t:${TIER[it.tier] || '#fff'}">${it.art ? `<img src="${CP.esc(it.art)}" alt="">` : '<div style="font-size:48px">🎁</div>'}<b>${CP.esc(it.name)}</b><small>${it.tier}${it.left !== null ? ` · ${it.left} left` : ''}</small>
        ${have ? '<button class="btn gh" disabled>Owned ✓</button>' : out ? '<button class="btn gh" disabled>Sold out</button>' :
          `<button class="btn" data-cpbuy="${it.id}">${price}</button>${it.cents ? `<button class="btn o" data-cppay="${it.id}">€${(it.cents / 100).toFixed(2)}</button>` : ''}`}</div>`;
    }).join('');
    a.modal(`<h3>💎 Rare shop</h3><p class="muted">You have ${S.coins} ⚡ · ${S.gems} 💎. Rare items glow in your room.</p><div class="cpShopGrid">${cards || '<p class="muted">Nothing on sale right now.</p>'}</div><div class="btns"><button class="btn gh" data-x>Close</button></div>`);
    document.querySelectorAll('[data-cpbuy]').forEach(b => b.onclick = async () => {
      b.disabled = true; const r = await call('POST', { action: 'buy', id: C.id, key: C.key, item: b.dataset.cpbuy });
      if (r.ok) { applyPatch(r.patch); a.SFX.yay(); a.toast(`🎁 ${r.patch.def.n} is yours! Find it in Room → Store`); open(); }
      else { a.SFX.no(); a.toast(r.error || 'Could not buy'); b.disabled = false; }
    });
    document.querySelectorAll('[data-cppay]').forEach(b => b.onclick = async () => {
      b.disabled = true; const r = await call('POST', { action: 'checkout', id: C.id, key: C.key, item: b.dataset.cppay });
      if (r.ok && r.url) location.href = r.url; else { a.toast(r.error || 'Payment unavailable'); b.disabled = false; }
    });
  }

  CP.on('start', () => {
    register();
    setInterval(register, 5000); // picks up items granted by gifts, QR codes or another device
    CP.sideButton('sShop', '💎', 'Rare shop', open);
    const paid = new URLSearchParams(location.search).get('paid');
    if (paid) {
      history.replaceState(null, '', location.pathname);
      A().toast('💳 Payment received: your item arrives in a moment');
      setTimeout(() => A().syncPull(), 2500); setTimeout(() => A().syncPull(), 8000);
    }
  });
  /* QR / t-shirt unlocks: madeinmaia.pt/petz?unlock=CODE. The code waits until cloud sync is on. */
  async function tryUnlock() {
    const a = A(); let code = ''; try { code = localStorage.getItem('cyberpet.unlock') || ''; } catch (e) { return; }
    if (!code) return;
    if (!a.CLOUD.id) { if (CP.S().stage === 'egg') return; a.toast('🔓 Hatch and sync your Cyberpet to unlock your code'); return; }
    const r = await call('POST', { action: 'qr', id: a.CLOUD.id, key: a.CLOUD.key, code });
    if (r.ok || [404, 409, 410, 403].includes(r.status)) try { localStorage.removeItem('cyberpet.unlock'); } catch (e) { /* ignore */ }
    if (r.ok) { r.patches.forEach(applyPatch); a.SFX.yay(); a.modal(`<h3>🔓 Unlocked!</h3><p><b>${CP.esc(r.release)}</b></p><p>${r.patches.map(p => CP.esc(p.def.n)).join(', ')} ${r.patches.length > 1 ? 'are' : 'is'} now in your Room → Store.</p><div class="btns"><button class="btn" data-x>Yay!</button></div>`); }
    else if (r.error) a.toast('🔓 ' + r.error);
  }
  CP.on('start', () => {
    const u = new URLSearchParams(location.search).get('unlock');
    if (u) { try { localStorage.setItem('cyberpet.unlock', u.replace(/[^A-Za-z0-9]/g, '').slice(0, 16).toUpperCase()); } catch (e) { /* private mode */ } history.replaceState(null, '', location.pathname); }
    setTimeout(tryUnlock, 3000); setInterval(tryUnlock, 60000);
  });
  CP.shop = { open, register, applyPatch, tryUnlock };
})();
