'use strict';
const CACHE='s4u-ctpa-static-fast-v20';
const CORE=[
  '/assets/css/portal.css','/assets/css/testing-page.css','/assets/css/global-checkout.css',
  '/images/logo.png','/images/logo2.png','/images/fav.png',
  '/assets/js/config.js','/assets/js/dialogs.js','/assets/js/session-security.js','/assets/js/app.js','/assets/js/validation.js'
];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()).catch(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
function isStatic(req,url){
  return req.method==='GET'&&url.origin===self.location.origin&&(/\.(?:js|css|png|jpg|jpeg|webp|svg|ico|woff2?|html)$/i.test(url.pathname));
}
self.addEventListener('fetch',event=>{
  const req=event.request,url=new URL(req.url);
  if(!isStatic(req,url))return;
  if(url.pathname.endsWith('.html')){
    event.respondWith(caches.open(CACHE).then(async cache=>{
      const cached=await cache.match(req,{ignoreSearch:false});
      const network=fetch(req).then(r=>{if(r&&r.ok)cache.put(req,r.clone());return r}).catch(()=>cached);
      return cached||network;
    }));
    return;
  }
  event.respondWith(caches.open(CACHE).then(async cache=>{
    const cached=await cache.match(req,{ignoreSearch:true});
    if(cached){fetch(req).then(r=>{if(r&&r.ok)cache.put(req,r.clone())}).catch(()=>{});return cached;}
    const r=await fetch(req);if(r&&r.ok)cache.put(req,r.clone());return r;
  }));
});
