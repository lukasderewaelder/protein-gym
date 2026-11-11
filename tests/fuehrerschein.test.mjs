// Laborführerschein: Fragen, gestufte Rückmeldungen, kein Neustart, Daten vollständig.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { startTest, aktuelle, antworte, weiter, istFertig, mische } from '../src/state/fuehrerschein.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const F = JSON.parse(readFileSync(join(root, 'data/fuehrerschein.json'), 'utf8'));
const dialoge = JSON.parse(readFileSync(join(root, 'data/dialoge.json'), 'utf8'));
const richtigIndex = (t) => aktuelle(t).optionen.findIndex((o) => o.richtig);
const falschIndex = (t, n = 0) => aktuelle(t).optionen.map((o, i) => (o.richtig ? -1 : i)).filter((i) => i >= 0)[n];

test('Es gibt drei Fragen mit je einer richtigen und zwei falschen Antworten', () => {
  assert.equal(F.fragen.length, 3);
  for (const f of F.fragen) {
    assert.equal(f.falsch.length, 2, f.frage);
    for (const k of ['erklaerung', 'hinweis', 'hilfe']) assert.ok(f[k] && f[k].length > 20, `${f.frage}: ${k}`);
    assert.ok(!f.hinweis.includes(f.richtig), 'der Hinweis verrät die Lösung nicht wörtlich');
  }
  assert.match(F.fragen[0].richtig, /Schutzbrille/);
  assert.match(F.fragen[1].richtig, /Anweisung/);
  assert.match(F.fragen[2].richtig, /Abstand.*Lehrkraft/);
  assert.equal(F.bestanden, 'Laborführerschein bestanden! Dein Labor-Ausweis wurde freigeschaltet.');
});

test('Die Dialoge für Markus und das Lesegerät sind da, der Einstieg lautet wie im Auftrag', () => {
  assert.match(dialoge['empfang.fuehrerschein'].lines.join(' '), /Halt, Neuling!.*Chef.*unser Labor.*Sicherheitseinweisung.*Drei Fragen.*Labor-Ausweis.*Bereit\?/);
  for (const id of ['empfang.fuehrerschein.ok', 'empfang.leser.ohne', 'empfang.leser.ok', 'empfang.leser.offen', 'tuer.tuer_labor.verriegelt']) assert.ok(dialoge[id], id);
});

test('Antworten werden gemischt, aber nichts geht verloren', () => {
  const t = startTest(F.fragen);
  for (const f of t.fragen) {
    assert.equal(f.optionen.length, 3);
    assert.equal(f.optionen.filter((o) => o.richtig).length, 1);
  }
  const ids = mische([1, 2, 3, 4, 5, 6, 7, 8], () => 0.3);
  assert.deepEqual([...ids].sort(), [1, 2, 3, 4, 5, 6, 7, 8]);
});

test('Richtig: sofort positive Rückmeldung mit Begründung', () => {
  const t = startTest(F.fragen);
  const r = antworte(t, richtigIndex(t));
  assert.equal(r.richtig, true);
  assert.equal(r.stufe, 'gut');
  assert.equal(r.text, F.fragen[0].erklaerung);
});

test('Erster Fehler: Hinweis ohne Lösung; zweiter Fehler: konkretere Hilfe; kein Neustart', () => {
  const t = startTest(F.fragen);
  const r1 = antworte(t, falschIndex(t, 0));
  assert.deepEqual([r1.richtig, r1.stufe, r1.text], [false, 'hinweis', F.fragen[0].hinweis]);
  const r2 = antworte(t, falschIndex(t, 1));
  assert.deepEqual([r2.richtig, r2.stufe, r2.text], [false, 'hilfe', F.fragen[0].hilfe]);
  assert.equal(t.i, 0, 'bleibt an derselben Frage');
  assert.equal(antworte(t, falschIndex(t, 0)).stufe, 'nichts', 'dieselbe falsche Antwort zählt nicht doppelt');
  assert.equal(antworte(t, richtigIndex(t)).richtig, true, 'danach geht die richtige immer noch');
});

test('Alle drei Fragen nacheinander ergeben den bestandenen Test', () => {
  const t = startTest(F.fragen);
  assert.equal(istFertig(t), false);
  for (let i = 0; i < 3; i++) {
    assert.equal(t.i, i);
    antworte(t, falschIndex(t)); // ein Fehlversuch je Frage ist erlaubt
    assert.equal(antworte(t, richtigIndex(t)).richtig, true);
    weiter(t);
    assert.equal(t.fehler, 0, 'Fehlerzähler beginnt mit jeder Frage neu');
  }
  assert.equal(istFertig(t), true);
});
