// Schritt-Typen für die Fachumstellung: „zeigen“ (Formel nur anschauen, nie abgefragt) und
// „fingerabdruck“ (Zusatz: Ninhydrin macht einen Fingerabdruck sichtbar).

import { h } from '../ui/dom.js';
import { aminoDiagram, svgEl } from './molecule.js';
import { alleFallKarten, taeterRichtig, hinweisZurWahl } from '../state/fall.js';

const NAMEN = { amino: 'Aminogruppe (–NH₂)', carboxy: 'Carboxygruppe (–COOH)', rest: 'Rest R (bei jeder Aminosäure anders)', c: 'zentrales Kohlenstoffatom', h: 'Wasserstoffatom' };

/** Formel zeigen: Tippen auf Teile nennt nur den Namen, nichts wird bewertet. Der Schritt ist mit „Verstanden“ erledigt. */
function zeigen(host, step, api, ctx) {
  const info = h('p', { class: 'hint', 'aria-live': 'polite' }, 'Tippe auf einen Teil der Formel, dann steht hier sein Name.');
  const children = [h('p', 'frage', step.auftrag)];
  if (step.molekuel) {
    const mol = ctx.data.molekuele[step.molekuel];
    const dia = aminoDiagram(mol, { onPart: (id) => { info.textContent = `${mol.name}: ${NAMEN[id]}`; } });
    children.push(h('div', 'formel-box', dia.svg), info);
  }
  children.push(h('button', { class: 'primary', type: 'button', onclick: () => api.ok('Gut. Das musst du dir nicht merken.') }, 'Verstanden'));
  host.append(...children);
  return { reveal() {} };
}

/** Papier mit unsichtbarem Fingerabdruck; „Besprühen“ färbt die Rillen violett. */
function fingerabdruck(host, step, api) {
  const svg = svgEl('svg', { viewBox: '0 0 240 300', class: 'formel fingerabdruck', role: 'img', 'aria-label': 'Ein Blatt Papier mit einem Fingerabdruck, der erst nach dem Besprühen sichtbar wird.' });
  svg.append(svgEl('rect', { x: 10, y: 10, width: 220, height: 280, rx: 10, class: 'papier' }));
  const g = svgEl('g', { class: 'rillen' });
  for (let i = 0; i < 9; i++) {
    const rx = 14 + i * 9;
    const ry = 22 + i * 12;
    g.append(svgEl('ellipse', { cx: 120, cy: 150 + (i % 2 ? 2 : -2), rx, ry, fill: 'none', 'stroke-dasharray': `${30 + i * 4} ${6 + (i % 3) * 3}`, 'stroke-dashoffset': i * 11 }));
  }
  svg.append(g);
  const btn = h('button', { class: 'primary', type: 'button', onclick: spruehen }, 'Mit Ninhydrin besprühen');
  host.append(h('p', 'frage', step.auftrag), h('div', 'formel-box', svg), btn);
  function zeige() { svg.classList.add('sichtbar'); btn.disabled = true; }
  function spruehen() {
    zeige();
    api.ok('Der Abdruck wird violett: Ninhydrin reagiert mit den Aminosäuren aus dem Schweiß.');
  }
  return { reveal: zeige };
}

/**
 * Auflösung des Falls: Wer war es? Die Hinweise aus dem Spind helfen, der gewürfelte Täter steht im Spielstand.
 * Pflicht ist die richtige Person. Nach der Wahl erscheint die Auflösung zum gewürfelten Ende.
 */
function verdaechtige(host, step, api, ctx) {
  const taeter = ctx.store.state.fall && ctx.store.state.fall.taeter;
  const fall = ctx.fall;
  const flags = ctx.store.state.flags;
  const karten = alleFallKarten(taeter, fall);
  const liste = h('ul', 'fall-hinweise', karten.map((k) => {
    const gefunden = Boolean(flags[k.id]);
    const aussage = k.zeilen[k.zeilen.length - 1].replace(/^[A-ZÄÖÜ][\wäöüß ]{0,17}: /, '');
    return h('li', gefunden ? '' : 'fehlt', gefunden ? h('strong', {}, `${k.titel}: `) : `Noch ein Hinweis in „${fall.hinweise[k.raum].raumName}“.`, gefunden ? aussage : '');
  }));
  const ergebnis = h('div', 'fall-aufloesung');
  ergebnis.hidden = true;
  const knoepfe = Object.entries(fall.verdaechtige).map(([id, v]) => {
    const b = h('button', { type: 'button', class: 'fall-person', 'data-id': id },
      h('img', { src: `assets/portraits/${v.portrait}_0.webp`, alt: '', width: 64, height: 64 }),
      h('strong', {}, v.name), h('span', {}, v.ort));
    b.addEventListener('click', () => {
      if (taeterRichtig(id, taeter)) { zeigeLoesung(id); api.ok(`Richtig: ${v.name}!`); } else api.fail(hinweisZurWahl(id, taeter, fall, flags));
    });
    return b;
  });
  function zeigeLoesung(auswahl) {
    knoepfe.forEach((b) => { b.disabled = true; if (b.dataset.id === auswahl) b.classList.add('richtig'); });
    ergebnis.replaceChildren(...fall.aufloesung[taeter].map((z) => h('p', {}, z)));
    ergebnis.hidden = false;
  }
  host.append(
    h('p', 'frage', 'Wer hat den Vorrat zum Gerinnen gebracht? Lies die Hinweise und tippe auf die Person, die kein Alibi hat.'),
    liste,
    h('div', 'fall-personen', knoepfe),
    ergebnis,
  );
  return { reveal() { zeigeLoesung(taeter); } };
}

export const NEU_TYPES = { zeigen, fingerabdruck, verdaechtige };
