// Skalierung: Das Szenenbild (3:2) wird so groß wie möglich eingepasst, übrige Fläche bleibt dunkler Rand.

import { WORLD } from './render.js';

export function createViewport(canvas) {
  const v = { scale: 1, ox: 0, oy: 0, dpr: 1, cssW: 0, cssH: 0 };

  function resize() {
    const rect = canvas.getBoundingClientRect();
    v.dpr = Math.min(window.devicePixelRatio || 1, 2);
    v.cssW = rect.width;
    v.cssH = rect.height;
    canvas.width = Math.max(1, Math.round(rect.width * v.dpr));
    canvas.height = Math.max(1, Math.round(rect.height * v.dpr));
    v.scale = Math.min(rect.width / WORLD.w, rect.height / WORLD.h);
    v.ox = (rect.width - WORLD.w * v.scale) / 2;
    v.oy = (rect.height - WORLD.h * v.scale) / 2;
  }

  function apply(ctx) {
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

  /** Bildschirmpunkt (Client-Koordinaten) in Weltkoordinaten. */
  function toWorld(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    return { x: (clientX - rect.left - v.ox) / v.scale, y: (clientY - rect.top - v.oy) / v.scale };
  }

  return { v, resize, apply, toWorld };
}
