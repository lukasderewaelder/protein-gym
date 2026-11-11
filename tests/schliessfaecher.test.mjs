// Bonus-Schließfächer: Daten, Hotspots, Zettel in den Räumen, Inhalte, Fragen.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { FLAG_LIST } from '../src/state/progress.js';
import { startTest, antworte, aktuelle } from '../src/state/fuehrerschein.js';

const lies = (n) => JSON.parse(readFileSync(new URL(`../data/${n}.json`, import.meta.url), 'utf8'));
const F = lies('schliessfaecher');
const S = lies('szenen');
const inv = lies('inventar');

test('Sechs Fächer mit dreistelligen, verschiedenen Codes und eigenen Flags', () => {
  assert.equal(F.faecher.length, 6);
  const codes = new Set();
  for (const f of F.faecher) {
    assert.match(f.code, /^[0-9]{3}$/, `Fach ${f.id}`);
    assert.ok(!codes.has(f.code), `doppelter Code ${f.code}`);
    codes.add(f.code);
    assert.ok(FLAG_LIST.includes(f.flag), f.flag);
    assert.ok(FLAG_LIST.includes(`bz_${f.id}`), `bz_${f.id} fehlt in der FLAG_LIST`);
    assert.ok(['spass', 'zusatz'].includes(f.typ));
    assert.ok(f.name && f.text && f.emoji, `Fach ${f.id}: Name, Text, Symbol`);
  }
});

test('Meist Spaß, nur zwei bis drei freiwillige Zusatzfragen mit Hinweis und Hilfe', () => {
  const zusatz = F.faecher.filter((f) => f.typ === 'zusatz');
  assert.ok(zusatz.length >= 2 && zusatz.length <= 3, `Zusatzfächer: ${zusatz.length}`);
  assert.ok(F.faecher.length - zusatz.length > zusatz.length, 'mehr Spaß- als Zusatzfächer');
  for (const f of zusatz) {
    assert.ok(f.fragen && f.fragen.length >= 1);
    for (const q of f.fragen) for (const k of ['frage', 'richtig', 'erklaerung', 'hinweis', 'hilfe']) assert.ok(q[k], `Fach ${f.id}: ${k}`);
    const t = startTest(f.fragen);
    assert.equal(antworte(t, aktuelle(t).optionen.findIndex((o) => o.richtig)).richtig, true);
  }
});

test('Jedes Fach hat einen Hotspot im Empfang, jeder Zettel hängt im richtigen Raum', () => {
  const empfang = S.szenen.find((s) => s.id === 'empfang');
  const raeume = new Set();
  for (const f of F.faecher) {
    const fach = empfang.hotspots.find((h) => h.type === 'fach' && h.fach === f.id);
    assert.ok(fach, `Fach ${f.id}: Hotspot im Empfang fehlt`);
    assert.equal(fach.aktion, 'fach');
    assert.ok(Math.abs(fach.x - f.x) < 1 && Math.abs(fach.y - f.y) < 1, `Fach ${f.id}: Position stimmt mit schliessfaecher.json überein`);
    const sz = S.szenen.find((s) => s.id === f.zettel.szene);
    assert.ok(sz, `Fach ${f.id}: Raum ${f.zettel.szene}`);
    const z = sz.hotspots.find((h) => h.zettel === f.id);
    assert.ok(z, `Zettel ${f.id} fehlt im Raum ${f.zettel.szene}`);
    assert.equal(z.aktion, 'zettel');
    raeume.add(f.zettel.szene);
  }
  assert.equal(raeume.size, 5, 'Zettel in allen fünf Räumen');
});

test('Codes stehen nur auf ihren Zetteln: normale Zettel nennen den Code, der Rätselzettel nicht', () => {
  for (const f of F.faecher) {
    const text = f.zettel.zeilen.join(' ');
    if (f.id === 6) {
      assert.ok(!text.includes(f.code) && !text.includes('{code}'), 'Rätsel verrät den Code nicht');
      assert.match(text, /22 Aminosäuren/);
      assert.equal(22 * 22, Number(f.code), 'Rätsel passt zur Aufgabe in der Trainingsfläche (22 · 22 = 484)');
    } else {
      assert.ok(text.includes('{code}'), `Zettel ${f.id} nennt den Code`);
      assert.ok(text.includes(`Schließfach ${f.id}`), `Zettel ${f.id} nennt das Fach`);
    }
  }
});

test('Easter Eggs: ergo, ausgebobbt und Bob Tschigerillo, keine Namen realer Personen, Schluss-Extra in Fach 6', () => {
  const alles = JSON.stringify(F.faecher);
  assert.match(alles, /Ergo: Fragt lieber nicht mich/, 'ergo (Kurt, Fach 2)');
  assert.match(alles, /ERGO/, 'ergo-Stempel (Fach 6)');
  assert.match(alles, /Jetzt hat es sich ausgebobbt/);
  assert.match(alles, /Bob Tschigerillo/);
  assert.doesNotMatch(alles, /Rühl|Cicherillo|Maggus|Coleman|Schwarzenegger/i, 'keine Namen realer Personen');
  const f6 = F.faecher.find((f) => f.id === 6);
  assert.ok(f6.extraWennAlle && /Alle sechs Fächer/.test(f6.extraWennAlle));
  assert.ok(F.faecher.every((f) => !f.extra || typeof f.extra === 'string'));
});

test('Fach-Inhalte werden zu Gegenständen in der Tasche (ohne Doppel-IDs)', () => {
  const ids = new Set(inv.gegenstaende.map((g) => g.id));
  for (const f of F.faecher) assert.ok(!ids.has(`fach${f.id}`), 'kommt erst zur Laufzeit dazu');
  assert.equal(new Set(F.faecher.map((f) => f.flag)).size, 6);
});
