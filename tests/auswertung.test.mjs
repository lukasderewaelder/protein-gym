import { test } from 'node:test';
import assert from 'node:assert/strict';
import { encodeProgress, decodeProgress } from '../src/state/progress.js';
import { parseZeilen, auswertungZeile, zusammenfassung, csvText } from '../src/state/auswertung.js';

const mia = { shirt: 1, hair: 2, skin: 0, scene: 'empfang', flags: { empfang_done: true, training_done: true, labor_done: true, sauna_done: true, shakebar_done: true, quiz_done: true, a0_done: true, a1_done: true, a2_done: true, a3_done: true, a4_done: true, a5_done: true, a6_done: true, k_bauplan: true, z_protein: true }, levels: { training: 2, labor: 1, sauna: 1, shakebar: 0 }, quiz: { richtig: 4, von: 4 }, fall: { taeter: 'kurt' } };
const tom = { shirt: 0, hair: 0, skin: 0, scene: 'labor', flags: { training_done: true, a1_done: true }, levels: { training: 0 }, quiz: null };

test('Quizergebnis steckt im Code, „nicht gespielt“ auch', () => {
  assert.deepEqual(decodeProgress(encodeProgress(mia)).state.quiz, { richtig: 4, von: 4 });
  assert.equal(decodeProgress(encodeProgress(tom)).state.quiz, null);
  assert.deepEqual(decodeProgress(encodeProgress({ ...mia, quiz: { richtig: 0, von: 4 } })).state.quiz, { richtig: 0, von: 4 });
});

test('Zeilen: Name und Code in verschiedenen Schreibweisen', () => {
  const a = encodeProgress(mia);
  const b = encodeProgress(tom);
  const rows = parseZeilen(`Mia: ${a}\n\nTom Lou - ${b.toLowerCase()}\n${a}\nQuatsch`);
  assert.equal(rows.length, 4);
  assert.equal(rows[0].name, 'Mia');
  assert.equal(rows[1].name, 'Tom Lou');
  assert.equal(rows[2].name, '');
  assert.ok(rows[0].res.ok && rows[1].res.ok && rows[2].res.ok);
  assert.equal(rows[3].res.ok, false);
});

test('Zeile: Räume, Aufgaben, Karten, Niveaus, Quiz', () => {
  const z = auswertungZeile(decodeProgress(encodeProgress(mia)).state);
  assert.equal(z.raeumeFertig, 5);
  assert.equal(z.aufgaben, 6, 'sechs Pflichtaufgaben');
  assert.match(z.fall, /Kupfer-Kurt/, 'Verursacher des Falls steckt im Code');
  assert.equal(z.zusatz, 1, 'Zusatz Peptidbindung gemacht');
  assert.equal(z.karten, 2);
  assert.equal(z.quiz, 4);
  assert.equal(z.quizDone, true);
  assert.deepEqual(z.niveaus, { empfang: '–', labor: 'Mittel', sauna: 'Mittel', training: 'Schwer', shakebar: 'Leicht' });
  const t = auswertungZeile(decodeProgress(encodeProgress(tom)).state);
  assert.equal(t.raeumeFertig, 1);
  assert.equal(t.quiz, null);
});

test('Zusammenfassung zählt nur gültige Codes und mittelt das Quiz', () => {
  const rows = parseZeilen([encodeProgress(mia), encodeProgress(tom), encodeProgress({ ...mia, quiz: { richtig: 4, von: 4 } }), 'PG-0000'].join('\n'));
  const s = zusammenfassung(rows);
  assert.equal(s.gesamt, 4);
  assert.equal(s.gueltig, 3);
  assert.equal(s.ungueltig, 1);
  assert.deepEqual(s.proRaum, { empfang: 2, labor: 2, sauna: 2, training: 3, shakebar: 2 });
  assert.equal(s.quizGespielt, 2);
  assert.equal(s.quizSchnitt, 4);
  assert.equal(s.fertig, 2);
});

test('Tabelle als CSV mit Semikolon, Anführungszeichen maskiert, Fehler mit Hinweis', () => {
  const rows = parseZeilen(`Mia "M.": ${encodeProgress(mia)}\nKaputt: PG-1234-5678`);
  const csv = csvText(rows).split('\n');
  assert.equal(csv.length, 3);
  assert.match(csv[0], /^"Name";"Empfang"/);
  assert.match(csv[1], /^"Mia ""M\."""?/);
  assert.match(csv[1], /"ja";"ja";"ja";"ja";"ja";"6";"1";"2";"4";"Kupfer-Kurt \(Schwermetallsalz\)";"Mittel";"Mittel";"Schwer";"Leicht"/);
  assert.match(csv[2], /Kaputt/);
  assert.match(csv[2], /Länge/);
});
