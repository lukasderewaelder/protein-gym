// Fortschrittscode auf der Lehrkräfte-Seite: Stände je Station (src/state/staende.js)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { STAENDE, standFlags, standZustand, fremdeFlags } from '../src/state/staende.js';
import { encodeProgress, decodeProgress } from '../src/state/progress.js';
import { naechsterSchritt } from '../src/state/naechster-schritt.js';

const lies = (n) => JSON.parse(readFileSync(new URL(`../data/${n}.json`, import.meta.url), 'utf8'));
const wissen = lies('wissen');
const aufgaben = lies('aufgaben');
const hefter = lies('hefter');
const daten = (haken = {}) => ({ aufgaben, karten: wissen.karten, hefter, haken });
const alleHaken = Object.fromEntries(hefter.eintraege.map((e) => [e.id, true]));

test('jedes Flag eines Stands steht im Fortschrittscode', () => {
  assert.deepEqual(fremdeFlags(wissen.karten), []);
});

test('jeder Stand übersteht Kodieren und Einlesen', () => {
  for (const s of STAENDE) {
    const z = standZustand(s.id, wissen.karten, { taeter: 'kurt', niveaus: { labor: 2, sauna: 0, training: 1, shakebar: 2 }, quiz: 3, quiz2: 1 }, () => 0.3);
    const r = decodeProgress(encodeProgress(z));
    assert.ok(r.ok, s.id);
    assert.deepEqual(r.state.flags, z.flags, s.id);
    assert.equal(r.state.scene, s.szene, s.id);
    assert.equal(r.state.fall.taeter, 'kurt');
    assert.deepEqual(r.state.levels, { labor: 2, sauna: 0, training: 1, shakebar: 2 });
    assert.equal(r.state.codes.sauna, z.codes.sauna);
  }
});

test('nach jedem Stand geht es an der richtigen Station weiter', () => {
  const erwartet = {
    empfang_anfang: 'spind',
    empfang_fertig: 'fuehrerschein',
    labor_anfang: 'labor_hinweise',
    labor_fertig: 'sauna_code_suchen',
    sauna_anfang: 'sauna_hinweise',
    sauna_fertig: 'training_hinweise',
    training_anfang: 'training_hinweise',
    training_fertig: 'shakebar_hinweise',
    shakebar_anfang: 'shakebar_hinweise',
    shakebar_fertig: 'aufloesung',
    aufloesung_fertig: 'lieferung_labor',
    lieferung_fertig: 'schlussquiz',
    schluss_fertig: 'fertig',
  };
  assert.deepEqual(STAENDE.map((s) => s.id), Object.keys(erwartet));
  for (const s of STAENDE) assert.equal(naechsterSchritt(standFlags(s.id, wissen.karten), daten(alleHaken)), erwartet[s.id], s.id);
  // Die Hefter-Haken liegen nur auf dem Gerät: Nach dem Einlesen kommt zuerst der Hefter dran, nie hängt jemand fest
  assert.equal(naechsterSchritt(standFlags('sauna_fertig', wissen.karten), daten()), 'hefter');
  assert.equal(naechsterSchritt(standFlags('training_anfang', wissen.karten), daten()), 'hefter'); // auch schon im Raum: erst Haken setzen (Spind)
});

test('Stände bauen aufeinander auf, Quizergebnisse erst ab der Auflösung', () => {
  let vorher = {};
  for (const s of STAENDE) {
    const f = standFlags(s.id, wissen.karten);
    for (const k of Object.keys(vorher)) assert.ok(f[k], `${s.id} verliert ${k}`);
    vorher = f;
  }
  assert.equal(standZustand('shakebar_fertig', wissen.karten).quiz, null);
  assert.deepEqual(standZustand('aufloesung_fertig', wissen.karten, { quiz: 2 }).quiz, { richtig: 2, von: 4 });
  assert.equal(standZustand('aufloesung_fertig', wissen.karten).quiz2, null);
  assert.deepEqual(standZustand('schluss_fertig', wissen.karten).quiz2, { richtig: 2, von: 2 });
  assert.equal(standZustand('gibt_es_nicht', wissen.karten), null);
});

test('Pflichtaufgaben jedes geschafften Raums sind erledigt', () => {
  for (const s of STAENDE.filter((x) => x.raum)) {
    const f = standFlags(s.id, wissen.karten);
    for (const id of aufgaben.raeume[s.raum].pflicht) assert.ok(f[aufgaben.aufgaben[id].flag], `${s.id}: ${id}`);
    assert.ok(f[aufgaben.raeume[s.raum].fertigFlag], s.id);
  }
});
