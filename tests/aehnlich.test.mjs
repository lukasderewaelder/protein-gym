import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { aehnlicheAufgabe, checkLuecken, checkOrdnen, checkZahl, anzahlDipeptide, wasserBeiKette } from '../src/tasks/check.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (f) => JSON.parse(readFileSync(join(root, 'data', f), 'utf8'));
const A = read('aufgaben.json');
const AE = read('aehnlich.json');

function original(key) {
  const [id, lvl, idx] = key.split('.');
  const niveaus = A.aufgaben[id].niveaus;
  const levels = lvl === '*' ? Object.keys(niveaus) : [lvl];
  // Bei „*“ zählen nur Niveaus, in denen es den Schritt gibt (nicht jedes Niveau hat gleich viele Schritte).
  return levels.map((l) => ({ l, step: (niveaus[l] || [])[Number(idx)] })).filter((x) => lvl !== '*' || x.step);
}

test('Ähnlichkeitsaufgaben: jeder Schlüssel trifft mindestens einen Schritt', () => {
  for (const key of Object.keys(AE)) assert.ok(original(key).length > 0, key);
});

test('Ähnlichkeitsaufgaben: Schlüssel zeigen auf vorhandene Schritte gleichen Typs', () => {
  for (const [key, st] of Object.entries(AE)) {
    for (const { l, step } of original(key)) {
      assert.ok(step, `${key}/${l}: Schritt existiert nicht`);
      assert.equal(st.type, step.type, `${key}/${l}: Typ weicht ab`);
    }
  }
});

test('Ähnlichkeitsaufgaben: Inhalte sind in sich stimmig und verschieden vom Original', () => {
  for (const [key, st] of Object.entries(AE)) {
    const orig = original(key)[0].step;
    assert.notDeepEqual(st, orig, `${key}: identisch mit dem Original`);
    if (st.type === 'luecken') {
      assert.equal((st.text.match(/\{\d+\}/g) || []).length, st.loesungen.length, `${key}: Lückenzahl`);
      for (const l of st.loesungen) assert.ok(st.optionen.includes(l), `${key}: ${l} fehlt in optionen`);
      assert.equal(new Set(st.optionen).size, st.optionen.length, `${key}: doppelte Optionen`);
      assert.equal(checkLuecken(st, st.loesungen).ok, true);
    }
    if (st.type === 'waehlen') assert.ok(st.richtig >= 0 && st.richtig < st.optionen.length && st.erklaerung, key);
    if (st.type === 'zahl') assert.ok(Number.isFinite(st.richtig) && st.erklaerung, key);
    if (st.type === 'zuordnen') {
      for (const p of st.paare) assert.ok(st.optionen.includes(p.richtig), `${key}: ${p.richtig} ist keine Option`);
      for (const o of st.optionen) assert.ok(st.paare.some((p) => p.richtig === o), `${key}: Option ${o} wird nie gebraucht`);
    }
    if (st.type === 'bausteine-ordnen') {
      const bank = [...st.ablage];
      for (const s of st.slots) { const i = bank.indexOf(s); assert.ok(i >= 0, `${key}: ${s} fehlt in der Ablage`); bank.splice(i, 1); }
      assert.equal(checkOrdnen(st, st.slots).ok, true);
    }
  }
});

test('Ähnlichkeitsaufgaben: Rechenantworten stimmen', () => {
  const wert = (k) => Number(AE[k].optionen[AE[k].richtig]);
  assert.equal(wert('a2.A.1'), wasserBeiKette(4));
  assert.equal(wert('a2.B.2'), wasserBeiKette(6));
  assert.equal(wert('a2.C.0'), anzahlDipeptide(5));
  assert.equal(wert('a2.C.2'), wasserBeiKette(8));
  assert.equal(AE['a2.B.1'].optionen[AE['a2.B.1'].richtig], 'n − 1');
});

test('Ähnlichkeitsaufgaben: Es gibt für jede Schritt-Art, die zum Lösungsbeispiel führen kann, eine Übung', () => {
  for (const [id, t] of Object.entries(A.aufgaben)) {
    if (id === 'quiz') continue;
    for (const [l, steps] of Object.entries(t.niveaus)) {
      steps.forEach((s, i) => {
        if (!['formel-tippen', 'peptid-verbinden', 'luecken', 'waehlen', 'zahl', 'zuordnen', 'bausteine-ordnen'].includes(s.type)) return;
        const a = aehnlicheAufgabe({ step: s, taskId: id, level: l, index: i, aehnlich: AE, molekuele: A.molekuele });
        assert.ok(a, `${id}.${l}.${i} (${s.type}) hat keine Ähnlichkeitsaufgabe`);
      });
    }
  }
});

test('Automatisch: anderes Molekül bei Formel-Schritten, andere Paarung bei Peptid-Schritten', () => {
  const ft = aehnlicheAufgabe({ step: { type: 'formel-tippen', molekuel: 'glycin', teile: ['amino', 'carboxy', 'rest'] }, taskId: 'x', level: 'A', index: 0, molekuele: A.molekuele });
  assert.equal(ft.type, 'formel-tippen');
  assert.notEqual(ft.molekuel, 'glycin');
  assert.ok(A.molekuele[ft.molekuel]);
  const pv1 = aehnlicheAufgabe({ step: { type: 'peptid-verbinden', a: 'alanin', b: 'glycin' }, taskId: 'x', level: 'A', index: 0, molekuele: A.molekuele });
  assert.deepEqual([pv1.a, pv1.b], ['cystein', 'valin']);
  const pv2 = aehnlicheAufgabe({ step: { type: 'peptid-verbinden', a: 'cystein', b: 'valin' }, taskId: 'x', level: 'A', index: 0, molekuele: A.molekuele });
  assert.deepEqual([pv2.a, pv2.b], ['glycin', 'alanin']);
  assert.equal(aehnlicheAufgabe({ step: { type: 'freitext' }, taskId: 'x', level: 'A', index: 0 }), null);
});

test('Wildcard- und genaue Schlüssel: genau schlägt Wildcard', () => {
  const aehnlich = { 'a.*.1': { id: 'wild' }, 'a.B.1': { id: 'genau' } };
  const s = { type: 'luecken' };
  assert.equal(aehnlicheAufgabe({ step: s, taskId: 'a', level: 'B', index: 1, aehnlich }).id, 'genau');
  assert.equal(aehnlicheAufgabe({ step: s, taskId: 'a', level: 'A', index: 1, aehnlich }).id, 'wild');
  assert.equal(aehnlicheAufgabe({ step: s, taskId: 'a', level: 'A', index: 2, aehnlich }), null);
});
