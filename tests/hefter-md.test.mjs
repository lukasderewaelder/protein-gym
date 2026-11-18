// Hefter-Texte: inhalt/hefter.md ist die Quelle, data/hefter.json wird daraus gebaut (tools/hefter-md.mjs).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ausMd, nachMd, alsJson, MD_PFAD, JSON_PFAD } from '../tools/hefter-md.mjs';

const md = readFileSync(MD_PFAD, 'utf8');
const json = readFileSync(JSON_PFAD, 'utf8');

test('data/hefter.json ist aus inhalt/hefter.md gebaut (sonst: npm run hefter)', () => {
  assert.equal(alsJson(ausMd(md)), json.replace(/\r\n/g, '\n'));
});

test('Rundreise JSON → MD → JSON ist verlustfrei', () => {
  const obj = JSON.parse(json);
  assert.deepEqual(ausMd(nachMd(obj)), obj);
});

test('Alle Teilarten werden gelesen: Überschrift, Text, Liste mit Einleitung, Merksatz, Tabelle, Abbildung', () => {
  const probe = `Erklärung, wird nicht gelesen

# Allgemein

## Blatt-Titel
Titel

## Hinweis über dem Blatt
Hinweis
über zwei Zeilen

# Eintrag X: Probe
<!-- id: hx · ab: a_done · sperrt: b · erledigtMit: b_done -->
Dauer: 1 Minute

## Anweisungen
- Erste Anweisung.

## Blatt

### Teil

Ein Absatz.

Einleitung:
- eins
- zwei

> **Merke: Begriff** Der Merksatz.

**Tabelle**
| A | B |
|---|---|
| 1 |  |

\`\`\`abbildung
art: aminosaeure
label: Bild
formeln: allgemein = R; Glycin = H
unterschrift: Unterschrift.
\`\`\`
`;
  const h = ausMd(probe);
  assert.equal(h.blatt.titel, 'Titel');
  assert.equal(h.hinweis, 'Hinweis über zwei Zeilen', 'Absätze dürfen umbrochen werden');
  const e = h.eintraege[0];
  assert.deepEqual([e.id, e.titel, e.ab, e.sperrt, e.erledigtMit, e.dauer], ['hx', 'Eintrag X: Probe', 'a_done', 'b', 'b_done', '1 Minute']);
  assert.deepEqual(e.anweisungen, ['Erste Anweisung.']);
  assert.deepEqual(e.teile, [
    { typ: 'text', ueb: 'Teil', text: 'Ein Absatz.' },
    { typ: 'liste', einleitung: 'Einleitung:', punkte: ['eins', 'zwei'] },
    { typ: 'merksatz', merke: 'Begriff', text: 'Der Merksatz.' },
    { typ: 'tabelle', label: 'Tabelle', kopf: ['A', 'B'], zeilen: [['1', '']] },
    { typ: 'abbildung', label: 'Bild', art: 'aminosaeure', formeln: [['allgemein', 'R'], ['Glycin', 'H']], unterschrift: 'Unterschrift.' },
  ]);
});

test('Die MD liegt nicht unter data/ (wird nicht auf die Geräte vorgeladen) und hat npm run hefter', () => {
  assert.match(MD_PFAD.replace(/\\/g, '/'), /\/inhalt\/hefter\.md$/);
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  assert.equal(pkg.scripts.hefter, 'node tools/hefter-md.mjs');
});
