const V='cbj-v6-1',FILES=['./','./index.html','./logica.js','./i18n.js','./manifest.json','./privacidade.html','./icons/icon-192.png','./icons/icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
// rede primeiro (página e scripts sempre da mesma versão); sem internet, usa a cópia guardada
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET'||new URL(r.url).origin!==location.origin)return;
  const nav=r.mode==='navigate';
  e.respondWith(fetch(r).then(x=>{if(x.ok){const c=x.clone();caches.open(V).then(ch=>ch.put(nav?'./index.html':r,c))}return x})
    .catch(()=>caches.match(nav?'./index.html':r,{ignoreSearch:true}).then(m=>m||caches.match('./index.html'))));
});
