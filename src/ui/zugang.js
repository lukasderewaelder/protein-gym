// Fenster für den Zugang: Laborführerschein, Labor-Ausweis, Zahlenschloss. Alles in einem eigenen Dialog (#zugang).

import { h, clear } from './dom.js';
import { tastaturFeld } from './tastatur.js';
import { startTest, aktuelle, antworte, weiter, istFertig } from '../state/fuehrerschein.js';
import { pruefeCode, radDrehen } from '../state/zugang.js';
import { svgEl } from '../tasks/molecule.js';

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
    dlg.onkeydown = null; // Tastatur-Eingaben des vorigen Schlosses enden mit dem Fenster
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
    // Vier Schlossarten: digital (Zahlenfeld), Drehschloss (Scheibe), Zahlenrädchen (Fahrradschloss) oder Schlüssel
    if (f.schloss === 'schluessel') {
      schluesselschloss({ titel, hat: store.hasFlag(`bz_${f.id}`), name: f.schluessel.name, beiRichtig: oeffnen });
    } else if (f.schloss === 'rad') {
      radschloss({
        titel, text: 'Das Fach hat ein Zahlenschloss wie ein Fahrradschloss. Stelle die drei Rädchen auf den Code und ziehe dann am Schloss.', stellen: 3, code: f.code,
        hinweis: 'Die Codes stehen auf Zetteln, die in den Räumen versteckt sind. Schau dich um.',
        beiRichtig: oeffnen,
      });
    } else if (f.schloss === 'dreh') {
      drehschloss({
        titel, text: 'Das Fach hat ein Drehschloss. Dreh die Scheibe auf die erste Zahl und lass sie einrasten, dann die zweite und die dritte.', stellen: 3, code: f.code,
        hinweis: 'Die Codes stehen auf Zetteln, die in den Räumen versteckt sind. Schau dich um.',
        beiRichtig: oeffnen,
      });
    } else {
      tastenfeld({
        titel, text: 'Das Fach hat ein Zahlenschloss. Gib den dreistelligen Code ein.', stellen: 3, code: f.code,
        hinweis: 'Die Codes stehen auf Zetteln, die in den Räumen versteckt sind. Schau dich um.',
        beiRichtig: oeffnen,
      });
    }
  }

  // ---------- Drehschloss ----------
  /**
   * Scheibe mit den Zahlen 0 bis 9: mit dem Finger drehen (oder mit den Pfeilknöpfen), die Zahl oben am Zeiger gilt.
   * „Einrasten“ übernimmt sie, nach `stellen` Zahlen wird geprüft. opts: { titel, text, stellen, code, hinweis, beiRichtig() }. Beliebig oft probieren.
   */
  function drehschloss(opts) {
    const stellen = opts.stellen || 3;
    const N = 10;
    const SCHRITT = 360 / N;
    let winkel = 0; // Drehung der Scheibe in Grad, im Uhrzeigersinn positiv
    let eingabe = '';
    let fehler = 0;
    let drag = null;
    const anzeige = h('div', { class: 'tf-anzeige', 'aria-live': 'polite', role: 'status' });
    const meldung = h('p', { class: 'zugang-fb', role: 'status' });
    const karte = h('div', 'zugang-karte tf dreh');
    const aktuelleZahl = () => ((Math.round(-winkel / SCHRITT) % N) + N) % N;

    const svg = svgEl('svg', { viewBox: '0 0 300 300', class: 'dreh-svg', role: 'img', 'aria-label': 'Drehscheibe mit den Zahlen 0 bis 9' });
    const scheibe = svgEl('g', { class: 'dreh-scheibe' });
    svg.append(svgEl('circle', { cx: 150, cy: 150, r: 144, fill: '#3b4a4f', stroke: '#0c1517', 'stroke-width': 4 }));
    scheibe.append(svgEl('circle', { cx: 150, cy: 150, r: 128, fill: '#e9eef0', stroke: '#5b6b70', 'stroke-width': 3 }));
    // Jede Zahl steht fest an ihrem Platz auf der Scheibe und dreht mit ihr (wie bei echten Schlössern). Position und Drehung kommen aus einem
    // einzigen SVG-Attribut um den Mittelpunkt (150, 150): keine Gegendrehung, kein transform-box, daher verrutscht nichts, auch nicht in Safari.
    for (let i = 0; i < N; i++) {
      const a = i * SCHRITT;
      const platz = svgEl('g', { class: 'dreh-platz', transform: `rotate(${a} 150 150)` });
      platz.append(svgEl('line', { x1: 150, y1: 24, x2: 150, y2: 32, stroke: '#5b6b70', 'stroke-width': 3 }));
      platz.append(svgEl('text', { x: 150, y: 52, 'text-anchor': 'middle', 'dominant-baseline': 'central', class: 'dreh-zahl' }, String(i)));
      // 6 und 9 bekommen einen Strich darunter, damit sie auch schräg oder kopfstehend nicht verwechselt werden
      if (i === 6 || i === 9) platz.append(svgEl('line', { x1: 143, y1: 69, x2: 157, y2: 69, stroke: '#1d1d1d', 'stroke-width': 3, 'stroke-linecap': 'round' }));
      scheibe.append(platz);
    }
    svg.append(scheibe);
    svg.append(svgEl('circle', { cx: 150, cy: 150, r: 52, fill: '#2b3b3f', stroke: '#0c1517', 'stroke-width': 4 }));
    const mitte = svgEl('text', { x: 150, y: 150, 'text-anchor': 'middle', 'dominant-baseline': 'central', class: 'dreh-mitte' }, '0');
    svg.append(mitte);
    svg.append(svgEl('polygon', { points: '136,2 164,2 150,34', fill: '#d9452b', stroke: '#0c1517', 'stroke-width': 3, 'stroke-linejoin': 'round' }));

    const zeichneScheibe = () => {
      scheibe.style.transform = `rotate(${winkel}deg)`;
      mitte.textContent = String(aktuelleZahl());
    };
    const zeichne = () => {
      clear(anzeige);
      for (let i = 0; i < stellen; i++) anzeige.append(h('span', { class: `tf-stelle${i < eingabe.length ? ' voll' : ''}` }, i < eingabe.length ? eingabe[i] : '•'));
    };
    const winkelVon = (e) => {
      const r = svg.getBoundingClientRect();
      return (Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180) / Math.PI;
    };
    svg.addEventListener('pointerdown', (e) => {
      drag = { letzter: winkelVon(e) };
      svg.setPointerCapture(e.pointerId);
      svg.classList.add('zieht');
    });
    svg.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const w = winkelVon(e);
      let d = w - drag.letzter;
      if (d > 180) d -= 360;
      if (d < -180) d += 360;
      winkel += d;
      drag.letzter = w;
      zeichneScheibe();
    });
    const loslassen = () => {
      if (!drag) return;
      drag = null;
      svg.classList.remove('zieht');
      winkel = Math.round(winkel / SCHRITT) * SCHRITT; // rastet auf einer Zahl ein
      zeichneScheibe();
    };
    svg.addEventListener('pointerup', loslassen);
    svg.addEventListener('pointercancel', loslassen);

    const dreh = (richtung) => { winkel += richtung * SCHRITT; zeichneScheibe(); };
    const pruefen = () => {
      if (pruefeCode(eingabe, opts.code)) {
        anzeige.classList.add('ok');
        meldung.className = 'zugang-fb gut';
        meldung.textContent = '✓ Das Schloss klickt. Offen!';
        karte.querySelectorAll('button').forEach((b) => { b.disabled = true; });
        setTimeout(() => { schliesse(); if (opts.beiRichtig) opts.beiRichtig(); }, 750);
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
    const einrasten = () => {
      if (eingabe.length >= stellen) return;
      eingabe += String(aktuelleZahl());
      meldung.textContent = '';
      meldung.className = 'zugang-fb';
      zeichne();
      if (eingabe.length === stellen) pruefen();
    };
    const zurueck = () => { eingabe = eingabe.slice(0, -1); zeichne(); };
    const knoepfe = h('div', 'dreh-knoepfe',
      h('button', { type: 'button', class: 'tf-taste', 'aria-label': 'Scheibe nach links drehen', onclick: () => dreh(-1) }, '↺'),
      h('button', { type: 'button', class: 'primary dreh-rast', onclick: einrasten }, 'Einrasten'),
      h('button', { type: 'button', class: 'tf-taste', 'aria-label': 'Scheibe nach rechts drehen', onclick: () => dreh(1) }, '↻'),
      h('button', { type: 'button', class: 'tf-taste', 'aria-label': 'Letzte Zahl löschen', onclick: zurueck }, '⌫'));
    karte.append(...[opts.text ? h('p', {}, opts.text) : null, anzeige, svg, knoepfe, meldung].filter(Boolean));
    zeichne();
    zeichneScheibe();
    zeige(opts.titel || 'Drehschloss', karte);
    dlg.onkeydown = (e) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); dreh(-1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); dreh(1); }
      else if (e.key === 'Enter') { e.preventDefault(); einrasten(); }
      else if (e.key === 'Backspace') zurueck();
    };
  }

  // ---------- Zahlenrädchen (Fahrradschloss) ----------
  /**
   * Drei Rädchen mit den Ziffern 0 bis 9: je Rädchen ein Knopf nach oben und unten, Wischen oder Pfeiltasten. „Schloss aufziehen“ prüft den Code.
   * opts: { titel, text, stellen, code, hinweis, beiRichtig() }. Beliebig oft probieren, die Rädchen bleiben stehen.
   */
  function radschloss(opts) {
    const stellen = opts.stellen || 3;
    const werte = new Array(stellen).fill(0);
    let fehler = 0;
    const meldung = h('p', { class: 'zugang-fb', role: 'status' });
    const karte = h('div', 'zugang-karte tf rad');
    const reihe = h('div', 'rad-reihe');
    const zeilen = [];
    const zeichne = (i) => {
      const z = zeilen[i];
      z.oben.textContent = String(radDrehen(werte[i], -1));
      z.mitte.textContent = String(werte[i]);
      z.unten.textContent = String(radDrehen(werte[i], 1));
      z.fenster.setAttribute('aria-valuenow', String(werte[i]));
    };
    const dreheRad = (i, schritt) => {
      werte[i] = radDrehen(werte[i], schritt);
      meldung.textContent = '';
      meldung.className = 'zugang-fb';
      zeichne(i);
    };
    const pruefen = () => {
      if (pruefeCode(werte.join(''), opts.code)) {
        reihe.classList.add('ok');
        meldung.className = 'zugang-fb gut';
        meldung.textContent = '✓ Das Schloss klickt. Offen!';
        karte.querySelectorAll('button').forEach((b) => { b.disabled = true; });
        setTimeout(() => { schliesse(); if (opts.beiRichtig) opts.beiRichtig(); }, 750);
      } else {
        fehler++;
        meldung.className = 'zugang-fb schlecht';
        meldung.textContent = fehler >= 3 && opts.hinweis ? `✗ Nicht richtig. ${opts.hinweis}` : '✗ Nicht richtig. Versuch es noch einmal.';
        karte.classList.remove('wackeln');
        void karte.offsetWidth;
        karte.classList.add('wackeln');
      }
    };
    for (let i = 0; i < stellen; i++) {
      const oben = h('span', 'rad-nachbar', '');
      const mitte = h('span', 'rad-ziffer', '');
      const unten = h('span', 'rad-nachbar', '');
      const fenster = h('div', { class: 'rad-fenster', tabindex: '0', role: 'spinbutton', 'aria-label': `Rädchen ${i + 1} von ${stellen}`, 'aria-valuemin': '0', 'aria-valuemax': '9' }, oben, mitte, unten);
      zeilen.push({ fenster, oben, mitte, unten });
      // Wischen: alle 30 Pixel ein Schritt, nach oben gewischt zählt hoch
      let start = null;
      fenster.addEventListener('pointerdown', (e) => { start = e.clientY; fenster.setPointerCapture(e.pointerId); });
      fenster.addEventListener('pointermove', (e) => {
        if (start === null) return;
        while (start - e.clientY >= 30) { dreheRad(i, 1); start -= 30; }
        while (e.clientY - start >= 30) { dreheRad(i, -1); start += 30; }
      });
      const ende = () => { start = null; };
      fenster.addEventListener('pointerup', ende);
      fenster.addEventListener('pointercancel', ende);
      fenster.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowUp') { e.preventDefault(); dreheRad(i, 1); }
        else if (e.key === 'ArrowDown') { e.preventDefault(); dreheRad(i, -1); }
        else if (/^[0-9]$/.test(e.key)) { werte[i] = Number(e.key); zeichne(i); }
        else if (e.key === 'Enter') { e.preventDefault(); pruefen(); }
      });
      reihe.append(h('div', 'rad-spalte',
        h('button', { type: 'button', class: 'tf-taste', 'aria-label': `Rädchen ${i + 1} hochdrehen`, onclick: () => dreheRad(i, 1) }, '▲'),
        fenster,
        h('button', { type: 'button', class: 'tf-taste', 'aria-label': `Rädchen ${i + 1} runterdrehen`, onclick: () => dreheRad(i, -1) }, '▼')));
      zeichne(i);
    }
    karte.append(...[opts.text ? h('p', {}, opts.text) : null, reihe, h('button', { type: 'button', class: 'primary dreh-rast', onclick: pruefen }, 'Schloss aufziehen'), meldung].filter(Boolean));
    zeige(opts.titel || 'Zahlenschloss', karte);
  }

  // ---------- Schlüsselschloss ----------
  /** Das Fach öffnet nur mit dem passenden Schlüssel aus der Tasche. opts: { titel, hat, name, beiRichtig() }. */
  function schluesselschloss(opts) {
    const svg = svgEl('svg', { viewBox: '0 0 300 170', class: 'schluessel-svg', role: 'img', 'aria-label': 'Schloss mit Schlüsselloch' });
    svg.append(
      svgEl('circle', { cx: 190, cy: 85, r: 62, fill: '#8a959a', stroke: '#0c1517', 'stroke-width': 4 }),
      svgEl('circle', { cx: 190, cy: 85, r: 46, fill: '#c9d3d6', stroke: '#5b6b70', 'stroke-width': 3 }),
      svgEl('circle', { cx: 190, cy: 76, r: 9, fill: '#0c1517' }),
      svgEl('polygon', { points: '183,80 197,80 200,108 180,108', fill: '#0c1517' }));
    const key = svgEl('g', { class: 'schluessel-key' });
    key.append(
      svgEl('rect', { x: 70, y: 80, width: 120, height: 10, rx: 3, fill: '#e8b73a', stroke: '#6b4e0a', 'stroke-width': 2 }),
      svgEl('rect', { x: 150, y: 90, width: 9, height: 14, fill: '#e8b73a', stroke: '#6b4e0a', 'stroke-width': 2 }),
      svgEl('rect', { x: 166, y: 90, width: 9, height: 10, fill: '#e8b73a', stroke: '#6b4e0a', 'stroke-width': 2 }),
      svgEl('circle', { cx: 52, cy: 85, r: 24, fill: '#e8b73a', stroke: '#6b4e0a', 'stroke-width': 3 }),
      svgEl('circle', { cx: 52, cy: 85, r: 9, fill: '#f6f3e8', stroke: '#6b4e0a', 'stroke-width': 2 }));
    if (opts.hat) svg.append(key);
    const meldung = h('p', { class: 'zugang-fb', role: 'status' });
    const karte = h('div', 'zugang-karte schluessel');
    if (!opts.hat) {
      karte.append(
        h('p', {}, 'Das Fach ist abgeschlossen. Hier passt nur ein Schlüssel, ein Zahlencode hilft nicht.'),
        svg,
        h('p', 'hint', 'Such in den Räumen nach einem kleinen Schlüssel. Wer hinschaut, findet ihn an einem unauffälligen Ort.'),
        h('button', { class: 'primary', type: 'button', onclick: () => schliesse() }, 'Schließen'));
      zeige(opts.titel || 'Schlüsselschloss', karte);
      return;
    }
    const umdrehen = h('button', {
      class: 'primary', type: 'button',
      onclick: () => {
        umdrehen.disabled = true;
        const kurz = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        key.classList.add('steckt');
        setTimeout(() => key.classList.add('gedreht'), kurz ? 0 : 550);
        setTimeout(() => {
          meldung.className = 'zugang-fb gut';
          meldung.textContent = '✓ Der Schlüssel dreht sich. Offen!';
        }, kurz ? 0 : 950);
        setTimeout(() => { schliesse(); if (opts.beiRichtig) opts.beiRichtig(); }, kurz ? 400 : 1500);
      },
    }, 'Schlüssel ins Schloss stecken und drehen');
    karte.append(h('p', {}, `Du hast ${opts.name} in der Tasche. Passt er?`), svg, umdrehen, meldung);
    zeige(opts.titel || 'Schlüsselschloss', karte);
  }

  /** Ein Schlüssel wurde gefunden (Versteck in einem Raum). */
  function schluesselFund(f, neu) {
    zeige('Schlüssel gefunden', h('div', 'zugang-karte',
      h('p', 'zugang-gut', `🔑 ${f.schluessel.name}`),
      h('p', {}, f.schluessel.fundort),
      h('p', 'hint', neu ? `Er liegt jetzt in deiner Tasche. Zu welchem Schließfach im Empfang passt er? Auf dem Anhänger steht die Nummer.` : 'Er liegt in deiner Tasche.'),
      h('button', { class: 'primary', type: 'button', onclick: () => schliesse() }, 'Schließen')));
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

  // ---------- Einrichtung für die Lehrkraft ----------
  /**
   * Klassenwort der Lehrkraft eingeben, damit dieses Tablet die zeitbasierten Codes nach dem Versuch prüfen kann.
   * opts: { eingerichtet, hatPruefwert, pruefen(wort) -> Promise<boolean> (speichert bei Erfolg den Schlüssel), entfernen() }.
   */
  function klassenwortFenster(opts) {
    const meldung = h('p', { class: 'zugang-fb', role: 'status' });
    const karte = h('div', 'zugang-karte');
    const status = h('p', { class: opts.eingerichtet ? 'zugang-gut' : 'hint' }, opts.eingerichtet ? '✓ Dieses Tablet ist eingerichtet.' : 'Dieses Tablet ist noch nicht eingerichtet.');
    const wort = h('input', { class: 'name-input', type: 'password', autocomplete: 'off', spellcheck: 'false', 'aria-label': 'Klassenwort', placeholder: 'Klassenwort' });
    const speichern = async () => {
      meldung.className = 'zugang-fb';
      meldung.textContent = 'Prüfe …';
      const ok = await opts.pruefen(wort.value);
      wort.value = '';
      meldung.className = ok ? 'zugang-fb gut' : 'zugang-fb schlecht';
      meldung.textContent = ok ? '✓ Eingerichtet. Die Codes nach dem Versuch werden jetzt geprüft.' : '✗ Das Klassenwort stimmt nicht.';
      if (ok) { status.className = 'zugang-gut'; status.textContent = '✓ Dieses Tablet ist eingerichtet.'; }
    };
    tastaturFeld(wort, 'text');
    wort.addEventListener('keydown', (e) => { if (e.key === 'Enter') speichern(); });
    karte.append(
      h('p', {}, 'Nur für die Lehrkraft: Gib das Klassenwort einmal ein. Danach nimmt dieses Tablet die Codes an, die deine Lehrkraft nach dem Versuch nennt.'),
      status,
      opts.hatPruefwert ? wort : h('p', 'hint', 'Es ist noch kein Klassenwort festgelegt (Lehrkraft-Seite, Abschnitt „Neues Klassenwort“).'),
      meldung,
      h('div', 'zugang-knoepfe',
        opts.hatPruefwert ? h('button', { class: 'primary', type: 'button', onclick: speichern }, 'Einrichten') : null,
        h('button', { type: 'button', onclick: () => { opts.entfernen(); status.className = 'hint'; status.textContent = 'Einrichtung entfernt.'; meldung.textContent = ''; } }, 'Einrichtung entfernen'),
        h('button', { type: 'button', onclick: () => schliesse() }, 'Schließen')));
    zeige('Für die Lehrkraft', karte);
  }

  // ---------- Hilfe von Markus ----------
  /** Zwei Stufen: erst grob, dann auf Knopfdruck konkret. Keine automatischen Hinweise. */
  function hilfe({ titel, knopf, schritt, beiStufe3, weg }) {
    const karte = h('div', 'zugang-karte');
    // „Dein Weg“: die Reihenfolge des Spiels mit Haken und der aktuellen Etappe
    const wegListe = weg ? h('ol', { class: 'weg', 'aria-label': 'Dein Weg durch das Probetraining' },
      weg.map((s) => h('li', { class: `weg-${s.status}`, 'aria-current': s.status === 'jetzt' ? 'step' : null },
        h('span', 'weg-marke', s.status === 'fertig' ? '✓' : s.status === 'jetzt' ? '▶' : '·'), ` ${s.name}`))) : null;
    const stufe2 = h('p', 'hilfe-konkret', schritt.konkret);
    stufe2.hidden = true;
    const s3 = schritt.stufe3;
    const stufe3 = s3 ? h('p', 'hilfe-konkret', s3.text) : null;
    if (stufe3) stufe3.hidden = true;
    const mehr3 = s3 ? h('button', { type: 'button', hidden: true, onclick: () => { mehr3.hidden = true; stufe3.hidden = false; if (beiStufe3) beiStufe3(s3.aktion); } }, s3.knopf || 'Zeig mir die Stelle') : null;
    const mehr = h('button', { type: 'button', onclick: () => { stufe2.hidden = false; mehr.hidden = true; if (mehr3) mehr3.hidden = false; } }, knopf);
    karte.append(
      ...(wegListe ? [wegListe] : []),
      h('p', 'zugang-sprecher', h('strong', {}, 'Markus'), h('span', 'chip chip-grau', schritt.ort)),
      h('p', {}, schritt.grob),
      stufe2,
      ...(stufe3 ? [stufe3] : []),
      h('div', 'zugang-knoepfe', mehr, ...(mehr3 ? [mehr3] : []), h('button', { class: 'primary', type: 'button', onclick: () => schliesse() }, 'Danke')));
    zeige(titel, karte);
  }

  /** Vergrößerte Ansicht des Saunazettels. */
  function codeGross(code, neu) {
    zeige('Zugangscode der Sauna', h('div', 'zugang-karte',
      aufkleber(code, true),
      h('p', 'hint', 'Der Zettel hängt rechts oben an deiner Pinnwand.'),
      h('button', { class: 'primary', type: 'button', onclick: () => schliesse() }, 'Schließen')));
  }

  return { zeige, schliesse, fuehrerschein, tastenfeld, klassenwortFenster, drehschloss, radschloss, schluesselschloss, schluesselFund, fach, hilfe, codeGross, get offen() { return dlg.open; } };
}
