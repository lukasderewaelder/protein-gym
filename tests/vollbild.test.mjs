// Vollbild: Unterstützung erkennen, ein- und ausschalten, Fehler abfangen, Querformat nur nach Zusage.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { vollbildMoeglich, istVollbild, vollbildAn, vollbildAus, umschalten, beiVollbildwechsel, vollbildWaechter, vollbildHinweis, istApple } from '../src/ui/vollbild.js';

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

test('Wächter: holt Vollbild beim nächsten Tippen zurück, aber nur mit Wunsch, nicht doppelt und nicht am Vollbild-Knopf', async () => {
  const d = fakeDoc();
  let wunsch = true;
  let aufrufe = 0;
  const knopf = { closest: (s) => (s === '#btn-vollbild' ? knopf : null) };
  const weg = vollbildWaechter(d, { wunsch: () => wunsch, nachholen: async () => { aufrufe++; await vollbildAn(d, null, null); }, ausser: (z) => Boolean(z && z.closest && z.closest('#btn-vollbild')) });
  const tippe = async (typ, target = {}) => { d.listeners[typ].forEach((f) => f({ target })); await new Promise((r) => setTimeout(r, 0)); };
  await tippe('pointerup');
  assert.equal(aufrufe, 1, 'kein Vollbild und Wunsch: nachholen');
  assert.equal(istVollbild(d), true);
  await tippe('click');
  assert.equal(aufrufe, 1, 'schon im Vollbild: nichts');
  d.fullscreenElement = null; // Browser beendet Vollbild (Druckdialog, Tastatur, App-Wechsel)
  await tippe('pointerup', knopf);
  assert.equal(aufrufe, 1, 'der Vollbild-Knopf entscheidet selbst');
  wunsch = false;
  await tippe('pointerup');
  assert.equal(aufrufe, 1, 'ohne Wunsch: nichts');
  wunsch = true;
  d.listeners.pointerup.forEach((f) => f({ target: {} }));
  d.listeners.click.forEach((f) => f({ target: {} }));
  await new Promise((r) => setTimeout(r, 0));
  assert.equal(aufrufe, 2, 'pointerup und click desselben Tipps fordern nur einmal an');
  weg();
  assert.equal(d.listeners.pointerup.length, 0);
  assert.equal(d.listeners.click.length, 0);
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
