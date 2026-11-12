// Viewport: Umrechnung Tippen → Welt muss zur aktuellen Größe der Zeichenfläche passen (Vollbild, Tastatur, Leisten ändern sie).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { passeEin, zuWelt } from '../src/engine/viewport.js';

const WELT = { w: 1536, h: 1024 };

test('Szene (3:2) wird eingepasst und zentriert', () => {
  const breit = passeEin(1500, 600, WELT); // zu niedrig: Höhe bestimmt, Ränder links und rechts
  assert.ok(Math.abs(breit.scale - 600 / 1024) < 1e-9);
  assert.ok(breit.ox > 0 && breit.oy === 0);
  const hoch = passeEin(768, 900, WELT); // zu schmal: Breite bestimmt, Ränder oben und unten
  assert.ok(Math.abs(hoch.scale - 0.5) < 1e-9);
  assert.ok(hoch.oy > 0 && hoch.ox === 0);
});

test('Tippen wird mit der aktuellen Größe umgerechnet: nach einer Größenänderung stimmt die Welt-Position', () => {
  const vorher = { left: 0, top: 60, width: 1024, height: 600 };
  const nachher = { left: 0, top: 60, width: 1280, height: 740 }; // zum Beispiel nach Vollbild
  // Mitte der Zeichenfläche ist immer die Mitte der Welt
  for (const r of [vorher, nachher]) {
    const p = zuWelt(r.left + r.width / 2, r.top + r.height / 2, r, WELT);
    assert.ok(Math.abs(p.x - 768) < 1e-6 && Math.abs(p.y - 512) < 1e-6, JSON.stringify(p));
  }
  // Ein Maßstab von „vorher“ auf die Fläche „nachher“ angewandt läge daneben: genau das soll nie passieren
  const alt = passeEin(vorher.width, vorher.height, WELT);
  const falsch = (500 - nachher.left - alt.ox) / alt.scale;
  const richtig = zuWelt(500, 300, nachher, WELT).x;
  assert.ok(Math.abs(falsch - richtig) > 20, 'veralteter Maßstab würde spürbar danebenliegen');
});

test('Zeichenfläche misst sich bei jedem Bild und jedem Tippen neu (sync), nicht nur bei window.resize', () => {
  const src = readFileSync(new URL('../src/engine/viewport.js', import.meta.url), 'utf8');
  assert.match(src, /ResizeObserver/);
  assert.match(src, /visualViewport/);
  assert.match(src, /function toWorld[\s\S]*sync\(\)/);
  assert.match(src, /function apply[\s\S]*sync\(\)/);
});
