/* FarmaAlert service worker */

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: 'FarmaAlert', body: event.data?.text() || '' };
  }

  const title = data.title || 'FarmaAlert';
  const options = {
    body: data.body || '',
    icon: '/farmalert/icon-192.png',
    badge: '/farmalert/icon-192.png',
    vibrate: [200, 100, 200],
    tag: data.tag || 'farmalert',
    renotify: true,
    requireInteraction: false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const url = '/farmalert/';
      for (const c of clients) {
        if (c.url.includes('/farmalert/')) {
          c.focus();
          return;
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});
