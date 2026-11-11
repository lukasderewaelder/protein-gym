// Spind (Innenseite = Ermittlungszentrale): Pinnwand mit den gefundenen Hinweisen, Glossar und Hefter.
// Hilfestufe 1, immer ohne Punktabzug erreichbar.

import { h, clear } from './dom.js';
import { renderMini } from './funde.js';
import { renderInventar } from './inventar.js';

const RAUM_REIHENFOLGE = ['empfang', 'labor', 'sauna', 'training', 'shakebar'];
const RAUM_NAMEN = { empfang: 'Empfang', training: 'Trainingsfläche', labor: 'Labor', sauna: 'Sauna', shakebar: 'Shake-Bar' };

const AB_TEXT = { sauna_done: 'die Sauna', training_done: 'die Trainingsfläche', shakebar_done: 'die Shake-Bar' };

export function createNotebook({ dialogEl, wissen, glossar, hefter, inventar, store, onFund, onOpen, extras, onKritzel, onInventar }) {
  const body = dialogEl.querySelector('.nb-body');
  const tabs = dialogEl.querySelector('.nb-tabs');
  let tab = 'karten';

  /** Pinnwand im Krimi-Stil: gefundene Funde hängen schief mit Pinnadeln, rote Fäden verbinden sie je Raum. */
  function renderKarten() {
    const flags = store.state.flags;
    const found = wissen.karten.filter((k) => flags[k.id]).length;
    const wand = h('div', 'pinnwand');
    wand.append(h('p', 'pin-summe', `${found} von ${wissen.karten.length} Funden an der Wand`));
    for (const raum of RAUM_REIHENFOLGE) {
      const list = wissen.karten.filter((k) => k.raum === raum).sort((x, y) => (x.typ === y.typ ? 0 : x.typ === 'pflicht' ? -1 : 1));
      if (!list.length) continue;
      const karten = h('div', 'pin-karten');
      let offen = 0;
      let offenZusatz = 0;
      for (const k of list) {
        if (flags[k.id]) karten.append(renderMini(k, { onclick: () => onFund && onFund(k) }));
        else if (k.typ === 'zusatz') offenZusatz++;
        else offen++;
      }
      // Leere Plätze nur als eine Zeile je Raum (Querformat, wenig Platz)
      const teile = [];
      if (offen) teile.push(`noch ${offen} ${offen === 1 ? 'Hinweis' : 'Hinweise'} offen`);
      if (offenZusatz) teile.push(`${offenZusatz} Extra-${offenZusatz === 1 ? 'Fund' : 'Funde'} versteckt`);
      if (teile.length) karten.append(h('p', `pin-offen${offen ? '' : ' nur-extra'}`, `? ${teile.join(' · ')}`));
      wand.append(h('section', 'pin-raum', h('h3', {}, RAUM_NAMEN[raum] || raum), karten));
    }
    // Notizen, die erst im Spielverlauf entstehen (zum Beispiel der Zettel mit dem Saunacode)
    const notizen = extras ? extras() : [];
    if (notizen.length) {
      wand.append(h('section', 'pin-raum', h('h3', {}, 'Notizen'), h('div', 'pin-karten', notizen.map((k) => renderMini(k, { onclick: () => onFund && onFund(k) })))));
    }
    // Gekritzel in der Ecke des Spinds: Markus hat den Saunacode hingeschrieben
    if (store.hasFlag('sauna_info') && store.state.codes && store.state.codes.sauna) {
      wand.prepend(h('button', { type: 'button', class: 'spind-kritzel', 'aria-label': 'Gekritzel in der Ecke des Spinds ansehen', onclick: () => onKritzel && onKritzel() },
        h('span', 'kritzel-zahl', store.state.codes.sauna), h('small', {}, 'hingekritzelt')));
    }
    return [wand];
  }

  /** Roter Wollfaden zwischen den Pinnadeln gefundener Funde (nach dem Anzeigen, wenn die Maße bekannt sind). */
  function zieheFaeden() {
    for (const raum of body.querySelectorAll('.pin-raum')) {
      raum.querySelector('.pin-faeden')?.remove();
      const minis = [...raum.querySelectorAll('.fund-mini')];
      if (minis.length < 2) continue;
      const r0 = raum.getBoundingClientRect();
      const pts = minis.map((m) => { const r = m.getBoundingClientRect(); return [r.left - r0.left + r.width / 2, r.top - r0.top + 6]; });
      let d = `M ${pts[0][0]} ${pts[0][1]}`;
      for (let i = 1; i < pts.length; i++) {
        const [x0, y0] = pts[i - 1];
        const [x1, y1] = pts[i];
        d += ` Q ${(x0 + x1) / 2} ${Math.max(y0, y1) + 26} ${x1} ${y1}`;
      }
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('class', 'pin-faeden');
      svg.setAttribute('aria-hidden', 'true');
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', d);
      svg.append(path);
      raum.prepend(svg);
    }
  }

  function renderGlossar() {
    const flags = store.state.flags;
    const nodes = [h('p', 'nb-summe', 'Hier steht, was du schon gefunden hast. Neue Begriffe erscheinen, wenn du das passende Hinweiskärtchen einsteckst.')];
    for (const g of glossar.begriffe) {
      if (g.ab && !flags[g.ab]) {
        nodes.push(h('article', 'karte gesperrt', h('h4', {}, '🔒 Noch ein Geheimnis'), h('p', {}, 'Finde zuerst den passenden Hinweis in den Räumen.')));
      } else {
        nodes.push(h('article', 'karte', h('h4', {}, g.begriff), h('p', {}, g.text)));
      }
    }
    return nodes;
  }

  /** Haken „abgeschrieben“: bleibt auf dem Gerät gespeichert, blockiert nichts. */
  function haken(key) {
    const box = h('input', { type: 'checkbox', id: `hk-${key}`, 'aria-label': 'abgeschrieben' });
    box.checked = Boolean(store.state.hefterHaken && store.state.hefterHaken[key]);
    box.addEventListener('change', () => {
      store.state.hefterHaken = { ...store.state.hefterHaken, [key]: box.checked };
      store.save();
    });
    return h('label', 'haken', box, ' abgeschrieben');
  }

  function renderHefter() {
    const flags = store.state.flags;
    const nodes = [h('p', 'nb-summe', 'Diese Einträge sichern den verbindlichen Stoff. Übernimm sie in deinen Hefter. Die Texte sind Vorschläge in eigenen Worten.')];
    for (const e of hefter.eintraege) {
      if (!flags[e.ab]) {
        nodes.push(h('article', 'karte gesperrt', h('h4', {}, `🔒 ${e.titel}`), h('p', {}, `Kommt, wenn du ${AB_TEXT[e.ab] || 'den Raum'} geschafft hast.`)));
        continue;
      }
      nodes.push(h('article', 'karte',
        h('h4', {}, e.titel),
        h('p', 'buch', e.dauer),
        ...e.teile.map((t, i) => {
          if (t.typ === 'merksatz') return h('p', 'merksatz', h('strong', {}, 'Merksatz: '), t.text);
          if (t.typ === 'hinweis') return h('p', 'buch', t.text);
          return h('div', 'auftrag-abschreiben', h('p', {}, t.text), haken(`${e.id}.${i}`));
        })));
    }
    return nodes;
  }

  function render() {
    clear(body);
    body.dataset.tab = tab;
    body.append(...(tab === 'karten' ? renderKarten() : tab === 'hefter' ? renderHefter() : tab === 'inventar' ? renderInventar({ daten: inventar, store }) : renderGlossar()));
    if (tab === 'inventar' && onInventar) onInventar();
    tabs.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.tab === tab)));
    if (tab === 'karten' && dialogEl.open) requestAnimationFrame(zieheFaeden);
  }

  tabs.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { tab = b.dataset.tab; render(); }));
  dialogEl.querySelector('.nb-close').addEventListener('click', () => dialogEl.close());

  return {
    open(which = 'karten') {
      if (onOpen) onOpen();
      tab = which;
      render();
      if (!dialogEl.open) dialogEl.showModal();
      if (tab === 'karten') requestAnimationFrame(zieheFaeden);
    },
    refresh() { if (dialogEl.open) render(); },
    get isOpen() { return dialogEl.open; },
  };
}
