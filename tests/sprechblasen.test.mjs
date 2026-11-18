// Sprechblasen nur bei Neuem: Eine Person trägt nur dann eine Blase, wenn das nächste Antippen etwas bringt, das man noch nicht gehört hat.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { neuigkeit, merkeGehoert, coachStufe } from '../src/state/sprechblasen.js';
import { naechsterSchritt } from '../src/state/naechster-schritt.js';

const lies = (n) => JSON.parse(readFileSync(new URL(`../data/${n}.json`, import.meta.url), 'utf8'));
const S = lies('szenen').szenen;
const A = lies('aufgaben');
const W = lies('wissen');
const person = (szene, id) => S.find((s) => s.id === szene).hotspots.find((h) => h.id === id);
const daten = { aufgaben: A, karten: W.karten };
/** Neuigkeit einer Person bei einem Spielstand (Station wie im Spiel aus naechsterSchritt). */
const neu = (szene, id, flags, gehoert = {}) => neuigkeit(person(szene, id), { flags, station: naechsterSchritt(flags, daten), gehoert, szene });

test('Nur Personen tragen Blasen: Türen, Dinge und fehlende Hotspots haben nie eine Neuigkeit', () => {
  assert.equal(neuigkeit(person('empfang', 'spind'), { flags: {} }), null);
  assert.equal(neuigkeit(person('empfang', 'tuer_labor'), { flags: {} }), null);
  assert.equal(neuigkeit(null, {}), null);
  assert.equal(neuigkeit(person('empfang', 'desi')), 'person_desi', 'ohne Kontext keine Ausnahme');
});

test('Desi und Zoe: Blase bis zum ersten Gespräch, danach keine', () => {
  const g = {};
  assert.equal(neu('empfang', 'desi', {}, g), 'person_desi');
  assert.equal(neu('shakebar', 'zoe', {}, g), 'person_zoe');
  assert.equal(merkeGehoert({ gehoert: g }, 'person_desi'), true);
  g.person_desi = true;
  assert.equal(neu('empfang', 'desi', {}, g), null);
  assert.equal(neu('shakebar', 'zoe', {}, g), 'person_zoe', 'Zoe unabhängig von Desi');
  assert.equal(merkeGehoert({ gehoert: g }, 'person_desi'), false, 'zweites Merken ist nichts Neues');
});

test('Kurt und Hannes: Blase, bis ihre Hinweiskarte eingesteckt ist', () => {
  assert.equal(neu('labor', 'kurt', {}), 'k_ausloeser');
  assert.equal(neu('labor', 'kurt', { k_ausloeser: true }), null);
  assert.equal(neu('sauna', 'hannes', {}), 'k_haltbar');
  assert.equal(neu('sauna', 'hannes', { k_haltbar: true }), null);
});

test('Alex: Blase, solange die Aufgabe der Shake-Bar die nächste Station ist', () => {
  const frueh = { empfang_done: true, labor_done: true, sauna_done: true, training_done: true };
  assert.equal(neu('shakebar', 'alex', frueh), null, 'erst die Hinweise suchen');
  const bereit = { ...frueh, ...Object.fromEntries(A.aufgaben.a6.braucht.map((f) => [f, true])) };
  assert.equal(naechsterSchritt(bereit, daten), 'shakebar_aufgabe');
  assert.equal(neu('shakebar', 'alex', bereit), 'aufgabe_shakebar');
  assert.equal(neu('shakebar', 'alex', { ...bereit, shakebar_done: true }), null);
});

test('Markus: Blase zur Einweisung, dann je Etappe einmal die Ansage, später Auflösung und Schlussquiz', () => {
  // Spielstart: Er hat nichts Neues (die Begrüßung hat schon zum Spind geschickt)
  assert.equal(neu('empfang', 'trainer', {}), null);
  assert.equal(neu('empfang', 'trainer', { spind_gesehen: true }), null, 'ohne Hinweise nur der Mahnhinweis');
  // Einweisung bereit: alle Karten der Einweisung gefunden
  const einweisung = { spind_gesehen: true, ...Object.fromEntries(A.aufgaben.a0.braucht.map((f) => [f, true])) };
  assert.equal(naechsterSchritt(einweisung, daten), 'einweisung');
  assert.equal(neu('empfang', 'trainer', einweisung), 'einweisung');
  // nach der Einweisung: Ansage der Etappe, einmal
  const nach = { ...einweisung, a0_done: true, empfang_done: true };
  const g = {};
  assert.equal(neu('empfang', 'trainer', nach, g), 'coach_labor');
  g.coach_labor = true;
  assert.equal(neu('empfang', 'trainer', nach, g), null);
  assert.equal(neu('empfang', 'trainer', { ...nach, labor_done: true }, g), 'coach_sauna', 'nächste Etappe, neue Ansage');
  assert.equal(coachStufe({ labor_done: true, sauna_done: true }), 'training');
  assert.equal(coachStufe({ labor_done: true, sauna_done: true, training_done: true }), 'shakebar');
  // Ende des Spiels
  const alle = { ...nach, labor_done: true, sauna_done: true, training_done: true, shakebar_done: true };
  assert.equal(neu('empfang', 'trainer', alle, { coach_shakebar: true }), 'aufloesung');
  assert.equal(neu('empfang', 'trainer', { ...alle, quiz_done: true }), null, 'Lieferung sagt er beim Lösen des Falls schon an');
  assert.equal(neu('empfang', 'trainer', { ...alle, quiz_done: true, lieferung_done: true }), 'schlussquiz');
  assert.equal(neu('empfang', 'trainer', { ...alle, quiz_done: true, lieferung_done: true, quiz2_done: true }), null);
});

test('Das Spiel zeichnet Blasen nur bei Neuem und merkt Gehörtes (keine Flags)', () => {
  const main = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
  const render = readFileSync(new URL('../src/engine/render.js', import.meta.url), 'utf8');
  assert.match(render, /if \(!st\.hatNeues \|\| st\.hatNeues\(hs\)\) drawSprechblase/);
  assert.match(main, /hatNeues: \(hs\) => neuigkeit\(hs, \{/);
  assert.match(main, /gehoertMerken\(`coach_\$\{weiter\}`\)/, 'Ansage von Markus');
  assert.match(main, /if \(hs\.type === 'npc'\) gehoertMerken\(`person_\$\{hs\.id\}`\)/, 'Gespräch mit Desi, Zoe');
  const store = readFileSync(new URL('../src/state/store.js', import.meta.url), 'utf8');
  assert.match(store, /gehoert: \{\}/);
  const code = readFileSync(new URL('../src/state/sprechblasen.js', import.meta.url), 'utf8');
  assert.doesNotMatch(code, /setFlag|store\.state\.flags\[/, 'Sprechblasen ändern den Fortschrittscode nicht');
});
