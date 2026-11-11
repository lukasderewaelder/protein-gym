// Prüflogik der Aufgaben als reine Funktionen (ohne Browser), damit sie sich testen lässt.

/** Zahl aus Eingabe lesen: Komma oder Punkt als Dezimaltrenner, Leerzeichen egal. NaN, wenn keine Zahl. */
export function parseNumber(text) {
  const t = String(text ?? '').trim().replace(/\s+/g, '').replace(',', '.');
  if (!/^-?\d+(\.\d+)?$/.test(t)) return NaN;
  return Number(t);
}

export function checkZahl(step, text) {
  const n = parseNumber(text);
  return Number.isFinite(n) && Math.abs(n - step.richtig) < 1e-9;
}

/**
 * answers: gewählte Wörter je Lücke (oder null). Rückgabe: { ok, wrong: [Index der falschen Lücken], empty: [leere] }
 * step.austauschbar: Gruppen von Lücken (1-basiert), deren Lösungen in jeder Besetzung gelten, zum Beispiel [[1, 2]].
 */
export function checkLuecken(step, answers) {
  const wrong = [];
  const empty = [];
  const tauschbar = new Map();
  for (const g of step.austauschbar || []) {
    const rest = g.map((n) => step.loesungen[n - 1]);
    for (const n of g) tauschbar.set(n - 1, { rest, group: g });
  }
  const used = new Map(); // Gruppe -> bereits vergebene Lösungen
  step.loesungen.forEach((sol, i) => {
    const a = answers[i];
    if (a == null || a === '') { empty.push(i); return; }
    const t = tauschbar.get(i);
    if (!t) { if (a !== sol) wrong.push(i); return; }
    const key = t.group.join(',');
    const taken = used.get(key) || [];
    const free = [...t.rest];
    for (const x of taken) { const k = free.indexOf(x); if (k >= 0) free.splice(k, 1); }
    const k = free.indexOf(a);
    if (k < 0) wrong.push(i); else used.set(key, [...taken, a]);
  });
  return { ok: !wrong.length && !empty.length, wrong, empty };
}

/**
 * Formel-Tippen: Wie wird ein angetipptes Teil gewertet? Die Teile dürfen in beliebiger Reihenfolge kommen.
 * Ist der Rest R = H (Glycin), zählen das H oben (Rest) und das H unten am zentralen C beide als Rest.
 * Rückgabe: { art: 'neu' | 'auchRest' | 'schon' | 'falsch', ziel }.
 */
export function formelTippTreffer(step, mol, offen, part) {
  const restH = mol.rest === 'H';
  const alsRest = part === 'rest' || (part === 'h' && restH);
  const ziel = alsRest ? 'rest' : part;
  if (!step.teile.includes(ziel)) return { art: 'falsch', ziel };
  if (offen.has(ziel)) return { art: 'neu', ziel };
  return { art: restH && alsRest ? 'auchRest' : 'schon', ziel };
}

/**
 * Welche Gruppen reagieren? a und b: { mol: 0|1, end: 'amino'|'carboxy' }.
 * Richtig: zwei verschiedene Moleküle, einmal Aminogruppe und einmal Carboxygruppe (beide Richtungen gelten).
 */
export function reactionPair(a, b) {
  if (a.mol === b.mol) return { ok: false, reason: 'gleiches-molekuel' };
  if (a.end === b.end) return { ok: false, reason: 'gleiche-gruppe' };
  const carboxy = a.end === 'carboxy' ? a : b;
  const amino = a.end === 'amino' ? a : b;
  return { ok: true, carboxyMol: carboxy.mol, aminoMol: amino.mol };
}

/** taps: zwei Teilchen { kind: 'OH' | 'H', mol }. Richtig: das OH der Carboxygruppe und ein H der Aminogruppe. */
export function leavingParticles(pair, taps) {
  if (taps.length !== 2) return { ok: false, reason: 'anzahl' };
  const oh = taps.find((t) => t.kind === 'OH');
  const h = taps.find((t) => t.kind === 'H');
  if (!oh || !h) return { ok: false, reason: 'art' };
  if (oh.mol !== pair.carboxyMol || h.mol !== pair.aminoMol) return { ok: false, reason: 'molekuel' };
  return { ok: true };
}

