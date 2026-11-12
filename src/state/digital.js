// Digitale Durchführung der Experimente: Aktivierungscode je Experiment (Prüfwert statt Klartext), Freischaltung je Station auf dem Gerät.
// Läuft im Browser und in Node (globalThis.crypto.subtle). Reine Funktionen. Der Code ist eine Hürde, keine Sicherheitsfreigabe:
// Der Prüfwert steht öffentlich in data/versuch.json, ein einzelnes Wort lässt sich raten.

const enc = new TextEncoder();
const SALZ = 'protein-gym-digital-aktivierung-v1';

export const DIGITAL_ITERATIONEN = 100000;

const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
/** Groß- und Kleinschreibung zählt nicht, Leerzeichen am Rand auch nicht. */
const norm = (wort) => String(wort || '').normalize('NFC').trim().toLowerCase();

/** Prüfwert eines Aktivierungscodes (steht in data/versuch.json unter digital.pruefwert). */
export async function aktivierungsPruefwert(wort, iterationen = DIGITAL_ITERATIONEN) {
  const roh = await globalThis.crypto.subtle.importKey('raw', enc.encode(norm(wort)), 'PBKDF2', false, ['deriveBits']);
  return hex(await globalThis.crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode(SALZ), iterations: iterationen }, roh, 256));
}

/** Passt die Eingabe zum Prüfwert? Leere Eingabe und fehlender Prüfwert passen nie. */
export async function aktivierungOk(eingabe, pruefwert, iterationen = DIGITAL_ITERATIONEN) {
  if (!pruefwert || !norm(eingabe)) return false;
  return (await aktivierungsPruefwert(eingabe, iterationen)) === pruefwert;
}

/** Ist der digitale Versuch dieser Station („A“ Hitze, „L“ Lieferung) auf diesem Gerät freigeschaltet? */
export function digitalFrei(state, id) {
  return Boolean(state && state.digitalFrei && state.digitalFrei[id]);
}

/** Digitalen Versuch für diese Station freischalten (jedes Experiment einzeln). */
export function digitalFreischalten(state, id) {
  state.digitalFrei = { ...(state.digitalFrei || {}), [id]: true };
}
