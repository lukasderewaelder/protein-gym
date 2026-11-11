// Zeichnen: Szenenbild (oder Platzhalter), Figuren, Hotspot-Markierungen.
// Alles in Weltkoordinaten (1536 x 1024); der Viewport legt die Skalierung per Transform fest.

import { fundart } from '../ui/funde-core.js';

export const WORLD = { w: 1536, h: 1024 };
export const FIGURE_HEIGHT = 150;

// Shirtfarben mit Buchstabe, damit Farbe nie das einzige Merkmal ist.
export const SHIRTS = [
  { name: 'Rot', css: '#d9453b' },
  { name: 'Blau', css: '#3b78d9' },
  { name: 'Gelb', css: '#e8b923' },
  { name: 'Grün', css: '#3aa060' },
];

export const SKINS = [
  { name: 'Ton 1', css: '#f6d3b3' },
  { name: 'Ton 2', css: '#e0a97c' },
  { name: 'Ton 3', css: '#b97a4e' },
  { name: 'Ton 4', css: '#7a4a2e' },
];

export const HAIRS = [
  { name: 'Kurz', style: 'kurz' },
  { name: 'Zopf', style: 'zopf' },
  { name: 'Locken', style: 'locken' },
];

const PLACEHOLDER_FLOOR = {
  empfang: '#3b4a4d',
  training: '#3a4448',
  labor: '#424a4a',
  sauna: '#5a4430',
  shakebar: '#3f4a48',
};

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawPlaceholderBg(ctx, scene) {
  ctx.fillStyle = PLACEHOLDER_FLOOR[scene.id] || '#3a4448';
  ctx.fillRect(0, 0, WORLD.w, WORLD.h);
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 2;
  for (let x = 0; x <= WORLD.w; x += 64) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, WORLD.h); ctx.stroke(); }
  for (let y = 0; y <= WORLD.h; y += 64) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(WORLD.w, y); ctx.stroke(); }
  for (const [x, y, w, h] of scene.blocked || []) {
    ctx.fillStyle = '#26343a';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#4b6168';
    ctx.lineWidth = 3;
    ctx.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);
  }
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.font = 'bold 90px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(scene.name, WORLD.w / 2, WORLD.h / 2 + 30);
  ctx.font = '28px system-ui, sans-serif';
  ctx.fillText('Platzhalter – Szenenbild fehlt noch', WORLD.w / 2, WORLD.h / 2 + 80);
}

