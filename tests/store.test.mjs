import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStore, STORAGE_KEY, defaultState } from '../src/state/store.js';
import { fillNames } from '../src/ui/dialog.js';
import { cleanName } from '../src/ui/start.js';

function fakeStorage(initial = {}) {
  const m = new Map(Object.entries(initial));
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
    dump: () => Object.fromEntries(m),
  };
}

test('Speichern und Laden über Neustart hinweg', () => {
  const st = fakeStorage();
  const a = createStore(st);
  a.load();
  a.state.names = ['Mia', 'Tom'];
  a.setFlag('intro_done');
  const b = createStore(st);
  b.load();
  assert.deepEqual(b.state.names, ['Mia', 'Tom']);
  assert.equal(b.hasFlag('intro_done'), true);
  assert.equal(b.hasNames(), true);
});

test('die Versionsnummer steckt im Schlüssel', () => {
  assert.match(STORAGE_KEY, /:v\d+$/);
});

test('beschädigter Speicher führt zu einem frischen Spiel', () => {
  const st = fakeStorage({ [STORAGE_KEY]: '{kaputt' });
  const s = createStore(st);
  s.load();
  const { fall, ...rest } = s.state;
  const { fall: _f, ...erwartet } = defaultState();
  assert.deepEqual(rest, erwartet);
  assert.ok(['desi', 'kurt', 'hannes', 'zoe'].includes(fall.taeter), 'Täter wird beim Start gewürfelt');
});

test('Zurücksetzen löscht alles', () => {
  const st = fakeStorage();
  const s = createStore(st);
  s.load();
  s.state.names = ['Mia'];
  s.save();
  s.reset();
  assert.equal(st.getItem(STORAGE_KEY), null);
  assert.equal(s.hasNames(), false);
});

test('ohne Speicher (gesperrt) läuft der Stand im Arbeitsspeicher', () => {
  const s = createStore(null);
  s.load();
  s.state.names = ['Mia'];
  s.save();
  s.load();
  assert.deepEqual(s.state.names, ['Mia']);
});

test('ein werfender Speicher bricht das Spiel nicht ab', () => {
  const bad = { getItem() { throw new Error('gesperrt'); }, setItem() { throw new Error('gesperrt'); }, removeItem() { throw new Error('gesperrt'); } };
  const s = createStore(bad);
  s.load();
  assert.doesNotThrow(() => { s.state.names = ['A']; s.save(); s.reset(); });
});

test('Namen werden im Dialogtext eingesetzt', () => {
  assert.equal(fillNames('Hey {name}!', ['Mia']), 'Hey Mia!');
  assert.equal(fillNames('Hey {name}!', ['Mia', 'Tom']), 'Hey Mia und Tom!');
  assert.equal(fillNames('Hey {name}!', ['Mia', 'Tom', 'Ali']), 'Hey Mia, Tom und Ali!');
  assert.equal(fillNames('Hey {name}!', []), 'Hey Trainingspartner!');
});

test('Namen werden gekürzt und von Spitzklammern befreit', () => {
  assert.equal(cleanName('  Mia   Lou  '), 'Mia Lou');
  assert.equal(cleanName('<b>Mia</b>'), 'bMia/b');
  assert.equal(cleanName('ein sehr langer Gruppenname'), 'ein sehr lan');
});