/** Formel des Dipeptids: Carboxygruppe von A reagiert mit Aminogruppe von B. */
export function dipeptidFormula(molA, molB) {
  return `H₂N–${molA.mid}–CO–NH–${molB.mid}–COOH`;
}

export function dipeptidName(molA, molB) {
  return `${molA.kurz}–${molB.kurz}`;
}

/** placed: Baustein-Texte je Platz (oder null). Rückgabe: { ok, wrong: [Plätze], empty: [Plätze] } */
export function checkOrdnen(step, placed) {
  const wrong = [];
  const empty = [];
  step.slots.forEach((want, i) => {
    if (placed[i] == null) empty.push(i);
    else if (placed[i] !== want) wrong.push(i);
  });
  return { ok: !wrong.length && !empty.length, wrong, empty };
}

/** Passt die Beobachtung zur Erwartung des Skripts? Abweichungen sind kein Fehler, sie werden nur angezeigt. */
export function beobachtungPasst(probe, wahl) {
  return Boolean(wahl) && probe.passt.includes(wahl);
}

/**
 * Reihenfolge beim Planen: gewaehlt ist die Liste der bisher angetippten Schritte (Texte).
 * gleichwertig: Gruppen von Positionen in korrekt, die untereinander vertauscht werden dürfen, zum Beispiel [[0, 1]].
 */
export function reihenfolge(korrekt, gewaehlt, gleichwertig = []) {
  const rang = (i) => { const g = gleichwertig.find((x) => x.includes(i)); return g ? Math.min(...g) : i; };
  const idx = gewaehlt.map((g) => korrekt.indexOf(g));
  const prefixOk = idx.every((k, p) => k >= 0 && rang(k) === rang(p)) && new Set(idx).size === idx.length;
  return { prefixOk, fertig: prefixOk && gewaehlt.length === korrekt.length };
}

/** Was im Glas passiert: bei Station A der Einfluss (Hitze, Säure …), bei Station B die Probe. */
export function probenName(p) {
  return p.einfluss || p.probe || '';
}

/** Die Stationen eines Schritts: Denaturierung („stationA“) und die Prüfung der neuen Lieferung („lieferung“) sind getrennte Versuche. */
export function stationenVon(versuch, keys = ['stationA', 'lieferung']) {
  return keys.map((k) => versuch[k]).filter(Boolean);
}

/** Schlüssel für die Besonderheiten im Protokoll: Denaturierung und Lieferung haben je eine eigene Notiz. */
export function notizSchluessel(keys = ['stationA', 'lieferung']) {
  return keys.includes('stationA') ? 'notiz' : 'notizLieferung';
}

/** Alle Proben der gewählten Stationen in Reihenfolge. */
export function alleProben(versuch, keys) {
  return stationenVon(versuch, keys).flatMap((st) => st.proben.map((p) => ({ ...p, station: st })));
}

/** Protokoll als Text zum Kopieren oder Abfotografieren. */
export function protokollText({ names, versuch, protokoll, stationen }) {
  const v = protokoll.vermutung || {};
  const b = protokoll.beobachtung || {};
  const nurLieferung = Array.isArray(stationen) && !stationen.includes('stationA');
  const lines = [nurLieferung ? 'Protokoll: Neue Lieferung' : 'Protokoll: Eiweiß-Versuch', `Namen: ${(names || []).join(', ') || '(ohne Namen)'}`, ''];
  for (const st of stationenVon(versuch, stationen)) {
    lines.push(`${st.name}: ${st.titel}`);
    lines.push(`Probe | ${st.spalte || 'Inhalt'} | Vermutung (Begründung) | Beobachtung | Erwartung laut Skript`);
    for (const p of st.proben) {
      const vm = v[p.id] ? `${v[p.id].wahl || '–'}${v[p.id].warum ? ` (${v[p.id].warum})` : ''}` : '–';
      const bo = b[p.id] ? `${b[p.id].wahl || '–'}${b[p.id].notiz ? ` (${b[p.id].notiz})` : ''}` : '–';
      lines.push(`${p.nr} | ${probenName(p)} | ${vm} | ${bo} | ${p.erwartung}`);
    }
    lines.push('');
  }
  const notiz = protokoll[notizSchluessel(stationen)];
  if (notiz) lines.push(`Besonderheiten: ${notiz}`, '');
  lines.push(nurLieferung
    ? 'Fazit: Eine Violettfärbung beim Biuret-Test zeigt Eiweiß an. Bleibt die Probe blau, ist kein Eiweiß enthalten.'
    : 'Merksatz: Beim Denaturieren (Gerinnen) verliert das Eiweiß seine Form: Aus klarem Eiklar wird festes Eiweiß. Der Vorgang ist nicht umkehrbar.');
  return lines.join('\n');
}