/** Einfache Pixelfigur aus Rechtecken, bis die ChatGPT-Sprites vorliegen. Füße bei (x, y). */
export function drawPlaceholderFigure(ctx, x, y, { h = FIGURE_HEIGHT, dir = 'down', t = 0, moving = false, shirt = '#d9453b', skin = '#f0c9a4', hair = '#5a3825', hairStyle = 'kurz' } = {}) {
  const u = h / 24;
  const step = moving ? Math.sin(t * 14) : 0;
  const px = (rx, ry, rw, rh, color) => {
    ctx.fillStyle = color;
    ctx.fillRect(x + rx * u, y + ry * u, rw * u, rh * u);
  };
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.beginPath();
  ctx.ellipse(x, y, 5.5 * u, 1.6 * u, 0, 0, Math.PI * 2);
  ctx.fill();
  const legL = Math.round(step * 1.2);
  px(-3.2, -7, 3, 7 + (legL > 0 ? -legL * 0.5 : 0), '#2e3440');
  px(0.2, -7, 3, 7 + (legL < 0 ? legL * 0.5 : 0), '#2e3440');
  px(-3.4, -1.1, 3.4, 1.1, '#e8e2d0');
  px(0, -1.1, 3.4, 1.1, '#e8e2d0');
  px(-4.2, -17, 8.4, 10, shirt);
  const armSwing = moving ? step : 0;
  px(-6.2, -16.5 + armSwing, 2, 7, shirt);
  px(4.2, -16.5 - armSwing, 2, 7, shirt);
  px(-6.2, -9.5 + armSwing, 2, 1.6, skin);
  px(4.2, -9.5 - armSwing, 2, 1.6, skin);
  px(-4, -24, 8, 8, skin);
  if (hairStyle === 'locken') {
    px(-5.2, -25.4, 10.4, dir === 'up' ? 8 : 4.6, hair);
    px(-5.2, -22, 1.8, 3.4, hair);
    px(3.4, -22, 1.8, 3.4, hair);
  } else {
    px(-4.4, -24.4, 8.8, dir === 'up' ? 6.5 : 3.4, hair);
  }
  if (hairStyle === 'zopf') {
    if (dir === 'down') px(-1, -16.6, 2, 3.4, hair);
    else if (dir === 'up') px(-1.4, -21, 2.8, 7, hair);
    else px(dir === 'left' ? 3.2 : -5.2, -22, 2, 6.4, hair);
  }
  if (dir === 'down') {
    px(-2.4, -20.4, 1.3, 1.6, '#1d2430');
    px(1.1, -20.4, 1.3, 1.6, '#1d2430');
  } else if (dir === 'left') {
    px(-3.2, -20.4, 1.3, 1.6, '#1d2430');
  } else if (dir === 'right') {
    px(1.9, -20.4, 1.3, 1.6, '#1d2430');
  }
  ctx.strokeStyle = 'rgba(0,0,0,0.55)';
  ctx.lineWidth = u * 0.5;
  ctx.strokeRect(x - 4.2 * u, y - 24 * u, 8.4 * u, 17 * u);
  ctx.restore();
}

