// Hilfe nur bei Bedarf: Die Ziel-Zeile oben erscheint erst, wenn man eine Minute lang keinen Fortschritt macht
// oder zweimal etwas Falsches tut (falsche Antwort, falscher Code, verschlossene Tür). Reine Logik ohne Browser.

/** Neue Uhr. grenzeMs: Ruhezeit bis zur Hilfe, fehlerGrenze: Zahl der Fehler bis zur Hilfe. */
export function neueHilfeUhr({ grenzeMs = 60000, fehlerGrenze = 2 } = {}) {
  return { ruheMs: 0, fehler: 0, sichtbar: false, grenzeMs, fehlerGrenze };
}

/** Zeit vergeht. Sie zählt nur, wenn `zaehlt` (kein Fenster, Gespräch oder Aufgabe offen). Gibt true zurück, wenn die Hilfe gerade erscheint. */
export function tick(u, ms, zaehlt = true) {
  if (u.sichtbar || !zaehlt) return false;
  u.ruheMs += ms;
  if (u.ruheMs >= u.grenzeMs) { u.sichtbar = true; return true; }
  return false;
}

/** Etwas Falsches getan. Gibt true zurück, wenn die Hilfe gerade erscheint. */
export function falsch(u) {
  if (u.sichtbar) return false;
  u.fehler += 1;
  if (u.fehler >= u.fehlerGrenze) { u.sichtbar = true; return true; }
  return false;
}

/** Fortschritt (ein neues Flag): Die Hilfe verschwindet wieder, Zeit und Fehler beginnen von vorn. */
export function fortschritt(u) {
  u.ruheMs = 0;
  u.fehler = 0;
  u.sichtbar = false;
}
