// Digitale Experimente: Aktivierungscode (Groß-/Kleinschreibung egal), Freischaltung je Station, Daten der digitalen Durchführung.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { aktivierungsPruefwert, aktivierungOk, digitalFrei, digitalFreischalten } from '../src/state/digital.js';
import { defaultState } from '../src/state/store.js';

const V = JSON.parse(readFileSync(new URL('../data/versuch.json', import.meta.url), 'utf8'));
const IT = 1000; // wenige Runden genügen im Test
const TESTWORT = 'Beispiel Wort';

test('Aktivierungscode: Groß- und Kleinschreibung und Leerzeichen am Rand zählen nicht, ein anderes Wort passt nicht', async () => {
  const p = await aktivierungsPruefwert(TESTWORT, IT);
  assert.match(p, /^[0-9a-f]{64}$/);
  assert.equal(await aktivierungOk('Beispiel Wort', p, IT), true);
  assert.equal(await aktivierungOk('beispiel wort', p, IT), true);
  assert.equal(await aktivierungOk('  BEISPIEL WORT ', p, IT), true);
  assert.equal(await aktivierungOk('Beispiel', p, IT), false);
  assert.equal(await aktivierungOk('', p, IT), false, 'leer passt nie');
  assert.equal(await aktivierungOk(TESTWORT, '', IT), false, 'ohne Prüfwert passt nichts');
});

test('Freischaltung gilt je Experiment einzeln und bleibt im Spielstand', () => {
  const st = defaultState();
  assert.deepEqual(st.digitalFrei, {});
  assert.equal(digitalFrei(st, 'A'), false);
  digitalFreischalten(st, 'A');
  assert.equal(digitalFrei(st, 'A'), true);
  assert.equal(digitalFrei(st, 'L'), false, 'die Lieferung muss einzeln freigeschaltet werden');
  digitalFreischalten(st, 'L');
  assert.deepEqual(st.digitalFrei, { A: true, L: true });
  assert.equal(digitalFrei({}, 'A'), false, 'älterer Spielstand ohne das Feld');
});

test('Daten: Prüfwert statt Klartext, Texte und Aktionen für jedes Glas', () => {
  assert.match(V.digital.pruefwert, /^[0-9a-f]{64}$/);
  assert.ok(V.digital.iterationen >= 100000);
  for (const k of ['modusLive', 'modusDigital', 'frage', 'platzhalter', 'knopf', 'falsch', 'einleitung', 'hinweis', 'zuruecksetzen', 'fertig']) {
    assert.ok(V.versuchSchritt.digital[k], k);
  }
  for (const st of [V.stationA, V.lieferung]) {
    for (const pr of st.proben) {
      assert.ok(Array.isArray(pr.aktionen) && pr.aktionen.length >= 1, `${pr.id}: Aktionen`);
      for (const a of pr.aktionen) if (/Fehling/.test(a)) assert.match(a, /Kupfersulfat/, 'Fehling I nie allein');
    }
  }
  assert.ok(V.stationA.proben.every((p) => p.aktionen.length === 1), 'Hitze-Station: je Glas ein Versuch');
  assert.deepEqual(V.lieferung.proben.map((p) => p.aktionen.join(' > ')), Array(3).fill('Natronlauge zugeben > Kupfersulfat-Lösung (Fehling I) zugeben'), 'Biuret: je Glas Natronlauge, dann Kupfersulfat-Lösung');
  const alle = JSON.stringify(V.versuchSchritt.digital);
  assert.doesNotMatch(alle, /Auslöser|Handschuh/);
  assert.doesNotMatch(alle, /Skript/, 'die Erwartung wird im digitalen Versuch nicht verraten');
});
