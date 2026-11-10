import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createImage, keyOutMagenta, labelIslands, mergeBoxes, cropImage, trimAlpha, splitEqual, detectFrames, frameStrip,
} from '../tools/sprite-core.mjs';
import { recolorShirt, isShirtRed, hexToRgb } from '../src/engine/recolor.js';

function bild(w, h, rects = [], bg = [255, 0, 255]) {
  const img = createImage(w, h);
  for (let i = 0; i < w * h; i++) { img.data[i * 4] = bg[0]; img.data[i * 4 + 1] = bg[1]; img.data[i * 4 + 2] = bg[2]; img.data[i * 4 + 3] = 255; }
  for (const { x, y, w: rw, h: rh, c = [40, 90, 200] } of rects) {
    for (let yy = y; yy < y + rh; yy++) for (let xx = x; xx < x + rw; xx++) {
      const p = (yy * w + xx) * 4;
      img.data[p] = c[0]; img.data[p + 1] = c[1]; img.data[p + 2] = c[2];
    }
  }
  return img;
}
const alpha = (img, x, y) => img.data[(y * img.width + x) * 4 + 3];

test('Magenta wird durchsichtig, Figurfarben bleiben', () => {
  const k = keyOutMagenta(bild(20, 20, [{ x: 5, y: 5, w: 6, h: 6 }]));
  assert.equal(alpha(k, 0, 0), 0);
  assert.equal(alpha(k, 7, 7), 255);
});

test('Fast-Magenta (JPEG-Rauschen) wird ebenfalls entfernt, helle Rosatöne bleiben', () => {
  const k = keyOutMagenta(bild(10, 10, [], [248, 12, 250]));
  assert.equal(alpha(k, 3, 3), 0);
  const rosa = keyOutMagenta(bild(10, 10, [], [255, 170, 200]));
  assert.equal(alpha(rosa, 3, 3), 255);
});

test('Randpixel werden weich und der Magenta-Schimmer wird herausgerechnet', () => {
  const img = bild(4, 1, [], [255, 0, 255]);
  img.data.set([220, 90, 220, 255], 4); // Mischfarbe am Rand
  const k = keyOutMagenta(img, { tol: 90, feather: 120 });
  assert.ok(alpha(k, 1, 0) > 0 && alpha(k, 1, 0) < 255, 'teilweise durchsichtig');
  assert.ok(k.data[4] < 220 && k.data[6] < 220, 'Magenta-Anteil gesenkt');
});

test('Flächen: drei Figuren, Rauschen wird ignoriert, Reihenfolge links nach rechts', () => {
  const k = keyOutMagenta(bild(100, 40, [{ x: 60, y: 5, w: 10, h: 30 }, { x: 10, y: 5, w: 10, h: 30 }, { x: 35, y: 5, w: 10, h: 30 }, { x: 90, y: 2, w: 2, h: 2 }]));
  const boxes = labelIslands(k);
  assert.equal(boxes.length, 3);
  assert.deepEqual(boxes.map((b) => b.x0), [10, 35, 60]);
});

test('Zusammenfügen: abgetrennte Hand gehört zur Figur, weit entfernte Figur nicht', () => {
  const k = keyOutMagenta(bild(100, 40, [{ x: 10, y: 5, w: 10, h: 30 }, { x: 23, y: 15, w: 8, h: 8 }, { x: 70, y: 5, w: 10, h: 30 }]));
  const base = labelIslands(k);
  assert.equal(base.length, 3);
  assert.equal(mergeBoxes(base, 2).length, 3);
  assert.equal(mergeBoxes(base, 4).length, 2);
});

test('Streifen mit vier Figuren wird über die Flächen erkannt', () => {
  const rects = [0, 1, 2, 3].flatMap((i) => [{ x: 8 + i * 40, y: 6, w: 14, h: 28 }, { x: 24 + i * 40, y: 14, w: 5, h: 5 }]);
  const res = detectFrames(keyOutMagenta(bild(170, 40, rects)), 4);
  assert.equal(res.mode, 'flaechen');
  assert.equal(res.frames.length, 4);
});

test('Falsche Anzahl: Rückfall auf gleich breite Spalten', () => {
  const rects = [0, 1, 2].map((i) => ({ x: 10 + i * 50, y: 6, w: 14, h: 28 }));
  const res = detectFrames(keyOutMagenta(bild(160, 40, rects)), 4);
  assert.equal(res.mode, 'gleich');
  assert.equal(res.frames.length, 4);
});

test('Streifen: gleiche Fußlinie, zentriert, gleich große Felder', () => {
  const a = cropImage(keyOutMagenta(bild(30, 40, [{ x: 5, y: 4, w: 10, h: 30 }])), { x0: 5, y0: 4, x1: 14, y1: 33 });
  const b = cropImage(keyOutMagenta(bild(30, 40, [{ x: 5, y: 4, w: 14, h: 24 }])), { x0: 5, y0: 4, x1: 18, y1: 27 });
  const { image, frameWidth, frameHeight } = frameStrip([a, b], { pad: 2 });
  assert.equal(frameWidth, 14 + 4);
  assert.equal(frameHeight, 30 + 4);
  assert.equal(image.width, frameWidth * 2);
  const fusslinie = (feld) => {
    for (let y = frameHeight - 1; y >= 0; y--) for (let x = feld * frameWidth; x < (feld + 1) * frameWidth; x++) if (alpha(image, x, y) > 0) return y;
    return -1;
  };
  assert.equal(fusslinie(0), frameHeight - 3);
  assert.equal(fusslinie(1), frameHeight - 3);
});

test('Zuschneiden und Teilen', () => {
  const k = keyOutMagenta(bild(40, 20, [{ x: 10, y: 4, w: 8, h: 8 }]));
  const t = trimAlpha(k, { pad: 1 });
  assert.equal(t.width, 10);
  assert.equal(t.height, 10);
  const teile = splitEqual(bild(40, 20), 4, 2);
  assert.equal(teile.length, 8);
  assert.equal(teile[0].width, 10);
  assert.equal(teile[0].height, 10);
});

test('Shirt umfärben: Rot wird Zielfarbe, Schatten bleibt dunkler, Haut und Rosa unverändert', () => {
  assert.equal(isShirtRed(255, 0, 0), true);
  assert.equal(isShirtRed(140, 10, 10), true);
  assert.equal(isShirtRed(240, 200, 170), false, 'Haut');
  assert.equal(isShirtRed(255, 150, 150), false, 'Rosa');
  assert.equal(isShirtRed(30, 0, 0), false, 'fast schwarz');
  const img = createImage(4, 1);
  img.data.set([255, 0, 0, 255, 128, 0, 0, 255, 240, 200, 170, 255, 255, 0, 0, 0], 0);
  const out = recolorShirt(img, [58, 120, 217]);
  assert.deepEqual([...out.data.slice(0, 3)], [58, 120, 217]);
  assert.deepEqual([...out.data.slice(4, 7)], [58, 120, 217].map((v) => Math.round(v * (128 / 255))), 'halbe Helligkeit');
  assert.deepEqual([...out.data.slice(8, 11)], [240, 200, 170]);
  assert.deepEqual([...out.data.slice(12, 16)], [255, 0, 0, 0], 'durchsichtiges bleibt unverändert');
  assert.deepEqual([...img.data.slice(0, 3)], [255, 0, 0], 'Original nicht verändert');
  assert.deepEqual(hexToRgb('#3b78d9'), [59, 120, 217]);
});
