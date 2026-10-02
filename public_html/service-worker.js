/**
 * 나노의 책장 (Nano BookShelf) Service Worker
 * PWA 오프라인 지원, 캐싱 및 빠른 로딩 처리
 */

const CACHE_NAME = 'nano-bookshelf-v1.0.0';

// 오프라인 및 기본 캐싱 대상 핵심 리소스
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './student_preview.html',
  './admin_preview.html',
  './master_preview.html',
  './manifest.json',
  './js/pwa-install.js',
  './resources/images/icons/icon-192.png',
  './resources/images/icons/icon-512.png',
  './resources/images/icons/apple-touch-icon.png',
  './resources/images/common/logo.png',
  './resources/images/common/symbol.png'
];

// 1. 설치 (Install): 핵심 리소스 사전 캐싱
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // 캐시 실패가 전체 SW 설치를 막지 않도록 각각 캐싱 시도
      return Promise.allSettled(
        PRECACHE_ASSETS.map((url) =>
          cache.add(url).catch((err) => {
            console.warn('[PWA SW] Precache skip:', url, err);
          })
        )
      );
    })
  );
});

// 2. 활성화 (Activate): 구버전 캐시 정리 및 즉시 클라이언트 제어
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log('[PWA SW] Clearing old cache:', name);
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. 네트워크 요청 가로채기 (Fetch)
// 전략:
// - 정적 폰트/아이콘 CDN: Cache First (빠른 렌더링)
// - HTML/JS/CSS/데이터: Network First (항상 최신 코드 반영, 오프라인 시 캐시 사용)
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // POST 요청이나 chrome-extension, API 호출 등은 네트워크로 바로 통과
  if (req.method !== 'GET' || !req.url.startsWith('http')) {
    return;
  }

  // 폰트 또는 CDN 자산 캐싱 (Cache First)
  const isCDN = url.hostname.includes('cdn.jsdelivr.net') ||
                url.hostname.includes('fonts.googleapis.com') ||
                url.hostname.includes('fonts.gstatic.com') ||
                url.hostname.includes('cdnjs.cloudflare.com');

  if (isCDN) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((res) => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return res;
        }).catch(() => cached);
      })
    );
    return;
  }

  // 기본 전략: Network First (최신 데이터 우선 보장)
  event.respondWith(
    fetch(req)
      .then((networkResponse) => {
        // 성공 응답 시 캐시 업데이트
        if (networkResponse && networkResponse.status === 200) {
          const resClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(req, resClone);
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        // 네트워크 실패 시 (오프라인 상태 등) 캐시에서 검색
        const cachedResponse = await caches.match(req);
        if (cachedResponse) {
          return cachedResponse;
        }

        // 페이지 네비게이션 실패 시 캐시된 index.html 반환
        if (req.mode === 'navigate') {
          const fallback = await caches.match('./index.html') || await caches.match('./');
          if (fallback) return fallback;
        }

        return new Response('인터넷 연결이 필요합니다. 네트워크 상태를 확인해 주세요.', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers({ 'Content-Type': 'text/plain; charset=utf-8' })
        });
      })
  );
});
