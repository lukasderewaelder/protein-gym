// Vollbild: Unterstützung erkennen, ein- und ausschalten, Fehler abfangen, Querformat nur nach Zusage.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { vollbildMoeglich, istVollbild, vollbildAn, vollbildAus, umschalten, beiVollbildwechsel, vollbildHinweis, istApple } from '../src/ui/vollbild.js';

function fakeDoc({ kann = true, ablehnen = false } = {}) {
  const log = [];
  const doc = {
    fullscreenElement: null,
    documentElement: kann
      ? { requestFullscreen: async (opt) => { log.push(['an', opt]); if (ablehnen) throw new Error('keine Geste'); doc.fullscreenElement = doc.documentElement; } }
      : {},
    exitFullscreen: async () => { log.push(['aus']); doc.fullscreenElement = null; },
    listeners: {},
    addEventListener(n, f) { (this.listeners[n] = this.listeners[n] || []).push(f); },
    removeEventListener(n, f) { this.listeners[n] = (this.listeners[n] || []).filter((x) => x !== f); },
    log,
  };
  return doc;
}
function fakeScreen({ klappt = true } = {}) {
  const calls = [];
  return { calls, orientation: { lock: async (m) => { calls.push(m); if (!klappt) throw new Error('nicht unterstützt'); } } };
}

test('Unterstützung wird erkannt (iPhone: nein)', () => {
  assert.equal(vollbildMoeglich(fakeDoc()), true);
  assert.equal(vollbildMoeglich(fakeDoc({ kann: false })), false);
  assert.equal(vollbildMoeglich({ documentElement: { webkitRequestFullscreen() {} } }), true);
});

test('Vollbild an: fordert an, sperrt danach das Querformat', async () => {
  const d = fakeDoc(); const s = fakeScreen();
  assert.equal(await vollbildAn(d, s), true);
  assert.equal(istVollbild(d), true);
  assert.deepEqual(d.log[0], ['an', { navigationUI: 'hide' }]);
  assert.deepEqual(s.calls, ['landscape']);
});

test('Vollbild an: schon im Vollbild, nichts doppelt', async () => {
  const d = fakeDoc(); const s = fakeScreen();
  await vollbildAn(d, s);
  assert.equal(await vollbildAn(d, s), true);
  assert.equal(d.log.length, 1);
});

test('Fehler beim Anfordern oder beim Sperren brechen nichts ab', async () => {
  const d1 = fakeDoc({ ablehnen: true }); const s1 = fakeScreen();
  assert.equal(await vollbildAn(d1, s1), false, 'ohne Geste abgelehnt');
  assert.deepEqual(s1.calls, [], 'ohne Vollbild keine Sperre');
  const d2 = fakeDoc(); const s2 = fakeScreen({ klappt: false });
  assert.equal(await vollbildAn(d2, s2), true, 'Sperre scheitert, Vollbild bleibt');
  assert.equal(await vollbildAn(fakeDoc({ kann: false }), fakeScreen()), false, 'nicht unterstützt');
});

test('Umschalten wechselt zwischen an und aus', async () => {
  const d = fakeDoc(); const s = fakeScreen();
  assert.equal(await umschalten(d, s), true);
  assert.equal(istVollbild(d), true);
  assert.equal(await umschalten(d, s), false);
  assert.equal(istVollbild(d), false);
  await vollbildAus(d); // schon aus: kein Fehler
  assert.equal(d.log.filter((e) => e[0] === 'aus').length, 1);
});

test('Wechsel-Hörer meldet den Zustand und lässt sich abmelden', () => {
  const d = fakeDoc(); const gemeldet = [];
  const weg = beiVollbildwechsel((an) => gemeldet.push(an), d);
  d.fullscreenElement = d.documentElement;
  d.listeners.fullscreenchange.forEach((f) => f());
  d.fullscreenElement = null;
  d.listeners.fullscreenchange.forEach((f) => f());
  assert.deepEqual(gemeldet, [true, false]);
  weg();
  assert.equal(d.listeners.fullscreenchange.length, 0);
});

