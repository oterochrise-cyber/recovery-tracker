/* Offline support + push notifications for Recovery Tracker.
   - HTML fetched network-first (updates land when online), cache fallback offline.
   - Static assets cache-first.
   - Push: shows notification; tap focuses/opens the app.
   Your logged data lives in localStorage / your Firebase, never here. */
const CACHE = "recovery-shell-v4";
const ASSETS = ["./", "./index.html", "./manifest.webmanifest", "./reg.js",
  "./apple-touch-icon.png", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const isHTML = req.mode === "navigate" || (req.headers.get("accept") || "").includes("text/html");
  if (isHTML) {
    e.respondWith(
      fetch(req).then(resp => {
        const copy = resp.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
        return resp;
      }).catch(() => caches.match(req).then(r => r || caches.match("./index.html")))
    );
  } else {
    e.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(resp => {
        const copy = resp.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
        return resp;
      }))
    );
  }
});

self.addEventListener("push", e => {
  let d = { title: "Recovery", body: "Open the app.", tag: "rt-general" };
  try { d = Object.assign(d, e.data.json()); } catch (x) {}
  e.waitUntil(self.registration.showNotification(d.title, {
    body: d.body, tag: d.tag, icon: "icon-192.png", badge: "icon-192.png",
    data: { url: d.url || "./index.html" }
  }));
});

self.addEventListener("notificationclick", e => {
  e.notification.close();
  e.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then(list => {
    for (const c of list) { if ("focus" in c) return c.focus(); }
    return clients.openWindow((e.notification.data && e.notification.data.url) || "./index.html");
  }));
});
