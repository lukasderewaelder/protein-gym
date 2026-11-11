import { test } from 'node:test';
import assert from 'node:assert/strict';
import { encodeProgress, decodeProgress, normalizeCode, FLAG_LIST, CODE_CHARS } from '../src/state/progress.js';

const sample = {
  shirt: 2, hair: 1, skin: 3, scene: 'labor',
  flags: { intro_done: true, training_done: true, a1_done: true, k_protein: true, z_protein: true },
  levels: { training: 2, labor: 0, sauna: 1, shakebar: 1 },
};

test('Code hat das Format PG-XXXX-XXXX-… in Vierergruppen', () => {
  const code = encodeProgress(sample);
  assert.match(code, /^PG-([0-9A-Z]{4}-)+[0-9A-Z]{1,4}$/);
  assert.equal(normalizeCode(code).length, CODE_CHARS);
});

test('Hin und zurück ergibt denselben Stand', () => {
  const res = decodeProgress(encodeProgress(sample));
  assert.equal(res.ok, true);
  assert.deepEqual(res.state.flags, sample.flags);
  assert.deepEqual(res.state.levels, sample.levels);
  assert.equal(res.state.scene, 'labor');
  assert.deepEqual([res.state.shirt, res.state.hair, res.state.skin], [2, 1, 3]);
});

test('Leerer Stand lässt sich auch kodieren', () => {
  const res = decodeProgress(encodeProgress({ scene: 'empfang', flags: {} }));
  assert.equal(res.ok, true);
  assert.deepEqual(res.state.flags, {});
  assert.equal(res.state.scene, 'empfang');
});

test('Alle Flags gleichzeitig sind möglich und eindeutig', () => {
  assert.equal(new Set(FLAG_LIST).size, FLAG_LIST.length, 'doppelte Flags');
  const flags = Object.fromEntries(FLAG_LIST.map((f) => [f, true]));
  const res = decodeProgress(encodeProgress({ scene: 'shakebar', flags }));
  assert.equal(res.ok, true);
  assert.equal(Object.keys(res.state.flags).length, FLAG_LIST.length);
});

test('Eingabe: Kleinbuchstaben, Leerzeichen, fehlende Striche und verwechselbare Zeichen', () => {
  const code = encodeProgress(sample);
  assert.equal(decodeProgress(code.toLowerCase()).ok, true);
  assert.equal(decodeProgress(code.replaceAll('-', ' ')).ok, true);
  assert.equal(decodeProgress(code.replaceAll('-', '')).ok, true);
  assert.equal(normalizeCode('pg-0o1i-lU'), '00111V');
});

test('Jeder einzelne Tippfehler wird erkannt', () => {
  const code = encodeProgress(sample);
  const chars = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  const body = code.replace(/^PG-/, '').replaceAll('-', '');
  let undetected = 0;
  for (let i = 0; i < body.length; i++) {
    for (const c of chars) {
      if (c === body[i]) continue;
      const bad = body.slice(0, i) + c + body.slice(i + 1);
      if (decodeProgress(bad).ok) undetected++;
    }
  }
  assert.equal(undetected, 0);
});

test('Falsche Länge und leere Eingabe', () => {
  assert.equal(decodeProgress('').ok, false);
  assert.equal(decodeProgress('PG-1234').ok, false);
  assert.match(decodeProgress('PG-1234').reason, /Länge/);
});

test('Version 6: Schlussquiz-Ergebnis und die neuen Flags überstehen den Rundlauf, die Layout-Längen sind verschieden', () => {
  const flags = { quiz_done: true, a7_done: true, lieferung_done: true, quiz2_task: true, quiz2_done: true };
  const res = decodeProgress(encodeProgress({ scene: 'empfang', flags, quiz: { richtig: 3, von: 4 }, quiz2: { richtig: 2, von: 2 } }));
  assert.equal(res.ok, true);
  assert.deepEqual(res.state.flags, flags);
  assert.deepEqual(res.state.quiz, { richtig: 3, von: 4 });
  assert.deepEqual(res.state.quiz2, { richtig: 2, von: 2 });
  const ohne = decodeProgress(encodeProgress({ scene: 'empfang', flags: {} }));
  assert.equal(ohne.state.quiz2, null, 'Schlussquiz nicht gespielt');
  assert.equal(CODE_CHARS, 24, 'Version 6 ist 24 Zeichen lang (Version 5: 23, Version 4: 16), die Länge verrät die Version');
});

test('Codes der Version 5 bleiben lesbar: Quiz 1 fertig, Prüfung der Lieferung und Schlussquiz fehlen noch', () => {
  const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  const flags5 = FLAG_LIST.slice(0, FLAG_LIST.length - 4);
  assert.equal(flags5.length, 63);
  assert.equal(flags5[62], 'bz_6', 'die ersten 63 Flags dürfen sich nie ändern');
  let v = 0n;
  const put = (w, b) => { v = (v << BigInt(b)) | (BigInt(w) & ((1n << BigInt(b)) - 1n)); };
  put(5, 4); put(0, 2); put(0, 2); put(0, 2); put(0, 3); // Version 5, Look, Szene empfang
  for (const f of flags5) put(['shakebar_done', 'quiz_done'].includes(f) ? 1 : 0, 1);
  for (let i = 0; i < 4; i++) put(1, 2);
  put(3, 3); put(1, 2); put(4826, 14); // Quiz 3 von 4, Täter, Saunacode
  let crc = 0; let b = v; const bytes = [];
  while (b > 0n) { bytes.push(Number(b & 0xffn)); b >>= 8n; }
  for (const byte of bytes.reverse()) { crc ^= byte; for (let i = 0; i < 8; i++) crc = (crc & 0x80) ? ((crc << 1) ^ 0x07) & 0xff : (crc << 1) & 0xff; }
  put(crc, 8);
  let s = '';
  for (let i = 22; i >= 0; i--) s += ALPHABET[Number((v >> BigInt(i * 5)) & 31n)];
  const res = decodeProgress(s);
  assert.equal(res.ok, true);
  assert.equal(res.state.flags.quiz_done, true);
  assert.equal(res.state.flags.lieferung_done, undefined, 'alte Stände holen die Prüfung nach');
  assert.equal(res.state.flags.quiz2_done, undefined);
  assert.equal(res.state.quiz2, undefined);
  assert.deepEqual(res.state.quiz, { richtig: 3, von: 4 });
  assert.equal(res.state.codes.sauna, '4826');
});
