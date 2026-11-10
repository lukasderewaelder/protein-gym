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
