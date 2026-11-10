import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { checkMehrfach, quizErgebnis, raumFertig, fehlendeKarten } from '../src/tasks/check.js';
import { FLAG_LIST } from '../src/state/progress.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (f) => JSON.parse(readFileSync(join(root, 'data', f), 'utf8'));
const A = read('aufgaben.json');
const W = read('wissen.json');
const S = read('szenen.json');
const WB = read('werbung.json');
const H = read('hefter.json');

test('Räume: alle fünf Raumeinträge haben Aufgaben und eigene Flags', () => {
  for (const r of ['empfang', 'labor', 'sauna', 'training', 'shakebar', 'abschluss']) {
    const room = A.raeume[r];
    assert.ok(room, r);
    assert.ok(FLAG_LIST.includes(room.fertigFlag), `${r}: fertigFlag ${room.fertigFlag}`);
    for (const id of room.aufgaben) {
      assert.ok(A.aufgaben[id], `${r}: Aufgabe ${id}`);
      assert.ok(FLAG_LIST.includes(A.aufgaben[id].flag), `${id}: Flag ${A.aufgaben[id].flag}`);
      assert.notEqual(A.aufgaben[id].flag, room.fertigFlag, `${id}: Aufgaben-Flag und Raum-Flag müssen verschieden sein`);
    }
  }
  const flags = Object.values(A.aufgaben).map((t) => t.flag);
  assert.equal(new Set(flags).size, flags.length, 'doppelte Aufgaben-Flags');
});

test('Türen: Freischaltung folgt der Reihenfolge Empfang → Labor → Sauna → Trainingsfläche → Shake-Bar', () => {
  const tueren = S.szenen.find((s) => s.id === 'empfang').hotspots.filter((h) => h.type === 'door');
  const req = Object.fromEntries(tueren.map((t) => [t.to, t.requires || null]));
  assert.equal(req.labor, A.raeume.empfang.fertigFlag);
  assert.equal(req.sauna, A.raeume.labor.fertigFlag);
  assert.equal(req.training, A.raeume.sauna.fertigFlag);
  assert.equal(req.shakebar, A.raeume.training.fertigFlag);
});

test('Jede Aufgabe fordert nur Karten aus ihrem Raum oder Vorgängerräumen, und die Karten sind dort erreichbar', () => {
  const reihenfolge = ['empfang', 'labor', 'sauna', 'training', 'shakebar'];
  const kartenRaum = Object.fromEntries(W.karten.map((k) => [k.id, k.raum]));
  for (const [raum, aufgaben] of Object.entries({ empfang: ['a0'], labor: ['a4'], sauna: ['a5'], training: ['a3', 'a1', 'a2'], shakebar: ['a6', 'z1'] })) {
    for (const id of aufgaben) {
      for (const k of A.aufgaben[id].braucht.filter((f) => f.startsWith('k_') || f.startsWith('z_'))) {
        assert.ok(reihenfolge.indexOf(kartenRaum[k]) <= reihenfolge.indexOf(raum), `${id}: Karte ${k} liegt in einem späteren Raum`);
      }
    }
  }
  for (const k of W.karten) {
    const hs = S.szenen.flatMap((s) => s.hotspots.map((h) => ({ ...h, szene: s.id }))).find((h) => h.karte === k.id);
    assert.ok(hs, `${k.id}: kein Hotspot`);
    assert.equal(hs.szene, k.raum, `${k.id}: Hotspot im falschen Raum`);
    assert.ok(FLAG_LIST.includes(k.id), `${k.id}: fehlt in FLAG_LIST`);
  }
});

test('Sauna: Zuordnung deckt alle vier Auslöser genau einmal ab', () => {
  for (const n of ['A', 'B', 'C']) {
    const z = A.aufgaben.a5.niveaus[n].find((s) => s.type === 'zuordnen');
    assert.deepEqual(z.paare.map((p) => p.richtig).sort(), [...z.optionen].sort());
    for (const p of z.paare) assert.ok(z.optionen.includes(p.richtig));
  }
  const lueck = A.aufgaben.a5.niveaus.C.find((s) => s.type === 'luecken');
  assert.deepEqual(lueck.loesungen.slice(0, 4).sort(), ['Alkohol', 'Hitze', 'Säure', 'Schwermetallsalze'].sort());
  assert.doesNotMatch(JSON.stringify(A.aufgaben.a5), /Aminosäure|Struktur|gefaltet/, 'Stufe 2 nennt noch keine Aminosäuren und keine Faltung');
});

test('Sauna: Merksätze nennen weder Katalysatoren noch Enzymbegriffe (Lehrplan-Leitplanke)', () => {
  const alles = JSON.stringify([A, W, H, read('dialoge.json'), WB]);
  assert.doesNotMatch(alles, /Katalysator|Enzym/i);
  assert.match(read('dialoge.json')['sauna.hannes'].lines.join(' '), /später/);
});

