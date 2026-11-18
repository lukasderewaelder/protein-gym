// Hilfe nur bei Bedarf: Die Ziel-Zeile erscheint nach 1 Minute ohne Fortschritt oder nach 2× etwas Falschem.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { neueHilfeUhr, tick, falsch, fortschritt } from '../src/state/hilfe-uhr.js';

test('Nach 59 s ohne Fortschritt noch keine Hilfe, nach 60 s schon', () => {
  const u = neueHilfeUhr();
  for (let i = 0; i < 59; i++) assert.equal(tick(u, 1000, true), false);
  assert.equal(u.sichtbar, false);
  assert.equal(tick(u, 1000, true), true, 'erscheint genau jetzt');
  assert.equal(u.sichtbar, true);
  assert.equal(tick(u, 1000, true), false, 'meldet sich nur einmal');
});

test('Zeit zählt nicht, solange ein Fenster, Gespräch oder eine Aufgabe offen ist', () => {
  const u = neueHilfeUhr();
  for (let i = 0; i < 120; i++) tick(u, 1000, false);
  assert.equal(u.sichtbar, false);
  assert.equal(u.ruheMs, 0);
});

test('Ein Fehler: noch keine Hilfe, zwei Fehler: Hilfe', () => {
  const u = neueHilfeUhr();
  assert.equal(falsch(u), false);
  assert.equal(u.sichtbar, false);
  assert.equal(falsch(u), true);
  assert.equal(u.sichtbar, true);
});

test('Fortschritt blendet die Hilfe aus, Zeit und Fehler beginnen von vorn', () => {
  const u = neueHilfeUhr();
  falsch(u);
  for (let i = 0; i < 40; i++) tick(u, 1000, true);
  fortschritt(u);
  assert.deepEqual([u.ruheMs, u.fehler, u.sichtbar], [0, 0, false]);
  assert.equal(falsch(u), false, 'ein neuer Fehler allein reicht wieder nicht');
  falsch(u);
  assert.equal(u.sichtbar, true);
  fortschritt(u);
  assert.equal(u.sichtbar, false);
});

test('Falsches wird an allen Stellen gemeldet (Aufgaben, Codes und Schlösser, Türen, Markus)', () => {
  const lies = (p) => readFileSync(new URL(`../src/${p}`, import.meta.url), 'utf8');
  assert.match(lies('ui/taskpanel.js'), /fail\(msg\) \{\n\s+S\.attempts\+\+;\n\s+meldeFalsch\(\);/);
  const zugang = lies('ui/zugang.js');
  assert.equal((zugang.match(/fehler\+\+;\n\s+meldeFalsch\(\);/g) || []).length, 3, 'drei Schlösser mit Code');
  assert.match(zugang, /if \(!r\.richtig\) \{ meldeFalsch\(\);/, 'Fragentest');
  assert.match(lies('tasks/labor-types.js'), /meldeFalsch\(\); api\.say\(`✗ \$\{t\.codeFalsch\}`\)/);
  const main = lies('main.js');
  assert.match(main, /if \(!richtigerWeg\) meldeFalsch\(\);/, 'verschlossene Tür');
  assert.match(main, /meldeFalsch\(\); playDialog\('empfang\.coach\.keinhinweis'\)/);
  // Die Ziel-Zeile ist nur bei sichtbarer Hilfe zu sehen
  assert.match(main, /if \(!z \|\| !hilfeUhr\.sichtbar\) \{ knopf\.hidden = true; return; \}/);
});
