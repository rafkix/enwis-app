// Enwis PWA service worker.
//
// Scope is intentionally narrow: this ONLY provides an offline fallback for
// navigations and caches static, immutable assets (icons, the app shell's
// own JS/CSS chunks). It must NEVER cache /api/* — test submission, exam
// state, and anything else that talks to the backend has to go straight to
// the network so a stale cached response can't silently swallow a real
// answer (see RESPONSIVE_TELEGRAM_PWA_PROMPTS.md, 21-PROMPT item 4).
const CACHE_NAME = "enwis-shell-v1";
const OFFLINE_URL = "/offline.html";

const PRECACHE_URLS = [
  OFFLINE_URL,
  "/favicon.ico",
  "/android-chrome-192x192.png",
  "/android-chrome-512x512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Never intercept API calls or cross-origin requests (backend, uploads,
  // telegram.org script, etc.) — those must always hit the network.
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) {
    return;
  }

  // Page navigations: network-first, offline page as the last resort.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match(OFFLINE_URL).then((res) => res || Response.error())),
    );
    return;
  }

  // Static Next.js build assets and icons: cache-first, since they're
  // content-hashed and safe to reuse; fall back to network if missing.
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/") || PRECACHE_URLS.includes(url.pathname)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((res) => {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
            return res;
          }),
      ),
    );
  }
});