test('Shake-Check: Zutaten, fünf Aussagen, gültige Urteile und Begründungen', () => {
  assert.ok(WB.produkt.zutaten.length >= 3);
  assert.doesNotMatch(JSON.stringify(WB), /Tryptophan|essentiell/i, 'essentielle Aminosäuren sind nur Zusatzwissen');
  assert.equal(WB.aussagen.length, 5);
  assert.equal(WB.aussagen.filter((a) => a.urteil === 0).length, 1, 'genau eine Aussage stimmt');
  for (const a of WB.aussagen) {
    assert.ok(a.urteil >= 0 && a.urteil < WB.urteile.length);
    assert.ok(a.richtig >= 0 && a.richtig < a.begruendungen.length);
    assert.ok(a.begruendungen.length >= 3 && a.erklaerung);
  }
  const richtigPositionen = new Set(WB.aussagen.map((a) => a.richtig));
  assert.ok(richtigPositionen.size >= 2, 'richtige Begründung steht nicht immer an derselben Stelle');
  assert.match(WB.aussagen[0].erklaerung, /Fremdwort/);
});

test('Shake-Check: keine Körperideale, Gewicht- oder Kalorienangaben', () => {
  assert.doesNotMatch(JSON.stringify({ produkt: WB.produkt, aussagen: WB.aussagen }), /Kalorie|kcal|Kilo|kg\b|abnehmen|Bauch|Sixpack|Körperfett/i);
});

test('Auflösung: vier gewertete Fragen, Verdächtigen-Wahl, Rückblick, genaue Zahl der richtigen Antworten', () => {
  const steps = A.aufgaben.quiz.niveaus.alle;
  assert.equal(steps.filter((s) => s.zaehlt).length, 4);
  assert.deepEqual(steps.slice(-2).map((s) => s.type), ['verdaechtige', 'rueckblick']);
  for (const s of steps.filter((x) => x.zaehlt)) assert.ok(s.erklaerung, 'Kurzbegründung fehlt');
  assert.deepEqual(quizErgebnis(steps, [true, true, false, true, true, true]), { richtig: 3, von: 4 });
  assert.deepEqual(quizErgebnis(steps, []), { richtig: 0, von: 4 });
});

test('Quiz-Antworten entsprechen den Lernzielen', () => {
  const s = A.aufgaben.quiz.niveaus.alle;
  assert.match(s[0].optionen[s[0].richtig], /Protein und Eiweiß sind dasselbe, und Aminosäuren sind die Bausteine/);
  assert.match(s[1].optionen[s[1].richtig], /Struktur wird zerstört, die Aminosäuren bleiben/);
  assert.deepEqual(s[2].richtig.map((i) => s[2].optionen[i]).sort(), ['Alkohol', 'Hitze', 'Säure']);
  assert.equal(s[3].optionen[s[3].richtig], 'Violett');
});

test('Mehrfachwahl: Anzahl und Richtigkeit', () => {
  const step = { richtig: [0, 2, 4], anzahl: 2 };
  assert.equal(checkMehrfach(step, [0]).reason, 'anzahl');
  assert.equal(checkMehrfach(step, [0, 1]).reason, 'falsch');
  assert.equal(checkMehrfach(step, [2, 4]).ok, true);
  assert.equal(checkMehrfach(step, [0, 2, 4]).reason, 'anzahl');
});

test('Hefter: zwei Einträge, frei nach Raum, mit Merksätzen und Lehrbuch-Verweis im Abschreibauftrag', () => {
  assert.equal(H.eintraege.length, 2);
  assert.equal(H.eintraege[0].ab, A.raeume.sauna.fertigFlag);
  assert.equal(H.eintraege[1].ab, A.raeume.training.fertigFlag);
  for (const e of H.eintraege) {
    assert.ok(e.teile.some((t) => t.typ === 'merksatz'));
    assert.ok(e.teile.some((t) => t.typ === 'auftrag'), 'Abschreibauftrag fehlt');
    assert.match(JSON.stringify(e.teile), /Lehrbuch S\. \d/);
  }
  assert.match(JSON.stringify(H.eintraege[1]), /Glycin.*Alanin/);
  assert.doesNotMatch(JSON.stringify(H.eintraege[1].teile.filter((t) => t.typ === 'auftrag')), /Valin|Cystein/, 'Skizze nur Glycin und Alanin');
  assert.match(JSON.stringify(H.eintraege[0]), /Biuret.*Lehrkraft ab/);
});

test('Gating: Quiz nur nach der Shake-Bar, Räume schließen unabhängig voneinander', () => {
  assert.deepEqual(fehlendeKarten(A.aufgaben.quiz, {}), ['shakebar_done']);
  assert.equal(raumFertig(A.raeume.sauna, A.aufgaben, 1, { a5_done: true }), true);
  assert.equal(raumFertig(A.raeume.shakebar, A.aufgaben, 1, {}), false);
  assert.equal(raumFertig(A.raeume.abschluss, A.aufgaben, 1, { quiz_task: true }), true);
});
