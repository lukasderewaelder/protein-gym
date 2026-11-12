// Skalierung: Das Szenenbild (3:2) wird so groß wie möglich eingepasst, übrige Fläche bleibt dunkler Rand.

import { WORLD } from './render.js';

/** Maßstab und Versatz für eine Zeichenfläche der Größe w × h (rein, ohne Browser). */
export function passeEin(w, h, welt = WORLD) {
  const scale = Math.min(w / welt.w, h / welt.h);
  return { scale, ox: (w - welt.w * scale) / 2, oy: (h - welt.h * scale) / 2 };
}

/** Punkt in Client-Koordinaten in Weltkoordinaten, bezogen auf die aktuelle Lage und Größe der Zeichenfläche (rect). */
export function zuWelt(clientX, clientY, rect, welt = WORLD) {
  const { scale, ox, oy } = passeEin(rect.width, rect.height, welt);
  return { x: (clientX - rect.left - ox) / scale, y: (clientY - rect.top - oy) / scale };
}

export function createViewport(canvas) {
  const v = { scale: 1, ox: 0, oy: 0, dpr: 1, cssW: 0, cssH: 0 };

  function resize() {
    const rect = canvas.getBoundingClientRect();
    v.dpr = Math.min(window.devicePixelRatio || 1, 2);
    v.cssW = rect.width;
    v.cssH = rect.height;
    canvas.width = Math.max(1, Math.round(rect.width * v.dpr));
    canvas.height = Math.max(1, Math.round(rect.height * v.dpr));
    Object.assign(v, passeEin(rect.width, rect.height));
  }

  /**
   * Gleicht die Zeichenfläche an, falls sich ihre Größe geändert hat. Vollbild, Bildschirmtastatur und Leisten verändern sie nicht immer
   * mit einem `resize`-Ereignis; ein veralteter Maßstab würde Tippen auf die falsche Stelle der Welt umrechnen (die Figur liefe nicht
   * oder woandershin). Darum läuft das bei jedem Bild und bei jedem Tippen.
   */
  function sync() {
    const rect = canvas.getBoundingClientRect();
    if (Math.abs(rect.width - v.cssW) > 0.5 || Math.abs(rect.height - v.cssH) > 0.5 || (window.devicePixelRatio && Math.min(window.devicePixelRatio, 2) !== v.dpr)) resize();
  }

  // Größenänderungen der Zeichenfläche selbst (auch ohne window.resize) und der sichtbaren Fläche (Tastatur)
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => sync()).observe(canvas);
  if (typeof window !== 'undefined' && window.visualViewport) window.visualViewport.addEventListener('resize', () => sync());

  function apply(ctx) {
    sync();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#0b1517';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(v.dpr * v.scale, 0, 0, v.dpr * v.scale, v.dpr * v.ox, v.dpr * v.oy);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.beginPath();
    ctx.rect(0, 0, WORLD.w, WORLD.h);
    ctx.clip();
  }

  /** Bildschirmpunkt (Client-Koordinaten) in Weltkoordinaten, immer mit der aktuellen Größe der Zeichenfläche. */
  function toWorld(clientX, clientY) {
    sync();
    return zuWelt(clientX, clientY, canvas.getBoundingClientRect());
  }

  return { v, resize, sync, apply, toWorld };
}