/** Mischt eine Liste (Fisher-Yates) und lässt die Eingabe unverändert. `zufall` liefert Zahlen in [0, 1). */
export function mische(liste, zufall = Math.random) {
  const a = [...liste];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(zufall() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Mehrfachwahl: genau `anzahl` Antworten, alle aus der Menge der richtigen. chosen = Indizes.
 *  Mit `alle: true` müssen genau alle richtigen gewählt sein und nichts Falsches (die Anzahl wird nicht verraten). */
export function checkMehrfach(step, chosen) {
  if (step.alle) {
    if (!chosen.every((i) => step.richtig.includes(i))) return { ok: false, reason: 'falsch' };
    if (!step.richtig.every((i) => chosen.includes(i))) return { ok: false, reason: 'fehlt' };
    return { ok: true, reason: null };
  }
  if (chosen.length !== step.anzahl) return { ok: false, reason: 'anzahl' };
  if (!chosen.every((i) => step.richtig.includes(i))) return { ok: false, reason: 'falsch' };
  return { ok: true, reason: null };
}

/** Quiz-Wertung: Schritte mit zaehlt=true, die ohne Fehlversuch und ohne Lösungshilfe gelöst wurden. */
export function quizErgebnis(steps, ersteVersuche) {
  const gezaehlt = steps.map((s, i) => ({ s, i })).filter(({ s }) => s.zaehlt);
  return { richtig: gezaehlt.filter(({ i }) => ersteVersuche[i] === true).length, von: gezaehlt.length };
}

/**
 * Ähnliche Aufgabe zum Üben nach dem Lösungsbeispiel. Erst in data/aehnlich.json suchen
 * (Schlüssel „aufgabe.niveau.schritt“, oder „aufgabe.*.schritt“ für alle Niveaus), sonst bei Formel-Schritten
 * automatisch ein anderes Molekül wählen. Gibt null zurück, wenn es keine passende Übung gibt.
 */
export function aehnlicheAufgabe({ step, taskId, level, index, aehnlich = {}, molekuele = {} }) {
  const fest = aehnlich[`${taskId}.${level}.${index}`] || aehnlich[`${taskId}.*.${index}`];
  if (fest) return fest;
  if (step.type === 'formel-tippen') {
    const keys = Object.keys(molekuele);
    const i = keys.indexOf(step.molekuel);
    if (keys.length < 2 || i < 0) return null;
    return { ...step, molekuel: keys[(i + 1) % keys.length] };
  }
  if (step.type === 'peptid-verbinden') {
    const basis = ['glycin', 'alanin'];
    const istBasis = basis.includes(step.a) && basis.includes(step.b);
    return istBasis ? { ...step, a: 'cystein', b: 'valin' } : { ...step, a: 'glycin', b: 'alanin' };
  }
  return null;
}

export const wasserBeiKette = (n) => Math.max(0, n - 1);
export const anzahlDipeptide = (sorten) => sorten * sorten;

/** Welche Pflicht-Wissenskarten fehlen noch? (IDs) */
export function fehlendeKarten(task, flags) {
  return (task.braucht || []).filter((id) => !flags[id]);
}

/** Ist der Raum fertig? Niveau 2 (Schwer) verlangt zusätzlich die Aufgaben aus pflichtSchwer. */
export function raumFertig(room, tasks, level, flags) {
  const need = [...room.pflicht, ...(level === 2 ? room.pflichtSchwer || [] : [])];
  return need.every((id) => flags[tasks[id].flag]);
}
