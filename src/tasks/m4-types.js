// Schritt-Typen für Sauna, Shake-Bar und Abschlussquiz: Zuordnen, Mehrfachwahl, Werbung prüfen, Rückblick.

import { h } from '../ui/dom.js';
import { checkMehrfach, mische, werbungSchritt, WERBUNG_START } from './check.js';

function zuordnen(host, step, api) {
  const gelöst = new Array(step.paare.length).fill(false);
  const zeilen = step.paare.map((p, i) => {
    const btns = step.optionen.map((o) => h('button', { type: 'button', class: 'option', onclick: () => pick(i, o, btns) }, o));
    // Längere Situationen (Feld titel): kurze Überschrift, darunter die Situation als normaler Text, dann die Antworten
    const kopf = p.titel ? [h('strong', {}, p.titel), h('p', 'situation-text', p.text)] : [h('strong', {}, p.text)];
    const row = h('div', 'probe situation', ...kopf, h('div', 'zeile', btns));
    return { row, btns };
  });
  // Die Situationen stehen bei jedem Start in anderer Reihenfolge (die Wertung hängt nur am Index der Situation)
  host.append(h('p', 'frage', step.auftrag), ...mische(zeilen.map((_, i) => i)).map((i) => zeilen[i].row));
  function setRichtig(i, btns) {
    gelöst[i] = true;
    btns.forEach((b) => {
      b.disabled = true;
      if (b.textContent.replace(/^[✓✗] /, '') === step.paare[i].richtig) { b.classList.add('richtig'); b.textContent = `✓ ${step.paare[i].richtig}`; }
    });
  }
  function pick(i, o, btns) {
    if (gelöst[i]) return;
    if (o === step.paare[i].richtig) {
      setRichtig(i, btns);
      if (gelöst.every(Boolean)) api.ok('Alle Situationen sind richtig zugeordnet.'); else api.say('Richtig. Weiter mit der nächsten Situation.');
    } else {
      const b = btns.find((x) => x.textContent === o);
      b.classList.add('falsch');
      b.textContent = `✗ ${o}`;
      b.disabled = true;
      api.fail(step.falsch || 'Das passt nicht. Überlege, was in dieser Situation mit dem Eiweiß passiert.');
    }
  }
  return {
    reveal() { zeilen.forEach((z, i) => { if (!gelöst[i]) setRichtig(i, z.btns); }); },
  };
}

function mehrfach(host, step, api) {
  const boxes = step.optionen.map((o, i) => h('input', { type: 'checkbox', id: `mf${i}` }));
  const check = h('button', { class: 'primary', type: 'button', onclick: onCheck }, 'Prüfen');
  host.append(
    h('p', 'frage', step.frage),
    h('ul', 'checkliste', step.optionen.map((o, i) => h('li', {}, h('label', {}, boxes[i], ` ${o}`)))),
    check,
  );
  function onCheck() {
    const chosen = boxes.map((b, i) => (b.checked ? i : -1)).filter((i) => i >= 0);
    const res = checkMehrfach(step, chosen);
    if (res.reason === 'anzahl') { api.say(`Wähle genau ${step.anzahl} aus.`); return; }
    if (res.reason === 'fehlt') { api.say('Das stimmt schon, aber es fehlt noch mindestens eine Ursache. Prüfe noch einmal.'); return; }
    if (!res.ok) { api.fail('Mindestens eine Antwort lässt Eiweiß nicht gerinnen. Prüfe noch einmal.'); return; }
    check.disabled = true;
    boxes.forEach((b) => { b.disabled = true; });
    api.ok(step.erklaerung);
  }
  return {
    reveal() {
      boxes.forEach((b, i) => { b.checked = (step.alle ? step.richtig : step.richtig.slice(0, step.anzahl)).includes(i); b.disabled = true; });
      check.disabled = true;
    },
  };
}

