const cacheName='madeinmaia-sprites-v1';
const assets=['./index.html','./style.css','./app.js','./manifest.webmanifest','./icon-192.png','./icon-512.png','./sample.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(cacheName).then(cache=>cache.addAll(assets))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('madeinmaia-sprites-')&&key!==cacheName).map(key=>caches.delete(key))))));
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET'||!assets.some(asset=>new URL(asset,self.registration.scope).href===event.request.url))return;
 event.respondWith(fetch(event.request).then(response=>{
  if(response.ok&&!response.redirected){const copy=response.clone();event.waitUntil(caches.open(cacheName).then(cache=>cache.put(event.request,copy)).catch(()=>{}));}
  return response;
 }).catch(()=>caches.match(event.request)));
});
