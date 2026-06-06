// HonestBaby カスタム Service Worker ロジック
// next-pwa が自動生成する Workbox SW にこのコードが取り込まれる（precache 等は next-pwa が担当）

// === Web Push 受信ハンドラ ===
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: 'HonestBaby', body: event.data ? event.data.text() : '' };
  }

  const title = data.title || 'HonestBaby';
  const options = {
    body: data.body || '',
    icon: data.icon || '/favicon.png',
    badge: '/favicon.png',
    image: data.image,
    data: { url: data.url || '/' },
    tag: data.tag,
    requireInteraction: false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// === 通知クリックハンドラ ===
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    })
  );
});
