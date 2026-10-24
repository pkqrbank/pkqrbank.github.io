// Offline support for QR Bank.
// make_web_version.sh fills in VERSION and FILES (every file of the built
// site) after `flutter build web`. On the first visit they are all saved on
// the device; after that the site opens and scans with no internet.
// Pokémon/item pictures from PokéAPI are saved as they are viewed.
const VERSION = "20261024-041124";
const FILES = [
 "./",
 "assets/AssetManifest.bin",
 "assets/AssetManifest.bin.json",
 "assets/FontManifest.json",
 "assets/NOTICES",
 "assets/assets/data/gen1_db.json",
 "assets/assets/data/gen2_db.json",
 "assets/assets/data/gen3_db.json",
 "assets/assets/data/gen4_db.json",
 "assets/assets/data/gen5_db.json",
 "assets/assets/data/gen6_db.json",
 "assets/assets/data/gen7_db.json",
 "assets/assets/data/gen8_db.json",
 "assets/assets/data/gen9_db.json",
 "assets/assets/data/info_tables.json",
 "assets/assets/data/sprites.json",
 "assets/fonts/MaterialIcons-Regular.otf",
 "assets/fonts/fallback/Roboto-Regular.ttf",
 "assets/packages/cupertino_icons/assets/CupertinoIcons.ttf",
 "assets/shaders/ink_sparkle.frag",
 "assets/shaders/stretch_effect.frag",
 "canvaskit/canvaskit.js",
 "canvaskit/canvaskit.wasm",
 "canvaskit/chromium/canvaskit.js",
 "canvaskit/chromium/canvaskit.wasm",
 "favicon.png",
 "flutter.js",
 "flutter_bootstrap.js",
 "icons/Icon-192.png",
 "icons/Icon-512.png",
 "icons/Icon-maskable-192.png",
 "icons/Icon-maskable-512.png",
 "index.html",
 "main.dart.js",
 "manifest.json",
 "version.json",
 "zxing/index.js",
 "zxing/zxing_reader.wasm"
];
const CACHE = 'qr-bank-' + VERSION;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(FILES.map((f) => new Request(f, { cache: 'reload' })))).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys
        .filter((k) => k.startsWith('qr-bank-') && k !== CACHE && k !== 'qr-bank-pictures')
        .map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // The page itself: try the internet first so updates show up
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req).then((r) => r || caches.match('./')))
    );
    return;
  }

  // Everything else: saved copy first, otherwise download and save it.
  // Pictures and fonts from other sites go in their own lasting cache.
  const store = url.origin === self.location.origin ? CACHE : 'qr-bank-pictures';
  event.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res.ok || res.type === 'opaque') {
        const copy = res.clone();
        caches.open(store).then((c) => c.put(req, copy));
      }
      return res;
    }))
  );
});
