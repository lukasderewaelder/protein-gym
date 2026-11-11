// Speicherstand im Browser (localStorage, Versionsnummer im Schlüssel). Fällt auf Arbeitsspeicher zurück,
// wenn der Speicher gesperrt ist (privates Fenster, Schulgeräte mit Einschränkung).

import { wuerfleTaeter, istTaeter } from './fall.js';
import { wuerfleSaunaCode, istSaunaCode, migriereZweiNull } from './zugang.js';

export const STORAGE_KEY = 'protein-gym:v1';

export function defaultState() {
  return {
    names: [],          // 1 bis 3 Namen oder ein Gruppenname
    shirt: 0,           // Index der Shirtfarbe
    hair: 0,            // Frisur (0 kurz, 1 Zopf, 2 Locken)
    skin: 0,            // Hautton (0 bis 3)
    levels: {},         // gewähltes Niveau je Raum: 0 leicht, 1 mittel, 2 schwer
    quiz: null,         // Ergebnis des Abschlussquiz: { richtig, von } (bleibt auf dem Gerät)
    hefterHaken: {},    // abgeschriebene Hefter-Aufträge (Schlüssel eintrag.index), nur auf dem Gerät
    protokoll: {},      // Versuchsprotokoll: vermutung, beobachtung, notiz (bleibt auf dem Gerät, nicht im Fortschrittscode)
    scene: 'empfang',
    flags: {},          // Fortschritt und gesehene Dialoge
    fall: { taeter: null }, // Täter des Krimis, wird beim Spielstart gewürfelt (siehe ensureFall)
    codes: { sauna: null }, // Saunacode (4 Ziffern), wird beim Spielstart gewürfelt (siehe ensureCodes)
    taskProgress: {},   // Zwischenstand je Aufgabe: { Niveau, Schritt, richtige Erstversuche } (nur auf dem Gerät)
    pos: null,          // Position der Figur { scene, x, y } (nur auf dem Gerät)
    fontScale: 1,
    inventarGesehen: {}, // Gegenstände, die die Tasche schon gezeigt hat (nur auf dem Gerät)
    vollbild: false,    // Vollbild war zuletzt an: nach dem Neuladen beim ersten Tippen wieder anfordern (nur auf dem Gerät)
  };
}

export function createStore(storage, zufall = Math.random) {
  let mem = null;
  let state = defaultState();
  const hoerer = [];
  let verboten = []; // Codes, die der Saunacode nicht sein darf (Code der Lehrkraft)

  /** Täter würfeln, falls noch keiner feststeht (neuer Spielstand oder Speicher aus einer älteren Version). */
  function ensureFall() {
    if (!state.fall || !istTaeter(state.fall.taeter)) state.fall = { taeter: wuerfleTaeter(zufall) };
  }

  /** Saunacode würfeln, falls noch keiner feststeht (neuer Spielstand oder Speicher aus der Zeit vor 2.0). */
  function ensureCodes() {
    if (!state.codes || typeof state.codes !== 'object') state.codes = { sauna: null };
    if (!istSaunaCode(state.codes.sauna) || verboten.includes(state.codes.sauna)) state.codes.sauna = wuerfleSaunaCode(zufall, verboten);
  }

  function readRaw() {
    try { return storage ? storage.getItem(STORAGE_KEY) : mem; } catch { return mem; }
  }
  function writeRaw(text) {
    mem = text;
    try { if (storage) storage.setItem(STORAGE_KEY, text); } catch { /* Speicher gesperrt: Arbeitsspeicher genügt */ }
  }
  function removeRaw() {
    mem = null;
    try { if (storage) storage.removeItem(STORAGE_KEY); } catch { /* ignorieren */ }
  }

  function load() {
    const raw = readRaw();
    state = defaultState();
    if (raw) {
      try {
        const data = JSON.parse(raw);
        if (data && typeof data === 'object') {
          state = { ...state, ...data, flags: { ...(data.flags || {}) } };
          if (!data.codes) migriereZweiNull(state); // gespeicherter Stand aus der Zeit vor 2.0: Ausweis und offene Türen nachrüsten
        }
      } catch { /* beschädigt: neu beginnen */ }
    }
    ensureFall();
    ensureCodes();
    return state;
  }

  return {
    load,
    get state() { return state; },
    save() { writeRaw(JSON.stringify(state)); },
    reset() { removeRaw(); state = defaultState(); ensureFall(); ensureCodes(); return state; },
    ensureFall,
    ensureCodes,
    /** Codes festlegen, die der Saunacode nie sein darf; ein bereits gewürfelter, der damit kollidiert, wird neu gewürfelt. */
    verbieteCodes(liste) { verboten = liste.map(String); ensureCodes(); this.save(); },
    setFlag(name, value = true) { state.flags[name] = value; this.save(); hoerer.forEach((f) => f(name, value)); },
    /** Auf gesetzte Flags hören (zum Beispiel für die Tasche). */
    onFlag(fn) { hoerer.push(fn); },
    hasFlag(name) { return Boolean(state.flags[name]); },
    hasNames() { return state.names.length > 0; },
  };
}

export function browserStorage() {
  try {
    const s = window.localStorage;
    s.setItem('protein-gym:probe', '1');
    s.removeItem('protein-gym:probe');
    return s;
  } catch {
    return null;
  }
}
