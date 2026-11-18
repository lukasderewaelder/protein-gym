// Verschlüsselte Lehrkräfte-Seite (src/state/tresor.js, tools/lehrkraft-seite.mjs) und Freigabe des Lehrkraft-Modus
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { verschluesseln, entschluesseln, entschluesselnMitSchluessel, sha256 } from '../src/state/tresor.js';
import { lesePaket, klartextDerSeite, QUELLE, STANDARD_WORT } from '../tools/lehrkraft-seite.mjs';

const seite = readFileSync(new URL('../lehrkraft.html', import.meta.url), 'utf8');
const lehrkraft = JSON.parse(readFileSync(new URL('../data/lehrkraft.json', import.meta.url), 'utf8'));

test('Verschlüsseln und Entschlüsseln, falsches Passwort liefert nichts', async () => {
  const p = await verschluesseln('Hallo Labor', 'geheim', { iterationen: 1000 });
  assert.equal((await entschluesseln(p, 'geheim')).text, 'Hallo Labor');
  assert.equal(await entschluesseln(p, 'Geheim'), null);
  const r = await entschluesseln(p, 'geheim');
  assert.equal(await entschluesselnMitSchluessel(p, r.schluessel), 'Hallo Labor');
  assert.ok(!JSON.stringify(p).includes('Hallo'));
});

test('lehrkraft.html zeigt ohne Passwort keinen Inhalt', () => {
  for (const geheim of ['Fortschrittscode erzeugen', 'Codes nach dem Versuch', 'Auswertung der Fortschrittscodes', 'Lehrkraft-Modus öffnen', 'gottFreigabe', 'standZustand', 'aktuellerCode']) {
    assert.ok(!seite.includes(geheim), `steht im Klartext: ${geheim}`);
  }
  const p = lesePaket(seite);
  assert.ok(p.daten && p.salz && p.iv && p.iterationen >= 100000);
});

test('Das Standardpasswort öffnet die Seite mit allen Teilen', async () => {
  const text = await klartextDerSeite(STANDARD_WORT);
  assert.ok(text, 'entschlüsselbar');
  for (const id of ['kw-codes', 'erz-stand', 'erz-los', 'gott-los', 'eingabe', 'tabelle']) assert.match(text, new RegExp(`id="${id}"`), id);
  assert.equal(await klartextDerSeite('proteine'), null, 'Groß- und Kleinschreibung zählt');
});

test('Die Freigabe des Lehrkraft-Modus passt zum Prüfwert im Spiel', async () => {
  const text = await klartextDerSeite(STANDARD_WORT);
  const m = /const GOTT_TOKEN = '([0-9a-f]{32,})';/.exec(text);
  assert.ok(m, 'Token im verschlüsselten Teil');
  assert.equal(await sha256(m[1]), lehrkraft.gottPruefwert);
  assert.ok(!seite.includes(m[1]) && !JSON.stringify(lehrkraft).includes(m[1]), 'Token nie im Klartext');
});

test('lokaler Klartext und verschlüsselte Seite stimmen überein (nur, wo der Klartext liegt)', async (t) => {
  if (!existsSync(QUELLE)) { t.skip('kein lokaler Klartext'); return; }
  assert.equal(await klartextDerSeite(STANDARD_WORT), readFileSync(QUELLE, 'utf8').replace(/\r\n/g, '\n'), 'node tools/lehrkraft-seite.mjs einpacken');
});
