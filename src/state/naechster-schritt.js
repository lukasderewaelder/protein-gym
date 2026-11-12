// „Wie geht’s weiter?“: aus dem Spielstand die nächste Station ableiten. Reine Logik ohne Browser.
// Die Texte (grob und konkret) stehen in data/hilfe.json unter dem Schlüssel der Station.

import { sperrenderEintrag } from './hefter.js';

/** Karten eines Raums, die für die nächste Pflichtaufgabe noch fehlen. */
function fehlendes(raum, flags, { aufgaben, karten }) {
  const rd = aufgaben.raeume[raum];
  const offen = rd.pflicht.filter((id) => !flags[aufgaben.aufgaben[id].flag]);
  const braucht = offen.length ? aufgaben.aufgaben[offen[0]].braucht || [] : [];
  const kartenIds = new Set(karten.map((k) => k.id));
  return {
    spind: braucht.includes('spind_gesehen') && !flags.spind_gesehen,
    karten: braucht.filter((b) => kartenIds.has(b) && !flags[b]),
  };
}

/** Station je Raum: erst Hinweise sammeln, dann die Aufgabe. */
function raumStation(raum, flags, daten) {
  const f = fehlendes(raum, flags, daten);
  if (raum === 'empfang') {
    if (f.spind) return 'spind';
    return f.karten.length ? 'empfang_hinweise' : 'einweisung';
  }
  if (f.karten.length) return `${raum}_hinweise`;
  return `${raum}_aufgabe`;
}

/** Reihenfolge des Spiels als Etappen („Dein Weg“): Name und das Flag, das die Etappe abschließt. */
export const WEG = [
  { name: 'Empfang', fertig: 'empfang_done' },
  { name: 'Labor', fertig: 'labor_done' },
  { name: 'Sauna', fertig: 'sauna_done' },
  { name: 'Training', fertig: 'training_done' },
  { name: 'Shake-Bar', fertig: 'shakebar_done' },
  { name: 'Auflösung', fertig: 'quiz_done' },
  { name: 'Lieferung', fertig: 'lieferung_done' },
  { name: 'Schlussquiz', fertig: 'quiz2_done' },
];

/** Etappen mit Status: 'fertig' (Haken), 'jetzt' (die erste noch offene) oder 'offen'. */
export function wegStationen(flags) {
  const f = flags || {};
  let jetztVergeben = false;
  return WEG.map((s) => {
    if (f[s.fertig]) return { name: s.name, status: 'fertig' };
    if (!jetztVergeben) { jetztVergeben = true; return { name: s.name, status: 'jetzt' }; }
    return { name: s.name, status: 'offen' };
  });
}

/**
 * Dauerhafte Ziel-Zeile in der oberen Leiste: { ort, text } zur nächsten Station (kurzer Satz `kurz` aus data/hilfe.json). Bei „Hinweise suchen“
 * kommt die Zahl der noch fehlenden Hinweise dazu („… (noch 2)“). Ohne Eintrag in der Hilfe: null.
 */
export function zielZeile(id, flags, daten, hilfe) {
  const s = hilfe && hilfe.schritte && hilfe.schritte[id];
  if (!s) return null;
  let text = s.kurz || s.grob;
  const m = /^(.+)_hinweise$/.exec(id);
  if (m && daten && daten.aufgaben && daten.aufgaben.raeume[m[1]]) {
    const n = fehlendes(m[1], flags || {}, daten).karten.length;
    if (n > 0) text += ` (noch ${n})`;
  }
  return { id, ort: s.ort || '', text };
}

/**
 * Nächste Station als Schlüssel für data/hilfe.json.
 * flags: Flags des Spielstands; daten: { aufgaben, karten, hefter?, haken? } (aus data/aufgaben.json, den Wissenskarten, data/hefter.json
 * und store.state.hefterHaken). Mit hefter: Ein nicht abgeschriebener Heftereintrag kommt vor dem Raum, den er sperrt („hefter“).
 */
export function naechsterSchritt(flags, daten) {
  const f = flags || {};
  const hefterFehlt = (raum) => Boolean(daten && daten.hefter && sperrenderEintrag(daten.hefter, f, daten.haken || {}, raum));
  if (!f.empfang_done) return raumStation('empfang', f, daten);
  if (!f.labor_done) {
    if (!f.lf_bestanden) return 'fuehrerschein';
    if (!f.labor_offen) return 'leser';
    return raumStation('labor', f, daten);
  }
  if (!f.sauna_done) {
    if (!f.sauna_offen) return f.sauna_code_gesehen ? 'saunatuer' : 'sauna_code_suchen';
    return raumStation('sauna', f, daten);
  }
  if (!f.training_done) return hefterFehlt('training') ? 'hefter' : raumStation('training', f, daten);
  if (!f.shakebar_done) return hefterFehlt('shakebar') ? 'hefter' : raumStation('shakebar', f, daten);
  if (!f.quiz_done) return 'aufloesung';
  if (!f.lieferung_done) return 'lieferung_labor';
  if (!f.quiz2_done) return hefterFehlt('schluss') ? 'hefter' : 'schlussquiz';
  return 'fertig';
}
