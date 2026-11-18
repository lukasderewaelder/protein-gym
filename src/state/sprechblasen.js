// Sprechblasen: Eine Person trägt nur dann eine Blase, wenn sie etwas Neues zu sagen hat. Reine Logik ohne Browser.
// „Neu“ heißt: Das nächste Antippen bringt etwas, das man noch nicht gehört hat. Danach (Gespräch gehört, Hinweiskarte eingesteckt,
// Aufgabe geschafft) verschwindet die Blase; die Person ist weiter ansprechbar und wiederholt sich dann.
// Gemerkt wird Gehörtes in store.state.gehoert (nur auf dem Gerät, keine Flags: Fortschrittscode und Hilfe-Uhr bleiben unberührt).

/** Welche Etappe Markus nach der Einweisung als Nächstes ansagt (wie coach() in main.js). */
export function coachStufe(flags) {
  const f = flags || {};
  return !f.labor_done ? 'labor' : !f.sauna_done ? 'sauna' : !f.training_done ? 'training' : 'shakebar';
}

/** Markus: Einweisung, danach pro Etappe einmal die Ansage, später Auflösung und Schlussquiz. */
function markusNeu(f, station, gehoert) {
  if (!f.empfang_done) return station === 'einweisung' ? 'einweisung' : null;
  if (!f.shakebar_done) { const k = `coach_${coachStufe(f)}`; return gehoert[k] ? null : k; }
  if (!f.quiz_done) return 'aufloesung';
  if (!f.lieferung_done) return null; // die Lieferung hat er beim Lösen des Falls schon angesagt
  if (!f.quiz2_done) return 'schlussquiz';
  return null; // Zertifikat gab es automatisch nach dem Schlussquiz
}

/**
 * Schlüssel der Neuigkeit, die eine Person gerade hat, sonst null (dann keine Blase).
 * ctx: { flags, station (aus naechsterSchritt), gehoert (store.state.gehoert), szene (ID des aktuellen Raums) }
 *  - Markus (aktion „coach“): siehe markusNeu;
 *  - Person mit Hinweiskarte (zum Beispiel Kurt, Hannes): bis die Karte eingesteckt ist;
 *  - Person mit Aufgabe (zum Beispiel Alex): solange die Aufgabe ihres Raums die nächste Station ist;
 *  - alle anderen (Desi, Zoe): bis man sie einmal angesprochen hat.
 */
export function neuigkeit(hs, ctx = {}) {
  if (!hs || hs.type !== 'npc') return null;
  const flags = ctx.flags || {};
  const gehoert = ctx.gehoert || {};
  if (hs.aktion === 'coach') return markusNeu(flags, ctx.station, gehoert);
  if (hs.karte) return flags[hs.karte] ? null : hs.karte;
  if (hs.task) return ctx.station && ctx.station === `${ctx.szene}_aufgabe` ? `aufgabe_${ctx.szene}` : null;
  const key = `person_${hs.id}`;
  return gehoert[key] ? null : key;
}

/** Gehörtes merken (state.gehoert); gibt true zurück, wenn es neu war. */
export function merkeGehoert(state, key) {
  if (!state.gehoert) state.gehoert = {};
  if (state.gehoert[key]) return false;
  state.gehoert[key] = true;
  return true;
}
