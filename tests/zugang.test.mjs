// Protein-Gym 2.0: Zugang (Laborführerschein, Ausweis, Saunacode), Migration alter Stände, Codeversion 5.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { erfuellt, flagsVon, istSichtbar, wuerfleSaunaCode, istSaunaCode, pruefeCode, migriereZweiNull, ZUGANG_FLAGS } from '../src/state/zugang.js';
import { encodeProgress, decodeProgress, FLAG_LIST, CODE_VERSION } from '../src/state/progress.js';
import { createStore, STORAGE_KEY } from '../src/state/store.js';

function fakeStorage() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
}
const hat = (flags) => (f) => Boolean(flags[f]);

test('Freischaltung: eine Flag, eine Liste (alle nötig) oder nichts', () => {
  assert.equal(erfuellt(undefined, hat({})), true);
  assert.equal(erfuellt('a', hat({ a: true })), true);
  assert.equal(erfuellt('a', hat({})), false);
  assert.equal(erfuellt(['a', 'b'], hat({ a: true })), false);
  assert.equal(erfuellt(['a', 'b'], hat({ a: true, b: true })), true);
  assert.deepEqual(flagsVon(['a', 'b']), ['a', 'b']);
  assert.deepEqual(flagsVon('a'), ['a']);
  assert.deepEqual(flagsVon(null), []);
});

test('Sichtbarkeit von Hotspots: „wenn“ und „nicht“', () => {
  assert.equal(istSichtbar({}, hat({})), true);
  assert.equal(istSichtbar({ wenn: 'x' }, hat({})), false);
  assert.equal(istSichtbar({ wenn: 'x' }, hat({ x: true })), true);
  assert.equal(istSichtbar({ nicht: 'x' }, hat({ x: true })), false);
});

test('Saunacode: vier Ziffern, nie vier gleiche, nie 1234 oder 4321, nie mit Null am Anfang', () => {
  for (let i = 0; i < 2000; i++) assert.ok(istSaunaCode(wuerfleSaunaCode()));
  for (const schlecht of ['1111', '9999', '1234', '4321', '0123', '123', '12345', 'abcd', 1234, null]) assert.equal(istSaunaCode(schlecht), false, String(schlecht));
  assert.equal(istSaunaCode('4826'), true);
  assert.equal(wuerfleSaunaCode(() => 0.5), String(1000 + Math.floor(0.5 * 9000)));
  assert.equal(wuerfleSaunaCode(() => (1111 - 1000 + 0.5) / 9000), '4826', 'Rückfall, wenn der Zufall nur schlechte Codes liefert');
  assert.equal(pruefeCode('4826', '4826'), true);
  assert.equal(pruefeCode('4827', '4826'), false);
});

test('Alle neuen Flags stehen einmal in der FLAG_LIST', () => {
  for (const f of ZUGANG_FLAGS) assert.equal(FLAG_LIST.filter((x) => x === f).length, 1, f);
  assert.equal(new Set(FLAG_LIST).size, FLAG_LIST.length);
});

test('Migration: frisch und nur Empfang fertig bleiben unverändert (Labor wird erst durch den Führerschein frei)', () => {
  const a = migriereZweiNull({ scene: 'empfang', flags: {} });
  assert.deepEqual(a.flags, {});
  const b = migriereZweiNull({ scene: 'empfang', flags: { empfang_done: true } });
  assert.deepEqual(b.flags, { empfang_done: true });
});

test('Migration: Labor schon betreten, Labor fertig, Sauna fertig', () => {
  const imLabor = migriereZweiNull({ scene: 'labor', flags: { empfang_done: true } });
  assert.equal(imLabor.flags.labor_offen, true);
  assert.equal(imLabor.flags.item_ausweis, true);
  assert.equal(imLabor.flags.sauna_offen, undefined, 'Sauna ist noch nicht offen');
  const fertig = migriereZweiNull({ scene: 'empfang', flags: { empfang_done: true, labor_done: true } });
  assert.equal(fertig.flags.labor_offen, true);
  assert.equal(fertig.flags.sauna_info, true);
  assert.equal(fertig.flags.sauna_offen, undefined, 'Saunacode muss noch eingegeben werden');
  const sauna = migriereZweiNull({ scene: 'empfang', flags: { empfang_done: true, labor_done: true, sauna_done: true } });
  assert.equal(sauna.flags.sauna_offen, true);
  assert.equal(sauna.flags.sauna_code_gesehen, true);
  const alles = migriereZweiNull({ scene: 'shakebar', flags: { empfang_done: true, labor_done: true, sauna_done: true, training_done: true, shakebar_done: true } });
  for (const f of ['lf_bestanden', 'labor_offen', 'sauna_offen']) assert.equal(alles.flags[f], true, f);
  const doppelt = migriereZweiNull(structuredClone(alles));
  assert.deepEqual(doppelt, alles, 'zweites Mal ändert nichts');
});

