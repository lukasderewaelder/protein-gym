// Begehbarkeit und Wegsuche. Reine Funktionen ohne Browser-Abhängigkeit (testbar mit node --test).
// Die Welt hat feste Koordinaten (Szenenbild 1536 x 1024); gesperrte Zonen sind Rechtecke [x, y, w, h].

export const CELL = 16;

/** Baut ein Raster, in dem Zellen gesperrt sind, deren Mitte in einem (um margin vergrößerten) Rechteck liegt. */
export function buildGrid({ width = 1536, height = 1024, blocked = [] }, margin = 12, cell = CELL) {
  const cols = Math.ceil(width / cell);
  const rows = Math.ceil(height / cell);
  const cells = new Uint8Array(cols * rows);
  for (const [x, y, w, h] of blocked) {
    const c0 = Math.max(0, Math.floor((x - margin) / cell));
    const c1 = Math.min(cols - 1, Math.ceil((x + w + margin) / cell));
    const r0 = Math.max(0, Math.floor((y - margin) / cell));
    const r1 = Math.min(rows - 1, Math.ceil((y + h + margin) / cell));
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        const cx = (c + 0.5) * cell;
        const cy = (r + 0.5) * cell;
        if (cx >= x - margin && cx <= x + w + margin && cy >= y - margin && cy <= y + h + margin) {
          cells[r * cols + c] = 1;
        }
      }
    }
  }
  return { cols, rows, cell, cells, width, height };
}

const cellOf = (g, v) => Math.floor(v / g.cell);

export function isBlockedCell(g, c, r) {
  return c < 0 || r < 0 || c >= g.cols || r >= g.rows || g.cells[r * g.cols + c] === 1;
}

export function isBlockedAt(g, x, y) {
  return isBlockedCell(g, cellOf(g, x), cellOf(g, y));
}

/** Nächste begehbare Zelle (Mitte in Weltkoordinaten) oder null, wenn alles gesperrt ist. */
export function nearestWalkable(g, x, y) {
  const c0 = Math.min(g.cols - 1, Math.max(0, cellOf(g, x)));
  const r0 = Math.min(g.rows - 1, Math.max(0, cellOf(g, y)));
  const maxR = Math.max(g.cols, g.rows);
  for (let ring = 0; ring <= maxR; ring++) {
    let best = null;
    let bestD = Infinity;
    for (let r = r0 - ring; r <= r0 + ring; r++) {
      for (let c = c0 - ring; c <= c0 + ring; c++) {
        if (Math.max(Math.abs(c - c0), Math.abs(r - r0)) !== ring) continue;
        if (isBlockedCell(g, c, r)) continue;
        const px = (c + 0.5) * g.cell;
        const py = (r + 0.5) * g.cell;
        const d = (px - x) ** 2 + (py - y) ** 2;
        if (d < bestD) { bestD = d; best = { x: px, y: py }; }
      }
    }
    // Ein Ring weiter kann noch eine näher liegende Zelle enthalten (Diagonale), daher einen Ring zugeben.
    if (best) {
      const next = nearestInRing(g, c0, r0, ring + 1, x, y);
      return next && next.d < bestD ? { x: next.x, y: next.y } : best;
    }
  }
  return null;
}

function nearestInRing(g, c0, r0, ring, x, y) {
  let best = null;
  for (let r = r0 - ring; r <= r0 + ring; r++) {
    for (let c = c0 - ring; c <= c0 + ring; c++) {
      if (Math.max(Math.abs(c - c0), Math.abs(r - r0)) !== ring) continue;
      if (isBlockedCell(g, c, r)) continue;
      const px = (c + 0.5) * g.cell;
      const py = (r + 0.5) * g.cell;
      const d = (px - x) ** 2 + (py - y) ** 2;
      if (!best || d < best.d) best = { x: px, y: py, d };
    }
  }
  return best;
}

/** Freie Sicht zwischen zwei Punkten (für das Glätten des Wegs). */
export function lineOfSight(g, a, b) {
  const dist = Math.hypot(b.x - a.x, b.y - a.y);
  const steps = Math.max(1, Math.ceil(dist / (g.cell / 2)));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    if (isBlockedAt(g, a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t)) return false;
  }
  return true;
}

