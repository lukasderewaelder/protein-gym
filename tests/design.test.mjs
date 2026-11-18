// Design-Satz der Aufgabenfenster (assets/css/design.css): eine Schrift, drei Größen, zwei Gewichte, Farben nur aus dem Satz.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const wurzel = new URL('../', import.meta.url);
const css = readFileSync(new URL('assets/css/design.css', wurzel), 'utf8');
const html = readFileSync(new URL('index.html', wurzel), 'utf8');
/** CSS ohne Kommentare und ohne den Token-Block („.papier { … }“ mit den --ds-Variablen). */
const ohneKommentar = css.replace(/\/\*[\s\S]*?\*\//g, '');
const regeln = ohneKommentar.replace(/@font-face \{[\s\S]*?\n\}/g, '').replace(/\.papier \{[\s\S]*?\n\}/, '');

test('Schrift: Atkinson Hyperlegible liegt lokal im Projekt, mit Lizenz, und wird geladen', () => {
  for (const f of ['atkinson-hyperlegible-latin-400.woff2', 'atkinson-hyperlegible-latin-700.woff2', 'LICENSE-Atkinson-Hyperlegible.txt']) {
    assert.ok(existsSync(new URL(`assets/schrift/${f}`, wurzel)), `${f} fehlt`);
  }
  assert.match(readFileSync(new URL('assets/schrift/LICENSE-Atkinson-Hyperlegible.txt', wurzel), 'utf8'), /SIL OPEN FONT LICENSE/i);
  assert.equal((css.match(/@font-face/g) || []).length, 2, 'Regular und Bold');
  for (const gewicht of ['400', '700']) assert.match(css, new RegExp(`font-weight: ${gewicht}; font-display: swap`));
  // design.css kommt nach papier.css (sonst gewinnen die alten Regeln)
  assert.ok(html.indexOf('assets/css/design.css') > html.indexOf('assets/css/papier.css'), 'design.css nach papier.css laden');
});

test('Schriftfamilien: nur die Schrift des Satzes, Monospace für Codes und Formeln, sonst vererbt', () => {
  for (const m of regeln.matchAll(/font-family:\s*([^;]+);/g)) {
    assert.match(m[1].trim(), /^(var\(--ds-font\)|var\(--ds-mono\)|inherit)$/, `unerlaubte Schrift: ${m[1]}`);
  }
});

test('Gewichte: nur 400 und 700', () => {
  for (const m of regeln.matchAll(/font-weight:\s*(\d+)/g)) assert.ok(['400', '700'].includes(m[1]), `Gewicht ${m[1]}`);
});

test('Größen: Titel, Text und Klein; sonst nur die Mindestgröße für Felder', () => {
  for (const m of regeln.matchAll(/font-size:\s*([^;]+);/g)) {
    assert.match(m[1].trim(), /^(var\(--ds-(titel|text|klein)\)|max\(16px, var\(--ds-text\)\))$/, `unerlaubte Größe: ${m[1]}`);
  }
  assert.match(css, /--ds-titel: calc\(24px \* var\(--font-scale\)\)/);
  assert.match(css, /--ds-text: calc\(20px \* var\(--font-scale\)\)/);
  assert.match(css, /--ds-klein: calc\(16px \* var\(--font-scale\)\)/);
});

test('Farben: außerhalb des Token-Blocks nur wenige feste Werte, sonst Variablen des Satzes', () => {
  const erlaubt = new Set(['#fff', '#1d1305', '#ffa04a', '#fbe9a8', '#dfe6e9', '#35656b']);
  for (const m of regeln.matchAll(/#[0-9a-fA-F]{3,6}\b/g)) assert.ok(erlaubt.has(m[0].toLowerCase()), `Farbe ${m[0]} gehört in einen Token`);
});

test('Zustände nie nur über Farbe: richtig und falsch haben dicken Rahmen; Orange nur für den Hauptknopf', () => {
  assert.match(css, /\.papier \.option\.richtig[^{]*\{[^}]*border: 3px solid var\(--ds-ok\)/);
  assert.match(css, /\.papier \.option\.falsch[^{]*\{[^}]*border: 3px solid var\(--ds-fehler\)/);
  const mitOrange = regeln.split('}').filter((r) => /--ds-aktion/.test(r));
  for (const r of mitOrange) assert.match(r, /button\.primary/, `Orange außerhalb des Hauptknopfs: ${r.trim().slice(0, 60)}`);
  assert.match(css, /\.papier \.wackeln \{ animation: none; \}/, 'kein Rütteln bei Fehlern');
});