test('Fortschrittscode Version 5: Saunacode und neue Flags überstehen den Rundlauf', () => {
  assert.equal(CODE_VERSION, 5);
  const flags = { empfang_done: true, lf_bestanden: true, item_ausweis: true, labor_offen: true, bz_3: true, bonus_6: true };
  const res = decodeProgress(encodeProgress({ scene: 'labor', flags, codes: { sauna: '4826' } }));
  assert.equal(res.ok, true);
  assert.deepEqual(res.state.flags, flags);
  assert.equal(res.state.codes.sauna, '4826');
  const ohne = decodeProgress(encodeProgress({ scene: 'empfang', flags: {} }));
  assert.equal(ohne.state.codes.sauna, null, 'kein Saunacode gespeichert: der Spielstand würfelt neu');
});

test('Alte Codes (Version 4) bleiben lesbar und werden nachgerüstet', () => {
  // So hat die Version 4 kodiert: 44 Flags, kein Saunacode, 16 Zeichen.
  const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  const alt = FLAG_LIST.slice(0, 44);
  assert.equal(alt[0], 'intro_done');
  assert.equal(alt[43], 'fall_geloest', 'die ersten 44 Flags dürfen sich nie ändern');
  let v = 0n;
  const put = (w, b) => { v = (v << BigInt(b)) | (BigInt(w) & ((1n << BigInt(b)) - 1n)); };
  put(4, 4); put(1, 2); put(2, 2); put(3, 2); put(2, 3); // Version 4, Look, Szene labor
  for (const f of alt) put(['empfang_done', 'labor_done', 'a4_done'].includes(f) ? 1 : 0, 1);
  for (let i = 0; i < 4; i++) put(1, 2);
  put(7, 3); put(2, 2);
  let crc = 0; let b = v; const bytes = [];
  while (b > 0n) { bytes.push(Number(b & 0xffn)); b >>= 8n; }
  for (const byte of bytes.reverse()) { crc ^= byte; for (let i = 0; i < 8; i++) crc = (crc & 0x80) ? ((crc << 1) ^ 0x07) & 0xff : (crc << 1) & 0xff; }
  put(crc, 8);
  let s = '';
  for (let i = 15; i >= 0; i--) s += ALPHABET[Number((v >> BigInt(i * 5)) & 31n)];
  const res = decodeProgress(`PG-${s.match(/.{1,4}/g).join('-')}`);
  assert.equal(res.ok, true, res.reason);
  assert.equal(res.state.scene, 'labor');
  assert.equal(res.state.flags.labor_done, true);
  assert.equal(res.state.flags.labor_offen, true, 'Ausweis und Tür nachgerüstet');
  assert.equal(res.state.flags.sauna_info, true);
  assert.equal(res.state.flags.sauna_offen, undefined);
  assert.equal(res.state.codes.sauna, null);
});

test('Speicher: neuer Spielstand bekommt einen Saunacode, alter Stand wird nachgerüstet, Neues Spiel würfelt neu', () => {
  const st = fakeStorage();
  const a = createStore(st);
  a.load();
  assert.ok(istSaunaCode(a.state.codes.sauna));
  const code = a.state.codes.sauna;
  a.save();
  const b = createStore(st);
  b.load();
  assert.equal(b.state.codes.sauna, code, 'bleibt nach Neustart gleich');
  // Spielstand aus der Zeit vor 2.0: kein Feld "codes", Labor schon geschafft
  const alt = fakeStorage();
  alt.setItem(STORAGE_KEY, JSON.stringify({ names: ['Mia'], scene: 'empfang', flags: { empfang_done: true, labor_done: true } }));
  const c = createStore(alt);
  c.load();
  assert.equal(c.state.flags.labor_offen, true);
  assert.equal(c.state.flags.sauna_info, true);
  assert.ok(istSaunaCode(c.state.codes.sauna));
  c.reset();
  assert.equal(c.state.flags.labor_offen, undefined);
  assert.ok(istSaunaCode(c.state.codes.sauna));
});
