// Schritt-Typen für das Labor (a4, a7): Vermutung, Planung, Versuch mit Code der Lehrkraft, Beobachtung. „export“ ist noch da, wird aber nicht mehr eingesetzt (das Protokoll kommt von der Lehrkraft).
// „simulation“ (virtueller Versuch) ist noch da, wird aber nicht mehr eingesetzt: der Versuch wird bei der Lehrkraft in echt gemacht.
// Das Tablet bereitet den echten Versuch vor und wertet ihn aus. Beobachtungen werden nie als „falsch" bewertet,
// die Erwartung des Skripts dient nur zum Vergleich.

import { h } from '../ui/dom.js';
import { tastaturFeld } from '../ui/tastatur.js';
import { svgEl } from './molecule.js';
import { beobachtungPasst, reihenfolge, alleProben, protokollText, probenName, stationenVon, notizSchluessel } from './check.js';
import { pruefeCodeMitSchluesseln, schrittFrei, schrittMerken, istNotfallCode } from '../state/lehrcode.js';
import { ladeSchluessel } from '../state/klassenwort.js';
import { aktivierungOk, digitalFrei, digitalFreischalten } from '../state/digital.js';
import { digitalVersuch } from './digital-versuch.js';

function protokoll(ctx) {
  if (!ctx.store.state.protokoll) ctx.store.state.protokoll = {};
  return ctx.store.state.protokoll;
}

function vermutung(host, step, api, ctx) {
  const p = protokoll(ctx);
  p.vermutung = p.vermutung || {};
  const pressed = [];
  const alle = alleProben(ctx.versuch, step.stationen);
  const fertig = () => alle.every((pr) => p.vermutung[pr.id] && p.vermutung[pr.id].wahl);
  const pruefe = () => { if (fertig()) api.ok('Deine Vermutungen sind im Protokoll gespeichert.'); };
  host.append(h('p', 'frage', 'Was passiert in den Proben? Tippe pro Probe deine Vermutung an. Das „Warum“ ist freiwillig, hilft dir aber später beim Deuten.'));
  for (const st of stationenVon(ctx.versuch, step.stationen)) {
    host.append(h('h3', {}, `${st.name}: ${st.titel}`));
    for (const pr of st.proben) {
      const cur = p.vermutung[pr.id] = p.vermutung[pr.id] || { wahl: '', warum: '' };
      const btns = st.vermutungOptionen.map((o) => {
        const b = h('button', {
          type: 'button', class: 'option', 'aria-pressed': String(cur.wahl === o),
          onclick: () => {
            cur.wahl = o;
            ctx.store.save();
            btns.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
            pruefe();
          },
        }, o);
        return b;
      });
      pressed.push(btns);
      const warum = h('input', { type: 'text', class: 'warum', maxlength: '120', placeholder: 'Warum? (freiwillig)', 'aria-label': `Begründung für Probe ${pr.nr}`, value: cur.warum });
      tastaturFeld(warum, 'text');
      warum.addEventListener('input', () => { cur.warum = warum.value; ctx.store.save(); });
      host.append(h('div', 'probe', h('strong', {}, `Probe ${pr.nr}: ${probenName(pr)}`), h('div', 'zeile', btns), warum));
    }
  }
  pruefe();
  return { reveal() {} };
}

function anleitung(host, step, api) {
  const boxes = step.schritte.map((s, i) => h('input', { type: 'checkbox', id: `as${i}`, onchange: pruefe }));
  function pruefe() { if (boxes.every((b) => b.checked)) api.ok('Alle Schritte gelesen. Jetzt geht es zum echten Versuch.'); }
  host.append(
    h('p', 'frage', step.auftrag),
    h('ul', 'checkliste', step.schritte.map((s, i) => h('li', {}, h('label', {}, boxes[i], ` ${i + 1}. ${s}`)))),
  );
  return { reveal() { boxes.forEach((b) => { b.checked = true; }); } };
}

