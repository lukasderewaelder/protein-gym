// Bildschirmtastatur: Zahlenfeld und QWERTZ mit Umlauten, Groß- und Kleinschreibung; alle Spielfelder nutzen sie.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ZIFFERN, QWERTZ, LOESCHEN, UMSCHALT, LEER, OK, zeichen, naechsterUmschalt, druecke, tasteVon, tastaturFeld } from '../src/ui/tastatur.js';

const lies = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');

test('Zahlenfeld: Ziffern 0–9, Punkt (Notfallcode ist ein Datum) und Löschen', () => {
  const tasten = ZIFFERN.flat();
  for (const z of '0123456789.') assert.ok(tasten.includes(z), z);
  assert.ok(tasten.includes(LOESCHEN));
});

test('QWERTZ: deutsche Reihenfolge, Umlaute, ß, Ziffern, Umschalt, Löschen, Leertaste, OK', () => {
  assert.equal(QWERTZ[1].slice(0, 6).join(''), 'qwertz');
  assert.equal(QWERTZ[3].slice(1, 7).join(''), 'yxcvbn');
  const alle = QWERTZ.flat();
  for (const z of ['ä', 'ö', 'ü', 'ß', UMSCHALT, LOESCHEN, LEER, OK, '-', '.', ',']) assert.ok(alle.includes(z), z);
  for (const z of '0123456789') assert.ok(alle.includes(z), z);
  for (const z of 'abcdefghijklmnopqrstuvwxyz') assert.ok(alle.includes(z), z);
});

test('Großschreibung: Umlaute werden groß, ß bleibt ß, Ziffern bleiben', () => {
  assert.equal(zeichen('ä', true), 'Ä');
  assert.equal(zeichen('ü', true), 'Ü');
  assert.equal(zeichen('q', true), 'Q');
  assert.equal(zeichen('ß', true), 'ß');
  assert.equal(zeichen('7', true), '7');
  assert.equal(zeichen('a', false), 'a');
});

test('Umschalt: aus → einmal → fest → aus; „einmal“ gilt nur für den nächsten Buchstaben', () => {
  assert.equal(naechsterUmschalt('aus'), 'einmal');
  assert.equal(naechsterUmschalt('einmal'), 'fest');
  assert.equal(naechsterUmschalt('fest'), 'aus');
  let z = { wert: '', umschalt: 'aus' };
  for (const t of [UMSCHALT, 'p', 'r', 'o']) z = druecke(z, t);
  assert.deepEqual(z, { wert: 'Pro', umschalt: 'aus' }, 'nur der erste groß');
  z = druecke(z, UMSCHALT); z = druecke(z, UMSCHALT); // fest
  for (const t of ['t', 'ü', '1']) z = druecke(z, t);
  assert.equal(z.wert, 'ProTÜ1');
  assert.equal(z.umschalt, 'fest', 'fest bleibt');
  z = druecke({ wert: 'a', umschalt: 'einmal' }, '3');
  assert.equal(z.umschalt, 'einmal', 'eine Ziffer verbraucht das einmalige Großschreiben nicht');
});

test('Löschen, Leertaste, Höchstlänge, OK', () => {
  assert.equal(druecke({ wert: 'Eiweiß' }, LOESCHEN).wert, 'Eiwei');
  assert.equal(druecke({ wert: '' }, LOESCHEN).wert, '');
  assert.equal(druecke({ wert: 'Hallo' }, LEER).wert, 'Hallo ');
  assert.equal(druecke({ wert: '123456' }, '7', { max: 6 }).wert, '123456', 'maxlength');
  const ok = druecke({ wert: '12.11.2026' }, OK);
  assert.equal(ok.fertig, true);
  assert.equal(ok.wert, '12.11.2026');
});

test('Echte Tastatur: Zeichen, Löschen und Enter werden übernommen, Strg/Cmd/Alt nicht', () => {
  assert.deepEqual(tasteVon({ key: 'Ä' }), { roh: 'Ä' });
  assert.equal(tasteVon({ key: 'Backspace' }), LOESCHEN);
  assert.equal(tasteVon({ key: 'Enter' }), OK);
  assert.equal(tasteVon({ key: ' ' }), LEER);
  assert.equal(tasteVon({ key: 'c', ctrlKey: true }), null);
  assert.equal(tasteVon({ key: '+', metaKey: true }), null);
  assert.equal(tasteVon({ key: 'Shift' }), null);
  assert.equal(tasteVon({ key: 'Tab' }), null);
});

test('tastaturFeld: keine Systemtastatur (readonly, inputmode none), Art merken', () => {
  const attr = {};
  const feld = { readOnly: false, dataset: {}, setAttribute: (k, v) => { attr[k] = v; } };
  assert.equal(tastaturFeld(feld, 'ziffern'), feld);
  assert.equal(feld.readOnly, true);
  assert.equal(attr.inputmode, 'none');
  assert.equal(feld.dataset.tastatur, 'ziffern');
});

test('Alle Eingabefelder im Spiel nutzen die Bildschirmtastatur (Codes mit Zahlenfeld)', () => {
  const dateien = ['../src/tasks/labor-types.js', '../src/ui/zugang.js', '../src/main.js'];
  let felder = 0;
  for (const d of dateien) {
    const src = lies(d);
    // const name = h('input', { … type: 'text'|'password' …}) oder h('textarea', …)
    const re = /const (\w+) = h\('(input|textarea)', \{([^}]*)\}/g;
    for (const m of src.matchAll(re)) {
      const [, name, tag, attrs] = m;
      if (tag === 'input' && !/type: '(text|password)'/.test(attrs)) continue;
      felder++;
      assert.match(src, new RegExp(`tastaturFeld\\(${name}(, '(ziffern|text)')?\\)`), `${d}: ${name} ohne Bildschirmtastatur`);
    }
  }
  assert.ok(felder >= 7, `nur ${felder} Felder gefunden`);
  // Die Codes nach dem Versuch bekommen das Zahlenfeld
  assert.match(lies('../src/tasks/labor-types.js'), /tastaturFeld\(input, 'ziffern'\)/);
  assert.match(lies('../src/main.js'), /createTastatur\(document\)/);
});
