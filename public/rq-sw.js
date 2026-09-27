self.addEventListener("install", (event) => {
  event.waitUntil(caches.open("rq-field-card-v2").then((cache) => cache.add("/offline.html")).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (event) => event.waitUntil(
  caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith("rq-field-card-") && key !== "rq-field-card-v2").map((key) => caches.delete(key)))).then(() => self.clients.claim()),
));

// Only the public, static field card is stored. Never cache accounts, API data,
// threat feeds, chat transcripts or paid reports on a shared device.
self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate" || event.request.method !== "GET") return;
  event.respondWith(fetch(event.request).catch(async () => {
    const cache = await caches.open("rq-field-card-v2");
    return await cache.match("/offline.html") || Response.error();
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const destination = event.notification.data?.url || "/pulse#signal-watch";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((client) => "focus" in client);
      if (existing) {
        existing.navigate(destination);
        return existing.focus();
      }
      return self.clients.openWindow(destination);
    }),
  );
});

// Ready for a future VAPID-backed push channel. No subscription is created
// until the user explicitly enables background alerts in a later release.
self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "RED QUEEN ALERT", body: event.data.text() };
  }
  event.waitUntil(self.registration.showNotification(payload.title || "RED QUEEN ALERT", {
    body: payload.body,
    icon: "/token-image.png",
    badge: "/token-image.png",
    tag: payload.tag,
    data: { url: payload.url || "/pulse#signal-watch" },
  }));
});
