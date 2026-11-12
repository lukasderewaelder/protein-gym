// Zeitbasierte Codes nach dem Versuch: Berechnung, Toleranz, Wiederverwendung, Einrichtung eines Tablets.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pruefwertVon, schluesselAus, wortPasst, codeFuer, aktuellerCode, pruefeCode, pruefeCodeMitSchluesseln, notfallCode, istNotfallCode, schrittVon, restSekunden, schrittFrei, schrittMerken, CODE_ZEIT } from '../src/state/lehrcode.js';
import { readFileSync } from 'node:fs';
import { ladeSchluessel, speichereSchluessel, entferneSchluessel } from '../src/state/klassenwort.js';

const IT = 1000; // wenige Runden genügen im Test
const WORT = 'Kupfer Gurke Mond 2026';
const T0 = Date.UTC(2026, 10, 12, 9, 0, 0); // genau auf einer Schrittgrenze (30 s)

test('Der Code hat sechs Ziffern, ist für Versuch und Zeitschritt verschieden und wiederholbar', async () => {
  const k = await schluesselAus(WORT, IT);
  assert.match(k, /^[0-9a-f]{64}$/);
  const a = await codeFuer(k, 'A', 100);
  assert.match(a, /^[0-9]{6}$/);
  assert.equal(await codeFuer(k, 'A', 100), a, 'gleiche Eingabe, gleicher Code');
  assert.notEqual(await codeFuer(k, 'L', 100), a, 'Lieferung hat einen anderen Code als der Hitze-Versuch');
  assert.notEqual(await codeFuer(k, 'A', 101), a, 'jeder Zeitschritt hat einen eigenen Code');
  const k2 = await schluesselAus('ein ganz anderes Wort', IT);
  assert.notEqual(await codeFuer(k2, 'A', 100), a, 'anderes Klassenwort, anderer Code');
});

test('Prüfwert und Schlüssel sind verschieden; ein falsches Wort passt nicht zum Prüfwert', async () => {
  const p = await pruefwertVon(WORT, IT);
  assert.notEqual(p, await schluesselAus(WORT, IT), 'der Prüfwert im Quelltext verrät den Schlüssel nicht');
  assert.equal(await wortPasst(WORT, p, IT), true);
  assert.equal(await wortPasst('falsch', p, IT), false);
  assert.equal(await wortPasst(`  ${WORT}  `, p, IT), true, 'Leerzeichen am Rand zählen nicht');
  assert.equal(await wortPasst(WORT, '', IT), false, 'ohne Prüfwert passt nichts');
});

test('Zeitschritte: 30 Sekunden, Restzeit, Toleranz einen Schritt vor und zurück, aber nicht mehr', async () => {
  const k = await schluesselAus(WORT, IT);
  const s = schrittVon(T0, 30);
  assert.equal(schrittVon(T0 + 29999, 30), s);
  assert.equal(schrittVon(T0 + 30000, 30), s + 1);
  assert.equal(restSekunden(T0, 30), 30);
  assert.equal(restSekunden(T0 + 25000, 30), 5);
  const jetzt = await aktuellerCode(k, 'A', T0 + 5000);
  assert.equal(await pruefeCode(k, 'A', jetzt, T0 + 5000), s, 'aktueller Code gilt');
  assert.equal(await pruefeCode(k, 'A', jetzt, T0 + 35000), s, 'der vorige Code gilt noch (Tippzeit)');
  assert.equal(await pruefeCode(k, 'A', jetzt, T0 - 5000), s, 'der nächste Code gilt schon (Uhr geht nach)');
  assert.equal(await pruefeCode(k, 'A', jetzt, T0 + 65000), null, 'nach gut einer Minute ist er abgelaufen');
  assert.equal(await pruefeCode(k, 'L', jetzt, T0 + 5000), null, 'der Code des anderen Versuchs gilt nicht');
  assert.equal(await pruefeCode(k, 'A', '12345', T0), null);
  assert.equal(await pruefeCode(k, 'A', 'abcdef', T0), null);
  assert.equal(await pruefeCode(k, 'A', `${jetzt.slice(0, 3)} ${jetzt.slice(3)}`, T0 + 5000), s, 'Leerzeichen beim Tippen stören nicht');
});

