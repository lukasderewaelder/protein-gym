import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { buildGrid, findPath, isBlockedAt } from '../src/engine/grid.js';
import { FALL_FLAGS } from '../src/state/fall.js';
import { flagsVon } from '../src/state/zugang.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const szenen = JSON.parse(readFileSync(join(root, 'data/szenen.json'), 'utf8'));
const dialoge = JSON.parse(readFileSync(join(root, 'data/dialoge.json'), 'utf8'));
const wissen = JSON.parse(readFileSync(join(root, 'data/wissen.json'), 'utf8'));
const kartenIds = new Set([...wissen.karten.map((k) => k.id), ...FALL_FLAGS]); // Fall-Hinweise entstehen zur Laufzeit aus data/fall.json
const { w, h } = szenen.welt;
const ids = new Set(szenen.szenen.map((s) => s.id));
const FLAGS = new Set(['empfang_done', 'training_done', 'labor_done', 'sauna_done', 'labor_offen', 'sauna_offen']);

test('fünf Räume mit eindeutiger ID', () => {
  assert.equal(szenen.szenen.length, 5);
  assert.equal(ids.size, 5);
  for (const id of ['empfang', 'training', 'labor', 'sauna', 'shakebar']) assert.ok(ids.has(id), id);
});

for (const s of szenen.szenen) {
  test(`${s.id}: Hotspots, Türen und Startpunkt sind gültig`, () => {
    const g = buildGrid(s);
    assert.ok(!isBlockedAt(g, s.spawn[0], s.spawn[1]), 'Startpunkt ist begehbar');
    const seen = new Set();
    for (const hs of s.hotspots) {
      assert.ok(!seen.has(hs.id), `doppelte Hotspot-ID ${hs.id}`);
      seen.add(hs.id);
      assert.ok(hs.x >= 0 && hs.x <= w && hs.y >= 0 && hs.y <= h, `${hs.id} liegt in der Welt`);
      assert.ok(['dialog', 'npc', 'door', 'task', 'geraet', 'fach'].includes(hs.type), `${hs.id}: Typ`);
      if (hs.type === 'door') {
        assert.ok(ids.has(hs.to), `${hs.id}: Zielraum ${hs.to}`);
        if (hs.requires) {
          for (const f of flagsVon(hs.requires)) assert.ok(FLAGS.has(f), `${hs.id}: unbekannte Freischaltung ${f}`);
          assert.ok(hs.lockedText, `${hs.id}: Text für gesperrte Tür fehlt`);
        }
      }
      if (hs.type !== 'door') {
        assert.ok(hs.dialog || hs.karte || hs.aktion, `${s.id}/${hs.id}: weder Dialog noch Karte noch Aktion`);
        if (hs.dialog) assert.ok(dialoge[hs.dialog], `${s.id}/${hs.id}: Dialog ${hs.dialog} fehlt`);
        if (hs.karte) assert.ok(kartenIds.has(hs.karte), `${s.id}/${hs.id}: Karte ${hs.karte} fehlt in wissen.json`);
      }
    }
  });

  test(`${s.id}: jeder Hotspot ist vom Startpunkt aus erreichbar`, () => {
    const g = buildGrid(s);
    for (const hs of s.hotspots) {
      const path = findPath(g, { x: s.spawn[0], y: s.spawn[1] }, { x: hs.x, y: hs.y });
      assert.ok(path.length > 0, `${hs.id} nicht erreichbar`);
      const end = path[path.length - 1];
      assert.ok(Math.hypot(end.x - hs.x, end.y - hs.y) <= (hs.r || 60) * 1.3 + 16, `${hs.id}: Ankunftspunkt zu weit entfernt (${Math.round(Math.hypot(end.x - hs.x, end.y - hs.y))})`);
    }
  });
}

test('Dialoge haben Text und die {name}-Platzhalter sind bekannt', () => {
  for (const [id, d] of Object.entries(dialoge)) {
    assert.ok(Array.isArray(d.lines) && d.lines.length > 0, `${id}: keine Zeilen`);
    for (const l of d.lines) {
      assert.ok(typeof l === 'string' && l.length > 0, `${id}: leere Zeile`);
      const tokens = l.match(/\{[^}]*\}/g) || [];
      for (const t of tokens) assert.equal(t, '{name}', `${id}: unbekannter Platzhalter ${t}`);
    }
  }
});

test('die Pflichtdateien der App sind vorhanden', () => {
  for (const f of ['index.html', 'manifest.webmanifest', 'sw.js', 'src/main.js', 'assets/css/app.css', 'assets/icons/icon.svg']) {
    assert.ok(existsSync(join(root, f)), f);
  }
});
