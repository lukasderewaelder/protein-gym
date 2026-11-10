// Darstellung der Hinweiskärtchen: jede Fundart sieht anders aus (Notizzettel, Zeitung, Chat …).
// Aufbau per DOM, Aussehen per assets/css/funde.css. Reine Parser stehen in funde-core.js.

import { h } from './dom.js';
import { fundart, istZusatz, parseChat, parseProtokoll, parseSteckbrief, parseFelder, tafelText } from './funde-core.js';
import { aminoTafel } from '../tasks/molecule.js';

const NS = 'http://www.w3.org/2000/svg';

/** Kleines Symbol der Fundart als SVG (Linien in currentColor). */
export function fundIcon(id, size = 24) {
  const f = fundart(id);
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  svg.setAttribute('class', 'fund-icon');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  for (const d of f.pfade) {
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('d', d);
    svg.append(p);
  }
  return svg;
}

function kettenSkizze() {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 260 44');
  svg.setAttribute('class', 'fund-kette');
  svg.setAttribute('aria-hidden', 'true');
  const farben = ['#d9632b', '#2a8a8a', '#c9a31c', '#8f5cc0'];
  for (let i = 0; i < 7; i++) {
    const c = document.createElementNS(NS, 'circle');
    c.setAttribute('cx', String(20 + i * 36));
    c.setAttribute('cy', String(22 + (i % 2 ? 6 : -6)));
    c.setAttribute('r', '11');
    c.setAttribute('fill', farben[i % 4]);
    c.setAttribute('stroke', '#1b2a30');
    c.setAttribute('stroke-width', '2');
    svg.append(c);
  }
  return svg;
}

const absaetze = (zeilen, cls = 'fund-zeile') => zeilen.map((z) => h('p', cls, z));

const BODIES = {
  haftnotiz: (k) => [h('div', 'fund-text', absaetze(k.zeilen))],
  karteikarte: (k) => [h('div', 'fund-text', absaetze(k.zeilen))],
  schautafel: (k) => [
    k.vorspann ? h('p', 'fund-vorspann', k.vorspann) : null,
    h('div', 'fund-tafeln', parseSteckbrief(k.zeilen).map((s) =>
      h('figure', 'fund-tafel', aminoTafel(s.felder[0] || 'R', s.name), h('figcaption', {}, s.name)))),
    h('div', 'fund-text', tafelText(k.zeilen).map((z, i) => h('p', `fund-zeile${i === 0 ? ' chip chip-grau' : i === 1 ? ' chip chip-orange' : ''}`, z))),
  ],
  whiteboard: (k) => [kettenSkizze(), h('div', 'fund-text', absaetze(k.zeilen))],
  heft: (k) => [h('div', 'fund-text', absaetze(k.zeilen))],
  plakat: (k) => [h('ul', 'fund-liste', k.zeilen.map((z) => h('li', /^Zusatz:/.test(z) ? 'klein' : '', z)))],
  zeitung: (k) => [
    k.vorspann ? h('p', 'fund-vorspann', k.vorspann) : null,
    h('div', 'fund-spalten', absaetze(k.zeilen, 'fund-absatz')),
  ],
  laborzettel: (k) => [formular(k)],
  bericht: (k) => [formular(k)],
  protokoll: (k) => [h('div', 'fund-verhoer', parseProtokoll(k.zeilen).map((z) =>
    h('p', `fund-${z.art === 'F' ? 'frage' : 'antwort'}`, h('b', {}, z.art === 'F' ? 'Frage' : 'Antwort'), z.text)))],
  schild: (k) => [h('div', 'fund-text', absaetze(k.zeilen))],
  rezept: (k) => [h('div', 'fund-text', absaetze(k.zeilen))],
  chat: (k) => [h('div', 'fund-chat', parseChat(k.zeilen).map((m) =>
    h('div', `fund-blase ${m.seite}`, h('small', {}, m.von), h('span', {}, m.text))))],
  etikett: (k) => [formular(k)],
};

function formular(k) {
  return h('dl', 'fund-felder-liste', parseFelder(k.zeilen).flatMap((f) =>
    f.label ? [h('dt', {}, f.label), h('dd', {}, f.wert)] : [h('dd', 'frei', f.wert)]));
}

/** Große Darstellung eines Funds. */
export function renderFund(karte) {
  const art = fundart(karte.medium);
  const body = (BODIES[art.id] || BODIES.haftnotiz)(karte);
  const kopfTag = art.id === 'zeitung' ? 'h3' : 'header';
  return h('article', { class: `fund ${art.id}${istZusatz(karte) ? ' zusatz' : ''}`, 'data-medium': art.id, 'aria-label': `${art.name}: ${karte.titel}` },
    h('span', 'fund-deko'),
    art.id === 'zeitung' ? h('p', 'fund-zeitungskopf', 'Gym-Post · Sonderausgabe') : null,
    h(kopfTag, 'fund-kopf', karte.kopf),
    ...body.filter(Boolean),
    karte.fuss ? h('footer', 'fund-fuss', karte.fuss) : null,
    istZusatz(karte) ? h('p', 'fund-buch', 'Zusatzwissen') : null);
}

/** Kleine Karte für Pinnwand und Leiste: Symbol, Titel, Fundart. */
export function renderMini(karte, { onclick, neu = false } = {}) {
  const art = fundart(karte.medium);
  return h('button', {
    type: 'button',
    class: `fund-mini ${art.id}${istZusatz(karte) ? ' zusatz' : ''}${neu ? ' neu' : ''}`,
    style: `--fund-farbe:${art.farbe}`,
    'data-id': karte.id,
    onclick,
  }, h('span', 'fund-pin'), fundIcon(art.id, 30), h('strong', {}, karte.titel.replace(/ \(Zusatzwissen\)$/, '')), h('small', {}, art.name));
}
