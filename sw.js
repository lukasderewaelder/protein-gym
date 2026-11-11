// Service Worker: speichert das ganze Spiel beim ersten Besuch, danach läuft es ohne Netz.
// Der Block zwischen den Marken wird von tools/precache.mjs erzeugt (node tools/precache.mjs).

// >>> precache
const VERSION = '4d5a716de7';
const ASSETS = [
  './',
  './assets/css/app.css',
  './assets/css/funde.css',
  './assets/css/game.css',
  './assets/css/zugang.css',
  './assets/figuren/figur_v1_walk_down.webp',
  './assets/figuren/figur_v1_walk_left.webp',
  './assets/figuren/figur_v1_walk_right.webp',
  './assets/figuren/figur_v1_walk_up.webp',
  './assets/figuren/icons_quellen_0.webp',
  './assets/figuren/icons_quellen_1.webp',
  './assets/figuren/icons_quellen_2.webp',
  './assets/figuren/icons_quellen_3.webp',
  './assets/figuren/icons_quellen_4.webp',
  './assets/figuren/icons_quellen_5.webp',
  './assets/figuren/icons_struktur_0.webp',
  './assets/figuren/icons_struktur_1.webp',
  './assets/figuren/icons_struktur_2.webp',
  './assets/figuren/npc_alex.webp',
  './assets/figuren/npc_hannes.webp',
  './assets/figuren/npc_kurt.webp',
  './assets/figuren/npc_trainer.webp',
  './assets/figuren/npc_zoe.webp',
  './assets/figuren/obj_pfanne_0.webp',
  './assets/figuren/obj_pfanne_1.webp',
  './assets/figuren/obj_pfanne_2.webp',
  './assets/figuren/obj_scheibe_0.webp',
  './assets/figuren/obj_scheibe_1.webp',
  './assets/figuren/obj_sonstiges_0.webp',
  './assets/figuren/obj_sonstiges_1.webp',
  './assets/figuren/obj_sonstiges_2.webp',
  './assets/figuren/obj_sonstiges_3.webp',
  './assets/funde/fund_haftnotiz.webp',
  './assets/icons/apple-touch-icon.png',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/icon.svg',
  './assets/portraits/alex_0.webp',
  './assets/portraits/alex_1.webp',
  './assets/portraits/alex_2.webp',
  './assets/portraits/alex_3.webp',
  './assets/portraits/desi_0.webp',
  './assets/portraits/desi_1.webp',
  './assets/portraits/desi_2.webp',
  './assets/portraits/hannes_0.webp',
  './assets/portraits/hannes_1.webp',
  './assets/portraits/hannes_2.webp',
  './assets/portraits/kurt_0.webp',
  './assets/portraits/kurt_1.webp',
  './assets/portraits/kurt_2.webp',
  './assets/portraits/trainer_0.webp',
  './assets/portraits/trainer_1.webp',
  './assets/portraits/trainer_2.webp',
  './assets/portraits/trainer_3.webp',
  './assets/portraits/zoe_0.webp',
  './assets/portraits/zoe_1.webp',
  './assets/portraits/zoe_2.webp',
  './assets/szenen/szene_empfang.webp',
  './assets/szenen/szene_labor.webp',
  './assets/szenen/szene_sauna.webp',
  './assets/szenen/szene_shakebar.webp',
  './assets/szenen/szene_trainingsflaeche.webp',
  './assets/szenen/titel.webp',
  './assets/szenen/zertifikat_rahmen.webp',
  './data/aehnlich.json',
  './data/aufgaben.json',
  './data/dialoge.json',
  './data/fall.json',
  './data/fuehrerschein.json',
  './data/glossar.json',
  './data/hefter.json',
  './data/hilfe.json',
  './data/inventar.json',
  './data/schliessfaecher.json',
  './data/szenen.json',
  './data/versuch.json',
  './data/werbung.json',
  './data/wissen.json',
  './index.html',
  './manifest.webmanifest',
  './src/engine/assets.js',
  './src/engine/editor.js',
  './src/engine/grid.js',
  './src/engine/player.js',
  './src/engine/recolor.js',
  './src/engine/render.js',
  './src/engine/viewport.js',
  './src/main.js',
  './src/state/auswertung.js',
  './src/state/fall.js',
  './src/state/fuehrerschein.js',
  './src/state/inventar.js',
  './src/state/naechster-schritt.js',
  './src/state/progress.js',
  './src/state/store.js',
  './src/state/zugang.js',
  './src/state/zwischenstand.js',
  './src/tasks/check.js',
  './src/tasks/labor-types.js',
  './src/tasks/m4-types.js',
  './src/tasks/molecule.js',
  './src/tasks/neu-types.js',
  './src/tasks/types.js',
  './src/ui/dialog.js',
  './src/ui/dom.js',
  './src/ui/funde-core.js',
  './src/ui/funde.js',
  './src/ui/inventar.js',
  './src/ui/notebook.js',
  './src/ui/start.js',
  './src/ui/taskpanel.js',
  './src/ui/vollbild.js',
  './src/ui/zugang.js',
];
// <<< precache

const CACHE_PREFIX = 'protein-gym-';
const CACHE = `${CACHE_PREFIX}${VERSION}`;

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await cache.addAll(ASSETS.map((url) => new Request(url, { cache: 'reload' })));
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) {
        if (key.startsWith(CACHE_PREFIX) && key !== CACHE) await caches.delete(key);
      }
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data === 'STATUS' && event.ports[0]) {
    event.waitUntil(
      (async () => {
        const cache = await caches.open(CACHE);
        const cached = (await cache.keys()).length;
        event.ports[0].postMessage({ version: VERSION, expected: ASSETS.length, cached });
      })(),
    );
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const hit = await cache.match(request, { ignoreSearch: true });
      if (hit) return hit;
      try {
        return await fetch(request);
      } catch (err) {
        if (request.mode === 'navigate') {
          const shell = await cache.match('./index.html');
          if (shell) return shell;
        }
        throw err;
      }
    })(),
  );
});
