// Fenster für den Zugang: Laborführerschein, Labor-Ausweis, Zahlenschloss. Alles in einem eigenen Dialog (#zugang).

import { h, clear } from './dom.js';
import { startTest, aktuelle, antworte, weiter, istFertig } from '../state/fuehrerschein.js';
import { pruefeCode } from '../state/zugang.js';

/** Der Labor-Ausweis als Karte, im Code gezeichnet (Namen der Spielenden). */
export function ausweisKarte(namen, klein = false) {
  const name = (namen && namen.length ? namen.join(', ') : 'Trainingspartner');
  return h('div', { class: `ausweis${klein ? ' klein' : ''}`, role: 'img', 'aria-label': `Labor-Ausweis für ${name}` },
    h('div', 'ausweis-streifen', 'LABOR-AUSWEIS'),
    h('div', 'ausweis-koerper',
      h('div', 'ausweis-foto', name.slice(0, 1).toUpperCase()),
      h('div', 'ausweis-zeilen',
        h('strong', {}, name),
        h('span', {}, 'Berechtigt: Labor'),
        h('span', 'ausweis-linie'),
        h('span', 'ausweis-linie kurz'))));
}

export function createZugang({ dlg, store, daten }) {
  const inhalt = dlg.querySelector('#zugang-inhalt');
  let beiSchliessen = null;

  function zeige(titel, ...nodes) {
    clear(inhalt);
    inhalt.append(h('h2', {}, titel), ...nodes);
    if (!dlg.open) dlg.showModal();
  }
  function schliesse() {
    if (dlg.open) dlg.close();
  }
  dlg.addEventListener('close', () => { const f = beiSchliessen; beiSchliessen = null; if (f) f(); });

  // ---------- Laborführerschein ----------
  function fuehrerschein({ beiBestanden }) {
    const F = daten.fuehrerschein;
    const t = startTest(F.fragen);

    function frage(rueckmeldung = null) {
      const f = aktuelle(t);
      const gefunden = rueckmeldung && rueckmeldung.richtig;
      const fb = h('p', { class: `zugang-fb${rueckmeldung ? (gefunden ? ' gut' : ' schlecht') : ''}`, role: 'status', 'aria-live': 'polite' },
        rueckmeldung ? `${gefunden ? '✓' : '✗'} ${rueckmeldung.text}` : '');
      const knoepfe = f.optionen.map((o, i) => h('button', {
        type: 'button',
        class: `option${t.gewaehlt.has(i) ? ' falsch' : ''}${gefunden && o.richtig ? ' richtig' : ''}`,
        disabled: t.gewaehlt.has(i) || gefunden,
        onclick: () => {
          const r = antworte(t, i);
          if (r.stufe === 'nichts') return;
          frage(r);
          if (!r.richtig) { const k = inhalt.querySelector('.zugang-karte'); if (k) { k.classList.remove('wackeln'); void k.offsetWidth; k.classList.add('wackeln'); } }
        },
      }, o.text));
      const fuss = gefunden
        ? h('button', { class: 'primary', type: 'button', onclick: () => { weiter(t); if (istFertig(t)) fertig(); else frage(); } }, t.i >= t.fragen.length - 1 ? 'Ausweis abholen' : 'Weiter →')
        : null;
      zeige(F.titel,
        h('div', 'zugang-karte',
          h('p', 'zugang-schritt', `Frage ${t.i + 1} von ${t.fragen.length}`),
          h('p', 'zugang-frage', f.frage),
          h('div', 'zugang-optionen', knoepfe),
          fb,
          fuss));
    }

    function fertig() {
      store.setFlag('lf_bestanden');
      store.setFlag('item_ausweis');
      zeige(F.titel,
        h('div', 'zugang-karte',
          h('p', 'zugang-gut', `✓ ${F.bestanden}`),
          ausweisKarte(store.state.names),
          h('p', 'hint', 'Du findest den Ausweis in deiner Tasche. Halte ihn an das Lesegerät neben der Labortür.'),
          h('button', { class: 'primary', type: 'button', onclick: () => { schliesse(); } }, 'Ausweis einstecken')));
      beiSchliessen = beiBestanden || null;
    }

    zeige(F.titel, h('div', 'zugang-karte', h('p', {}, F.einleitung), h('button', { class: 'primary', type: 'button', onclick: () => frage() }, 'Los')));
  }

  // ---------- Zahlenschloss ----------
  /**
   * Ziffernfeld. opts: { titel, text, stellen, code, hinweis (nach 3 Fehlversuchen), beiRichtig() }.
   * Kein Sperren: man kann beliebig oft probieren.
   */
  function tastenfeld(opts) {
    const stellen = opts.stellen || 4;
    let eingabe = '';
    let fehler = 0;
    const anzeige = h('div', { class: 'tf-anzeige', 'aria-live': 'polite', role: 'status' });
    const meldung = h('p', { class: 'zugang-fb', role: 'status' });
    const karte = h('div', 'zugang-karte tf');

    const zeichne = () => {
      clear(anzeige);
      for (let i = 0; i < stellen; i++) anzeige.append(h('span', { class: `tf-stelle${i < eingabe.length ? ' voll' : ''}` }, i < eingabe.length ? eingabe[i] : '•'));
    };
    const druecke = (z) => {
      if (eingabe.length >= stellen) return;
      eingabe += z;
      meldung.textContent = '';
      meldung.className = 'zugang-fb';
      zeichne();
      if (eingabe.length === stellen) pruefen();
    };
    const pruefen = () => {
      if (pruefeCode(eingabe, opts.code)) {
        anzeige.classList.add('ok');
        meldung.className = 'zugang-fb gut';
        meldung.textContent = '✓ Richtig!';
        karte.querySelectorAll('button').forEach((b) => { b.disabled = true; });
        setTimeout(() => { schliesse(); if (opts.beiRichtig) opts.beiRichtig(); }, 650);
      } else {
        fehler++;
        meldung.className = 'zugang-fb schlecht';
        meldung.textContent = fehler >= 3 && opts.hinweis ? `✗ Nicht richtig. ${opts.hinweis}` : '✗ Nicht richtig. Versuch es noch einmal.';
        eingabe = '';
        karte.classList.remove('wackeln');
        void karte.offsetWidth;
        karte.classList.add('wackeln');
        zeichne();
      }
    };
    const taste = (z) => h('button', { type: 'button', class: 'tf-taste', 'aria-label': z === '⌫' ? 'Letzte Ziffer löschen' : `Ziffer ${z}`, onclick: () => (z === '⌫' ? ((eingabe = eingabe.slice(0, -1)), zeichne()) : druecke(z)) }, z);
    const tasten = h('div', 'tf-tasten', ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0'].map(taste), h('span', 'tf-leer'));
    karte.append(opts.text ? h('p', {}, opts.text) : null, anzeige, tasten, meldung);
    zeichne();
    zeige(opts.titel || 'Zahlenschloss', karte);
    dlg.onkeydown = (e) => {
      if (/^[0-9]$/.test(e.key)) druecke(e.key);
      else if (e.key === 'Backspace') { eingabe = eingabe.slice(0, -1); zeichne(); }
    };
  }

  return { zeige, schliesse, fuehrerschein, tastenfeld, get offen() { return dlg.open; } };
}
