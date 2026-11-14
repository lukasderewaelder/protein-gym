// Bonus-Schließfächer: Daten, Hotspots, Zettel in den Räumen, Inhalte, Fragen.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { FLAG_LIST } from '../src/state/progress.js';
import { startTest, antworte, aktuelle } from '../src/state/fuehrerschein.js';
import { radDrehen } from '../src/state/zugang.js';

const lies = (n) => JSON.parse(readFileSync(new URL(`../data/${n}.json`, import.meta.url), 'utf8'));
const F = lies('schliessfaecher');
const S = lies('szenen');
const inv = lies('inventar');

test('Sechs Fächer mit eigenen Flags; Zahlenfeld, Drehscheibe und Zahlenrädchen haben dreistellige, verschiedene Codes', () => {
  assert.equal(F.faecher.length, 6);
  const codes = new Set();
  for (const f of F.faecher) {
    if (f.schloss === 'schluessel') assert.equal(f.code, undefined, `Fach ${f.id}: ein Schlüsselschloss hat keinen Code`);
    else {
      assert.match(f.code, /^[0-9]{3}$/, `Fach ${f.id}`);
      assert.ok(!codes.has(f.code), `doppelter Code ${f.code}`);
      codes.add(f.code);
    }
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

test('Vier Schlossarten: Zahlenfeld (1, 4), Drehscheibe (3, 6), Zahlenrädchen (2), Schlüssel (5); Hotspots zeigen dieselbe Art', () => {
  const arten = new Set(F.faecher.map((f) => f.schloss));
  assert.deepEqual([...arten].sort(), ['digital', 'dreh', 'rad', 'schluessel'], 'alle vier Schlossarten kommen vor');
  const art = (id) => F.faecher.find((f) => f.id === id).schloss;
  assert.deepEqual([1, 2, 3, 4, 5, 6].map(art), ['digital', 'rad', 'dreh', 'digital', 'schluessel', 'dreh']);
  const f2 = F.faecher.find((f) => f.id === 2);
  assert.equal(f2.schluessel, undefined, 'Fach 2 hat keinen Schlüssel mehr');
  assert.equal(f2.zettel.szene, 'labor', 'der Zettel für Fach 2 liegt im Labor (unter dem Labortisch)');
  assert.match(f2.zettel.zeilen.join(' '), /Labortisch/);
  const labor = S.szenen.find((s) => s.id === 'labor');
  assert.equal(labor.hotspots.find((h) => h.zettel === 2).label, 'Zettel');
  const empfang = S.szenen.find((s) => s.id === 'empfang');
  for (const f of F.faecher) {
    const hs = empfang.hotspots.find((h) => h.type === 'fach' && h.fach === f.id);
    assert.equal(hs.schloss, f.schloss, `Fach ${f.id}: Platte im Bild passt zum Schloss`);
    if (f.schloss === 'schluessel') {
      assert.ok(f.schluessel.name.includes(String(f.id)), `Fach ${f.id}: die Nummer steht am Schlüssel`);
      assert.ok(f.schluessel.fundort.length > 20);
      assert.equal(f.zettel.zeilen, undefined, 'statt eines Zettels liegt hier ein Schlüssel');
    }
  }
});

test('Codes stehen nur auf ihren Zetteln: normale Zettel nennen den Code, der Rätselzettel nicht', () => {
  for (const f of F.faecher.filter((x) => x.schloss !== 'schluessel')) {
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

test('Easter Eggs: ergo (nur Fach 2), ausgebobbt, Tattoos und Bob Tschigerillo, keine Namen realer Personen, Schluss-Extra in Fach 6', () => {
  const alles = JSON.stringify(F.faecher);
  assert.match(alles, /Ergo: Fragt lieber nicht mich/, 'ergo (Kurt, Fach 2)');
  for (const f of F.faecher.filter((x) => x.id !== 2)) assert.doesNotMatch(JSON.stringify(f), /ergo/i, `ergo nur in Fach 2 (Fach ${f.id})`);
  assert.match(F.faecher.find((f) => f.id === 4).text, /für teure Eiweiß-Shakes hat sich’s ausgebobbt/, 'Meme-Form „Für X hat sich’s ausgebobbt“');
  for (const id of [3, 6]) assert.match(F.faecher.find((f) => f.id === id).name, /Tattoo/, `Fach ${id}: Klebe-Tattoo`);
  assert.doesNotMatch(alles, /Aufkleber/, 'keine Aufkleber mehr in den Fächern');
  assert.match(alles, /Bob Tschigerillo/);
  assert.doesNotMatch(alles, /Rühl|Cicherillo|Maggus|Coleman|Schwarzenegger/i, 'keine Namen realer Personen');
  const f6 = F.faecher.find((f) => f.id === 6);
  assert.ok(f6.extraWennAlle && /Alle sechs Fächer/.test(f6.extraWennAlle));
  assert.ok(F.faecher.every((f) => !f.extra || typeof f.extra === 'string'));
});

test('Zahlenrädchen drehen mit Umlauf (9 → 0, 0 → 9)', () => {
  assert.equal(radDrehen(0, 1), 1);
  assert.equal(radDrehen(9, 1), 0);
  assert.equal(radDrehen(0, -1), 9);
  assert.equal(radDrehen(5, -1), 4);
  assert.equal(radDrehen(3, 12), 5);
  assert.equal(radDrehen('7', -8), 9, 'auch Ziffern als Text');
});

test('Drehscheibe: Zahlen drehen nur mit der Scheibe mit (keine eigene CSS-Drehung, die in Safari verrutscht)', () => {
  const css = readFileSync(new URL('../assets/css/zugang.css', import.meta.url), 'utf8');
  const regel = css.split(/\r?\n/).find((z) => z.startsWith('.dreh-zahl {'));
  assert.ok(regel, '.dreh-zahl ist definiert');
  assert.doesNotMatch(regel, /transform|transition/, 'keine transform-box, transform-origin oder Transition an den Zahlen');
  const js = readFileSync(new URL('../src/ui/zugang.js', import.meta.url), 'utf8');
  assert.doesNotMatch(js, /rotate\(\$\{-winkel\}deg\)/, 'keine Gegendrehung der Zahlen');
  assert.match(js, /rotate\(\$\{a\} 150 150\)/, 'jede Zahl steht fest an ihrem Platz um den Mittelpunkt');
});

test('Fach-Inhalte werden zu Gegenständen in der Tasche (ohne Doppel-IDs)', () => {
  const ids = new Set(inv.gegenstaende.map((g) => g.id));
  for (const f of F.faecher) assert.ok(!ids.has(`fach${f.id}`), 'kommt erst zur Laufzeit dazu');
  assert.equal(new Set(F.faecher.map((f) => f.flag)).size, 6);
});

test('Easter Eggs: die vier Meme-Sprüche stehen in ihren Fächern (Handkäs, Hantel-Tattoo, Thunfischshake-Schale, Bizeps-Tattoo)', () => {
  const fach = (id) => JSON.stringify(F.faecher.find((f) => f.id === id));
  assert.match(fach(1), /Handkäs/);
  assert.match(fach(1), /Muss ned schmegge, muss wirke!/);
  assert.match(fach(3), /Bob Tschigerillo!/);
  assert.match(fach(4), /Thunfischshake/);
  assert.match(fach(4), /En leggeren Thunfischshake!/);
  assert.equal(F.faecher.find((f) => f.id === 4).emoji, '🐟');
  assert.match(fach(6), /Viel hilft viel!/);
  assert.match(F.faecher.find((f) => f.id === 6).extra, /Stimmt nicht immer/, 'das Kleingedruckte stellt „Viel hilft viel“ richtig');
});
