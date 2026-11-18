// Lehrkraft-Modus („God-Modus“, Wunsch der Lehrkraft 2026-11-18): alle Türen offen, jeder Raum per Knopf, alle Hinweise, Glossar und
// Hefter-Einträge sichtbar, jede Aufgabe in jedem Niveau mit „Lösung zeigen“. Freigabe nur über die verschlüsselte Lehrkräfte-Seite:
// Sie legt eine Freigabe mit Ablaufzeit auf dem Gerät ab (GOTT_KEY), das Spiel prüft sie gegen den Prüfwert in data/lehrkraft.json und
// spielt dann in einem eigenen Spielstand (GOTT_SPIEL_KEY in store.js). Reine Logik ohne Browser, Test tests/gott.test.mjs.

import { FLAG_LIST } from './progress.js';

export const GOTT_KEY = 'protein-gym:gott';
/** So lange gilt eine Freigabe (danach erneut über die Lehrkräfte-Seite öffnen, damit sie nicht auf einem Schülergerät liegen bleibt). */
export const GOTT_DAUER_MS = 12 * 60 * 60 * 1000;

/** Freigabe als Text für den Speicher. */
export function gottFreigabe(token, jetzt = Date.now()) {
  return JSON.stringify({ t: String(token), bis: jetzt + GOTT_DAUER_MS });
}

/** Gespeicherte Freigabe lesen: das Token, solange sie gilt, sonst null. */
export function gottToken(text, jetzt = Date.now()) {
  try {
    const f = JSON.parse(text);
    return f && typeof f.t === 'string' && Number(f.bis) > jetzt ? f.t : null;
  } catch {
    return null;
  }
}

/**
 * Alle Flags für den Lehrkraft-Modus: jedes Flag des Fortschrittscodes, alle Hinweiskarten, die Begrüßungen der Räume und was Dialoge setzen.
 * daten: { karten (Wissenskarten mit Fall-Karten), dialoge (data/dialoge.json), szenen (Szenen-IDs) }.
 */
export function gottFlags({ karten = [], dialoge = {}, szenen = [] } = {}) {
  const f = {};
  for (const x of FLAG_LIST) f[x] = true;
  for (const k of karten) f[k.id] = true;
  for (const s of szenen) f[`raum_${s}_gruss`] = true;
  for (const d of Object.values(dialoge)) if (d && d.setFlag) f[d.setFlag] = true;
  return f;
}

/** Spielstand des Lehrkraft-Modus vorbereiten (ändert state): Name, alle Flags, alle Hefter-Haken, Quizergebnisse, Tipps gehört. */
export function gottStand(state, { karten, dialoge, szenen, hefter, tipps = [] }) {
  state.names = ['Lehrkraft'];
  state.flags = { ...state.flags, ...gottFlags({ karten, dialoge, szenen }) };
  state.hefterHaken = Object.fromEntries((hefter ? hefter.eintraege : []).map((e) => [e.id, true]));
  state.quiz = state.quiz || { richtig: 4, von: 4 };
  state.quiz2 = state.quiz2 || { richtig: 2, von: 2 };
  state.tipps = Object.fromEntries(tipps.map((n) => [n, true]));
  return state;
}
