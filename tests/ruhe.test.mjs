// Ruhige Seite: kein Zoom, kein Verrutschen, Felder groß genug gegen den Fokus-Zoom von iOS.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { istEingabe, istZoomGeste, sperreZoom, haltePosition } from '../src/ui/ruhe.js';

const lies = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');

function fakeZiel() {
  const hoerer = {};
  return {
    hoerer,
    activeElement: null,
    scrollingElement: { scrollTop: 0, scrollLeft: 0 },
    addEventListener(n, f, opt) { (hoerer[n] = hoerer[n] || []).push({ f, opt }); },
    removeEventListener(n, f) { hoerer[n] = (hoerer[n] || []).filter((x) => x.f !== f); },
    sende(n, e) { (hoerer[n] || []).forEach((x) => x.f(e)); },
  };
}
const ereignis = (felder = {}) => ({ cancelable: true, verhindert: false, preventDefault() { this.verhindert = true; }, ...felder });

test('Eingabefelder werden erkannt (Text ja, Kästchen und Knöpfe nein)', () => {
  assert.equal(istEingabe({ tagName: 'INPUT', type: 'text' }), true);
  assert.equal(istEingabe({ tagName: 'INPUT', type: 'password' }), true);
  assert.equal(istEingabe({ tagName: 'INPUT' }), true);
  assert.equal(istEingabe({ tagName: 'TEXTAREA' }), true);
  assert.equal(istEingabe({ tagName: 'DIV', isContentEditable: true }), true);
  assert.equal(istEingabe({ tagName: 'INPUT', type: 'checkbox' }), false);
  assert.equal(istEingabe({ tagName: 'BUTTON' }), false);
  assert.equal(istEingabe(null), false);
});

test('Zoom-Gesten werden erkannt, normales Tippen und Ein-Finger-Wischen nicht', () => {
  assert.equal(istZoomGeste('gesturestart', {}), true);
  assert.equal(istZoomGeste('touchmove', { touches: [1, 2] }), true);
  assert.equal(istZoomGeste('touchmove', { touches: [1] }), false);
  assert.equal(istZoomGeste('wheel', { ctrlKey: true }), true);
  assert.equal(istZoomGeste('wheel', { ctrlKey: false }), false);
  for (const key of ['+', '-', '=', '0']) {
    assert.equal(istZoomGeste('keydown', { ctrlKey: true, key }), true, key);
    assert.equal(istZoomGeste('keydown', { metaKey: true, key }), true, key);
    assert.equal(istZoomGeste('keydown', { key }), false, `${key} ohne Strg`);
  }
  assert.equal(istZoomGeste('keydown', { ctrlKey: true, key: 'c' }), false, 'Kopieren bleibt');
  assert.equal(istZoomGeste('pointerdown', {}), false);
});

test('sperreZoom: hört nicht passiv auf der ganzen Seite und verhindert nur Zoom', () => {
  const d = fakeZiel();
  const weg = sperreZoom(d);
  for (const n of ['gesturestart', 'touchmove', 'wheel', 'keydown']) assert.equal(d.hoerer[n][0].opt.passive, false, n);
  const zwei = ereignis({ touches: [1, 2] });
  d.sende('touchmove', zwei);
  assert.equal(zwei.verhindert, true);
  const einer = ereignis({ touches: [1] });
  d.sende('touchmove', einer);
  assert.equal(einer.verhindert, false);
  const rad = ereignis({ ctrlKey: true });
  d.sende('wheel', rad);
  assert.equal(rad.verhindert, true);
  const plus = ereignis({ ctrlKey: true, key: '+' });
  d.sende('keydown', plus);
  assert.equal(plus.verhindert, true);
  weg();
  assert.equal(d.hoerer.touchmove.length, 0);
});

test('haltePosition: Seite springt nach Scrollen und nach dem Verlassen eines Feldes zurück, nicht während getippt wird', async () => {
  const d = fakeZiel();
  const w = fakeZiel();
  w.scrollX = 0; w.scrollY = 0;
  w.scrollTo = (x, y) => { w.scrollX = x; w.scrollY = y; };
  let neuGemessen = 0;
  haltePosition(d, w, { nachher: () => { neuGemessen++; } });
  w.scrollY = 120;
  w.sende('scroll', {});
  assert.equal(w.scrollY, 0, 'Scrollen wird zurückgesetzt');
  assert.ok(neuGemessen >= 1, 'Spielfläche wird neu gemessen');
  // Feld hat den Fokus: iOS darf die Seite über die Tastatur schieben
  d.activeElement = { tagName: 'INPUT', type: 'text' };
  w.scrollY = 200;
  w.sende('scroll', {});
  assert.equal(w.scrollY, 200, 'während des Tippens nicht');
  // Feld verlassen: kurz danach wieder oben
  d.activeElement = null;
  d.sende('focusout', {});
  await new Promise((r) => setTimeout(r, 80));
  assert.equal(w.scrollY, 0, 'nach dem Verlassen');
});

test('Kein Zoom: viewport-Meta mit maximum-scale=1 und user-scalable=no', () => {
  assert.match(lies('../index.html'), /name="viewport" content="[^"]*maximum-scale=1[^"]*user-scalable=no/);
});

test('Felder sind mindestens 16 px groß (sonst zoomt iOS beim Antippen), auch bei kleinster Schrift', () => {
  const css = readdirSync(new URL('../assets/css/', import.meta.url)).filter((n) => n.endsWith('.css')).map((n) => [n, lies(`../assets/css/${n}`)]);
  assert.match(css.map(([, t]) => t).join('\n'), /input, textarea, select \{ font-size: max\(16px, 1em\); \}/, 'Grundregel');
  let geprueft = 0;
  for (const [n, t] of css) {
    for (const regel of t.split('}')) {
      const [sel = '', body = ''] = regel.split('{');
      if (!/(^|[\s,.#])(input|textarea|select)\b|\.name-input|\.code-eingabe/.test(sel)) continue;
      const m = /font(?:-size)?:[^;]*var\(--font-scale\)[^;]*/.exec(body);
      if (!m) continue;
      geprueft++;
      assert.match(m[0], /max\(16px,/, `${n}: ${sel.trim()}`);
    }
  }
  assert.ok(geprueft >= 5, `nur ${geprueft} Feldregeln gefunden`);
});

test('Seite steht still: kein Gummiband und kein Herunterziehen zum Neuladen; die Spielfläche nimmt keine Browser-Gesten', () => {
  const app = lies('../assets/css/app.css');
  assert.match(app, /html, body \{[^}]*overflow: hidden;[^}]*overscroll-behavior: none;/);
  assert.match(app, /body \{ position: fixed; inset: 0; \}/);
  assert.match(app, /#stage \{[^}]*touch-action: none;/);
  const main = lies('../src/main.js');
  assert.match(main, /sperreZoom\(document\)/);
  assert.match(main, /haltePosition\(document, window/);
});

test('Immer antippbar: busy bleibt nach einem fehlgeschlagenen Raumwechsel nicht hängen', () => {
  assert.match(lies('../src/main.js'), /async function enterScene[\s\S]*?try \{[\s\S]*?\} finally \{\s*busy = false;/);
});
