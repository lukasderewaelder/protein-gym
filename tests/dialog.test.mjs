// Dialogbox: Zeilen mit Sprecherwechsel (Gespräch mit Kupfer-Kurt) und laufender Text.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { zeileAufloesen, zeilenFuellen, textBisZeichen } from '../src/ui/dialog.js';

const kurt = { speaker: 'Kupfer-Kurt', portrait: 'kurt' };

test('Eine Textzeile gehört dem Standard-Sprecher', () => {
  assert.deepEqual(zeileAufloesen('Hallo.', kurt), { von: 'Kupfer-Kurt', portrait: 'kurt', text: 'Hallo.' });
});

test('Sprecherwechsel: „Du“ hat kein Kurt-Porträt, ein genannter Kurt schon', () => {
  assert.deepEqual(zeileAufloesen({ von: 'Du', text: 'Und?' }, kurt), { von: 'Du', portrait: null, text: 'Und?' });
  assert.equal(zeileAufloesen({ von: 'Kupfer-Kurt', text: 'Na ja.' }, kurt).portrait, 'kurt');
  assert.equal(zeileAufloesen({ von: 'Markus', portrait: 'trainer', text: 'Hi' }, kurt).portrait, 'trainer');
});

test('{name} wird in Texten und in Sprecherzeilen ersetzt', () => {
  const z = zeilenFuellen(['Hi {name}', { von: 'Du', text: 'Ich bin {name}' }], ['Mia']);
  assert.equal(z[0], 'Hi Mia');
  assert.deepEqual(z[1], { von: 'Du', text: 'Ich bin Mia' });
});

test('Laufender Text: die ersten n Zeichen, auch mit Umlauten und Emoji', () => {
  assert.equal(textBisZeichen('Äpfel', 3), 'Äpf');
  assert.equal(textBisZeichen('Ab', 10), 'Ab');
  assert.equal(textBisZeichen('Ab', -2), '');
  assert.equal(textBisZeichen('🥇x', 1), '🥇');
});
