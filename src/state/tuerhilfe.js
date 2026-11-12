// Hilfe an verschlossenen Türen: Wer dieselbe Tür mehrmals antippt, obwohl noch etwas fehlt, bekommt ab dem zweiten Mal von der
// passenden Figur gesagt, was konkret noch zu lösen ist. Reine Logik ohne Browser; Texte und Figuren stehen in data/hilfe.json (`tuerHilfe`),
// die Schritte kommen aus `naechsterSchritt` (src/state/naechster-schritt.js). Der Zähler liegt nur auf dem Gerät (store.state.tuerVersuche).

/** Versuch an dieser Tür zählen und die neue Anzahl zurückgeben. */
export function zaehleTuerVersuch(state, tuerId) {
  const alt = (state.tuerVersuche && state.tuerVersuche[tuerId]) || 0;
  state.tuerVersuche = { ...(state.tuerVersuche || {}), [tuerId]: alt + 1 };
  return alt + 1;
}

/**
 * Dialog der Figur, die zum fehlenden Schritt gehört (Ort des Schritts), oder null (zu früh, kein Schritt, keine Figur).
 * versuche: Anzahl der Versuche an der Tür; schrittId: Schlüssel aus naechsterSchritt; hilfe: Inhalt von data/hilfe.json.
 */
export function tuerHilfeDialog(versuche, schrittId, hilfe) {
  const cfg = hilfe && hilfe.tuerHilfe;
  const s = hilfe && hilfe.schritte && hilfe.schritte[schrittId];
  if (!cfg || !s || versuche < cfg.ab) return null;
  const fig = (cfg.figuren && (cfg.figuren[s.ort] || cfg.figuren.Standard)) || null;
  if (!fig) return null;
  return { speaker: fig.von, portrait: fig.portrait, lines: [fig.einleitung, s.grob, s.konkret].filter(Boolean) };
}
