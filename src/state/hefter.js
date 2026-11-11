// Hefter-Pflicht: Ein neuer Heftereintrag muss abgeschrieben (abgehakt) sein, bevor der nächste Raum aufgeht.
// Reine Logik ohne Browser. Die Haken liegen nur auf dem Gerät (store.state.hefterHaken, Schlüssel = Eintrags-ID);
// nach dem Einlesen eines Fortschrittscodes zählt ein Eintrag auch als erledigt, wenn sein Folgeraum schon geschafft ist
// (Feld erledigtMit), damit niemand hängen bleibt.

/** Ist der Eintrag abgeschrieben (Haken) oder durch den Spielverlauf schon überholt? */
export function eintragErledigt(e, flags = {}, haken = {}) {
  return Boolean((haken || {})[e.id] || (e.erledigtMit && flags[e.erledigtMit]));
}

/** Freigeschaltete, aber noch nicht abgeschriebene Einträge (in der Reihenfolge des Hefters). */
export function offeneEintraege(hefter, flags = {}, haken = {}) {
  return hefter.eintraege.filter((e) => flags[e.ab] && !eintragErledigt(e, flags, haken));
}

/** Eintrag, der den Raum `raum` (Feld sperrt, z. B. "training", "shakebar", "schluss") noch sperrt, sonst null. */
export function sperrenderEintrag(hefter, flags = {}, haken = {}, raum) {
  return offeneEintraege(hefter, flags, haken).find((e) => e.sperrt === raum) || null;
}

/** Eintrag, der mit dem Raum-Flag `fertigFlag` frei wird (für die Ansage „Neuer Heftereintrag!“), sonst null. */
export function eintragAb(hefter, fertigFlag) {
  return hefter.eintraege.find((e) => e.ab === fertigFlag) || null;
}
