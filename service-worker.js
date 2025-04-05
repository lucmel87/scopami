const CACHE_NAME = "scopati-game-cache-v1";
const urlsToCache = [
  "index.html",
  "Scopa.js",
  "assets/css/styles.css",
  "classes/Mazzo.js",
  "classes/Render.js",
  "classes/Giocatore.js",
  "classes/Carta.js",
  "classes/CalcolatorePunteggio.js",
  "favicon/android-chrome-192x192.png",
  "favicon/android-chrome-512x512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Caching files...");
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log("Clearing old cache...");
            return caches.delete(cache);
          }
        })
      );
    })
  );
});