function reihenfolgeStep(host, step, api) {
  const chosen = [];
  const order = step.anzeige.map((i) => step.korrekt[i]);
  const list = h('ol', 'gewaehlt');
  const btns = order.map((text) => h('button', { type: 'button', class: 'option', onclick: () => pick(text, btnOf(text)) }, text));
  const btnOf = (t) => btns[order.indexOf(t)];
  host.append(h('p', 'frage', step.auftrag), h('p', 'frage', 'Deine Reihenfolge:'), list, h('div', 'optionen', btns));
  function pick(text, btn) {
    const next = [...chosen, text];
    const r = reihenfolge(step.korrekt, next, step.gleichwertig);
    if (!r.prefixOk) { api.fail('Das ist noch nicht dran. Welcher Schritt kommt als Nächstes?'); return; }
    chosen.push(text);
    btn.disabled = true;
    list.append(h('li', {}, text));
    if (r.fertig) api.ok('Die Reihenfolge stimmt.'); else api.say('Richtig. Weiter mit dem nächsten Schritt.');
  }
  return {
    reveal() {
      step.korrekt.forEach((t) => {
        if (chosen.includes(t)) return;
        chosen.push(t);
        btnOf(t).disabled = true;
        list.append(h('li', {}, t));
      });
    },
  };
}

function tubeSvg(pr, done, start) {
  const svg = svgEl('svg', { viewBox: '0 0 90 190', class: 'tube', role: 'img', 'aria-label': `Reagenzglas ${pr.nr}` });
  const color = done ? pr.sim.farbe : start;
  svg.append(svgEl('rect', { x: 22, y: 70, width: 46, height: 80, fill: color }));
  svg.append(svgEl('circle', { cx: 45, cy: 150, r: 23, fill: color }));
  if (done && pr.sim.trueb) svg.append(svgEl('rect', { x: 22, y: 70, width: 46, height: 80, fill: '#fff', opacity: pr.sim.trueb * 0.45 }));
  if (done) {
    for (let i = 0; i < pr.sim.flocken; i++) {
      const cx = 30 + ((i * 17) % 30);
      const cy = 82 + ((i * 29) % 62);
      svg.append(svgEl('circle', { cx, cy, r: 4 + (i % 3), fill: '#fffbe8', opacity: 0.9 }));
    }
  }
  svg.append(svgEl('path', { d: 'M20 14 V150 a25 25 0 0 0 50 0 V14', fill: 'none', stroke: '#c9d6d8', 'stroke-width': 4, 'stroke-linecap': 'round' }));
  svg.append(svgEl('line', { x1: 14, y1: 14, x2: 76, y2: 14, stroke: '#c9d6d8', 'stroke-width': 4, 'stroke-linecap': 'round' }));
  return svg;
}

function simulation(host, step, api, ctx) {
  const v = ctx.versuch;
  const done = new Set();
  const racks = [
    { st: v.stationA, start: '#dfeef4', tasteA: 'Einwirken lassen' },
    { st: v.lieferung, start: '#e6f1f5', tasteA: 'Nachweis machen' },
  ];
  const area = h('div', 'rack');
  let cur = 0;
  const tabs = h('div', 'task-levels', racks.map((r, i) => h('button', { type: 'button', onclick: () => { cur = i; render(); } }, r.st.name)));
  host.append(
    h('p', 'frage', 'Probiere den Versuch virtuell aus. Das ist Vorbereitung (oder Ersatz, falls der Versuch ausfällt). Die Simulation zeigt die Erwartung aus dem Skript, dein echter Versuch kann abweichen.'),
    tabs, area,
    h('button', { class: 'primary', type: 'button', onclick: () => api.ok('Gut vorbereitet. Jetzt geht es an den echten Versuch.') }, 'Simulation beenden oder überspringen'),
  );
  function render() {
    [...tabs.children].forEach((b, i) => b.setAttribute('aria-pressed', String(i === cur)));
    const r = racks[cur];
    area.replaceChildren(...r.st.proben.map((pr) => {
      const on = done.has(pr.id);
      return h('div', 'tube-karte',
        tubeSvg(pr, on, r.start),
        h('strong', {}, `Probe ${pr.nr}`),
        h('span', {}, probenName(pr)),
        h('button', { type: 'button', onclick: () => { if (on) done.delete(pr.id); else done.add(pr.id); render(); } }, on ? 'Zurücksetzen' : r.tasteA),
        h('span', { class: 'tube-ergebnis', 'aria-live': 'polite' }, on ? `Skript: ${pr.erwartung}` : ''),
      );
    }));
  }
  render();
  return { reveal() {} };
}

