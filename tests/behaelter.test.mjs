// Zuordnen in Behälter (Wunsch der Lehrkraft 2026-11-18): Karten per Finger in Behälter ziehen, geprüft wird am Ende.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pruefeBehaelter } from '../src/tasks/check.js';

const lies = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const A = JSON.parse(lies('data/aufgaben.json'));
const AE = JSON.parse(lies('data/aehnlich.json'));
const paare = [{ text: 'a', richtig: 'X' }, { text: 'b', richtig: 'Y' }, { text: 'c', richtig: 'X' }];

test('pruefeBehaelter: offene, falsche und richtige Karten; fertig erst, wenn alles verteilt und richtig ist', () => {
  assert.deepEqual(pruefeBehaelter(paare, [null, null, null]), { offen: [0, 1, 2], falsch: [], richtig: [], fertig: false });
  assert.deepEqual(pruefeBehaelter(paare, ['X', 'X', null]), { offen: [2], falsch: [1], richtig: [0], fertig: false });
  assert.deepEqual(pruefeBehaelter(paare, ['X', 'Y', 'Y']), { offen: [], falsch: [2], richtig: [0, 1], fertig: false });
  assert.equal(pruefeBehaelter(paare, ['X', 'Y', 'X']).fertig, true);
});

test('Gewählte Aufgaben ziehen in Behälter: Einweisung Schritt 1, Baustein-Check Schwer, Sauna in allen Niveaus; die übrigen Zuordnungen nicht', () => {
  const mit = [];
  for (const [id, t] of Object.entries(A.aufgaben)) {
    for (const [n, steps] of Object.entries(t.niveaus || {})) {
      steps.forEach((s, i) => { if (s.type === 'zuordnen' && s.ansicht === 'behaelter') mit.push(`${id}.${n}.${i}`); });
    }
  }
  assert.deepEqual(mit.sort(), ['a0.alle.0', 'a1.C.2', 'a5.A.0', 'a5.B.0', 'a5.C.0']);
  assert.equal(A.aufgaben.a0.niveaus.alle[2].ansicht, undefined, 'Eiklar oder Eiweiß bleibt bei Knöpfen');
  for (const k of ['a0.*.0', 'a1.C.2', 'a5.*.0']) assert.equal(AE[k].ansicht, 'behaelter', `Ähnlichkeitsaufgabe ${k}`);
  for (const k of mit) {
    const [id, n, i] = k.split('.');
    const s = A.aufgaben[id].niveaus[n][Number(i)];
    assert.match(s.auftrag, /Behälter/, `${k}: Auftrag nennt die Behälter`);
    assert.ok(s.optionen.length >= 2 && s.optionen.length <= 4, `${k}: 2 bis 4 Behälter`);
    // Kurze Namen für die Karten im Behälter (lange Situationen würden die Behälter sprengen)
    for (const p of s.paare) assert.ok((p.kurz || p.titel || p.text).length <= 45, `${k}: Name zu lang: ${p.kurz || p.titel || p.text}`);
  }
});

test('Darstellung: Stapel mit einer Karte, Ziehen per Pointer-Events, Antippen der Behälter als zweiter Weg, Prüfen am Ende', () => {
  const src = lies('src/tasks/m4-types.js');
  const css = lies('assets/css/design.css');
  assert.match(src, /if \(step\.ansicht === 'behaelter'\) return behaelter\(host, step, api\);/);
  for (const ev of ['pointerdown', 'pointermove', 'pointerup', 'pointercancel']) assert.ok(src.includes(`'${ev}'`), ev);
  assert.match(src, /'aria-label': `Aktuelle Karte in „\$\{o\}“ legen`/);
  assert.match(src, /pruefen\.disabled = gesperrt \|\| o\.length > 0;/, 'Prüfen erst, wenn alles verteilt ist');
  assert.match(css, /\.papier \.sortier-karte \{[^}]*touch-action: none/);
});
