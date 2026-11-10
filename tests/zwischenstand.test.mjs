// Zwischenstände im Browser: Aufgabenfortschritt und Position bleiben nach Schließen oder Neuladen erhalten.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { merkeFortschritt, holeFortschritt, loescheFortschritt, merkePosition, holePosition } from '../src/state/zwischenstand.js';
import { createStore, STORAGE_KEY } from '../src/state/store.js';

function fakeStorage() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
}

test('Aufgabe: gemerkter Schritt kommt beim Wiederöffnen zurück, mit den richtigen Erstversuchen', () => {
  const s = { taskProgress: {} };
  merkeFortschritt(s, 'a3', 'B', 2, [true, undefined, false]);
  assert.deepEqual(holeFortschritt(s, 'a3', 'B', 5), { step: 2, first: [true, false, false] });
});

test('Aufgabe: anderes Niveau, unpassender Schritt oder nichts gemerkt ergeben keinen Zwischenstand', () => {
  const s = { taskProgress: {} };
  assert.equal(holeFortschritt(s, 'a3', 'B', 5), null);
  merkeFortschritt(s, 'a3', 'B', 2, []);
  assert.equal(holeFortschritt(s, 'a3', 'A', 5), null, 'Niveau gewechselt');
  assert.equal(holeFortschritt(s, 'a3', 'B', 2), null, 'Schritt gibt es nicht mehr');
  merkeFortschritt(s, 'a3', 'B', 0, []);
  assert.equal(holeFortschritt(s, 'a3', 'B', 5), null, 'Schritt 1 braucht keinen Zwischenstand');
  assert.equal(holeFortschritt({}, 'a3', 'B', 5), null, 'alter Spielstand ohne Feld');
});

test('Aufgabe: nach dem Abschluss ist der Zwischenstand weg, andere Aufgaben bleiben', () => {
  const s = { taskProgress: {} };
  merkeFortschritt(s, 'a3', 'B', 2, []);
  merkeFortschritt(s, 'a1', 'A', 1, []);
  loescheFortschritt(s, 'a3');
  assert.equal(holeFortschritt(s, 'a3', 'B', 5), null);
  assert.ok(holeFortschritt(s, 'a1', 'A', 3));
});

test('Position: gilt nur für den gespeicherten Raum', () => {
  const s = {};
  merkePosition(s, 'labor', 700.4, 640.6);
  assert.deepEqual(holePosition(s, 'labor'), { x: 700, y: 641 });
  assert.equal(holePosition(s, 'sauna'), null);
  assert.equal(holePosition({ pos: { scene: 'labor', x: 'a', y: 1 } }, 'labor'), null, 'kaputte Werte werden ignoriert');
});

test('Zwischenstände überstehen Schließen und Neustart des Browsers (Speicher)', () => {
  const st = fakeStorage();
  const a = createStore(st);
  a.load();
  a.state.names = ['Mia'];
  merkeFortschritt(a.state, 'quiz', 'alle', 2, [true, true]);
  merkePosition(a.state, 'training', 500, 600);
  a.save();
  const b = createStore(st); // neuer Browserstart
  b.load();
  assert.deepEqual(holeFortschritt(b.state, 'quiz', 'alle', 6), { step: 2, first: [true, true] });
  assert.deepEqual(holePosition(b.state, 'training'), { x: 500, y: 600 });
  assert.ok(st.getItem(STORAGE_KEY));
  b.reset();
  assert.equal(holeFortschritt(b.state, 'quiz', 'alle', 6), null, 'Neues Spiel löscht auch die Zwischenstände');
  assert.equal(b.state.pos, null);
});