class MinHeap {
  constructor() { this.a = []; }
  get size() { return this.a.length; }
  push(f, v) {
    const a = this.a;
    a.push([f, v]);
    let i = a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (a[p][0] <= a[i][0]) break;
      [a[p], a[i]] = [a[i], a[p]];
      i = p;
    }
  }
  pop() {
    const a = this.a;
    const top = a[0];
    const last = a.pop();
    if (a.length) {
      a[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let m = i;
        if (l < a.length && a[l][0] < a[m][0]) m = l;
        if (r < a.length && a[r][0] < a[m][0]) m = r;
        if (m === i) break;
        [a[m], a[i]] = [a[i], a[m]];
        i = m;
      }
    }
    return top[1];
  }
}

/**
 * Weg von `from` nach `to` als Liste von Weltpunkten (ohne Startpunkt, geglättet).
 * Ein gesperrtes Ziel wird auf die nächste begehbare Zelle gelegt. Leere Liste: kein Weg.
 */
export function findPath(g, from, to) {
  const start = isBlockedAt(g, from.x, from.y) ? nearestWalkable(g, from.x, from.y) : from;
  const goalPt = isBlockedAt(g, to.x, to.y) ? nearestWalkable(g, to.x, to.y) : to;
  if (!start || !goalPt) return [];
  const sc = cellOf(g, start.x), sr = cellOf(g, start.y);
  const gc = cellOf(g, goalPt.x), gr = cellOf(g, goalPt.y);
  if (sc === gc && sr === gr) return [{ x: goalPt.x, y: goalPt.y }];

  const N = g.cols * g.rows;
  const gScore = new Float32Array(N).fill(Infinity);
  const prev = new Int32Array(N).fill(-1);
  const closed = new Uint8Array(N);
  const idx = (c, r) => r * g.cols + c;
  const h = (c, r) => {
    const dx = Math.abs(c - gc), dy = Math.abs(r - gr);
    return (dx + dy) + (Math.SQRT2 - 2) * Math.min(dx, dy);
  };
  const open = new MinHeap();
  gScore[idx(sc, sr)] = 0;
  open.push(h(sc, sr), idx(sc, sr));
  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
  let found = false;

  while (open.size) {
    const cur = open.pop();
    if (closed[cur]) continue;
    closed[cur] = 1;
    const c = cur % g.cols;
    const r = (cur - c) / g.cols;
    if (c === gc && r === gr) { found = true; break; }
    for (const [dc, dr] of DIRS) {
      const nc = c + dc, nr = r + dr;
      if (isBlockedCell(g, nc, nr)) continue;
      if (dc !== 0 && dr !== 0 && (isBlockedCell(g, c + dc, r) || isBlockedCell(g, c, r + dr))) continue;
      const ni = idx(nc, nr);
      if (closed[ni]) continue;
      const cost = gScore[cur] + (dc !== 0 && dr !== 0 ? Math.SQRT2 : 1);
      if (cost < gScore[ni]) {
        gScore[ni] = cost;
        prev[ni] = cur;
        open.push(cost + h(nc, nr), ni);
      }
    }
  }
  if (!found) return [];

  const cells = [];
  for (let i = idx(gc, gr); i !== -1; i = prev[i]) {
    const c = i % g.cols;
    cells.push({ x: (c + 0.5) * g.cell, y: ((i - c) / g.cols + 0.5) * g.cell });
  }
  cells.reverse();
  cells[0] = { x: start.x, y: start.y };
  cells[cells.length - 1] = { x: goalPt.x, y: goalPt.y };

  // Geglättet: von jedem Ankerpunkt so weit wie möglich geradeaus.
  const out = [];
  let anchor = 0;
  while (anchor < cells.length - 1) {
    let far = anchor + 1;
    for (let j = cells.length - 1; j > anchor + 1; j--) {
      if (lineOfSight(g, cells[anchor], cells[j])) { far = j; break; }
    }
    out.push(cells[far]);
    anchor = far;
  }
  return out;
}
