// v2.4.5.1: network-first for online updates, offline cache fallback.
const CACHE='family-cfo-v3-5-0-r1';
const FILES=['./','./index.html','./style.css?v=3500','./app.js?v=3500','./js/ledger.js?v=3500','./js/forecast.js?v=3500','./js/migration.js?v=3500','./js/analytics.js?v=3500','./js/analysis-ui.js?v=3500','./manifest.webmanifest','./icon.svg'];
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)));
 
});
self.addEventListener('activate',event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))));
 
});
self.addEventListener('fetch',event=>{
 const request=event.request;
 if(request.method!=='GET'||new URL(request.url).origin!==location.origin)return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  try{
   const response=await fetch(request,{cache:'no-store'});
   if(response.ok)await cache.put(request,response.clone());
   return response;
  }catch(error){
   const cached=await cache.match(request,{ignoreSearch:false});
   if(cached)return cached;
   if(request.mode==='navigate'){const fallback=await cache.match('./index.html');if(fallback)return fallback;}
   throw error;
  }
 })());
});
