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

/** Aufkleber mit dem Saunacode, wie er auf der Innenseite der Spindtür klebt. gross = vergrößerte, gut lesbare Ansicht. */
export function aufkleber(code, gross = false) {
  return h('div', { class: `aufkleber${gross ? ' gross' : ''}`, role: 'img', 'aria-label': `Aufkleber: Zugangscode der Sauna ${String(code).split('').join(' ')}` },
    h('small', {}, 'ZUGANGSCODE · SAUNA'),
    h('span', 'aufkleber-zahl', code));
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

  // ---------- Fragentest (Laborführerschein und Zusatzfragen der Schließfächer) ----------
  /** opts: { titel, einleitung, fragen, letzterKnopf, beiFertig() }. Hinweis nach dem 1. Fehler, Hilfe ab dem 2., kein Neustart. */
  function fragenTest({ titel, einleitung, fragen, letzterKnopf = 'Fertig', beiFertig }) {
    const t = startTest(fragen);

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
        ? h('button', { class: 'primary', type: 'button', onclick: () => { weiter(t); if (istFertig(t)) beiFertig(); else frage(); } }, t.i >= t.fragen.length - 1 ? letzterKnopf : 'Weiter →')
        : null;
      zeige(titel,
        h('div', 'zugang-karte',
          h('p', 'zugang-schritt', `Frage ${t.i + 1} von ${t.fragen.length}`),
          h('p', 'zugang-frage', f.frage),
          h('div', 'zugang-optionen', knoepfe),
          fb,
          fuss));
    }

    zeige(titel, h('div', 'zugang-karte', h('p', {}, einleitung), h('button', { class: 'primary', type: 'button', onclick: () => frage() }, 'Los')));
  }

  // ---------- Laborführerschein ----------
  function fuehrerschein({ beiBestanden }) {
    const F = daten.fuehrerschein;
    fragenTest({
      titel: F.titel, einleitung: F.einleitung, fragen: F.fragen, letzterKnopf: 'Ausweis abholen',
      beiFertig: () => {
        store.setFlag('lf_bestanden');
        store.setFlag('item_ausweis');
        zeige(F.titel,
          h('div', 'zugang-karte',
            h('p', 'zugang-gut', `✓ ${F.bestanden}`),
            ausweisKarte(store.state.names),
            h('p', 'hint', 'Du findest den Ausweis in deiner Tasche. Halte ihn an das Lesegerät neben der Labortür.'),
            h('button', { class: 'primary', type: 'button', onclick: () => { schliesse(); } }, 'Ausweis einstecken')));
        beiSchliessen = beiBestanden || null;
      },
    });
  }

  // ---------- Bonus-Schließfach ----------
  /** Fach antippen: erst Zahlenschloss (3 Ziffern), dann Inhalt (Spaß oder freiwillige Zusatzfrage). Ist es schon offen, zeigt es nur den Inhalt. */
  function fach(f) {
    const titel = `Schließfach ${f.id}`;
    // Das Schluss-Extra erscheint nur, wenn alle sechs Bonus-Flags gesetzt sind (das eigene wird beim Öffnen gesetzt, bevor das Fenster erscheint)
    const alleFaecherOffen = () => [1, 2, 3, 4, 5, 6].every((n) => store.hasFlag(`bonus_${n}`));
    const belohnung = (extra) => zeige(titel,
      h('div', 'zugang-karte',
        h('p', 'zugang-gut', `${f.emoji} ${f.name}`),
        h('p', {}, f.text),
        f.extra ? h('p', 'hint', f.extra) : null,
        f.extraWennAlle && alleFaecherOffen() ? h('p', 'zugang-gut', f.extraWennAlle) : null,
        extra,
        h('p', 'hint', 'Der Gegenstand liegt jetzt in deiner Tasche. Bonus-Fächer sind freiwillig und zählen nirgends mit.'),
        h('button', { class: 'primary', type: 'button', onclick: () => schliesse() }, 'Schließen')));
    const oeffnen = () => {
      if (f.typ === 'zusatz' && !store.hasFlag(f.flag)) {
        fragenTest({
          titel: `${titel} · Zusatzfrage`, einleitung: 'Freiwillige Zusatzfrage zum Fach. Schaffst du sie, gehört der Inhalt dir.', fragen: f.fragen, letzterKnopf: 'Inhalt holen',
          beiFertig: () => { store.setFlag(f.flag); belohnung(null); },
        });
        return;
      }
      store.setFlag(f.flag);
      belohnung(null);
    };
    if (store.hasFlag(f.flag)) { oeffnen(); return; }
    tastenfeld({
      titel, text: 'Das Fach hat ein Zahlenschloss. Gib den dreistelligen Code ein.', stellen: 3, code: f.code,
      hinweis: 'Die Codes stehen auf Zetteln, die in den Räumen versteckt sind. Schau dich um.',
      beiRichtig: oeffnen,
    });
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
        meldung.textContent = `✓ ${opts.richtigText || 'Richtig!'}`;
        karte.querySelectorAll('button').forEach((b) => { b.disabled = true; });
        setTimeout(() => { schliesse(); if (opts.beiRichtig) opts.beiRichtig(); }, opts.richtigText ? 1000 : 650);
      } else {
        fehler++;
        meldung.className = 'zugang-fb schlecht';
        meldung.textContent = opts.falschText ? `✗ ${opts.falschText}` : (fehler >= 3 && opts.hinweis ? `✗ Nicht richtig. ${opts.hinweis}` : '✗ Nicht richtig. Versuch es noch einmal.');
        eingabe = '';
        karte.classList.remove('wackeln');
        void karte.offsetWidth;
        karte.classList.add('wackeln');
        zeichne();
      }
    };
    const taste = (z) => h('button', { type: 'button', class: 'tf-taste', 'aria-label': z === '⌫' ? 'Letzte Ziffer löschen' : `Ziffer ${z}`, onclick: () => (z === '⌫' ? ((eingabe = eingabe.slice(0, -1)), zeichne()) : druecke(z)) }, z);
    const tasten = h('div', 'tf-tasten', ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0'].map(taste), h('span', 'tf-leer'));
    karte.append(...[opts.text ? h('p', {}, opts.text) : null, anzeige, tasten, meldung].filter(Boolean));
    zeichne();
    zeige(opts.titel || 'Zahlenschloss', karte);
    dlg.onkeydown = (e) => {
      if (/^[0-9]$/.test(e.key)) druecke(e.key);
      else if (e.key === 'Backspace') { eingabe = eingabe.slice(0, -1); zeichne(); }
    };
  }

  // ---------- Hilfe von Markus ----------
  /** Zwei Stufen: erst grob, dann auf Knopfdruck konkret. Keine automatischen Hinweise. */
  function hilfe({ titel, knopf, schritt, beiStufe3 }) {
    const karte = h('div', 'zugang-karte');
    const stufe2 = h('p', 'hilfe-konkret', schritt.konkret);
    stufe2.hidden = true;
    const s3 = schritt.stufe3;
    const stufe3 = s3 ? h('p', 'hilfe-konkret', s3.text) : null;
    if (stufe3) stufe3.hidden = true;
    const mehr3 = s3 ? h('button', { type: 'button', hidden: true, onclick: () => { mehr3.hidden = true; stufe3.hidden = false; if (beiStufe3) beiStufe3(s3.aktion); } }, s3.knopf || 'Zeig mir die Stelle') : null;
    const mehr = h('button', { type: 'button', onclick: () => { stufe2.hidden = false; mehr.hidden = true; if (mehr3) mehr3.hidden = false; } }, knopf);
    karte.append(
      h('p', 'zugang-sprecher', h('strong', {}, 'Markus'), h('span', 'chip chip-grau', schritt.ort)),
      h('p', {}, schritt.grob),
      stufe2,
      ...(stufe3 ? [stufe3] : []),
      h('div', 'zugang-knoepfe', mehr, ...(mehr3 ? [mehr3] : []), h('button', { class: 'primary', type: 'button', onclick: () => schliesse() }, 'Danke')));
    zeige(titel, karte);
  }

  /** Vergrößerte Ansicht des Aufklebers. Nach dem Ansehen ist der Code als Notiz an der Pinnwand gespeichert. */
  function codeGross(code, neu) {
    zeige('Zugangscode der Sauna', h('div', 'zugang-karte',
      aufkleber(code, true),
      h('p', 'hint', neu ? 'Der Code ist jetzt als Notiz an deiner Pinnwand gespeichert. Du findest ihn dort jederzeit wieder.' : 'Der Code hängt als Notiz an deiner Pinnwand.'),
      h('p', 'hint', 'Das ist der Sicherheitscode der Saunatür und nicht der Code der Lehrkraft für den Versuch im Labor.'),
      h('button', { class: 'primary', type: 'button', onclick: () => schliesse() }, 'Schließen')));
  }

  return { zeige, schliesse, fuehrerschein, tastenfeld, fach, hilfe, codeGross, get offen() { return dlg.open; } };
}
