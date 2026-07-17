/* Service Worker — surya-v36
   Handles: offline cache, alarm notification with auto-open */
const C = "surya-v36";
const A = [
  "./","./index.html","./app.js","./quotes.js","./manifest.json",
  "./icon-192.png","./icon-512.png",
  "./icon-maskable-192.png","./icon-maskable-512.png"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(C).then(c=>c.addAll(A)).then(()=>self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(k=>k!==C).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  if(e.request.method!=="GET") return;
  const isHTML = e.request.destination==="document";
  e.respondWith(
    caches.match(e.request).then(cached=>{
      if(isHTML){
        return fetch(e.request)
          .then(res=>{ if(res&&res.status===200) caches.open(C).then(c=>c.put(e.request,res.clone())); return res; })
          .catch(()=>cached||caches.match("./index.html"));
      }
      return cached||fetch(e.request).then(res=>{
        if(res&&res.status===200&&res.type==="basic") caches.open(C).then(c=>c.put(e.request,res.clone()));
        return res;
      });
    })
  );
});

// Notification click — auto-open the app
self.addEventListener("notificationclick", e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({type:"window",includeUncontrolled:true}).then(cs=>{
      // If app already open, focus it
      for(const c of cs){
        if(c.url.includes("index.html")||c.url.endsWith("/")) {
          c.postMessage({type:"ALARM_FIRED"});
          return c.focus();
        }
      }
      // Otherwise open app — auto-opens at alarm time
      return clients.openWindow("./index.html?alarm=1");
    })
  );
});

self.addEventListener("message", e => {
  if(e.data==="skipWaiting") self.skipWaiting();
});
