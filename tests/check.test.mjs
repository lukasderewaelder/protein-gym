import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { FLAG_LIST } from '../src/state/progress.js';
import { beobachtungPasst, reihenfolge, alleProben, protokollText } from '../src/tasks/check.js';
import {
  parseNumber, checkZahl, checkLuecken, reactionPair, leavingParticles, dipeptidFormula, dipeptidName,
  checkOrdnen, wasserBeiKette, anzahlDipeptide, fehlendeKarten, raumFertig,
} from '../src/tasks/check.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const A = JSON.parse(readFileSync(join(root, 'data/aufgaben.json'), 'utf8'));
const W = JSON.parse(readFileSync(join(root, 'data/wissen.json'), 'utf8'));
const S = JSON.parse(readFileSync(join(root, 'data/szenen.json'), 'utf8'));

test('Zahlen: Komma und Punkt, Leerzeichen, Unsinn', () => {
  assert.equal(parseNumber(' 484 '), 484);
  assert.equal(parseNumber('3,5'), 3.5);
  assert.ok(Number.isNaN(parseNumber('drei')));
  assert.ok(Number.isNaN(parseNumber('')));
  assert.equal(checkZahl({ richtig: 3 }, '3'), true);
  assert.equal(checkZahl({ richtig: 3 }, '4'), false);
});

test('Lücken: richtig, falsch und leer werden unterschieden', () => {
  const step = { loesungen: ['Amino', 'Carboxy'] };
  assert.deepEqual(checkLuecken(step, ['Amino', 'Carboxy']), { ok: true, wrong: [], empty: [] });
  assert.deepEqual(checkLuecken(step, ['Carboxy', 'Carboxy']), { ok: false, wrong: [0], empty: [] });
  assert.deepEqual(checkLuecken(step, ['Amino', null]), { ok: false, wrong: [], empty: [1] });
});

test('Reaktion: beide Richtungen sind richtig (Gly–Ala und Ala–Gly)', () => {
  const r1 = reactionPair({ mol: 0, end: 'carboxy' }, { mol: 1, end: 'amino' });
  const r2 = reactionPair({ mol: 1, end: 'amino' }, { mol: 0, end: 'carboxy' });
  const r3 = reactionPair({ mol: 1, end: 'carboxy' }, { mol: 0, end: 'amino' });
  assert.deepEqual(r1, { ok: true, carboxyMol: 0, aminoMol: 1 });
  assert.deepEqual(r2, r1);
  assert.deepEqual(r3, { ok: true, carboxyMol: 1, aminoMol: 0 });
});

test('Reaktion: dasselbe Molekül oder dieselbe Gruppe ist falsch', () => {
  assert.equal(reactionPair({ mol: 0, end: 'amino' }, { mol: 0, end: 'carboxy' }).reason, 'gleiches-molekuel');
  assert.equal(reactionPair({ mol: 0, end: 'amino' }, { mol: 1, end: 'amino' }).reason, 'gleiche-gruppe');
});

test('Wasser: OH der Carboxygruppe und H der Aminogruppe, nicht anders herum', () => {
  const pair = { carboxyMol: 0, aminoMol: 1 };
  assert.equal(leavingParticles(pair, [{ kind: 'OH', mol: 0 }, { kind: 'H', mol: 1 }]).ok, true);
  assert.equal(leavingParticles(pair, [{ kind: 'H', mol: 1 }, { kind: 'OH', mol: 0 }]).ok, true);
  assert.equal(leavingParticles(pair, [{ kind: 'OH', mol: 1 }, { kind: 'H', mol: 0 }]).reason, 'molekuel');
  assert.equal(leavingParticles(pair, [{ kind: 'H', mol: 1 }, { kind: 'H', mol: 1 }]).reason, 'art');
  assert.equal(leavingParticles(pair, [{ kind: 'OH', mol: 0 }]).reason, 'anzahl');
});

test('Dipeptid-Formel mit Peptidbindung', () => {
  const gly = A.molekuele.glycin;
  const ala = A.molekuele.alanin;
  assert.equal(dipeptidFormula(gly, ala), 'H₂N–CH₂–CO–NH–CH(CH₃)–COOH');
  assert.equal(dipeptidFormula(ala, gly), 'H₂N–CH(CH₃)–CO–NH–CH₂–COOH');
  assert.equal(dipeptidName(gly, ala), 'Gly–Ala');
});

test('Baukasten: richtige Kette, falscher und leerer Platz', () => {
  const step = { slots: ['H₂N', 'CH₂', 'CO', 'NH', 'CH₂', 'COOH'] };
  assert.equal(checkOrdnen(step, [...step.slots]).ok, true);
  const falsch = [...step.slots]; falsch[2] = 'NH';
  assert.deepEqual(checkOrdnen(step, falsch).wrong, [2]);
  const leer = [...step.slots]; leer[5] = null;
  assert.deepEqual(checkOrdnen(step, leer).empty, [5]);
});

test('Ketten: n − 1 Wassermoleküle, Dipeptide = Sorten²', () => {
  assert.equal(wasserBeiKette(3), 2);
  assert.equal(wasserBeiKette(4), 3);
  assert.equal(wasserBeiKette(1), 0);
  assert.equal(anzahlDipeptide(20), 400);
  assert.equal(anzahlDipeptide(22), 484);
});

test('Daten: Zusatz Peptidbindung fragt genau Sorten² und n − 1 aus den Konstanten', () => {
  const n = A.konstanten.anzahlAminosaeuren;
  const step = A.aufgaben.a2.niveaus.C[0];
  assert.equal(Number(step.optionen[step.richtig]), anzahlDipeptide(n));
  assert.match(step.frage, new RegExp(String(n)));
  const b = A.aufgaben.a2.niveaus.B[2];
  assert.equal(Number(b.optionen[b.richtig]), wasserBeiKette(4));
  const a = A.aufgaben.a2.niveaus.A[1];
  assert.equal(Number(a.optionen[a.richtig]), wasserBeiKette(3));
  const c = A.aufgaben.a2.niveaus.C[2];
  assert.equal(Number(c.optionen[c.richtig]), wasserBeiKette(6));
});

