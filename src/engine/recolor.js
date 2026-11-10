// Shirt umfärben: Im Sprite ist das Shirt in kräftigem Rot gemalt (Vorgabe in den ChatGPT-Prompts).
// Alle roten Pixel werden in die gewählte Shirtfarbe getauscht, die Helligkeit (Schatten, Falten) bleibt erhalten.

export function hexToRgb(css) {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(css || '');
  return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [217, 69, 59];
}

/** Ist dieser Pixel Shirt-Rot? (kräftig gesättigt, Rotanteil deutlich vor Grün und Blau) */
export function isShirtRed(r, g, b) {
  const max = Math.max(r, g, b);
  if (max < 70 || r !== max) return false;
  const sat = (max - Math.min(g, b)) / max;
  return sat > 0.5 && g < r * 0.6 && b < r * 0.6;
}

/** Kopie des Bildes mit getauschtem Shirt. img: { width, height, data }. */
export function recolorShirt(img, rgb) {
  const out = { width: img.width, height: img.height, data: new Uint8ClampedArray(img.data) };
  const d = out.data;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0 || !isShirtRed(d[i], d[i + 1], d[i + 2])) continue;
    const v = Math.max(d[i], d[i + 1], d[i + 2]) / 255;
    d[i] = Math.min(255, rgb[0] * v);
    d[i + 1] = Math.min(255, rgb[1] * v);
    d[i + 2] = Math.min(255, rgb[2] * v);
  }
  return out;
}