test('Hinweis im Menü: App-Modus zuerst, ohne Unterstützung auf Apple-Geräten der Weg über den Home-Bildschirm, sonst „abgelehnt“', () => {
  assert.equal(vollbildHinweis({ moeglich: true, appModus: true, ios: true }), 'app');
  assert.equal(vollbildHinweis({ moeglich: false, appModus: true, ios: false }), 'app');
  assert.equal(vollbildHinweis({ moeglich: false, appModus: false, ios: true }), 'ios');
  assert.equal(vollbildHinweis({ moeglich: false, appModus: false, ios: false }), 'abgelehnt');
  assert.equal(vollbildHinweis({ moeglich: true, appModus: false, ios: true }), 'abgelehnt', 'unterstützt, aber vom Browser abgelehnt');
});

test('Apple-Geräte werden erkannt, auch iPadOS als Mac mit Touch', () => {
  assert.equal(istApple({ userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)', platform: 'iPhone', maxTouchPoints: 5 }), true);
  assert.equal(istApple({ userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)', platform: 'iPad', maxTouchPoints: 5 }), true);
  assert.equal(istApple({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', platform: 'MacIntel', maxTouchPoints: 5 }), true, 'iPadOS im Desktop-Modus');
  assert.equal(istApple({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', platform: 'MacIntel', maxTouchPoints: 0 }), false, 'echter Mac');
  assert.equal(istApple({ userAgent: 'Mozilla/5.0 (Linux; Android 13)', platform: 'Linux armv8l', maxTouchPoints: 5 }), false);
  assert.equal(istApple({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', platform: 'Win32', maxTouchPoints: 0 }), false);
  assert.equal(istApple(null), false);
});

test('Esc wird im Vollbild abgefangen (Chrome) und beim Verlassen wieder freigegeben', async () => {
  const d = fakeDoc(); const log = [];
  const nav = { keyboard: { lock: async (k) => { log.push(['lock', k]); }, unlock: () => { log.push(['unlock']); } } };
  await vollbildAn(d, null, nav);
  await vollbildAus(d, nav);
  assert.deepEqual(log, [['lock', ['Escape']], ['unlock']]);
  const ohne = fakeDoc();
  assert.equal(await vollbildAn(ohne, null, { keyboard: { lock: async () => { throw new Error('nicht erlaubt'); } } }), true, 'fehlende Sperre bricht nichts ab');
});

test('Keine Browser-Dialoge im Spiel (alert, confirm, prompt beenden das Vollbild); nur der Editiermodus darf prompt nutzen', async () => {
  const { readdirSync, readFileSync, statSync } = await import('node:fs');
  const { join } = await import('node:path');
  const wurzel = new URL('../src/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
  const dateien = [];
  const lauf = (dir) => { for (const n of readdirSync(dir)) { const p = join(dir, n); if (statSync(p).isDirectory()) lauf(p); else if (p.endsWith('.js')) dateien.push(p); } };
  lauf(wurzel);
  for (const p of dateien.filter((x) => !/editor\.js$/.test(x))) {
    assert.doesNotMatch(readFileSync(p, 'utf8'), /\b(window\.)?(alert|confirm|prompt)\(/, p);
  }
});

test('Vollbild nur per Knopf: kein Tippen im Spiel fordert Vollbild an (kein Wächter auf pointerup/click)', async () => {
  const { readFileSync } = await import('node:fs');
  const lies = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');
  const vb = lies('../src/ui/vollbild.js');
  const main = lies('../src/main.js');
  assert.doesNotMatch(vb, /export function vollbildWaechter/, 'kein Wächter mehr');
  assert.doesNotMatch(vb, /addEventListener\('(pointerup|click|pointerdown)'/, 'vollbild.js hört nicht auf Tippen');
  assert.doesNotMatch(main, /vollbildWaechter/);
  // vollbildAn steht in main.js nur beim Start (onGeste); umschalten nur hinter den beiden Knöpfen
  assert.equal((main.match(/vollbildAn\(/g) || []).length, 1, 'vollbildAn nur einmal (Start)');
  assert.match(main, /onGeste: \(\) => \{ if \(vollbildMoeglich\(\)\) \{ store\.state\.vollbild = true; vollbildAn\(\)/);
  assert.match(main, /knopf\.addEventListener\('click', \(\) => schalte\(true\)\)/);
  assert.match(main, /leiste\.addEventListener\('click', \(\) => schalte\(false\)\)/);
  const html = lies('../index.html');
  assert.match(html, /id="btn-vollbild-leiste" class="icon-btn vollbild-leiste"/);
  assert.match(html, /id="btn-vollbild"/, 'Menüknopf bleibt');
});
