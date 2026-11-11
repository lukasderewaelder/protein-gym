// „Wie geht’s weiter?“: Station für jeden Spielstand von „frisch“ bis „Fall gelöst“, Texte vollständig.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { naechsterSchritt } from '../src/state/naechster-schritt.js';
import { alleFallKarten } from '../src/state/fall.js';

const lies = (n) => JSON.parse(readFileSync(new URL(`../data/${n}.json`, import.meta.url), 'utf8'));
const A = lies('aufgaben');
const W = lies('wissen');
const H = lies('hilfe');
const daten = { aufgaben: A, karten: W.karten };
const schritt = (flags) => naechsterSchritt(flags, daten);
const mit = (...ids) => Object.fromEntries(ids.map((i) => [i, true]));

test('Ganzer Spielverlauf: die Station wechselt in der richtigen Reihenfolge', () => {
  const f = {};
  const verlauf = [];
  const merke = () => { const s = schritt(f); if (verlauf[verlauf.length - 1] !== s) verlauf.push(s); };
  const setze = (...ids) => { for (const i of ids) { f[i] = true; merke(); } };
  merke();
  setze('intro_done', 'spind_gesehen');
  setze('k_protein', 'k_wichtig', 'a0_done', 'empfang_done');
  setze('lf_bestanden', 'item_ausweis', 'item_ausweis_benutzt', 'labor_offen');
  setze('k_denat', 'k_ausloeser', 'k_biuret', 'lab_frei', 'a4_done', 'labor_done');
  setze('sauna_info', 'sauna_code_gesehen', 'sauna_offen');
  setze('k_hitze', 'k_umkehr', 'k_haltbar', 'a5_done', 'sauna_done');
  setze('k_bauplan', 'k_rest', 'k_kette', 'k_struktur', 'a3_done', 'a1_done', 'training_done');
  setze('k_dose', 'k_abbau', 'k_geronnen', 'a6_done', 'shakebar_done');
  setze('quiz_done');
  setze('a7_done', 'lieferung_done');
  setze('quiz2_task', 'quiz2_done');
  assert.deepEqual(verlauf, [
    'spind', 'empfang_hinweise', 'einweisung', 'fuehrerschein', 'leser',
    'labor_hinweise', 'labor_freigabe', 'labor_aufgabe',
    'sauna_code_suchen', 'saunatuer', 'sauna_hinweise', 'sauna_aufgabe',
    'training_hinweise', 'training_aufgabe', 'shakebar_hinweise', 'shakebar_aufgabe',
    'aufloesung', 'lieferung_labor', 'schlussquiz', 'fertig',
  ]);
});

test('Einzelne Spielstände', () => {
  assert.equal(schritt({}), 'spind');
  assert.equal(schritt(mit('empfang_done')), 'fuehrerschein');
  assert.equal(schritt(mit('empfang_done', 'lf_bestanden')), 'leser');
  assert.equal(schritt(mit('empfang_done', 'lf_bestanden', 'labor_offen')), 'labor_hinweise');
  assert.equal(schritt(mit('empfang_done', 'labor_done')), 'sauna_code_suchen', 'auch ohne Führerschein-Flags, wer das Labor schon hatte');
  assert.equal(schritt(mit('empfang_done', 'labor_done', 'sauna_code_gesehen')), 'saunatuer');
  assert.equal(schritt(mit('empfang_done', 'sauna_code_gesehen')), 'fuehrerschein', 'Code früh entdeckt: erst das Labor, die Tür bleibt bis dahin zu');
  assert.equal(schritt(mit('empfang_done', 'labor_done', 'sauna_offen', 'sauna_done')), 'training_hinweise');
  assert.equal(schritt(mit('empfang_done', 'labor_done', 'sauna_done', 'training_done', 'shakebar_done')), 'aufloesung');
});

test('Jede Station hat grobe und konkrete Hilfe von Markus', () => {
  const ids = new Set();
  const f = {};
  // alle möglichen Stationen einsammeln: Flags nacheinander setzen, außerdem die festen Stationen
  for (const t of Object.values(A.aufgaben)) f[t.flag] = false;
  const alle = ['spind', 'empfang_hinweise', 'einweisung', 'fuehrerschein', 'leser', 'labor_hinweise', 'labor_freigabe', 'labor_aufgabe', 'sauna_code_suchen', 'saunatuer',
    'sauna_hinweise', 'sauna_aufgabe', 'training_hinweise', 'training_aufgabe', 'shakebar_hinweise', 'shakebar_aufgabe', 'aufloesung', 'lieferung_labor', 'schlussquiz', 'fertig'];
  for (const id of alle) {
    const s = H.schritte[id];
    assert.ok(s, `Text für ${id}`);
    assert.ok(s.ort && s.grob && s.konkret, id);
    assert.notEqual(s.grob, s.konkret, `${id}: Stufe 2 ist genauer als Stufe 1`);
    ids.add(id);
  }
  assert.deepEqual(Object.keys(H.schritte).sort(), [...ids].sort(), 'keine ungenutzten Texte');
});

test('Die Hilfe gibt den Ort der Hinweise genau an (Hotspots stimmen mit den Karten überein)', () => {
  const S = lies('szenen');
  const orte = { labor: ['kuehlschrank', 'plakat', 'kurt'], sauna: ['ofen', 'thermometer', 'hannes'], training: ['scheiben', 'spiegel', 'plan', 'aushang'], shakebar: ['mixer', 'regal', 'vitrine'], empfang: ['tresen', 'spiegel'] };
  for (const [raum, ids] of Object.entries(orte)) {
    const sz = S.szenen.find((s) => s.id === raum);
    const pflicht = W.karten.filter((k) => k.raum === raum && k.typ === 'pflicht').map((k) => k.id);
    for (const hid of ids) {
      const hs = sz.hotspots.find((h) => h.id === hid);
      assert.ok(hs, `${raum}/${hid}`);
      assert.ok(pflicht.includes(hs.karte), `${raum}/${hid} trägt eine Pflichtkarte`);
    }
    assert.equal(pflicht.length, ids.length, `${raum}: alle Pflichtkarten stehen in der Hilfe`);
  }
});

test('Fall-Hinweise (Laufzeit-Karten) bringen die Hilfe nicht durcheinander', () => {
  const fall = lies('fall');
  const mitFall = { aufgaben: A, karten: [...W.karten, ...alleFallKarten('desi', fall)] };
  assert.equal(naechsterSchritt({ empfang_done: true, lf_bestanden: true, labor_offen: true, k_denat: true, k_ausloeser: true, k_biuret: true, lab_frei: true }, mitFall), 'labor_aufgabe');
});