/** Zeichnet Spielfigur oder NPC; mit Sprite-Streifen (4 Bilder je Richtung) oder als Platzhalter. */
export function drawFigure(ctx, ent, sprites, opts = {}) {
  const h = opts.h || FIGURE_HEIGHT;
  const strip = sprites && sprites[ent.dir];
  if (strip) {
    const frames = 4;
    const fw = strip.width / frames;
    const fh = strip.height;
    const frame = ent.moving ? Math.floor(ent.t * 8) % frames : 0;
    const k = h / fh;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(ent.x, ent.y, fw * k * 0.3, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.drawImage(strip, frame * fw, 0, fw, fh, ent.x - (fw * k) / 2, ent.y - h, fw * k, h);
    ctx.restore();
    return;
  }
  drawPlaceholderFigure(ctx, ent.x, ent.y, { h, dir: ent.dir, t: ent.t, moving: ent.moving, shirt: opts.shirt, hair: opts.hair, skin: opts.skin, hairStyle: opts.hairStyle });
}

function drawStaticSprite(ctx, img, x, y, h) {
  const k = h / img.height;
  ctx.drawImage(img, x - (img.width * k) / 2, y - h, img.width * k, h);
}

/** Kleiner Funke: Hier gibt es etwas zu entdecken (erscheint nur, wenn die Figur nah dran ist). */
function drawSpark(ctx, hs, time) {
  const pulse = 1 + Math.sin(time * 5) * 0.18;
  ctx.save();
  ctx.translate(hs.x, hs.y);
  ctx.fillStyle = 'rgba(255,224,102,0.95)';
  ctx.strokeStyle = '#1c1c1c';
  ctx.lineWidth = 3;
  const r = 20 * pulse;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (Math.PI / 4) * i - Math.PI / 2;
    const rr = i % 2 ? r * 0.38 : r;
    ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

const PFAD_CACHE = new Map();
function fundPfade(art) {
  if (!PFAD_CACHE.has(art.id)) PFAD_CACHE.set(art.id, art.pfade.map((d) => new Path2D(d)));
  return PFAD_CACHE.get(art.id);
}

/** Gefundener Hinweis: bleibt dauerhaft sichtbar und antippbar. Das Symbol zeigt die Fundart (Zettel, Zeitung, Handy …), Zusatz mit lila Rand. */
function drawFound(ctx, hs, card) {
  const art = fundart(card && card.medium);
  const zusatz = Boolean(card && card.typ === 'zusatz');
  ctx.save();
  ctx.translate(hs.x, hs.y);
  ctx.fillStyle = 'rgba(255,253,242,0.94)';
  ctx.strokeStyle = zusatz ? '#8f5cc0' : art.farbe;
  ctx.lineWidth = 5;
  if (zusatz) ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.arc(0, 0, 21, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.scale(0.85, 0.85);
  ctx.translate(-12, -12);
  ctx.strokeStyle = '#1d1d1d';
  ctx.lineWidth = 2.2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const p of fundPfade(art)) ctx.stroke(p);
  ctx.restore();
}

/** Kartenlesegerät: kleine Box an der Wand mit Kartenschlitz und Lämpchen (rot gesperrt, grün frei). */
function drawGeraet(ctx, hs, time, offen) {
  ctx.save();
  ctx.translate(hs.x, hs.y);
  ctx.fillStyle = '#2b3b3f';
  ctx.strokeStyle = '#0c1517';
  ctx.lineWidth = 4;
  roundRect(ctx, -22, -34, 44, 68, 6);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#0c1517'; // Anzeige
  ctx.fillRect(-14, -26, 28, 14);
  ctx.fillStyle = '#6f8f95'; // Kartenschlitz
  ctx.fillRect(-14, 4, 28, 5);
  const an = offen || Math.sin(time * 5) > -0.2; // rotes Lämpchen blinkt leicht
  ctx.fillStyle = offen ? '#3adb76' : (an ? '#ff4a3d' : '#7a2a25');
  ctx.beginPath();
  ctx.arc(0, 21, 6, 0, Math.PI * 2);
  ctx.fill();
  if (offen) {
    ctx.strokeStyle = 'rgba(58,219,118,0.5)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 21, 11 + Math.sin(time * 4) * 2, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

/** Schließfach mit Zahlenschloss: kleine Platte mit Nummer und Lämpchen (gelb zu, grün offen). */
function drawFach(ctx, hs, time, offen) {
  ctx.save();
  ctx.translate(hs.x, hs.y);
  ctx.fillStyle = '#2b3b3f';
  ctx.strokeStyle = '#0c1517';
  ctx.lineWidth = 3;
  roundRect(ctx, -16, -22, 32, 46, 5);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#0c1517';
  ctx.fillRect(-11, -16, 22, 8);
  ctx.fillStyle = '#6f8f95';
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) ctx.fillRect(-11 + c * 8, -4 + r * 6, 6, 4);
  ctx.fillStyle = offen ? '#3adb76' : (Math.sin(time * 3 + hs.x) > 0 ? '#ffd24a' : '#a88a22');
  ctx.beginPath();
  ctx.arc(0, -30, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(hs.fach), 0, -12);
  ctx.restore();
}

/** Tür gleitet auf: zwei Türflügel schieben sich auseinander, dahinter wird es hell. p läuft von 0 bis 1. */
function drawTuerAnim(ctx, a, scene) {
  const hs = (scene.hotspots || []).find((x) => x.id === a.id);
  if (!hs) return;
  const w = 168;
  const hoch = 134;
  const x0 = hs.x - w / 2;
  const y0 = hs.y - 40;
  const ease = a.p * a.p * (3 - 2 * a.p);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x0, y0, w, hoch);
  ctx.clip();
  ctx.fillStyle = 'rgba(255,244,200,0.9)'; // Licht aus dem Raum
  ctx.fillRect(x0, y0, w, hoch);
  ctx.fillStyle = '#3d7d84';
  ctx.strokeStyle = '#0c1517';
  ctx.lineWidth = 4;
  const halb = (w / 2) * (1 - ease);
  ctx.fillRect(x0, y0, halb, hoch);
  ctx.strokeRect(x0, y0, halb, hoch);
  ctx.fillRect(x0 + w - halb, y0, halb, hoch);
  ctx.strokeRect(x0 + w - halb, y0, halb, hoch);
  ctx.restore();
}

function drawMarker(ctx, hs, time, locked, showLabel) {
  const pulse = 1 + Math.sin(time * 4) * 0.08;
  const r = 26 * pulse;
  ctx.save();
  ctx.translate(hs.x, hs.y + (hs.type === 'npc' ? -FIGURE_HEIGHT - 36 : 0));
  ctx.fillStyle = locked ? 'rgba(120,130,135,0.75)' : 'rgba(255,214,64,0.88)';
  ctx.strokeStyle = '#1c1c1c';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#1c1c1c';
  if (locked) {
    ctx.fillRect(-11, -2, 22, 16);
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, -3, 8, Math.PI, 0);
    ctx.stroke();
  } else {
    ctx.font = 'bold 34px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(hs.type === 'door' ? '↓' : '!', 0, 2);
  }
  if (showLabel) {
    ctx.font = '600 26px system-ui, sans-serif';
    ctx.textBaseline = 'alphabetic';
    const text = hs.label || hs.id;
    const w = ctx.measureText(text).width + 20;
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    roundRect(ctx, -w / 2, r + 8, w, 36, 8);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillText(text, 0, r + 34);
  }
  ctx.restore();
}

/**
 * st: { scene, bg, figureSprites, player, shirtCss, npcs: [{ hs, sprite }], time, isLocked(hs), showLabels, overlay(ctx) }
 */
export function drawScene(ctx, st) {
  const { scene, bg, time } = st;
  if (bg) {
    ctx.drawImage(bg, 0, 0, WORLD.w, WORLD.h);
  } else {
    drawPlaceholderBg(ctx, scene);
  }

  const showLabels = st.showLabels ?? !bg;
  const drawables = [{ y: st.player.y, draw: () => drawFigure(ctx, st.player, st.figureSprites, { shirt: st.shirtCss, skin: st.skinCss, hairStyle: st.hairStyle }) }];
  for (const n of st.npcs || []) {
    const { hs, sprite } = n;
    drawables.push({
      y: hs.y,
      draw: () => {
        if (sprite) drawStaticSprite(ctx, sprite, hs.x, hs.y, FIGURE_HEIGHT);
        else drawPlaceholderFigure(ctx, hs.x, hs.y, { dir: 'down', shirt: hs.color || '#2c8c8c', hair: hs.hair || '#3a2a1a' });
      },
    });
  }
  drawables.sort((a, b) => a.y - b.y).forEach((d) => d.draw());

  // Erkunden: Hinweis-Objekte (Typ „dialog“) zeigen sich erst in der Nähe der Figur als Funke und bleiben nach dem Fund als Haken.
  // Türen, Aufgabenstationen und Personen sind immer markiert. Im Editiermodus (showAll) sieht man alles.
  for (const hs of scene.hotspots || []) {
    if (!st.showAll && st.isHidden && st.isHidden(hs)) continue;
    if (hs.type === 'fach') { drawFach(ctx, hs, time, st.fachOffen ? st.fachOffen(hs) : false); continue; }
    if (hs.type === 'geraet') { drawGeraet(ctx, hs, time, st.geraetOffen ? st.geraetOffen(hs) : false); continue; }
    if (!st.showAll && hs.type === 'dialog') {
      if (st.isFound && st.isFound(hs)) drawFound(ctx, hs, st.fundInfo ? st.fundInfo(hs) : null);
      else if (Math.hypot(st.player.x - hs.x, st.player.y - hs.y) < 240) drawSpark(ctx, hs, time);
      continue;
    }
    drawMarker(ctx, hs, time, st.isLocked ? st.isLocked(hs) : false, showLabels);
  }
  if (st.tuerAnim) drawTuerAnim(ctx, st.tuerAnim, scene);
  if (st.overlay) st.overlay(ctx);
}
