// MiMBO · The Good Stuff Machine — service worker. Makes the catalogue installable as an app.
// Network first: the catalogue always shows the latest; a small offline note if the connection drops.
const CACHE = "mimbo-shell-v1";
const BASE = "/mimbo-the-good-stuff-machine/";
self.addEventListener("install", (e) => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then((c) => c.addAll([BASE + "icon-192.png", BASE + "icon-512.png"])).catch(() => {})); });
self.addEventListener("activate", (e) => { e.waitUntil(self.clients.claim()); });
self.addEventListener("fetch", (e) => {
  const r = e.request;
  if (r.method !== "GET" || r.mode !== "navigate") return;
  e.respondWith(fetch(r).catch(() => new Response(
    '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><body style="margin:0;display:grid;place-items:center;height:100vh;background:#14112b;color:#ffd23f;font:16px monospace;text-align:center"><div>MiMBO<br><br>SEM LIGAÇÃO À INTERNET<br><small style="color:#cfc9f2">Liga-te e volta a abrir.</small></div>',
    { headers: { "content-type": "text/html; charset=utf-8" } })));
});
