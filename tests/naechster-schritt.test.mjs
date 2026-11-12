// „Wie geht’s weiter?“: Station für jeden Spielstand von „frisch“ bis „Fall gelöst“, Texte vollständig.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { naechsterSchritt, zielZeile, wegStationen } from '../src/state/naechster-schritt.js';
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
  setze('k_denat', 'k_ausloeser', 'k_biuret', 'a4_done', 'labor_done');
  setze('sauna_info', 'sauna_code_gesehen', 'sauna_offen');
  setze('k_hitze', 'k_umkehr', 'k_haltbar', 'a5_done', 'sauna_done');
  setze('k_bauplan', 'k_rest', 'k_kette', 'k_struktur', 'a3_done', 'a1_done', 'training_done');
  setze('k_dose', 'k_abbau', 'k_geronnen', 'a6_done', 'shakebar_done');
  setze('quiz_done');
  setze('a7_done', 'lieferung_done');
  setze('quiz2_task', 'quiz2_done');
  assert.deepEqual(verlauf, [
    'spind', 'empfang_hinweise', 'einweisung', 'fuehrerschein', 'leser',
    'labor_hinweise', 'labor_aufgabe',
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
  const alle = ['spind', 'empfang_hinweise', 'einweisung', 'fuehrerschein', 'leser', 'labor_hinweise', 'labor_aufgabe', 'sauna_code_suchen', 'saunatuer',
    'sauna_hinweise', 'sauna_aufgabe', 'training_hinweise', 'training_aufgabe', 'shakebar_hinweise', 'shakebar_aufgabe', 'aufloesung', 'lieferung_labor', 'schlussquiz', 'fertig', 'hefter'];
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
  assert.equal(naechsterSchritt({ empfang_done: true, lf_bestanden: true, labor_offen: true, k_denat: true, k_ausloeser: true, k_biuret: true }, mitFall), 'labor_aufgabe');
});

test('Ein nicht abgeschriebener Heftereintrag kommt vor dem gesperrten Raum', () => {
  const hefter = JSON.parse(readFileSync(new URL('../data/hefter.json', import.meta.url), 'utf8'));
  const d = { aufgaben: A, karten: [], hefter, haken: {} };
  const f = { empfang_done: true, labor_done: true, sauna_done: true };
  assert.equal(naechsterSchritt(f, d), 'hefter');
  assert.notEqual(naechsterSchritt(f, { ...d, haken: { h1: true } }), 'hefter');
  assert.notEqual(naechsterSchritt(f, { aufgaben: A, karten: [] }), 'hefter', 'ohne Hefterdaten wie bisher');
});

test('Ziel-Zeile: jede Station hat einen kurzen Satz (höchstens 40 Zeichen), Hinweise zählen die fehlenden Karten', () => {
  for (const [id, s] of Object.entries(H.schritte)) {
    assert.ok(s.kurz && s.kurz.length <= 40, `${id}: kurz fehlt oder ist zu lang (${(s.kurz || '').length})`);
    assert.doesNotMatch(s.kurz, /Täter|Verdächtig|Auslöser/, id);
  }
  const z0 = zielZeile(schritt({}), {}, daten, H);
  assert.equal(z0.id, 'spind');
  assert.equal(z0.text, 'Öffne deinen Spind');
  const z1 = zielZeile(schritt(mit('spind_gesehen')), mit('spind_gesehen'), daten, H);
  assert.equal(z1.id, 'empfang_hinweise');
  assert.match(z1.text, /^Such die Hinweise im Empfang \(noch \d+\)$/);
  const f = mit('spind_gesehen', 'k_protein', 'k_wichtig');
  assert.equal(zielZeile(schritt(f), f, daten, H).text, 'Sprich mit Markus', 'ohne Zähler, wenn nichts mehr fehlt');
  assert.equal(zielZeile('gibtsnicht', {}, daten, H), null);
});

test('Ziel-Zeile: jeder Spielstand des Verlaufs ergibt eine Zeile mit Ort', () => {
  for (const id of Object.keys(H.schritte)) {
    const z = zielZeile(id, {}, daten, H);
    assert.ok(z && z.text && z.ort, id);
  }
});

test('Dein Weg: acht Etappen in Spielreihenfolge, genau eine ist „jetzt“, bis alles fertig ist', () => {
  const namen = wegStationen({}).map((s) => s.name);
  assert.deepEqual(namen, ['Empfang', 'Labor', 'Sauna', 'Training', 'Shake-Bar', 'Auflösung', 'Lieferung', 'Schlussquiz']);
  assert.deepEqual(wegStationen({}).map((s) => s.status), ['jetzt', 'offen', 'offen', 'offen', 'offen', 'offen', 'offen', 'offen']);
  const mitte = wegStationen(mit('empfang_done', 'labor_done')).map((s) => s.status);
  assert.deepEqual(mitte, ['fertig', 'fertig', 'jetzt', 'offen', 'offen', 'offen', 'offen', 'offen']);
  const alle = wegStationen(mit('empfang_done', 'labor_done', 'sauna_done', 'training_done', 'shakebar_done', 'quiz_done', 'lieferung_done', 'quiz2_done'));
  assert.ok(alle.every((s) => s.status === 'fertig'), 'am Ende keine offene Etappe');
});

test('Raum-Begrüßungen: jeder Raum mit Aufgabe sagt beim ersten Betreten die Reihenfolge (Hinweise, dann Aufgabe)', () => {
  const D = lies('dialoge');
  const S = lies('szenen');
  const mitAufgabe = ['labor', 'sauna', 'training', 'shakebar'];
  for (const r of mitAufgabe) {
    const d = D[`raum.${r}.start`];
    assert.ok(d, `raum.${r}.start fehlt`);
    assert.equal(d.setFlag, `raum_${r}_gruss`);
    assert.match(d.lines.join(' '), /Hinweise/);
    assert.match(d.lines.join(' '), /Aufgabe/);
    assert.ok(S.szenen.some((s) => s.id === r), r);
  }
  assert.match(D['empfang.intro'].lines.join(' '), /Oben in der Leiste steht immer, was als Nächstes dran ist/);
});
