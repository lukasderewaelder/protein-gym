// Hotspots: Der Gegenstand im Bild (ziel) ist genau dort markiert und antippbar, wo er zu sehen ist; x/y ist der Standort davor.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const S = JSON.parse(readFileSync(new URL('../data/szenen.json', import.meta.url), 'utf8'));

test('Hinweiskarten, Aufgaben-Stationen und Schließfächer haben ein Ziel auf dem Gegenstand', () => {
  for (const s of S.szenen) {
    for (const hs of s.hotspots) {
      const braucht = Boolean(hs.karte) || hs.type === 'task' || hs.type === 'fach' || hs.aktion === 'zettel' || hs.aktion === 'notizbuch';
      if (!braucht || hs.type === 'npc') continue; // Personen stehen im Raum, die Figur ist ihr Ziel
      assert.ok(hs.ziel, `${s.id}/${hs.id}: ziel fehlt`);
      assert.ok(hs.ziel.x > 0 && hs.ziel.x < S.welt.w && hs.ziel.y > 0 && hs.ziel.y < S.welt.h, `${s.id}/${hs.id}: ziel liegt im Bild`);
      assert.ok(hs.ziel.r >= 40 && hs.ziel.r <= 110, `${s.id}/${hs.id}: Tippradius ${hs.ziel.r}`);
      const weg = Math.hypot(hs.ziel.x - hs.x, hs.ziel.y - hs.y);
      assert.ok(weg <= 480, `${s.id}/${hs.id}: Standort ${Math.round(weg)} px vom Gegenstand entfernt`);
    }
  }
});

test('Die Tippflächen der Ziele überdecken sich nicht stark (sonst trifft der Tipp den falschen Gegenstand)', () => {
  for (const s of S.szenen) {
    const mit = s.hotspots.filter((h) => h.ziel && h.id !== 'nachweis_leer' && h.id !== 'nachweis');
    for (let i = 0; i < mit.length; i++) for (let j = i + 1; j < mit.length; j++) {
      const a = mit[i], b = mit[j];
      const d = Math.hypot(a.ziel.x - b.ziel.x, a.ziel.y - b.ziel.y);
      assert.ok(d >= Math.min(a.ziel.r, b.ziel.r) * 0.9, `${s.id}: ${a.id} und ${b.id} liegen zu dicht beieinander (${Math.round(d)} px)`);
    }
  }
});
