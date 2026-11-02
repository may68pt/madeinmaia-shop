/* FÆLIX service worker: the site is the source of truth.
   Pages & data: network first (fresh updates), cache only as offline fallback.
   Art (webp/png/fonts): served from cache, refreshed in the background. */
const V='faelix-sw-1';
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(['/petz/','/petz/index.html','/petz/manifest.webmanifest']).catch(()=>{})))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(n=>n.startsWith('faelix-sw-')&&n!==V).map(n=>caches.delete(n)))).then(()=>self.clients.claim()))});
self.addEventListener('message',e=>{if(e.data==='skip')self.skipWaiting()});
self.addEventListener('fetch',e=>{
  const r=e.request,u=new URL(r.url);
  if(r.method!=='GET'||u.origin!==location.origin||!u.pathname.startsWith('/petz'))return;
  const fresh=r.mode==='navigate'||/\.(json|html|webmanifest)$/.test(u.pathname)||u.pathname==='/petz'||u.pathname==='/petz/';
  if(fresh){
    e.respondWith(fetch(r,{cache:'no-store'}).then(res=>{if(res.ok){const c=res.clone();caches.open(V).then(x=>x.put(r.mode==='navigate'?'/petz/index.html':r,c))}return res})
      .catch(()=>caches.match(r.mode==='navigate'?'/petz/index.html':r).then(m=>m||caches.match('/petz/'))));
    return}
  e.respondWith(caches.open(V).then(c=>c.match(r).then(m=>{const net=fetch(r).then(res=>{if(res.ok)c.put(r,res.clone());return res}).catch(()=>m);return m||net})));
});
