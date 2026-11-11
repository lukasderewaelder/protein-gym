// Inventar anzeigen: als Reiter im Spind und als Fenster über das Taschensymbol.

import { h } from './dom.js';
import { liste } from '../state/inventar.js';
import { ausweisKarte } from './zugang.js';

const EMOJI = { aufkleber: '⭐', zettel: '📝', schluessel: '🔑' };

function symbol(g, namen) {
  if (g.symbol === 'ausweis') return ausweisKarte(namen, true);
  return h('span', { class: 'inv-emoji', 'aria-hidden': 'true' }, g.emoji || EMOJI[g.symbol] || '🎒');
}

/** Karten für alle Gegenstände. Benutzte bleiben sichtbar, ausgegraut und mit Haken. */
export function renderInventar({ daten, store }) {
  const items = liste(daten.gegenstaende, (f) => store.hasFlag(f));
  if (!items.length) return [h('p', 'nb-summe', daten.leer)];
  return [
    h('p', 'nb-summe', `${items.length} ${items.length === 1 ? 'Gegenstand' : 'Gegenstände'} in deiner Tasche.`),
    ...items.map((g) => h('article', { class: `karte inv-karte${g.benutzt ? ' benutzt' : ''}` },
      h('div', 'inv-bild', symbol(g, store.state.names)),
      h('div', 'inv-text',
        h('h4', {}, g.benutzt ? `✓ ${g.name}` : g.name),
        h('p', {}, g.text),
        g.benutzt ? h('p', 'inv-status', g.hinweisBenutzt || 'Benutzt.') : (g.hinweisNeu ? h('p', 'inv-hinweis', g.hinweisNeu) : null)))),
  ];
}
