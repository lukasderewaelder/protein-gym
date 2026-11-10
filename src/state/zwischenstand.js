// Zwischenstände im Browser: Wo steht eine Aufgabe, wo steht die Figur?
// Reine Funktionen auf dem Spielstand (store.state), damit sie sich testen lassen. Gespeichert wird über store.save().
// Diese Angaben bleiben nur auf dem Gerät und stecken nicht im Fortschrittscode.

/** Aufgabe merken: bei Schritt `step` weitermachen (Index), `first` = beim ersten Versuch richtig gelöste Schritte. */
export function merkeFortschritt(state, id, level, step, first = []) {
  state.taskProgress = { ...(state.taskProgress || {}), [id]: { level, step, first: Array.from(first, (v) => v === true) } };
}

/**
 * Gemerkten Stand einer Aufgabe holen. Gibt null zurück, wenn nichts gemerkt ist, das Niveau gewechselt wurde
 * oder der Schritt nicht mehr passt (zum Beispiel nach einer Änderung der Aufgabe).
 */
export function holeFortschritt(state, id, level, anzahlSchritte) {
  const p = state.taskProgress && state.taskProgress[id];
  if (!p || p.level !== level) return null;
  if (!Number.isInteger(p.step) || p.step < 1 || p.step >= anzahlSchritte) return null;
  return { step: p.step, first: Array.isArray(p.first) ? Array.from(p.first, (v) => v === true) : [] };
}

export function loescheFortschritt(state, id) {
  if (state.taskProgress && id in state.taskProgress) {
    const { [id]: _weg, ...rest } = state.taskProgress;
    state.taskProgress = rest;
  }
}

/** Position der Figur merken (Raum und Weltkoordinaten, ganzzahlig). */
export function merkePosition(state, scene, x, y) {
  state.pos = { scene, x: Math.round(x), y: Math.round(y) };
}

/** Gespeicherte Position für diesen Raum, sonst null. */
export function holePosition(state, scene) {
  const p = state.pos;
  if (!p || p.scene !== scene || !Number.isFinite(p.x) || !Number.isFinite(p.y)) return null;
  return { x: p.x, y: p.y };
}