test('Ein Zeitschritt lässt sich auf einem Gerät nur einmal verwenden', () => {
  assert.equal(schrittFrei({}, 'A', 5), true);
  const b = schrittMerken({}, 'A', 5);
  assert.equal(schrittFrei(b, 'A', 5), false);
  assert.equal(schrittFrei(b, 'A', 6), true);
  assert.equal(schrittFrei(b, 'L', 5), true, 'der andere Versuch hat seine eigene Liste');
  let x = {};
  for (let i = 0; i < 40; i++) x = schrittMerken(x, 'A', i);
  assert.equal(x.A.length, 20, 'es bleiben nur die letzten Schritte');
  assert.deepEqual(CODE_ZEIT, { sekunden: 30, vorher: 1, nachher: 1, stellen: 6 });
});

test('Einrichtung eines Tablets: nur ein gültiger Schlüssel wird gelesen, ohne Speicher passiert nichts', async () => {
  const daten = new Map();
  const speicher = { getItem: (k) => (daten.has(k) ? daten.get(k) : null), setItem: (k, v) => daten.set(k, v), removeItem: (k) => daten.delete(k) };
  assert.equal(ladeSchluessel(speicher), '');
  const k = await schluesselAus(WORT, IT);
  assert.equal(speichereSchluessel(speicher, k), true);
  assert.equal(ladeSchluessel(speicher), k);
  entferneSchluessel(speicher);
  assert.equal(ladeSchluessel(speicher), '');
  daten.set('protein-gym:lehrkraft', JSON.stringify({ schluessel: 'kein-schluessel' }));
  assert.equal(ladeSchluessel(speicher), '', 'ungültiger Inhalt wird ignoriert');
  assert.equal(ladeSchluessel(null), '');
  assert.equal(speichereSchluessel({ setItem() { throw new Error('voll'); } }, k), false);
});

test('Notfallcode: heutiges Datum als dd.mm.yyyy, auch ohne Punkte, nur für heute', () => {
  const heute = new Date(2026, 10, 12, 9, 30).getTime(); // Ortszeit
  assert.equal(notfallCode(heute), '12.11.2026');
  assert.equal(notfallCode(new Date(2027, 0, 5, 23, 59).getTime()), '05.01.2027', 'Tag und Monat immer zweistellig');
  assert.equal(istNotfallCode('12.11.2026', heute), true);
  assert.equal(istNotfallCode(' 12.11.2026 ', heute), true, 'Leerzeichen stören nicht');
  assert.equal(istNotfallCode('12112026', heute), true, 'ohne Punkte (Zahlentastatur) auch');
  assert.equal(istNotfallCode('11.11.2026', heute), false, 'gestern gilt nicht');
  assert.equal(istNotfallCode('12.11.26', heute), false);
  assert.equal(istNotfallCode('', heute), false);
  assert.equal(istNotfallCode('12.11.2026', new Date(2026, 10, 13, 0, 5).getTime()), false, 'am nächsten Tag gilt das neue Datum');
});

test('Mehrere Schlüssel: der erste Treffer zählt, ohne passenden Schlüssel kein Treffer', async () => {
  const a = await schluesselAus('Wort A', IT);
  const b = await schluesselAus('Wort B', IT);
  const code = await aktuellerCode(b, 'A', T0 + 5000);
  assert.equal(await pruefeCodeMitSchluesseln([a, b], 'A', code, T0 + 5000), schrittVon(T0, 30));
  assert.equal(await pruefeCodeMitSchluesseln(['', null, b], 'A', code, T0 + 5000), schrittVon(T0, 30), 'leere Einträge werden übersprungen');
  assert.equal(await pruefeCodeMitSchluesseln([a], 'A', code, T0 + 5000), null);
  assert.equal(await pruefeCodeMitSchluesseln([], 'A', code, T0 + 5000), null);
});

test('Standardwort „Proteine“: Prüfwert und Standardschlüssel in den Daten gehören zusammen (Tablets brauchen keine Einrichtung)', async () => {
  const V = JSON.parse(readFileSync(new URL('../data/versuch.json', import.meta.url), 'utf8'));
  const kw = V.klassenwort;
  assert.equal(await wortPasst('Proteine', kw.hash, kw.iterationen), true, 'Standardwort passt zum Prüfwert');
  assert.equal(kw.standardSchluessel, await schluesselAus('Proteine', kw.iterationen), 'Standardschlüssel stammt aus dem Standardwort');
  assert.equal(await wortPasst('proteine', kw.hash, kw.iterationen), false, 'Groß- und Kleinschreibung zählt');
});
