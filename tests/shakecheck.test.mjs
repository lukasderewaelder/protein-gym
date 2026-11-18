// Shake-Check (Aufgabe 6): Dosen-Etikett ohne Zahlen und Körperideale, eine Werbeaussage nach der anderen.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { werbungSchritt, WERBUNG_START } from '../src/tasks/check.js';

const W = JSON.parse(readFileSync(new URL('../data/werbung.json', import.meta.url), 'utf8'));
const start = () => ({ ...WERBUNG_START, geloest: [] });

test('Ablauf: Urteil, dann Begründung, dann Erklärung; falsche Wahl ändert nichts', () => {
  const a = W.aussagen[0];
  let z = start();
  const falschesUrteil = W.urteile.findIndex((_, k) => k !== a.urteil);
  assert.deepEqual(werbungSchritt(W, z, { art: 'urteil', wahl: falschesUrteil }), { z, ok: false, alle: false });
  assert.equal(werbungSchritt(W, z, { art: 'grund', wahl: a.richtig }).ok, false, 'Begründung erst nach dem Urteil');
  z = werbungSchritt(W, z, { art: 'urteil', wahl: a.urteil }).z;
  assert.equal(z.phase, 'grund');
  const falscherGrund = a.begruendungen.findIndex((_, k) => k !== a.richtig);
  assert.equal(werbungSchritt(W, z, { art: 'grund', wahl: falscherGrund }).ok, false);
  const r = werbungSchritt(W, z, { art: 'grund', wahl: a.richtig });
  assert.deepEqual([r.z.phase, r.z.geloest, r.alle], ['erklaert', [0], false]);
  const weiter = werbungSchritt(W, r.z, { art: 'weiter' });
  assert.deepEqual([weiter.z.i, weiter.z.phase], [1, 'urteil']);
});

test('Alle Aussagen nacheinander: erst die letzte meldet „alle geprüft“, danach gibt es kein Weiter mehr', () => {
  let z = start();
  let letzte = null;
  W.aussagen.forEach((a, i) => {
    z = werbungSchritt(W, z, { art: 'urteil', wahl: a.urteil }).z;
    letzte = werbungSchritt(W, z, { art: 'grund', wahl: a.richtig });
    z = letzte.z;
    assert.equal(letzte.alle, i === W.aussagen.length - 1, `Aussage ${i + 1}`);
    if (i < W.aussagen.length - 1) z = werbungSchritt(W, z, { art: 'weiter' }).z;
  });
  assert.equal(werbungSchritt(W, z, { art: 'weiter' }).ok, false);
  assert.equal(z.geloest.length, W.aussagen.length);
});

test('Etikett: mit Sorte und Spruch, ohne Aufkleber und Zitronensäure, ohne Zahlen und ohne Körperideale', () => {
  const p = W.produkt;
  for (const k of ['name', 'sorte', 'slogan']) assert.ok(p[k], `produkt.${k} fehlt`);
  assert.equal(p.aufkleber, undefined, 'kein Aufkleber „frei erfunden“ (Wunsch der Lehrkraft)');
  assert.ok(!p.zutaten.includes('Zitronensäure'));
  const { hinweis, ...ohneHinweis } = W; // der Hinweis nennt die Regel selbst („keine Zahlen zu Gewicht oder Kalorien“)
  assert.match(hinweis, /keine Körperideale/);
  const alles = JSON.stringify(ohneHinweis);
  assert.doesNotMatch([p.name, p.sorte, p.slogan, ...p.zutaten].join(' '), /\d/, 'keine Zahlen auf dem Etikett');
  assert.doesNotMatch(alles, /schlank|Sixpack|Traumk(ö|o)rper|abnehmen|Kalorie|kcal|Gewicht|Figur/i, 'keine Körperideale');
});

test('Darstellung: Dose links, rechts immer nur eine Aussage; kein doppeltes Anführungszeichen', () => {
  const src = readFileSync(new URL('../src/tasks/m4-types.js', import.meta.url), 'utf8');
  assert.match(src, /h\('div', 'shake', doseEtikett\(w\), rechts\)/);
  assert.match(src, /rechts\.replaceChildren\(/);
  assert.match(src, /Aussage \$\{z\.i \+ 1\} von \$\{w\.aussagen\.length\}/);
  // Aussagen bringen ihre Anführungszeichen selbst mit (früher entstand „„Protein“ …)
  assert.doesNotMatch(src, /'„' \+ a\.text|`„\$\{a\.text\}/);
});