/** Blitz-Symbol für das Etikett (SVG, damit es auf allen Geräten gleich aussieht). */
function blitz() {
  const NS = 'http://www.w3.org/2000/svg';
  const s = document.createElementNS(NS, 'svg');
  s.setAttribute('viewBox', '0 0 24 32');
  s.setAttribute('class', 'dose-blitz');
  s.setAttribute('aria-hidden', 'true');
  const p = document.createElementNS(NS, 'path');
  p.setAttribute('d', 'M14 1 L3 18 H11 L8 31 L21 12 H13 Z');
  s.append(p);
  return s;
}

/** Erfundenes Dosen-Etikett (Abbildung zur Aufgabe): Marke, Sorte, Spruch, Zutaten, Aufkleber „frei erfunden“. Keine Zahlen, keine Körperideale. */
export function doseEtikett(w) {
  const pr = w.produkt;
  const [erst, ...rest] = pr.name.split(' ');
  return h('figure', { class: 'dose', 'aria-label': `Etikett der Dose ${pr.name} (frei erfunden). Zutaten: ${pr.zutaten.join(', ')}.` },
    h('span', 'dose-deckel'),
    h('span', 'dose-aufkleber', pr.aufkleber || 'frei erfunden'),
    h('div', 'dose-streifen', blitz(), h('strong', 'dose-marke', erst.toUpperCase()), rest.length ? h('span', 'dose-marke-2', rest.join(' ')) : null),
    pr.sorte ? h('p', 'dose-sorte', pr.sorte) : null,
    pr.slogan ? h('p', 'dose-slogan', pr.slogan) : null,
    h('p', 'dose-zutaten', h('b', {}, 'Zutaten: '), pr.zutaten.join(', '), '.'));
}

/**
 * Shake-Check: links die Dose, rechts immer nur eine Werbeaussage: Urteil → Begründung → Erklärung → „Nächste Aussage“.
 * Erledigte Aussagen sind nur als Punkt sichtbar. Ablauf als reine Logik: werbungSchritt in src/tasks/check.js.
 */
function werbung(host, step, api, ctx) {
  const w = ctx.werbung;
  let z = { ...WERBUNG_START, geloest: [] };
  const rechts = h('div', 'shake-aussage');
  host.append(h('div', 'shake', doseEtikett(w), rechts));

  function punkte() {
    return h('span', { class: 'shake-punkte', 'aria-hidden': 'true' }, w.aussagen.map((_, k) => h('span', `punkt${z.geloest.includes(k) ? ' fertig' : k === z.i ? ' jetzt' : ''}`, z.geloest.includes(k) ? '✓' : '')));
  }
  function knopf(text, klasse, onclick) { return h('button', { type: 'button', class: klasse, onclick }, text); }
  function zeichne(falsch = {}) {
    const a = w.aussagen[z.i];
    const teile = [
      h('p', 'shake-kopf', h('span', {}, `Aussage ${z.i + 1} von ${w.aussagen.length}`), punkte()),
      h('p', 'werbespruch', a.text),
    ];
    if (z.phase === 'urteil') {
      teile.push(h('p', 'frage', 'Stimmt die Aussage?'),
        h('div', 'zeile', w.urteile.map((u, ui) => {
          const b = knopf(falsch.urteil && falsch.urteil.includes(ui) ? `✗ ${u}` : u, `option${falsch.urteil && falsch.urteil.includes(ui) ? ' falsch' : ''}`, () => wahl('urteil', ui));
          if (falsch.urteil && falsch.urteil.includes(ui)) b.disabled = true;
          return b;
        })));
    } else {
      if (z.phase === 'grund') {
        // Urteil und nächste Frage in einer Zeile, damit auch lange Begründungen auf die Seite passen
        teile.push(h('p', 'frage', h('span', 'shake-erledigt', `✓ ${w.urteile[a.urteil]}. `), 'Welche Begründung passt?'),
          h('div', 'optionen', a.begruendungen.map((g, gi) => {
            const istFalsch = falsch.grund && falsch.grund.includes(gi);
            const b = knopf(istFalsch ? `✗ ${g}` : g, `option${istFalsch ? ' falsch' : ''}`, () => wahl('grund', gi));
            if (istFalsch) b.disabled = true;
            return b;
          })));
      } else {
        teile.push(h('p', 'shake-erledigt', `✓ ${w.urteile[a.urteil]}: ${a.begruendungen[a.richtig]}`), h('p', 'muster', a.erklaerung));
        if (z.i < w.aussagen.length - 1) teile.push(knopf('Nächste Aussage →', 'primary', () => { z = werbungSchritt(w, z, { art: 'weiter' }).z; falscheWahl = {}; zeichne(); api.say(''); }));
      }
    }
    rechts.replaceChildren(...teile);
  }
  let falscheWahl = {};
  function wahl(art, nr) {
    const r = werbungSchritt(w, z, { art, wahl: nr });
    if (!r.ok) {
      falscheWahl = { ...falscheWahl, [art]: [...(falscheWahl[art] || []), nr] };
      zeichne(falscheWahl);
      api.fail(art === 'urteil' ? 'Das Urteil passt noch nicht. Prüfe die Aussage mit den Karten im Spind.' : 'Diese Begründung passt nicht zur Aussage.');
      return;
    }
    z = r.z;
    falscheWahl = {};
    zeichne();
    if (r.alle) api.ok(`Alle ${w.aussagen.length} Aussagen sind geprüft.`);
    else if (z.phase === 'grund') api.say('Das Urteil passt. Jetzt die Begründung.');
    else api.say('Richtig.');
  }
  zeichne();
  return {
    reveal() {
      // Lösungsbeispiel: Die aktuelle Aussage wird aufgelöst, alle übrigen gelten als geprüft
      z = { i: z.i, phase: 'erklaert', geloest: w.aussagen.map((_, k) => k) };
      zeichne();
      const knopfWeiter = rechts.querySelector('.primary');
      if (knopfWeiter) knopfWeiter.remove();
    },
  };
}

