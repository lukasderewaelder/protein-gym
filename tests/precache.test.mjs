import { test } from 'node:test';
import assert from 'node:assert/strict';
import { currentAndExpected } from '../tools/precache.mjs';

test('sw.js ist aktuell (sonst: node tools/precache.mjs)', () => {
  const { sw, expected } = currentAndExpected();
  assert.equal(sw, expected);
});
