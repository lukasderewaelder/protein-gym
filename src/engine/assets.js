// Bilder laden. Fehlt eine Datei (Grafiken kommen später aus ChatGPT), liefert loadImage null,
// und das Spiel zeichnet stattdessen Platzhalter. So läuft alles ohne fertige Grafiken.

import { recolorShirt, hexToRgb } from './recolor.js';

const cache = new Map();
const recolored = new WeakMap();

/** Lauf-Streifen mit getauschter Shirtfarbe (das Shirt ist im Sprite in kräftigem Rot gemalt). Ergebnis ist ein Canvas. */
export function recolorStrip(img, css) {
  let perColor = recolored.get(img);
  if (!perColor) { perColor = new Map(); recolored.set(img, perColor); }
  if (perColor.has(css)) return perColor.get(css);
  const c = document.createElement('canvas');
  c.width = img.width;
  c.height = img.height;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.drawImage(img, 0, 0);
  const out = recolorShirt(g.getImageData(0, 0, c.width, c.height), hexToRgb(css));
  g.putImageData(new ImageData(out.data, c.width, c.height), 0, 0);
  perColor.set(css, c);
  return c;
}

export function loadImage(url) {
  if (cache.has(url)) return cache.get(url);
  const p = new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
  cache.set(url, p);
  return p;
}

/** Erstes vorhandenes Bild aus mehreren Dateiendungen (webp vor png). */
export async function loadFirst(base) {
  for (const ext of ['webp', 'png']) {
    const img = await loadImage(`${base}.${ext}`);
    if (img) return img;
  }
  return null;
}

export const DIRS = ['down', 'up', 'left', 'right'];

/** Lauf-Streifen der Spielfigur (4 Richtungen à 4 Bilder). Null, wenn nicht alle vier vorhanden sind. */
export async function loadFigureSprites(variant = 1) {
  const entries = await Promise.all(DIRS.map(async (d) => [d, await loadFirst(`assets/figuren/figur_v${variant}_walk_${d}`)]));
  if (entries.some(([, img]) => !img)) return null;
  return Object.fromEntries(entries);
}

/** Einzelner NPC-Sprite, z. B. assets/figuren/npc_hannes.png. */
export function loadNpcSprite(id) {
  return loadFirst(`assets/figuren/npc_${id}`);
}
