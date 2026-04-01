// Service Worker Version: 1.0.6
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { createHandlerBoundToURL } from 'workbox-precaching';

// self.__WB_MANIFEST is injected by the build process
precacheAndRoute(self.__WB_MANIFEST || []);

cleanupOutdatedCaches();

// Force immediate control
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Handle navigation requests (SPA fallback)
const handler = createHandlerBoundToURL('/index.html');
const navigationRoute = new NavigationRoute(handler);
registerRoute(navigationRoute);

self.addEventListener('push', function(event) {
  console.log('[Service Worker] Push Received (v1.0.6).');
  
  let title = 'Andorra Bank';
  let body = 'You have a new message';
  const icon = new URL('/pwa-192x192.svg', self.location.origin).href;

  if (event.data) {
    try {
      const data = event.data.json();
      console.log('[Service Worker] Push Data (JSON):', data);
      if (data.title) title = String(data.title);
      if (data.body) body = String(data.body);
    } catch (e) {
      console.warn('[Service Worker] Error parsing push data as JSON:', e);
      try {
        const textData = event.data.text();
        if (textData) {
          body = String(textData);
        }
      } catch (e2) {
        console.error('[Service Worker] Error parsing push data as text:', e2);
      }
    }
  }

  const options = {
    body: body,
    icon: icon,
    badge: icon,
    vibrate: [100, 50, 100],
    tag: 'andorra-bank-push', // Important for Chrome desktop
    renotify: true,
    requireInteraction: true, // Keep it visible on desktop
    timestamp: Date.now(),
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '2'
    },
    actions: [
      { action: 'open', title: 'Open App' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
      .catch(err => {
        console.error('[Service Worker] Error showing notification:', err);
        // Absolute fallback
        return self.registration.showNotification('Andorra Bank', {
          body: 'New notification received (v1.0.6)',
          tag: 'andorra-bank-push-fallback',
          icon: icon
        });
      })
  );
});

self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Notification click Received.');
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) {
            client = clientList[i];
          }
        }
        return client.focus();
      }
      return clients.openWindow('/');
    })
  );
});