test('Daten: jede Aufgabe hat alle drei Niveaus, bekannte Typen und gültige Lücken', () => {
  const TYPEN = new Set(['formel-tippen', 'luecken', 'freitext', 'waehlen', 'zahl', 'peptid-verbinden', 'bausteine-ordnen', 'vermutung', 'anleitung', 'reihenfolge', 'simulation', 'versuch', 'beobachtung', 'export', 'zuordnen', 'mehrfach', 'werbung', 'rueckblick', 'zeigen', 'fingerabdruck', 'verdaechtige']);
  const VERBOTEN = new Set(['formel-tippen', 'peptid-verbinden', 'bausteine-ordnen', 'freitext', 'zahl']);
  const karten = new Set(W.karten.map((k) => k.id));
  for (const [id, t] of Object.entries(A.aufgaben)) {
    for (const n of t.niveaus.alle ? ['alle'] : ['A', 'B', 'C']) assert.ok(t.niveaus[n] && t.niveaus[n].length, `${id}/${n}`);
    for (const k of t.braucht) assert.ok(karten.has(k) || FLAG_LIST.includes(k), `${id}: Karte oder Flag ${k}`);
    assert.ok(t.tipp && t.loesung && t.hilfekarte.zeilen.length, `${id}: Hilfen`);
    for (const [n, steps] of Object.entries(t.niveaus)) {
      for (const s of steps) {
        assert.ok(TYPEN.has(s.type), `${id}/${n}: Typ ${s.type}`);
        assert.ok(!VERBOTEN.has(s.type), `${id}/${n}: Typ ${s.type} wird nicht mehr eingesetzt (Gruppen nie abfragen, kein Freitext)`);
        if (s.type === 'luecken') {
          const gaps = (s.text.match(/\{\d+\}/g) || []).length;
          assert.equal(gaps, s.loesungen.length, `${id}/${n}: Lückenzahl`);
          for (const l of s.loesungen) assert.ok(s.optionen.includes(l), `${id}/${n}: ${l} fehlt in optionen`);
          assert.equal(new Set(s.optionen).size, s.optionen.length, `${id}/${n}: doppelte Optionen`);
        }
        if (s.type === 'formel-tippen') {
          assert.ok(A.molekuele[s.molekuel], s.molekuel);
          assert.deepEqual([...s.teile].sort(), ['amino', 'carboxy', 'rest']);
        }
        if (s.type === 'peptid-verbinden') { assert.ok(A.molekuele[s.a] && A.molekuele[s.b]); assert.notEqual(s.a, s.b); }
        if (s.type === 'waehlen') assert.ok(s.richtig >= 0 && s.richtig < s.optionen.length);
        if (s.type === 'freitext') assert.ok(s.muster && s.checkliste.length >= 2);
        if (s.type === 'anleitung') assert.ok(s.schritte.length >= 3);
        if (s.type === 'reihenfolge') {
          assert.deepEqual([...s.anzeige].sort(), s.korrekt.map((_, i) => i), `${id}/${n}: anzeige ist keine Permutation`);
          assert.notDeepEqual(s.anzeige, s.korrekt.map((_, i) => i), `${id}/${n}: anzeige ist nicht gemischt`);
        }
        if (s.type === 'bausteine-ordnen') {
          const bank = [...s.ablage];
          for (const sl of s.slots) { const i = bank.indexOf(sl); assert.ok(i >= 0, `${id}: Baustein ${sl} fehlt in der Ablage`); bank.splice(i, 1); }
          assert.ok(s.peptid.every((i) => i >= 0 && i < s.slots.length));
        }
      }
    }
  }
});

test('Daten: Wissenskarten sind an Hotspots erreichbar und Aufgaben brauchen nur gefundene Karten', () => {
  const fromHotspots = new Set(S.szenen.flatMap((s) => s.hotspots.map((h) => h.karte).filter(Boolean)));
  for (const k of W.karten) assert.ok(fromHotspots.has(k.id), `Karte ${k.id} hängt an keinem Hotspot`);
  const trainingKarten = new Set(W.karten.filter((k) => k.raum === 'training').map((k) => k.id));
  for (const id of A.raeume.training.aufgaben) for (const k of A.aufgaben[id].braucht) assert.ok(trainingKarten.has(k), `${id}: ${k} gehört nicht zum Trainingsraum`);
});

test('Gating und Raumabschluss', () => {
  const t = A.aufgaben.a1;
  assert.deepEqual(fehlendeKarten(t, {}), ['k_bauplan', 'k_rest']);
  assert.deepEqual(fehlendeKarten(t, { k_bauplan: true }), ['k_rest']);
  assert.deepEqual(fehlendeKarten(t, { k_bauplan: true, k_rest: true }), []);
  const room = A.raeume.training;
  assert.equal(raumFertig(room, A.aufgaben, 1, {}), false);
  assert.equal(raumFertig(room, A.aufgaben, 1, { a1_done: true }), false, 'Bau und Faltung gehört zur Pflicht');
  assert.equal(raumFertig(room, A.aufgaben, 1, { a1_done: true, a3_done: true }), true, 'Trainingsfläche ist mit Bau und Bausteinen fertig');
  assert.equal(raumFertig(room, A.aufgaben, 2, { a1_done: true, a3_done: true }), true, 'auch auf Schwer ist das Zusatzwissen freiwillig');
});