/** Versuch bei der Lehrkraft: Gläser, drei Sicherheitspunkte, danach der Code der Lehrkraft (Texte in data/versuch.json). */
function versuch(host, step, api, ctx) {
  const v = ctx.versuch;
  const t = v.versuchSchritt;
  const gewaehlt = stationenVon(v, step.stationen);
  const stationen = gewaehlt.map((st) => h('div', 'probe',
    h('strong', {}, `${st.name}: ${st.titel}`),
    h('p', 'hint', st.regel || ''),
    h('ul', {}, st.proben.map((pr) => h('li', {}, `Glas ${pr.nr}: ${probenName(pr)}`)))));
  // Die allgemeine Entsorgungsregel (letzter Punkt) ersetzt die Station durch ihre eigene
  const entsorgung = gewaehlt.map((st) => st.entsorgung).filter(Boolean);
  const sicherheit = entsorgung.length ? [...v.sicherheit.slice(0, -1), ...entsorgung] : v.sicherheit;
  const zeit = gewaehlt.map((st) => [t.zeit.replace('{zeit}', st.zeit), st.zeitHinweis].filter(Boolean).join(' ')).join(' ');
  const cfg = v.codeZeit || {};
  const versuchId = gewaehlt[0].id;
  const input = h('input', { class: 'code-eingabe', type: 'text', autocomplete: 'off', maxlength: '10', 'aria-label': 'Code deiner Lehrkraft', placeholder: t.codePlatzhalter });
  // Der Code wechselt alle 30 Sekunden (Klassenwort der Lehrkraft, src/state/lehrcode.js). Falsche, abgelaufene oder schon benutzte Codes
  // zählen nicht als Fehler (api.say), damit das Lösungsbeispiel den Code nie überspringt.
  const pruefe = async () => {
    // Notfallcode (heutiges Datum): geht immer, ohne Einrichtung, beliebig oft
    if (istNotfallCode(input.value, Date.now())) { input.disabled = true; api.ok(t.codeRichtig); return; }
    // Schlüssel: das eingerichtete Klassenwort und der Standardschlüssel (Klassenwort „Proteine“, ohne Einrichtung); fehlt beides, ist das Tablet nicht freigeschaltet
    const schluessel = [ladeSchluessel(globalThis.localStorage), (v.klassenwort || {}).standardSchluessel].filter(Boolean);
    if (!schluessel.length) { api.say(`✗ ${t.codeNichtEingerichtet}`); return; }
    const schritt = await pruefeCodeMitSchluesseln(schluessel, versuchId, input.value, Date.now(), cfg);
    if (schritt === null) { api.say(`✗ ${t.codeFalsch}`); return; }
    const state = ctx.store.state;
    if (!schrittFrei(state.codeBenutzt, versuchId, schritt)) { api.say(`✗ ${t.codeBenutzt}`); return; }
    state.codeBenutzt = schrittMerken(state.codeBenutzt, versuchId, schritt);
    ctx.store.save();
    input.disabled = true;
    api.ok(t.codeRichtig);
  };
  // Zahlenfeld im Spiel statt Systemtastatur (das Vollbild bleibt); Ziffern und Punkt für den Notfallcode (Datum)
  tastaturFeld(input, 'ziffern');
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') pruefe(); });
  // Live (Code der Lehrkraft nach dem echten Versuch) oder digital (Aktivierungscode, Versuch am Bildschirm, zum Beispiel zu Hause).
  // Die Blöcke stehen direkt im Schrittkörper, damit sich der Inhalt auf Seiten verteilen lässt; beim Wechsel wird der Körper neu gesetzt.
  // Ausdrücklicher Ablauf der Station (Protokoll abholen, ausrüsten, Material am Lehrertisch, Versuch, aufräumen, Code), ersetzt Einleitung
  // und Sicherheitsliste. Jeder Punkt ist ein eigener Block, damit sich der Schritt auf Seiten verteilen lässt.
  const ablauf = gewaehlt.flatMap((st) => (st.ablauf || []).map((s) => s.replaceAll('{entsorgung}', st.entsorgung || '')));
  const kopf = ablauf.length
    ? [h('p', 'frage', t.ablaufTitel || t.einleitung), ...ablauf.map((s, i) => h('div', `ablauf-schritt${i === 0 ? ' erst' : ''}`, h('span', 'ablauf-nr', String(i + 1)), h('p', {}, s)))]
    : [h('p', 'frage', t.einleitung)];
  const sicherheitsBlock = ablauf.length ? [] : [h('h3', {}, t.sicherheitTitel), h('ul', {}, sicherheit.map((s) => h('li', {}, s)))];
  const liveKnoten = [
    ...kopf,
    ...stationen,
    ...sicherheitsBlock,
    h('p', 'hint', zeit),
    h('div', 'probe', h('p', {}, t.codeFrage), h('div', 'zeile', input, h('button', { class: 'primary', type: 'button', onclick: pruefe }, t.codeKnopf))),
  ];
  const td = t.digital;
  const station = gewaehlt[0];
  let nachrichtComment = null;
  // Nach einer Änderung im Körper das Blättern neu messen lassen (ein Kommentarknoten löst die Beobachtung des Körpers aus)
  const neuMessen = () => { if (nachrichtComment) nachrichtComment.remove(); nachrichtComment = host.ownerDocument.createComment('neu'); host.append(nachrichtComment); };
  const modusLive = h('button', { type: 'button', 'aria-pressed': 'true' }, td.modusLive);
  const modusDigital = h('button', { type: 'button', 'aria-pressed': 'false' }, td.modusDigital);
  let digital = false;
  let lab = null;
  const formular = () => {
    const code = h('input', { class: 'code-eingabe', type: 'text', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', maxlength: '30', 'aria-label': td.platzhalter, placeholder: td.platzhalter });
    const frei = async () => {
      if (!(await aktivierungOk(code.value, (v.digital || {}).pruefwert, (v.digital || {}).iterationen))) { api.say(`✗ ${td.falsch}`); return; }
      digitalFreischalten(ctx.store.state, versuchId);
      ctx.store.save();
      zeige(true);
    };
    tastaturFeld(code, 'text');
    code.addEventListener('keydown', (e) => { if (e.key === 'Enter') frei(); });
    return [h('div', 'probe', h('p', {}, td.frage), h('div', 'zeile', code, h('button', { class: 'primary', type: 'button', onclick: frei }, td.knopf)))];
  };
  const digitalKnoten = () => {
    if (!digitalFrei(ctx.store.state, versuchId)) return formular();
    lab = lab || digitalVersuch({ station, t: td, api, tubeSvg, probenName, start: versuchId === 'A' ? '#dfeef4' : '#e6f1f5', nachAenderung: neuMessen });
    return lab.knoten;
  };
  function zeige(dig) {
    digital = dig;
    modusLive.setAttribute('aria-pressed', String(!digital));
    modusDigital.setAttribute('aria-pressed', String(digital));
    host.replaceChildren(h('div', 'task-levels', modusLive, modusDigital), ...(digital ? digitalKnoten() : liveKnoten));
  }
  modusLive.addEventListener('click', () => zeige(false));
  modusDigital.addEventListener('click', () => zeige(true));
  zeige(false);
  return { reveal() {} };
}

function beobachtung(host, step, api, ctx) {
  const p = protokoll(ctx);
  p.beobachtung = p.beobachtung || {};
  const alle = alleProben(ctx.versuch, step.stationen);
  const nk = notizSchluessel(step.stationen);
  const result = h('div', { class: 'ergebnis', hidden: true });
  host.append(h('p', 'frage', 'Trage ein, was du wirklich gesehen hast.'));
  for (const pr of alle) {
    const cur = p.beobachtung[pr.id] = p.beobachtung[pr.id] || { wahl: '', notiz: '' };
    const vm = p.vermutung && p.vermutung[pr.id] && p.vermutung[pr.id].wahl;
    const btns = ctx.versuch.beobachtungOptionen.map((o) => {
      const b = h('button', {
        type: 'button', class: 'chip', 'aria-pressed': String(cur.wahl === o),
        onclick: () => { cur.wahl = o; ctx.store.save(); btns.forEach((x) => x.setAttribute('aria-pressed', String(x === b))); },
      }, o);
      return b;
    });
    const notiz = h('input', { type: 'text', class: 'warum', maxlength: '120', placeholder: 'Notiz (freiwillig)', 'aria-label': `Notiz zu Probe ${pr.nr}`, value: cur.notiz });
    tastaturFeld(notiz, 'text');
    notiz.addEventListener('input', () => { cur.notiz = notiz.value; ctx.store.save(); });
    host.append(h('div', 'probe',
      h('strong', {}, `${pr.station.name}, Probe ${pr.nr}: ${probenName(pr)}`),
      vm ? h('span', 'hint', `Du vermutetest: ${vm}`) : null,
      h('div', 'chips', btns), notiz));
  }
  const besonder = h('textarea', { rows: 2, 'aria-label': 'Besonderheiten', placeholder: 'Besonderheiten oder Auffälliges (freiwillig)' });
  besonder.value = p[nk] || '';
  tastaturFeld(besonder, 'text');
  besonder.addEventListener('input', () => { p[nk] = besonder.value; ctx.store.save(); });
  const compare = h('button', {
    class: 'primary', type: 'button',
    onclick: () => {
      const fehlt = alle.filter((pr) => !p.beobachtung[pr.id].wahl);
      if (fehlt.length) { api.say(`Bei ${fehlt.length} Probe(n) fehlt noch deine Beobachtung.`); return; }
      const zeilen = alle.map((pr) => {
        const w = p.beobachtung[pr.id].wahl;
        const passt = beobachtungPasst(pr, w);
        return h('li', {}, `Probe ${pr.nr} (${probenName(pr)}): Du: ${w}. Skript: ${pr.erwartung}. ${passt ? '✓ passt' : '≠ weicht ab'}`);
      });
      const abw = alle.some((pr) => !beobachtungPasst(pr, p.beobachtung[pr.id].wahl));
      result.hidden = false;
      result.replaceChildren(h('h3', {}, 'Vergleich mit dem Skript'), h('ul', {}, zeilen), abw ? h('p', {}, ctx.versuch.abweichung) : h('p', {}, 'Alles passt zum Skript.'));
      api.ok('Beobachtungen im Protokoll gespeichert.');
    },
  }, 'Mit dem Skript vergleichen');
  host.append(besonder, compare, result);
  return { reveal() {} };
}

function exportStep(host, step, api, ctx) {
  const text = protokollText({ names: ctx.store.state.names, versuch: ctx.versuch, protokoll: protokoll(ctx), stationen: step.stationen });
  // Als Text angezeigt (nicht als scrollendes Textfeld), damit nichts gescrollt werden muss; Markieren geht trotzdem
  const ta = h('pre', { class: 'protokoll-text', 'aria-label': 'Protokoll als Text' }, text);
  const info = h('p', 'hint', '');
  const copy = h('button', {
    type: 'button',
    onclick: async () => {
      try {
        await navigator.clipboard.writeText(text);
        info.textContent = 'Das Protokoll liegt in der Zwischenablage.';
      } catch {
        const sel = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(ta);
        sel.removeAllRanges();
        sel.addRange(range);
        info.textContent = document.execCommand && document.execCommand('copy') ? 'Das Protokoll liegt in der Zwischenablage.' : 'Markiere den Text und kopiere ihn von Hand, oder mache ein Foto vom Bildschirm.';
      }
    },
  }, 'Als Text kopieren');
  host.append(h('p', 'frage', 'Dein Protokoll ist fertig. Kopiere es oder mache ein Foto vom Bildschirm.'), ta, h('div', 'zeile', copy, navigator.share ? h('button', { type: 'button', onclick: () => navigator.share({ title: 'Protokoll Eiweiß-Versuch', text }).catch(() => {}) }, 'Teilen') : null), info);
  api.ok('Das Protokoll ist fertig.');
  return { reveal() {} };
}

export const LABOR_TYPES = {
  vermutung,
  anleitung,
  reihenfolge: reihenfolgeStep,
  simulation,
  versuch,
  beobachtung,
  export: exportStep,
};
