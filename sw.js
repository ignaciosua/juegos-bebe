/* Juegos para bebé: funciona sin internet.
   Abre lo guardado al instante y, si hay internet, baja la versión nueva para la próxima vez. */
var V = 'juegos-bebe-v2';
var FILES = ['./', 'index.html', 'juegos-bebe.html', 'manifest.webmanifest', 'icono-180.png', 'icono-192.png', 'icono-512.png'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(V).then(function (c) { return c.addAll(FILES); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== V; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  // la página: primero la versión nueva de internet (si tarda más de 4 s o no hay red, la guardada)
  if (e.request.mode === 'navigate') {
    e.respondWith(caches.open(V).then(function (c) {
      var net = fetch(e.request).then(function (r) { if (r.ok) c.put(e.request, r.clone()); return r; });
      var old = c.match(e.request, {ignoreSearch: true});
      return Promise.race([net, new Promise(function (ok) { setTimeout(ok, 4000); }).then(function () { return old; })])
        .then(function (r) { return r || net; }).catch(function () { return old; });
    }));
    return;
  }
  e.respondWith(caches.open(V).then(function (c) {
    return c.match(e.request, {ignoreSearch: true}).then(function (hit) {
      var net = fetch(e.request).then(function (r) { if (r.ok) c.put(e.request, r.clone()); return r; }).catch(function () { return hit; });
      return hit || net;
    });
  }));
});
