// Nichts liegt über der Spielfläche: Die obere Leiste ist ein eigener Streifen, die Zeichenfläche beginnt darunter,
// die Hinweis-Kärtchen stehen als eine Zeile in der Leiste (früher als Stapel links oben über der Szene).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../assets/css/app.css', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const regel = (sel) => {
  const i = css.indexOf(`${sel} {`);
  assert.ok(i >= 0, `${sel} fehlt`);
  return css.slice(i, css.indexOf('}', i));
};

test('Die Zeichenfläche beginnt unter der oberen Leiste', () => {
  assert.match(css, /--leiste-oben:\s*calc\(/, 'Höhe der Leiste als Variable');
  const stage = regel('#stage');
  assert.match(stage, /top:\s*var\(--leiste-oben\)/);
  assert.match(stage, /height:\s*calc\(100% - var\(--leiste-oben\)\)/);
  assert.doesNotMatch(stage, /inset:\s*0/);
});

test('Die obere Leiste ist ein deckender Streifen genau in dieser Höhe', () => {
  const hud = regel('#hud');
  assert.match(hud, /top:\s*0/);
  assert.match(hud, /height:\s*var\(--leiste-oben\)/);
  assert.match(hud, /background:\s*var\(--bg\)/);
  assert.doesNotMatch(hud, /pointer-events:\s*none/);
});

test('Die Hinweis-Kärtchen stehen in der Leiste, nicht frei über der Szene', () => {
  const hud = html.slice(html.indexOf('<div id="hud"'), html.indexOf('<div id="task"'));
  assert.match(hud, /id="tray"/, '#tray steckt in #hud');
  assert.equal((html.match(/id="tray"/g) || []).length, 1);
  const tray = regel('.tray');
  assert.doesNotMatch(tray, /position:\s*(fixed|absolute)/);
  assert.match(tray, /flex-direction:\s*row/);
});
