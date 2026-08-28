// Crinstalle IA — service worker v1 : réseau d'abord, cache en secours (app utilisable hors ligne en lecture du shell)
var CACHE = 'crinstalle-v4';
var SHELL = ['/', '/index.html', '/crinstalle-app.js', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) { return; } // API Supabase / PDF n8n : jamais interceptés
  e.respondWith(
    fetch(e.request).then(function (r) {
      if (r && r.ok) { var copy = r.clone(); caches.open(CACHE).then(function (c) { c.put(e.request, copy); }); }
      return r;
    }).catch(function () {
      return caches.match(e.request, { ignoreSearch: false }).then(function (m) {
        if (m) { return m; }
        if (e.request.mode === 'navigate') { return caches.match('/index.html'); }
        return Response.error();
      });
    })
  );
});
