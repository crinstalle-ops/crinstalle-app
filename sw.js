// Crinstalle IA — service worker v2 : réseau d'abord AVEC revalidation systématique (cache:'no-cache'
// → le navigateur re-demande toujours au serveur, réponse 304 quasi gratuite si rien n'a changé),
// cache en secours (app utilisable hors ligne en lecture du shell)
var CACHE = 'crinstalle-v7';
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
  var req = e.request;
  try {
    req = (e.request.mode === 'navigate')
      ? new Request(e.request.url, { cache: 'no-cache' })
      : new Request(e.request, { cache: 'no-cache' });
  } catch (er) { req = e.request; }
  e.respondWith(
    fetch(req).then(function (r) {
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
