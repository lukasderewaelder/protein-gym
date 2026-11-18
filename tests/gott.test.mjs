// Lehrkraft-Modus im Spiel (src/state/gott.js)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { gottFreigabe, gottToken, gottFlags, gottStand, GOTT_DAUER_MS } from '../src/state/gott.js';
import { FLAG_LIST } from '../src/state/progress.js';
import { defaultState, createStore, STORAGE_KEY, GOTT_SPIEL_KEY } from '../src/state/store.js';
import { naechsterSchritt } from '../src/state/naechster-schritt.js';
import { sperrenderEintrag } from '../src/state/hefter.js';

const lies = (n) => JSON.parse(readFileSync(new URL(`../data/${n}.json`, import.meta.url), 'utf8'));
const wissen = lies('wissen');
const dialoge = lies('dialoge');
const hefter = lies('hefter');
const aufgaben = lies('aufgaben');
const szenen = lies('szenen').szenen.map((s) => s.id);

test('Freigabe gilt 12 Stunden, kaputte Freigaben gelten nicht', () => {
  const f = gottFreigabe('abc', 1000);
  assert.equal(gottToken(f, 1000 + GOTT_DAUER_MS - 1), 'abc');
  assert.equal(gottToken(f, 1000 + GOTT_DAUER_MS + 1), null);
  for (const x of [null, '', 'kaputt', '{"t":5,"bis":99999999999999}']) assert.equal(gottToken(x, 0), null);
});

test('Im Lehrkraft-Modus ist alles frei: Flags, Karten, Hefter, keine Sperre', () => {
  const s = gottStand(defaultState(), { karten: wissen.karten, dialoge, szenen, hefter, tipps: ['hefter'] });
  for (const f of FLAG_LIST) assert.ok(s.flags[f], f);
  for (const k of wissen.karten) assert.ok(s.flags[k.id], k.id);
  for (const r of ['training', 'shakebar', 'schluss']) assert.equal(sperrenderEintrag(hefter, s.flags, s.hefterHaken, r), null);
  assert.equal(naechsterSchritt(s.flags, { aufgaben, karten: wissen.karten, hefter, haken: s.hefterHaken }), 'fertig');
  for (const id of szenen) if (dialoge[`raum.${id}.start`]) assert.ok(s.flags[`raum_${id}_gruss`], `keine Begrüßung in ${id}`);
  assert.ok(s.flags.intro_done && s.tipps.hefter);
  assert.deepEqual(s.names, ['Lehrkraft']);
  assert.ok(Object.keys(gottFlags({ karten: wissen.karten, dialoge, szenen })).length >= FLAG_LIST.length);
});

test('Der Lehrkraft-Modus speichert getrennt vom Spielstand der Lernenden', () => {
  const daten = new Map();
  const st = { getItem: (k) => (daten.has(k) ? daten.get(k) : null), setItem: (k, v) => daten.set(k, String(v)), removeItem: (k) => daten.delete(k) };
  const lernende = createStore(st);
  lernende.load();
  lernende.state.names = ['Mia'];
  lernende.setFlag('empfang_done');
  const lehrkraft = createStore(st, Math.random, GOTT_SPIEL_KEY);
  lehrkraft.load();
  gottStand(lehrkraft.state, { karten: wissen.karten, dialoge, szenen, hefter });
  lehrkraft.save();
  lehrkraft.reset();
  const wieder = createStore(st);
  wieder.load();
  assert.deepEqual(wieder.state.names, ['Mia']);
  assert.deepEqual(Object.keys(wieder.state.flags), ['empfang_done']);
  assert.ok(daten.has(STORAGE_KEY));
});
