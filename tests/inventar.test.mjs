// Inventar: Gegenstände aus Flags, „benutzt“ bleibt sichtbar, Neu-Zähler, Daten stimmig.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { liste, neuAnzahl, markiereGesehen } from '../src/state/inventar.js';
import { FLAG_LIST } from '../src/state/progress.js';
import { createStore } from '../src/state/store.js';

const daten = JSON.parse(readFileSync(new URL('../data/inventar.json', import.meta.url), 'utf8'));
const hat = (flags) => (f) => Boolean(flags[f]);

test('Ohne Flags ist die Tasche leer', () => {
  assert.deepEqual(liste(daten.gegenstaende, hat({})), []);
});

test('Der Ausweis erscheint nach dem Führerschein und bleibt nach dem Benutzen als „benutzt“ erhalten', () => {
  const neu = liste(daten.gegenstaende, hat({ item_ausweis: true }));
  assert.equal(neu.length, 1);
  assert.equal(neu[0].id, 'ausweis');
  assert.equal(neu[0].benutzt, false);
  const benutzt = liste(daten.gegenstaende, hat({ item_ausweis: true, item_ausweis_benutzt: true }));
  assert.equal(benutzt.length, 1, 'bleibt in der Tasche');
  assert.equal(benutzt[0].benutzt, true);
});

test('Zählpunkt: neue Gegenstände zählen, angesehene nicht', () => {
  const items = liste(daten.gegenstaende, hat({ item_ausweis: true }));
  assert.equal(neuAnzahl(items, {}), 1);
  const gesehen = markiereGesehen(items, {});
  assert.equal(neuAnzahl(items, gesehen), 0);
});

test('Alle Flags des Inventars stehen in der FLAG_LIST (und im Fortschrittscode)', () => {
  const ids = new Set();
  for (const g of daten.gegenstaende) {
    assert.ok(!ids.has(g.id), `doppelte ID ${g.id}`);
    ids.add(g.id);
    assert.ok(FLAG_LIST.includes(g.hat), `${g.id}: Flag ${g.hat}`);
    if (g.benutzt) assert.ok(FLAG_LIST.includes(g.benutzt), `${g.id}: Flag ${g.benutzt}`);
    assert.ok(g.name && g.text, `${g.id}: Name und Text`);
  }
});

test('Der Speicher setzt Flags und meldet sie den Hörern (Tasche)', () => {
  const s = createStore(null);
  s.load();
  const gemeldet = [];
  s.onFlag((n) => gemeldet.push(n));
  s.setFlag('item_ausweis');
  assert.deepEqual(gemeldet, ['item_ausweis']);
  assert.equal(s.hasFlag('item_ausweis'), true);
});
