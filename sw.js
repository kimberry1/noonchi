// ThinkKl Service Worker v1.1
const CACHE_NAME = 'thinkKl-v2';
const BASE = '/thinkKl';
const OFFLINE_ASSETS = [
  BASE + '/',
  BASE + '/index.html',
  BASE + '/manifest.json',
  BASE + '/icon-192.png',
  BASE + '/icon-512.png'
];

// 설치: 핵심 파일 캐시
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(OFFLINE_ASSETS);
    }).catch(function(e){
      console.warn('[SW] 캐시 실패:', e);
    })
  );
  self.skipWaiting();
});

// 활성화: 구버전 캐시 삭제
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

// 요청 처리: Network First (온라인 우선, 실패 시 캐시)
self.addEventListener('fetch', function(event) {
  var url = event.request.url;

  // Supabase API / 외부 요청은 캐시 안 함
  if (url.includes('supabase.co') ||
      url.includes('googleapis.com') ||
      url.includes('kakao.com')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(function(response) {
        if (response && response.status === 200 && response.type === 'basic') {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, clone);
          });
        }
        return response;
      })
      .catch(function() {
        return caches.match(event.request).then(function(cached) {
          return cached || caches.match(BASE + '/index.html');
        });
      })
  );
});
