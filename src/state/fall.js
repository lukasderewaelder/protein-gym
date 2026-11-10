// Der Fall: Wer hat den Eiweiß-Vorrat zum Gerinnen gebracht? Der Täter wird beim Spielstart zufällig gewürfelt.
// Reine Funktionen (ohne Browser), damit sie sich testen lassen. Texte stehen in data/fall.json.

/** Mögliche Täter, in dieser Reihenfolge im Fortschrittscode (2 Bit). */
export const FALL_LIST = ['desi', 'kurt', 'hannes', 'zoe'];

/** Hinweis-Karten je Raum: Raum → { verdaechtiger, flag }. Jeder Raum gehört einer Person. */
export const FALL_HINWEISE = {
  labor: { verdaechtiger: 'kurt', flag: 'f_labor' },
  sauna: { verdaechtiger: 'hannes', flag: 'f_sauna' },
  training: { verdaechtiger: 'desi', flag: 'f_training' },
  shakebar: { verdaechtiger: 'zoe', flag: 'f_shakebar' },
};

export const FALL_FLAGS = Object.values(FALL_HINWEISE).map((h) => h.flag);

/** Zufälligen Täter wählen. `zufall` ist austauschbar (Tests), Standard Math.random. */
export function wuerfleTaeter(zufall = Math.random) {
  return FALL_LIST[Math.min(FALL_LIST.length - 1, Math.floor(zufall() * FALL_LIST.length))];
}

export const istTaeter = (id) => FALL_LIST.includes(id);

/** Ist der Hinweis zu diesem Verdächtigen ein Beweis (belastend) oder ein Alibi (entlastend)? */
export const hinweisArt = (verdaechtiger, taeter) => (verdaechtiger === taeter ? 'beweis' : 'alibi');

/**
 * Die Fund-Karte zu einem Fall-Hinweis, passend zum gewürfelten Täter.
 * Gibt dieselbe Form wie eine Karte aus data/wissen.json zurück (id, typ, raum, ort, titel, medium, kopf, zeilen, fuss).
 */
export function fallKarte(raum, taeter, fall) {
  const def = FALL_HINWEISE[raum];
  const text = fall.hinweise[raum];
  if (!def || !text) return null;
  const art = hinweisArt(def.verdaechtiger, taeter);
  const variante = text[art];
  return {
    id: def.flag,
    typ: 'pflicht',
    fall: true,
    art,
    raum,
    ort: text.ort,
    titel: text.titel,
    medium: text.medium,
    kopf: text.kopf,
    zeilen: variante.zeilen,
    fuss: variante.fuss,
    verdaechtiger: def.verdaechtiger,
  };
}

/** Alle vier Fall-Karten zum gewürfelten Täter. */
export function alleFallKarten(taeter, fall) {
  return Object.keys(FALL_HINWEISE).map((raum) => fallKarte(raum, taeter, fall)).filter(Boolean);
}

/** Wurde der richtige Verdächtige benannt? */
export const taeterRichtig = (auswahl, taeter) => Boolean(auswahl) && auswahl === taeter;

/**
 * Hilfe bei falscher Wahl: Welche gefundene Karte entlastet diesen Verdächtigen (Alibi)?
 * Fehlt die Karte noch, wird ein Hinweis auf den Raum gegeben.
 */
export function hinweisZurWahl(auswahl, taeter, fall, flags = {}) {
  const raum = Object.keys(FALL_HINWEISE).find((r) => FALL_HINWEISE[r].verdaechtiger === auswahl);
  if (!raum) return 'Wähle eine der vier Personen.';
  const def = FALL_HINWEISE[raum];
  const text = fall.hinweise[raum];
  if (hinweisArt(def.verdaechtiger, taeter) === 'beweis') return 'Das passt nicht ganz. Lies die Hinweise im Spind noch einmal.';
  if (!flags[def.flag]) return `Zu ${fall.verdaechtige[auswahl].name} fehlt dir noch ein Hinweis im Raum „${text.raumName}“.`;
  return `Dieser Hinweis entlastet ${fall.verdaechtige[auswahl].name}: „${text.titel}“ im Spind.`;
}
