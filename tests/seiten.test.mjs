// Seiten statt Scrollen: reine Aufteilung der Blöcke auf Seiten.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { verteileSeiten, seiteVon } from '../src/ui/seiten.js';

test('Alles passt auf eine Seite, ohne Blöcke gibt es eine leere Seite', () => {
  assert.deepEqual(verteileSeiten([100, 100, 100], 400), [[0, 1, 2]]);
  assert.deepEqual(verteileSeiten([], 400), [[]]);
});

test('Gierige Aufteilung: Blöcke bleiben in Reihenfolge und werden nie geteilt', () => {
  const s = verteileSeiten([200, 150, 100, 300], 400);
  assert.deepEqual(s, [[0, 1], [2, 3]]);
  assert.deepEqual(s.flat(), [0, 1, 2, 3]);
});

test('Ein zu hoher Block bekommt eine eigene Seite', () => {
  assert.deepEqual(verteileSeiten([100, 900, 100], 400), [[0], [1], [2]]);
  assert.deepEqual(verteileSeiten([900], 400), [[0]]);
});

test('Genau passende Summe bleibt auf einer Seite', () => {
  assert.deepEqual(verteileSeiten([200, 200, 1], 400), [[0, 1], [2]]);
});

test('Seite eines Blocks finden', () => {
  const s = verteileSeiten([200, 150, 100, 300], 400);
  assert.equal(seiteVon(s, 0), 0);
  assert.equal(seiteVon(s, 2), 1);
  assert.equal(seiteVon(s, 3), 1);
  assert.equal(seiteVon(s, 99), 0, 'unbekannter Block: Seite 0');
});

test('Kleben: Frage und Antworten bleiben zusammen, solange sie auf eine Seite passen', () => {
  // Blöcke: Auftrag(100), Frage(40), Antworten(200), Frage(40), Antworten(200); Seite 300
  const kleben = [false, true, false, true, false];
  assert.deepEqual(verteileSeiten([100, 40, 200, 40, 200], 300, kleben), [[0], [1, 2], [3, 4]]);
  assert.deepEqual(verteileSeiten([100, 40, 200, 40, 200], 300), [[0, 1], [2, 3], [4]], 'ohne Kleben wird die Frage von ihren Antworten getrennt');
});

test('Kleben: eine zu hohe Einheit wird in einzelne Blöcke aufgelöst', () => {
  assert.deepEqual(verteileSeiten([200, 300], 400, [true, false]), [[0], [1]]);
  assert.deepEqual(verteileSeiten([200, 150], 400, [true, false]), [[0, 1]]);
});
