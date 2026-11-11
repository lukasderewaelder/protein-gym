// Strukturformeln als SVG, im Code gezeichnet (KI-Bilder können Chemie-Formeln nicht zuverlässig).
// Alle antippbaren Teile haben eine Trefferfläche von mindestens 44 Pixeln bei normaler Darstellung.

const NS = 'http://www.w3.org/2000/svg';

export function svgEl(tag, attrs = {}, text) {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  if (text != null) e.textContent = text;
  return e;
}

function line(x1, y1, x2, y2, cls = 'bond') {
  return svgEl('line', { x1, y1, x2, y2, class: cls });
}

function button(group, label, onClick) {
  group.setAttribute('role', 'button');
  group.setAttribute('tabindex', '0');
  group.setAttribute('aria-label', label);
  group.addEventListener('click', onClick);
  group.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(e); }
  });
}

/**
 * Schautafel: ganze Aminosäure als feste Zeichnung (nicht antippbar). Das Grundgerüst steht grau,
 * der Rest R orange mit Beschriftung. Gleiche Geometrie wie aminoDiagram. Die Gruppen werden nur gezeigt.
 */
export function aminoTafel(rest, name = 'Aminosäure') {
  const svg = svgEl('svg', { viewBox: '0 0 420 236', class: 'formel tafel-formel', role: 'img', 'aria-label': `Strukturformel von ${name}, Rest ${rest}` });
  svg.append(
    svgEl('rect', { x: 8, y: 68, width: 404, height: 160, rx: 18, fill: '#dde1e4', stroke: '#8a959a', 'stroke-width': 3 }),
    line(118, 110, 184, 110, 'bond tafel-bond'), line(236, 110, 288, 110, 'bond tafel-bond'),
    line(210, 86, 210, 58, 'bond tafel-bond'), line(210, 134, 210, 162, 'bond tafel-bond'),
    svgEl('rect', { x: 130, y: 4, width: 160, height: 54, rx: 12, fill: '#ffd8a8', stroke: '#e5701f', 'stroke-width': 4 }),
  );
  // Farben per style, weil .formel text/.bond in game.css sonst helle Farben vorgeben
  const t = (x, y, size, text, { fill = '#1d1d1d', bold = false, italic = false, anchor = 'middle' } = {}) => svg.append(svgEl('text', { x, y, 'font-size': size, 'text-anchor': anchor, 'dominant-baseline': 'central', style: `fill:${fill};font-weight:${bold ? 700 : 400};font-style:${italic ? 'italic' : 'normal'}` }, text));
  t(68, 110, 38, 'H₂N');
  t(210, 110, 38, 'C');
  t(346, 110, 38, 'COOH');
  t(210, 190, 34, 'H');
  t(210, 32, rest.length > 5 ? 28 : 34, rest, { fill: '#8a3a05', bold: true });
  t(302, 32, 24, '← Rest R', { anchor: 'start', fill: '#b3500f', bold: true });
  // Die Namen der Gruppen stehen als gut lesbarer Text unter der Formel (HTML), nicht im Bild.
  return svg;
}

/** Allgemeine Aminosäure H₂N–CH(R)–COOH, Teile antippbar: amino, carboxy, rest, c (zentrales C), h (H am C). */
export function aminoDiagram(mol, { onPart }) {
  const svg = svgEl('svg', { viewBox: '0 0 420 220', class: 'formel', role: 'group', 'aria-label': `Strukturformel von ${mol.name}` });
  svg.append(
    line(118, 110, 184, 110), line(236, 110, 288, 110),
    line(210, 86, 210, 58), line(210, 134, 210, 162),
  );
  const parts = {};
  function part(id, label, rect, textAt, text, size = 38) {
    const g = svgEl('g', { class: 'teil', 'data-part': id });
    g.append(svgEl('rect', { x: rect[0], y: rect[1], width: rect[2], height: rect[3], rx: 10, class: 'treffer' }));
    g.append(svgEl('text', { x: textAt[0], y: textAt[1], 'font-size': size, 'text-anchor': 'middle', 'dominant-baseline': 'central' }, text));
    button(g, label, () => onPart(id));
    svg.append(g);
    parts[id] = g;
  }
  part('amino', 'Gruppe links', [14, 66, 108, 88], [68, 110], 'H₂N');
  part('carboxy', 'Gruppe rechts', [286, 66, 128, 88], [346, 110], 'COOH');
  part('rest', 'Gruppe oben', [140, 4, 140, 54], [210, 32], mol.rest, mol.rest.length > 5 ? 28 : 34);
  part('c', 'Zentrales Kohlenstoffatom', [184, 84, 52, 52], [210, 110], 'C');
  part('h', 'Wasserstoffatom unten', [176, 164, 68, 52], [210, 190], 'H', 34);

  const labelAt = { amino: [68, 168], carboxy: [346, 168], rest: [300, 32], h: [330, 196] };
  return {
    svg,
    mark(id, text) {
      parts[id].classList.add('richtig');
      const t = svgEl('text', { x: labelAt[id][0], y: labelAt[id][1], class: 'etikett', 'text-anchor': 'middle', 'font-size': 20 }, `✓ ${text}`);
      svg.append(t);
    },
  };
}

