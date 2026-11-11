// Zugang zu den Räumen (Protein-Gym 2.0): Laborführerschein, Labor-Ausweis, Saunacode.
// Alles hier ist reine Logik ohne Browser, damit sie sich testen lässt.

/** Neue Flags der Version 2.0. Sie hängen in progress.js am Ende der FLAG_LIST. */
export const ZUGANG_FLAGS = [
  'lf_bestanden',          // Laborführerschein bestanden, Labor-Ausweis im Inventar
  'item_ausweis',          // Ausweis liegt im Inventar
  'item_ausweis_benutzt',  // Ausweis am Lesegerät benutzt
  'labor_offen',           // Labortür ist entriegelt
  'sauna_info',            // Markus hat gesagt, dass die Sauna verriegelt ist
  'sauna_code_gesehen',    // der Zettel mit dem Saunacode (rechts oben an der Pinnwand) wurde gesehen
  'sauna_offen',           // Saunatür ist entriegelt
  'bonus_1', 'bonus_2', 'bonus_3', 'bonus_4', 'bonus_5', 'bonus_6',  // Bonus-Schließfächer geöffnet
  'bz_1', 'bz_2', 'bz_3', 'bz_4', 'bz_5', 'bz_6',                    // Zahlenzettel gefunden
];

/** Freischaltung prüfen: eine Flag, eine Liste (alle nötig) oder nichts. */
export function erfuellt(requires, hat) {
  if (!requires) return true;
  const liste = Array.isArray(requires) ? requires : [requires];
  return liste.every((f) => hat(f));
}

/** Alle Flag-Namen einer Freischaltung als Liste (für Tests). */
export function flagsVon(requires) {
  if (!requires) return [];
  return Array.isArray(requires) ? requires : [requires];
}

/** Ein Hotspot ist sichtbar, wenn seine Flags „wenn“ erfüllt und „nicht“ nicht gesetzt sind (beide optional). */
export function istSichtbar(hs, hat) {
  if (hs.wenn && !erfuellt(hs.wenn, hat)) return false;
  if (hs.nicht && erfuellt(hs.nicht, hat)) return false;
  return true;
}

/** Zufälliger vierstelliger Saunacode als Text: keine vier gleichen Ziffern, weder 1234 noch 4321 noch mit Null am Anfang.
 *  verboten: Codes, die er nicht sein darf (der Code der Lehrkraft für die Versuche, damit beide nie verwechselt werden). */
export function wuerfleSaunaCode(zufall = Math.random, verboten = []) {
  for (let i = 0; i < 200; i++) {
    const n = 1000 + Math.floor(zufall() * 9000);
    const s = String(n);
    if (istSaunaCode(s) && !verboten.includes(s)) return s;
  }
  return ['4826', '5937', '6048'].find((c) => !verboten.includes(c));
}

export function istSaunaCode(s) {
  if (typeof s !== 'string' || !/^[1-9][0-9]{3}$/.test(s)) return false;
  if (/^(.)\1{3}$/.test(s)) return false;
  return s !== '1234' && s !== '4321';
}

/** Eingabe am Zahlenschloss prüfen. */
export function pruefeCode(eingabe, code) {
  return String(eingabe) === String(code);
}

/**
 * Spielstände aus der Zeit vor 2.0 nachrüsten, damit niemand ausgesperrt wird:
 * wer das Labor schon geschafft oder betreten hat, gilt als geprüft; wer die Sauna schon hatte, hat sie auch offen.
 * Ändert den Spielstand und gibt ihn zurück. Mehrfaches Aufrufen schadet nicht.
 */
export function migriereZweiNull(state) {
  const f = state.flags || (state.flags = {});
  const szene = state.scene;
  const weit = ['labor', 'sauna', 'training', 'shakebar'].includes(szene);
  const labor = Boolean(f.labor_done || f.sauna_done || f.training_done || f.shakebar_done || (f.empfang_done && weit));
  if (labor) {
    for (const k of ['lf_bestanden', 'item_ausweis', 'item_ausweis_benutzt', 'labor_offen', 'sauna_info']) f[k] = true;
  }
  const sauna = Boolean(f.sauna_done || f.training_done || f.shakebar_done || (f.labor_done && ['sauna', 'training', 'shakebar'].includes(szene)));
  if (sauna) {
    for (const k of ['sauna_code_gesehen', 'sauna_offen']) f[k] = true;
  }
  return state;
}

/** Tafel im Labor als Plakat-Karte mit den drei Sicherheitspunkten (nur zum Ansehen, kein Flag, nicht in der Leiste). */
export function tafelKarte(versuch) {
  return {
    id: 'tafel_sicherheit', medium: 'plakat', titel: 'Sicherheit im Labor', kopf: 'Sicherheit im Labor',
    zeilen: [...versuch.sicherheit, 'Den Versuch machst du mit deiner Lehrkraft in echt.'],
  };
}
