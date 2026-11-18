// Etwas Falsches getan (falsche Antwort, falscher Code, verschlossene Tür): Die Stellen melden es, main.js zählt mit (Hilfe-Uhr).

const EREIGNIS = 'pg:falsch';

/** Melden, dass gerade etwas Falsches passiert ist. */
export function meldeFalsch() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(EREIGNIS));
}

/** Auf gemeldete Fehler hören. */
export function beiFalsch(fn) {
  window.addEventListener(EREIGNIS, fn);
}
