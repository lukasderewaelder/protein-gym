// Inventar: Gegenstände sind Flags im Spielstand (Besitz und „benutzt“), die Liste kommt aus data/inventar.json.
// Reine Logik ohne Browser. „gesehen“ merkt sich je Gegenstand, ob die Tasche ihn schon gezeigt hat (nur auf dem Gerät).

/** Alle Gegenstände, die die Spielenden haben, mit Zustand benutzt oder nicht. Reihenfolge wie in der Datei. */
export function liste(gegenstaende, hat) {
  return gegenstaende
    .filter((g) => hat(g.hat))
    .map((g) => ({ ...g, benutzt: g.benutzt ? Boolean(hat(g.benutzt)) : false }));
}

/** Wie viele Gegenstände sind neu (noch nicht in der Tasche angesehen)? */
export function neuAnzahl(items, gesehen = {}) {
  return items.filter((g) => !gesehen[g.id]).length;
}

/** Alle gegebenen Gegenstände als gesehen markieren (ändert und gibt das Objekt zurück). */
export function markiereGesehen(items, gesehen = {}) {
  for (const g of items) gesehen[g.id] = true;
  return gesehen;
}
