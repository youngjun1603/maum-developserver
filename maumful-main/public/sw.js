// Service Worker — 마음풀 PWA
// 전략: Network First (최신 데이터 우선) + 오프라인 폴백

const CACHE_NAME   = 'maumful-v2';
const STATIC_CACHE = 'maumful-static-v2';

const PRECACHE_URLS = [
  '/',
  '/static/app.jsx',
  '/static/style.css',
  '/manifest.json',
];

// ── 설치 ────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// ── 활성화: 구버전 캐시 정리 ───────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME && k !== STATIC_CACHE)
            .map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch 전략 ───────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API 요청: 네트워크 우선 (캐시 없음)
  if (url.pathname.startsWith('/api/')) return;

  // HTML 페이지: 네트워크 우선, 오프라인 시 캐시
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/'))
    );
    return;
  }

  // 정적 자산: 캐시 우선
  event.respondWith(
    caches.match(request).then(cached => cached || fetch(request))
  );
});

// ── 푸시 알림 수신 ───────────────────────────────────────────
self.addEventListener('push', (event) => {
  let data = { title: '마음풀', body: '오늘의 마음 건강을 체크해보세요', icon: '/static/icon-192.png', url: '/' };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {}

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body:   data.body,
      icon:   data.icon || '/static/icon-192.png',
      badge:  '/static/icon-192.png',
      tag:    data.tag || 'maumful-notification',
      data:   { url: data.url || '/' },
      actions: data.actions || [],
      vibrate: [200, 100, 200],
    })
  );
});

// ── 알림 클릭 처리 ──────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      // 이미 열린 탭이 있으면 포커스
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // 없으면 새 탭
      return clients.openWindow(targetUrl);
    })
  );
});

// ── 백그라운드 동기화 (periodicsync) ────────────────────────
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'daily-reminder') {
    event.waitUntil(sendDailyReminder());
  }
});

async function sendDailyReminder() {
  const lastPlayed = await getFromIDB('last_played');
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;
  if (lastPlayed && now - lastPlayed < oneDayMs) return; // 오늘 이미 플레이함

  await self.registration.showNotification('🌿 마음풀', {
    body: '오늘 마음의 정원을 가꿔보세요. 3분이면 충분해요.',
    icon: '/static/icon-192.png',
    badge: '/static/icon-192.png',
    tag: 'daily-reminder',
    data: { url: '/?v=game' },
    actions: [
      { action: 'play',   title: '게임 시작' },
      { action: 'dismiss',title: '나중에' },
    ],
  });
}

// ── IDB 헬퍼 ────────────────────────────────────────────────
function getFromIDB(key) {
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open('maumful-sw', 1);
      req.onsuccess = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('data')) { resolve(null); return; }
        const tx = db.transaction('data', 'readonly');
        const store = tx.objectStore('data');
        const getReq = store.get(key);
        getReq.onsuccess = () => resolve(getReq.result);
        getReq.onerror = () => resolve(null);
      };
      req.onerror = () => resolve(null);
    } catch { resolve(null); }
  });
}
