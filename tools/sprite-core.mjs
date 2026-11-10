// Bildverarbeitung für das Sprite-Werkzeug. Reine Funktionen auf { width, height, data: Uint8ClampedArray (RGBA) },
// damit sie ohne Browser getestet werden können (node --test).

export function createImage(width, height) {
  return { width, height, data: new Uint8ClampedArray(width * height * 4) };
}

export function cloneImage(img) {
  return { width: img.width, height: img.height, data: new Uint8ClampedArray(img.data) };
}

/**
 * Magenta (#FF00FF) freistellen: nahe Pixel werden durchsichtig, Randpixel teilweise (weicher Rand),
 * und Magenta-Reste an den Rändern werden herausgerechnet.
 */
export function keyOutMagenta(img, { tol = 90, feather = 50 } = {}) {
  const out = cloneImage(img);
  const d = out.data;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i], g = d[i + 1], b = d[i + 2];
    const dist = Math.hypot(255 - r, g, 255 - b);
    if (dist <= tol) {
      d[i + 3] = 0;
    } else if (dist < tol + feather) {
      const a = Math.round(((dist - tol) / feather) * d[i + 3]);
      d[i + 3] = a;
      const spill = Math.min(r, b) - g;
      if (spill > 0) { d[i] = Math.max(0, r - spill * 0.8); d[i + 2] = Math.max(0, b - spill * 0.8); }
    }
  }
  return out;
}

/** Zusammenhängende Flächen (8er-Nachbarschaft) mit Alpha > alphaMin. Rückgabe: Rechtecke, links nach rechts. */
export function labelIslands(img, { alphaMin = 20, minArea = 40 } = {}) {
  const { width: w, height: h, data } = img;
  const seen = new Uint8Array(w * h);
  const boxes = [];
  const stack = [];
  for (let start = 0; start < w * h; start++) {
    if (seen[start] || data[start * 4 + 3] <= alphaMin) continue;
    let x0 = w, y0 = h, x1 = -1, y1 = -1, area = 0;
    stack.push(start);
    seen[start] = 1;
    while (stack.length) {
      const p = stack.pop();
      const x = p % w, y = (p - x) / w;
      area++;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          const n = ny * w + nx;
          if (seen[n] || data[n * 4 + 3] <= alphaMin) continue;
          seen[n] = 1;
          stack.push(n);
        }
      }
    }
    if (area >= minArea) boxes.push({ x0, y0, x1, y1, area });
  }
  return boxes.sort((a, b) => (a.x0 + a.x1) - (b.x0 + b.x1));
}

/** Nahe beieinanderliegende Flächen (z. B. abgetrennte Hand oder Haarsträhne) zu einer Figur verbinden. */
export function mergeBoxes(boxes, gap) {
  const list = boxes.map((b) => ({ ...b }));
  let changed = true;
  while (changed) {
    changed = false;
    outer: for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i], b = list[j];
        const gx = Math.max(a.x0, b.x0) - Math.min(a.x1, b.x1);
        const gy = Math.max(a.y0, b.y0) - Math.min(a.y1, b.y1);
        if (gx <= gap && gy <= gap) {
          list[i] = { x0: Math.min(a.x0, b.x0), y0: Math.min(a.y0, b.y0), x1: Math.max(a.x1, b.x1), y1: Math.max(a.y1, b.y1), area: a.area + b.area };
          list.splice(j, 1);
          changed = true;
          break outer;
        }
      }
    }
  }
  return list.sort((a, b) => (a.x0 + a.x1) - (b.x0 + b.x1));
}

export function cropImage(img, { x0, y0, x1, y1 }) {
  const w = x1 - x0 + 1, h = y1 - y0 + 1;
  const out = createImage(w, h);
  for (let y = 0; y < h; y++) {
    const src = ((y0 + y) * img.width + x0) * 4;
    out.data.set(img.data.subarray(src, src + w * 4), y * w * 4);
  }
  return out;
}

/** Auf die sichtbare Fläche zuschneiden (mit Rand `pad`). Leeres Bild: unverändert. */
export function trimAlpha(img, { alphaMin = 20, pad = 0 } = {}) {
  let x0 = img.width, y0 = img.height, x1 = -1, y1 = -1;
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      if (img.data[(y * img.width + x) * 4 + 3] > alphaMin) {
        if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < 0) return img;
  const c = cropImage(img, { x0, y0, x1, y1 });
  return pad ? padImage(c, pad) : c;
}

export function padImage(img, pad) {
  const out = createImage(img.width + pad * 2, img.height + pad * 2);
  for (let y = 0; y < img.height; y++) out.data.set(img.data.subarray(y * img.width * 4, (y + 1) * img.width * 4), ((y + pad) * out.width + pad) * 4);
  return out;
}

/** Bild in gleich große Spalten und Zeilen teilen (für Sheets mit gleichmäßigem Raster). */
export function splitEqual(img, cols, rows = 1) {
  const cw = Math.floor(img.width / cols), ch = Math.floor(img.height / rows);
  const out = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) out.push(cropImage(img, { x0: c * cw, y0: r * ch, x1: (c + 1) * cw - 1, y1: (r + 1) * ch - 1 }));
  }
  return out;
}

/**
 * Figuren-Bilder erkennen. Erst Flächen suchen und zusammenfügen; stimmt die Anzahl nicht, wird das Bild in `expected`
 * gleich breite Spalten geteilt. Rückgabe: { frames, mode: 'flaechen' | 'gleich', gefunden }.
 */
export function detectFrames(keyed, expected) {
  const base = labelIslands(keyed);
  const maxH = Math.max(1, ...base.map((b) => b.y1 - b.y0 + 1));
  let boxes = base;
  for (const f of [0.02, 0.06, 0.12, 0.2, 0.3]) {
    boxes = mergeBoxes(base, Math.round(maxH * f));
    if (boxes.length <= expected) break;
  }
  if (boxes.length === expected) {
    return { frames: boxes.map((b) => cropImage(keyed, b)), mode: 'flaechen', gefunden: base.length };
  }
  return { frames: splitEqual(keyed, expected).map((f) => trimAlpha(f)), mode: 'gleich', gefunden: boxes.length };
}

/** Frames auf gemeinsame Größe bringen: gleiche Fußlinie (unten), waagerecht zentriert. Ergebnis: ein Streifen. */
export function frameStrip(frames, { pad = 4 } = {}) {
  const fw = Math.max(...frames.map((f) => f.width)) + pad * 2;
  const fh = Math.max(...frames.map((f) => f.height)) + pad * 2;
  const out = createImage(fw * frames.length, fh);
  frames.forEach((f, i) => {
    const ox = i * fw + Math.floor((fw - f.width) / 2);
    const oy = fh - pad - f.height;
    for (let y = 0; y < f.height; y++) out.data.set(f.data.subarray(y * f.width * 4, (y + 1) * f.width * 4), ((oy + y) * out.width + ox) * 4);
  });
  return { image: out, frameWidth: fw, frameHeight: fh };
}
