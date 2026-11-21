/* Service worker KosaKata — opsional, untuk mode offline.
   Letakkan file ini di folder yang SAMA dengan index.html saat di-hosting (HTTPS). */
const CACHE = 'kosakata-v1';
const CORE = ['./', './index.html'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  // Halaman: ambil versi terbaru dari internet, fallback ke cache saat offline
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put('./index.html', copy)); return res; })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Aset lain (font, dll): cache dulu, lalu perbarui di belakang layar
  e.respondWith(
    caches.match(req).then(cached => {
      const net = fetch(req)
        .then(res => { if (res && (res.ok || res.type === 'opaque')) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return res; })
        .catch(() => cached);
      return cached || net;
    })
  );
});
