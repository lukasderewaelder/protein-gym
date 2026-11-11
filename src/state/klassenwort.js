// Einrichtung eines Tablets für die zeitbasierten Codes: gespeichert wird nur der abgeleitete Schlüssel (nie das Klassenwort).
// Eigener localStorage-Schlüssel, damit „Neues Spiel“ die Einrichtung nicht löscht (gemeinsame Tablets bleiben eingerichtet).

export const KLASSENWORT_SCHLUESSEL = 'protein-gym:lehrkraft';

/** Gespeicherter Schlüssel (Hex) oder ein leerer Text. Läuft auch ohne localStorage (privates Fenster). */
export function ladeSchluessel(storage) {
  try {
    const raw = storage && storage.getItem(KLASSENWORT_SCHLUESSEL);
    const s = raw ? JSON.parse(raw).schluessel : '';
    return typeof s === 'string' && /^[0-9a-f]{64}$/.test(s) ? s : '';
  } catch { return ''; }
}

/** Schlüssel speichern; true, wenn es geklappt hat. */
export function speichereSchluessel(storage, hex) {
  try {
    storage.setItem(KLASSENWORT_SCHLUESSEL, JSON.stringify({ schluessel: hex }));
    return true;
  } catch { return false; }
}

/** Einrichtung entfernen. */
export function entferneSchluessel(storage) {
  try { storage.removeItem(KLASSENWORT_SCHLUESSEL); } catch { /* ignorieren */ }
}
