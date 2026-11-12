// Spind (Innenseite der Spindtür): Pinnwand mit den gefundenen Hinweisen, Glossar und Hefter.
// Hilfestufe 1, immer ohne Punktabzug erreichbar.

import { h, clear } from './dom.js';
import { renderMini } from './funde.js';
import { renderInventar } from './inventar.js';
import { macheSeiten } from './seiten.js';
import { aminoTafel, denatDiagram } from '../tasks/molecule.js';
import { eintragErledigt } from '../state/hefter.js';

const RAUM_REIHENFOLGE = ['empfang', 'labor', 'sauna', 'training', 'shakebar'];
const RAUM_NAMEN = { empfang: 'Empfang', training: 'Trainingsfläche', labor: 'Labor', sauna: 'Sauna', shakebar: 'Shake-Bar' };

const AB_TEXT = { sauna_done: 'die Sauna', training_done: 'die Trainingsfläche', shakebar_done: 'die Shake-Bar', lieferung_done: 'die Prüfung der neuen Lieferung' };

export function createNotebook({ dialogEl, wissen, glossar, hefter, inventar, store, onFund, onOpen, extras, onCode, onZettel, onInventar }) {
  const body = dialogEl.querySelector('.nb-body');
  const tabs = dialogEl.querySelector('.nb-tabs');
  let tab = 'karten';
  let hervor = false;       // Hilfe 3: den Saunazettel kurz blinken lassen
  // Kein Scrollen: Blättern in Pinnwand, Glossar, Hefter und Inventar; „Seite x von y“ steht rechts in der Reiterleiste
  const nav = h('nav', { class: 'nb-nav', 'aria-label': 'Seiten', hidden: true });
  tabs.append(nav);
  let seiten = null;

  /** Pinnwand im Krimi-Stil: gefundene Funde hängen schief mit Pinnadeln, rote Fäden verbinden sie je Raum. */
  function renderKarten() {
    const flags = store.state.flags;
    const found = wissen.karten.filter((k) => flags[k.id]).length;
    const wand = h('div', 'pinnwand');
    wand.append(h('p', 'pin-summe', `${found} von ${wissen.karten.length} Funden an der Wand`));
    // Rechts oben an der Pinnwand hängt die ganze Zeit ein kleiner Zettel mit dem Saunacode (niemand weist darauf hin).
    // Er steht auf jeder Seite der Pinnwand; als gesehen gilt er, sobald Markus von der verriegelten Sauna erzählt hat.
    const saunaCode = store.state.codes && store.state.codes.sauna;
    if (saunaCode) {
      wand.append(h('button', { type: 'button', class: `pin-zettel-oben${hervor ? ' hervor' : ''}`, 'aria-label': `Zettel: Sauna ${saunaCode.split('').join(' ')}. Antippen zum Vergrößern.`, onclick: () => onCode && onCode() },
        h('span', 'pin-zettel-kopf', 'Sauna'),
        h('span', 'pin-zettel-code', saunaCode)));
      if (flags.sauna_info && onZettel) onZettel();
    }
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

  /** Haken „abgeschrieben“ je Eintrag: bleibt auf dem Gerät gespeichert; ohne Haken bleibt der nächste Raum zu (src/state/hefter.js). */
  function haken(e) {
    const box = h('input', { type: 'checkbox', id: `hk-${e.id}`, 'aria-label': `${e.titel} abgeschrieben` });
    box.checked = eintragErledigt(e, store.state.flags, store.state.hefterHaken);
    box.addEventListener('change', () => {
      store.state.hefterHaken = { ...store.state.hefterHaken, [e.id]: box.checked };
      store.save();
      render();
    });
    return h('label', 'haken', box, ' abgeschrieben');
  }

  /** Abbildung im Hefter zum Abzeichnen: Aminosäure-Formeln (aminoTafel) oder die Kette als Perlenschnur (denatDiagram). */
  function abbildung(t) {
    if (t.art === 'aminosaeure') {
      return h('figure', 'blatt-abb',
        h('div', 'blatt-abb-reihe', t.formeln.map(([name, rest]) => h('div', 'blatt-abb-formel', aminoTafel(rest, name), h('span', 'blatt-abb-name', name)))),
        t.unterschrift ? h('figcaption', {}, t.unterschrift) : null);
    }
    if (t.art === 'kette') return h('figure', 'blatt-abb', denatDiagram(), t.unterschrift ? h('figcaption', {}, t.unterschrift) : null);
    return h('p', 'blatt-text', '(Abbildung fehlt)');
  }

  /** Stichpunkte: optionaler Einleitungssatz (fett) und eine Liste. */
  function liste(t) {
    return [t.einleitung ? h('p', 'blatt-text blatt-einleitung', t.einleitung) : null, h('ul', 'blatt-liste', t.punkte.map((p) => h('li', {}, p)))].filter(Boolean);
  }

  /** Übersicht als Tabelle (Kopfzeile, Zeilen; leere Zellen bleiben zum Ausfüllen frei). */
  function tabelle(t) {
    return h('table', 'blatt-tabelle',
      h('thead', {}, h('tr', {}, t.kopf.map((k) => h('th', { scope: 'col' }, k)))),
      h('tbody', {}, t.zeilen.map((z) => h('tr', {}, z.map((c) => h('td', {}, c))))));
  }

  function renderHefter() {
    const flags = store.state.flags;
    const hk = store.state.hefterHaken || {};
    const frei = hefter.eintraege.filter((e) => flags[e.ab]);
    // Leiste über dem Blatt: was zu tun ist und der Haken; das Blatt selbst enthält nur, was abgeschrieben wird
    const offen = frei.filter((e) => !eintragErledigt(e, flags, hk));
    const leiste = h('div', 'hefter-leiste', offen.length
      ? offen.map((e) => h('div', 'hefter-auftrag', h('strong', {}, `${e.titel}:`), h('span', {}, e.anweisungen.join(' ')), haken(e)))
      : h('p', 'hefter-fertig', frei.length ? '✓ Alle freien Einträge sind abgeschrieben.' : 'Der erste Eintrag kommt nach der Sauna.'));
    const blatt = h('article', 'blatt', h('h3', 'blatt-titel', (hefter.blatt && hefter.blatt.titel) || 'Eiweiße'));
    for (const e of hefter.eintraege) {
      if (!flags[e.ab]) {
        blatt.append(h('p', 'blatt-gesperrt', `🔒 ${e.titel}: Kommt, wenn du ${AB_TEXT[e.ab] || 'den Raum'} geschafft hast.`));
        continue;
      }
      for (const t of e.teile) {
        // Grün (ueb) nur für echte Teilüberschriften; kleine Beschriftungen (label) sind eine fette schwarze Zeile
        if (t.ueb) blatt.append(h('h4', 'blatt-ueb', t.ueb));
        if (t.label) blatt.append(h('p', 'blatt-label', t.label));
        // Nur Wichtiges ist ein Merksatz: roter Rahmen, Überschrift „Merke: <Begriff>“; alles andere ist normaler Text
        if (t.typ === 'merksatz') blatt.append(h('div', 'blatt-merk', h('p', 'blatt-merke-kopf', t.merke ? `Merke: ${t.merke}` : 'Merke'), h('p', 'blatt-merke-text', t.text)));
        else if (t.typ === 'abbildung') blatt.append(abbildung(t));
        // Stichpunkte und Übersichten (Tabellen) statt Fließtext, wo ein Text länger wird
        else if (t.typ === 'liste') blatt.append(...liste(t));
        else if (t.typ === 'tabelle') blatt.append(tabelle(t));
        else blatt.append(h('p', 'blatt-text', t.text));
      }
    }
    return [leiste, blatt];
  }

  function render() {
    clear(body);
    body.dataset.tab = tab;
    body.append(...(tab === 'karten' ? renderKarten() : tab === 'hefter' ? renderHefter() : tab === 'inventar' ? renderInventar({ daten: inventar, store }) : renderGlossar()));
    if (tab === 'inventar' && onInventar) onInventar();
    tabs.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.tab === tab)));
    if (tab === 'karten' && dialogEl.open) requestAnimationFrame(zieheFaeden);
    blaettern();
  }

  /** Seiten für den aktuellen Reiter einrichten (Pinnwand: Räume, Hefter: Blöcke des Blatts, Glossar/Inventar: Einträge). */
  function blaettern() {
    if (seiten) { seiten.ende(); seiten = null; }
    nav.hidden = true;
    const host = tab === 'karten' ? body.querySelector('.pinnwand') : tab === 'hefter' ? body.querySelector('.blatt') : body;
    if (!host) return;
    seiten = macheSeiten(host, {
      nav,
      kompakt: false,
      ignorieren: (k) => k.classList.contains('pin-zettel-oben') || k.classList.contains('pin-faeden'),
      kleben: (k) => k.matches('.pin-summe, .nb-summe, h3, h4, .blatt-label'),
      beiWechsel: () => { if (tab === 'karten') requestAnimationFrame(zieheFaeden); },
    });
    if (dialogEl.open) requestAnimationFrame(() => seiten && seiten.neu());
  }

  tabs.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { tab = b.dataset.tab; render(); }));
  dialogEl.querySelector('.nb-close').addEventListener('click', () => dialogEl.close());

  return {
    open(which = 'karten', { hervorheben = false } = {}) {
      if (onOpen) onOpen();
      tab = which;
      hervor = hervorheben;
      render();
      if (!dialogEl.open) dialogEl.showModal();
      if (tab === 'karten') requestAnimationFrame(zieheFaeden);
      requestAnimationFrame(() => seiten && seiten.neu());
      if (hervor) setTimeout(() => { hervor = false; }, 4000);
    },
    refresh() { if (dialogEl.open) render(); },
    get isOpen() { return dialogEl.open; },
  };
}
