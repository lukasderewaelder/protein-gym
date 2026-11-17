// Kein Fenster scrollt: Mit vielen Gegenständen wird die Tasche (Fenster #zugang über den Taschenknopf) geblättert.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const main = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
const zugang = readFileSync(new URL('../src/ui/zugang.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../assets/css/zugang.css', import.meta.url), 'utf8');

test('Die Tasche verteilt ihre Gegenstände auf Seiten statt zu scrollen', () => {
  const i = main.indexOf('function taschenFenster()');
  assert.ok(i >= 0, 'taschenFenster fehlt');
  const rumpf = main.slice(i, main.indexOf('\n}', i));
  assert.match(rumpf, /macheSeiten\(liste/, 'Liste der Tasche wird nicht geblättert');
  assert.match(rumpf, /classList\.add\('tasche'\)/);
  // Die Blätterleiste ist beim ersten Messen sichtbar, sonst rechnet die Liste mit zu viel Platz und die letzte Karte ragt hinaus
  assert.doesNotMatch(rumpf, /tasche-nav'[^)]*hidden: true/);
  assert.match(main, /\$\('#zugang'\)\.addEventListener\('close', \(\) => \{ if \(taschenSeiten\)/, 'Blättern endet nicht mit dem Fenster');
});

test('Andere Fenster im Dialog #zugang erben den Aufbau der Tasche nicht', () => {
  const i = zugang.indexOf('function zeige(titel');
  assert.match(zugang.slice(i, zugang.indexOf('}', i)), /classList\.remove\('tasche'\)/);
});

test('Liste der Tasche schneidet ab statt zu scrollen, das Fenster selbst scrollt nicht', () => {
  assert.match(css, /dialog#zugang\.tasche \{ overflow: hidden; \}/);
  assert.match(css, /\.tasche-liste\.seiten-voll \{[^}]*overflow: hidden/);
  assert.match(css, /dialog#zugang\.tasche:has\(\.seiten-voll\) \{ height: calc\(100dvh - 24px\); \}/);
});