/**
 * Zwei Aminosäuren untereinander. Phase 1: Gruppen antippen (gestrichelte Kästen).
 * Phase 2: Teilchen antippen (OH und H). onBox(mol, end), onAtom(mol, kind, index).
 */
export function peptidDiagram(molecules, { onBox, onAtom }) {
  const svg = svgEl('svg', { viewBox: '0 0 560 340', class: 'formel formel-peptid', role: 'group', 'aria-label': 'Zwei Aminosäuren' });
  const rows = [95, 245];
  const ui = { boxes: [], atoms: [] };

  molecules.forEach((mol, m) => {
    const y = rows[m];
    svg.append(svgEl('text', { x: 14, y: y - 70, class: 'molname', 'font-size': 20 }, `${mol.name} (${mol.kurz})`));
    svg.append(
      line(100, y - 8, 70, y - 34), line(100, y + 8, 70, y + 34),
      line(138, y, 190, y), line(330, y, 360, y),
      line(385, y - 20, 385, y - 44), line(392, y - 20, 392, y - 44),
      line(408, y, 446, y),
    );
    svg.append(svgEl('text', { x: 120, y, 'font-size': 34, 'text-anchor': 'middle', 'dominant-baseline': 'central' }, 'N'));
    svg.append(svgEl('text', { x: 260, y, 'font-size': mol.mid.length > 6 ? 26 : 32, 'text-anchor': 'middle', 'dominant-baseline': 'central' }, mol.mid));
    svg.append(svgEl('text', { x: 385, y, 'font-size': 34, 'text-anchor': 'middle', 'dominant-baseline': 'central' }, 'C'));
    svg.append(svgEl('text', { x: 389, y: y - 56, 'font-size': 30, 'text-anchor': 'middle', 'dominant-baseline': 'central' }, 'O'));

    // Kästen der Gruppen (Phase 1)
    for (const [end, rect, label] of [['amino', [36, y - 62, 118, 124], 'Aminogruppe'], ['carboxy', [356, y - 62, 168, 124], 'Carboxygruppe']]) {
      const g = svgEl('g', { class: 'kasten', 'data-mol': m, 'data-end': end });
      g.append(svgEl('rect', { x: rect[0], y: rect[1], width: rect[2], height: rect[3], rx: 14 }));
      button(g, `${label} von ${mol.name}`, () => onBox(m, end));
      svg.append(g);
      ui.boxes.push(g);
    }

    // Atome (Phase 2): zwei H an N, OH an C
    [[70, y - 34, 0], [70, y + 34, 1]].forEach(([x, yy, idx]) => {
      const g = svgEl('g', { class: 'atom atom-h', 'data-mol': m, 'data-kind': 'H', 'data-idx': idx });
      g.append(svgEl('circle', { cx: x, cy: yy, r: 24 }));
      g.append(svgEl('text', { x, y: yy, 'font-size': 26, 'text-anchor': 'middle', 'dominant-baseline': 'central' }, 'H'));
      button(g, `Wasserstoffatom ${idx + 1} der Aminogruppe von ${mol.name}`, () => onAtom(m, 'H', idx));
      svg.append(g);
      ui.atoms.push(g);
    });
    const oh = svgEl('g', { class: 'atom atom-oh', 'data-mol': m, 'data-kind': 'OH' });
    oh.append(svgEl('rect', { x: 446, y: y - 26, width: 78, height: 52, rx: 26 }));
    oh.append(svgEl('text', { x: 485, y, 'font-size': 30, 'text-anchor': 'middle', 'dominant-baseline': 'central' }, 'OH'));
    button(oh, `OH-Gruppe der Carboxygruppe von ${mol.name}`, () => onAtom(m, 'OH', 0));
    svg.append(oh);
    ui.atoms.push(oh);
  });

  function setPhase(p) {
    svg.dataset.phase = String(p);
    ui.boxes.forEach((g) => { g.tabIndex = p === 1 ? 0 : -1; });
    ui.atoms.forEach((g) => { g.tabIndex = p === 2 ? 0 : -1; });
  }
  setPhase(1);

  return {
    svg,
    setPhase,
    boxEl: (m, end) => ui.boxes.find((g) => g.dataset.mol === String(m) && g.dataset.end === end),
    atomEl: (m, kind, idx = 0) => ui.atoms.find((g) => g.dataset.mol === String(m) && g.dataset.kind === kind && (kind === 'OH' || g.dataset.idx === String(idx))),
    /** Wasser löst sich: markierte Atome verschwinden, ein H₂O erscheint in der Mitte. */
    showWater(atomEls) {
      atomEls.forEach((g) => g.classList.add('weg'));
      const w = svgEl('g', { class: 'wasser' });
      w.append(svgEl('circle', { cx: 280, cy: 170, r: 36 }));
      w.append(svgEl('text', { x: 280, y: 170, 'font-size': 26, 'text-anchor': 'middle', 'dominant-baseline': 'central' }, 'H₂O'));
      svg.append(w);
    },
  };
}