function rueckblick(host, step, api, ctx) {
  const vorher = ctx.store.state.protokoll && ctx.store.state.protokoll.vorher;
  if (step.zwischen) {
    // Zwischenfazit nach „Bau und Faltung“: Die Eingangsfrage lässt sich jetzt erklären.
    host.append(
      h('p', 'frage', 'Zwischenstand: Am Anfang hast du überlegt, warum das Eiweiß im Eiklar in der Pfanne fest wird.'),
      h('p', 'frage', vorher ? `Deine Idee damals: „${vorher}“` : 'Du hattest damals keine Idee aufgeschrieben.'),
      h('div', 'muster',
        h('p', 'muster-text', h('strong', {}, 'Jetzt kannst du es erklären: '), 'Hitze löst die schwachen Verbindungen, die die Falten des Eiweißes halten. Die Kette entfaltet sich und verklumpt: Das Eiweiß gerinnt, und das ist nicht umkehrbar.')),
      h('button', { class: 'primary', type: 'button', onclick: () => api.ok('Gut. Jetzt weißt du, wie ein Eiweiß aufgebaut ist.') }, 'Weiter'),
    );
    return { reveal() {} };
  }
  host.append(
    h('p', 'frage', 'Zum Schluss ein Rückblick: Am Anfang hast du überlegt, warum das Eiweiß im Eiklar in der Pfanne fest wird.'),
    h('p', 'frage', vorher ? `Deine Idee damals: „${vorher}“` : 'Du hattest damals keine Idee aufgeschrieben.'),
    h('div', 'muster',
      h('p', 'muster-text', h('strong', {}, 'Das wissen wir jetzt: '), 'Das Eiweiß im Eiklar wird fest, weil Hitze die räumliche Struktur der Eiweiße verändert: Das Eiweiß wird denaturiert, man sagt auch, es stockt oder gerinnt. Die Aminosäuren bleiben, aber der Vorgang ist nicht umkehrbar.')),
    h('button', { class: 'primary', type: 'button', onclick: () => api.ok('Gut. Jetzt bekommst du dein Zertifikat.') }, 'Weiter zum Zertifikat'),
  );
  return { reveal() {} };
}

export const M4_TYPES = { zuordnen, mehrfach, werbung, rueckblick };
