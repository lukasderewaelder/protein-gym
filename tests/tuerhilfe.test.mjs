// Hilfe an verschlossenen Türen: ab dem 2. Versuch sagt die passende Figur, was konkret fehlt.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { zaehleTuerVersuch, tuerHilfeDialog } from '../src/state/tuerhilfe.js';
import { naechsterSchritt } from '../src/state/naechster-schritt.js';
import { defaultState } from '../src/state/store.js';

const read = (n) => JSON.parse(readFileSync(new URL(`../data/${n}.json`, import.meta.url), 'utf8'));
const HILFE = read('hilfe');
const A = read('aufgaben');
const W = read('wissen');
const HEFTER = read('hefter');

test('Der Zähler zählt je Tür einzeln und bleibt im Spielstand', () => {
  const st = defaultState();
  assert.equal(zaehleTuerVersuch(st, 'tuer_sauna'), 1);
  assert.equal(zaehleTuerVersuch(st, 'tuer_sauna'), 2);
  assert.equal(zaehleTuerVersuch(st, 'tuer_shakebar'), 1);
  assert.deepEqual(st.tuerVersuche, { tuer_sauna: 2, tuer_shakebar: 1 });
  assert.equal(zaehleTuerVersuch({}, 'x'), 1, 'auch ohne das Feld (älterer Spielstand)');
});

test('Beim 1. Versuch gibt es keine Hilfe, ab dem 2. sagt die Figur des fehlenden Schritts, was konkret zu tun ist', () => {
  assert.equal(HILFE.tuerHilfe.ab, 2);
  assert.equal(tuerHilfeDialog(1, 'labor_aufgabe', HILFE), null);
  // Sauna-Tür, Labor noch nicht geschafft, alle Hinweise im Labor gefunden: Kurt nennt die Aufgabe im Labor
  const flags = { empfang_done: true, lf_bestanden: true, labor_offen: true, k_denat: true, k_ausloeser: true, k_biuret: true };
  const schritt = naechsterSchritt(flags, { aufgaben: A, karten: W.karten, hefter: HEFTER, haken: {} });
  assert.equal(schritt, 'labor_aufgabe');
  const d = tuerHilfeDialog(2, schritt, HILFE);
  assert.equal(d.speaker, 'Kupfer-Kurt');
  assert.equal(d.portrait, 'kurt');
  assert.equal(d.lines.length, 3);
  assert.equal(d.lines[2], HILFE.schritte.labor_aufgabe.konkret, 'die letzte Zeile ist die konkrete Hilfe');
  assert.deepEqual(tuerHilfeDialog(3, schritt, HILFE), d, 'jedes weitere Antippen gibt dieselbe Hilfe');
});

test('Jeder Ort eines Hilfeschritts hat eine Figur, jede Figur hat ein Porträt und eine Einleitung; unbekannte Schritte geben nichts', () => {
  const orte = new Set(Object.values(HILFE.schritte).map((s) => s.ort));
  for (const o of orte) assert.ok(HILFE.tuerHilfe.figuren[o] || HILFE.tuerHilfe.figuren.Standard, `Figur für ${o}`);
  for (const [ort, f] of Object.entries(HILFE.tuerHilfe.figuren)) {
    assert.ok(f.von && f.einleitung, ort);
    assert.ok(readFileSync(new URL(`../assets/portraits/${f.portrait}_0.webp`, import.meta.url)), `Porträt ${f.portrait}`);
  }
  for (const id of Object.keys(HILFE.schritte)) {
    const d = tuerHilfeDialog(2, id, HILFE);
    assert.ok(d && d.lines.every(Boolean), id);
  }
  assert.equal(tuerHilfeDialog(5, 'gibt_es_nicht', HILFE), null);
  assert.equal(tuerHilfeDialog(5, 'spind', {}), null);
});

test('Hilfe an den Türen: Labor-Hinweise nennt Kurt, die Shake-Bar Alex, die Sauna Hannes, der Rest Markus', () => {
  const von = (id) => tuerHilfeDialog(2, id, HILFE).speaker;
  assert.equal(von('labor_hinweise'), 'Kupfer-Kurt');
  assert.equal(von('sauna_hinweise'), 'Hitze-Hannes');
  assert.equal(von('shakebar_aufgabe'), 'Alex');
  assert.equal(von('einweisung'), 'Markus');
  assert.equal(von('hefter'), 'Markus');
  assert.equal(von('training_aufgabe'), 'Markus');
});