/** Schema der Denaturierung: gefaltete Kette → entfaltete Kette (Reihenfolge der Bausteine bleibt). */
export function denatDiagram() {
  const svg = svgEl('svg', { viewBox: '0 0 560 200', class: 'formel denat', role: 'img', 'aria-label': 'Eine gefaltete Aminosäurekette wird durch Hitze oder Säure zu einer gestreckten Kette. Die Reihenfolge der Bausteine bleibt.' });
  const N = 12;
  const farben = ['#f08a24', '#3aa0a0', '#d9c23a', '#8f5cc0'];
  const folded = [];
  const flat = [];
  for (let i = 0; i < N; i++) {
    const a = i * 0.95;
    const k = 1 - i * 0.035;
    folded.push([95 + 58 * Math.cos(a) * k, 82 + 52 * Math.sin(a) * k]);
    flat.push([312 + i * 20, 82 + (i % 2 ? 14 : -14)]);
  }
  const chain = (pts) => {
    svg.append(svgEl('polyline', { points: pts.map((p) => p.join(',')).join(' '), fill: 'none', stroke: '#c9d6d8', 'stroke-width': 3, 'stroke-linejoin': 'round' }));
    pts.forEach(([x, y], i) => svg.append(svgEl('circle', { cx: x, cy: y, r: 10, fill: farben[i % 4], stroke: '#0b1517', 'stroke-width': 2 })));
  };
  chain(folded);
  chain(flat);
  // gestrichelte Wasserstoffbrücken in der gefalteten Kette
  for (const [a, b] of [[0, 7], [2, 9], [4, 11]]) {
    svg.append(svgEl('line', { x1: folded[a][0], y1: folded[a][1], x2: folded[b][0], y2: folded[b][1], stroke: '#9be3b0', 'stroke-width': 2, 'stroke-dasharray': '4 4' }));
  }
  svg.append(svgEl('text', { x: 95, y: 170, 'text-anchor': 'middle', 'font-size': 16, class: 'denat-text' }, 'gefaltet: Struktur intakt'));
  svg.append(svgEl('text', { x: 432, y: 170, 'text-anchor': 'middle', 'font-size': 16, class: 'denat-text' }, 'entfaltet: Form verloren'));
  svg.append(svgEl('line', { x1: 175, y1: 82, x2: 280, y2: 82, stroke: '#f08a24', 'stroke-width': 4 }));
  svg.append(svgEl('polygon', { points: '280,72 298,82 280,92', fill: '#f08a24' }));
  svg.append(svgEl('text', { x: 228, y: 62, 'text-anchor': 'middle', 'font-size': 14, class: 'denat-text' }, 'Hitze, Säure,'));
  svg.append(svgEl('text', { x: 228, y: 106, 'text-anchor': 'middle', 'font-size': 14, class: 'denat-text' }, 'Alkohol, Schwermetall'));
  svg.append(svgEl('text', { x: 280, y: 195, 'text-anchor': 'middle', 'font-size': 14, class: 'denat-text' }, 'Die Reihenfolge der Bausteine (Farben) bleibt.'));
  return svg;
}

/** Kette aus n Bausteinen mit Verbindungsstellen, für Aufgabe 3. */
export function ketteDiagram(n) {
  const w = 90 * n + 20;
  const svg = svgEl('svg', { viewBox: `0 0 ${w} 90`, class: 'formel kette', role: 'img', 'aria-label': `Kette aus ${n} Aminosäuren` });
  for (let i = 0; i < n; i++) {
    const x = 10 + i * 90;
    const g = svgEl('g', { class: 'baustein' });
    g.append(svgEl('rect', { x, y: 20, width: 70, height: 50, rx: 12 }));
    g.append(svgEl('text', { x: x + 35, y: 45, 'font-size': 22, 'text-anchor': 'middle', 'dominant-baseline': 'central' }, 'AS'));
    svg.append(g);
    if (i < n - 1) svg.append(svgEl('rect', { x: x + 70, y: 40, width: 20, height: 10, class: 'verbinder' }));
  }
  return svg;
}
