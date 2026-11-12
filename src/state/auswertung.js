// Auswertung für Lehrkräfte ohne Server: Fortschrittscodes einlesen und eine Klassenübersicht bilden.
// Die Codes enthalten keine Namen; Namen stehen nur, wenn die Lehrkraft sie selbst vor den Code schreibt.

import { decodeProgress, FLAG_LIST } from './progress.js';

export const RAUM_NAMEN = { empfang: 'Empfang', labor: 'Labor', sauna: 'Sauna', training: 'Trainingsfläche', shakebar: 'Shake-Bar' };
export const RAUM_FLAGS = { empfang: 'empfang_done', labor: 'labor_done', sauna: 'sauna_done', training: 'training_done', shakebar: 'shakebar_done' };
export const FALL_NAMEN = { desi: 'Desi (Alkohol)', kurt: 'Kupfer-Kurt (Schwermetallsalz)', hannes: 'Hitze-Hannes (Hitze)', zoe: 'Zitrus-Zoe (Säure)' };
export const NIVEAU_NAMEN = ['Leicht', 'Mittel', 'Schwer'];
export const AUFGABEN_FLAGS = ['a0_done', 'a4_done', 'a5_done', 'a3_done', 'a1_done', 'a6_done']; // Pflichtaufgaben in Spielreihenfolge
export const ZUSATZ_FLAGS = ['a2_done', 'z1_done']; // freiwillig: Peptidbindung, Spurensicherung

const CODE_RE = /PG[-\s]*[0-9A-Z]{2,}(?:[-\s][0-9A-Z]{1,6})+/i;

/** Zeilen wie „Mia: PG-…“, „Mia PG-…“ oder nur „PG-…“ einlesen. */
export function parseZeilen(text) {
  const rows = [];
  String(text || '').split(/\r?\n/).forEach((roh, i) => {
    const zeile = roh.trim();
    if (!zeile) return;
    const m = CODE_RE.exec(zeile);
    const code = m ? m[0] : zeile;
    const name = (m ? zeile.slice(0, m.index) : '').replace(/[:\-–,;]+\s*$/, '').trim();
    rows.push({ nr: i + 1, name, code, res: decodeProgress(code) });
  });
  return rows;
}

export function auswertungZeile(state) {
  const raeume = Object.fromEntries(Object.entries(RAUM_FLAGS).map(([r, f]) => [r, Boolean(state.flags[f])]));
  const aufgaben = AUFGABEN_FLAGS.filter((f) => state.flags[f]).length;
  const zusatz = ZUSATZ_FLAGS.filter((f) => state.flags[f]).length;
  const karten = FLAG_LIST.filter((f) => /^(k|z)_/.test(f) && state.flags[f]).length;
  return {
    raeume,
    raeumeFertig: Object.values(raeume).filter(Boolean).length,
    aufgaben,
    zusatz,
    karten,
    quizDone: Boolean(state.flags.quiz_done),
    fall: state.fall && state.fall.taeter ? (FALL_NAMEN[state.fall.taeter] || state.fall.taeter) : '–',
    quiz: state.quiz ? state.quiz.richtig : null,
    niveaus: Object.fromEntries(Object.keys(RAUM_FLAGS).map((r) => [r, NIVEAU_NAMEN[state.levels[r]] || '–'])),
  };
}

/** Summen über alle gültigen Zeilen. */
export function zusammenfassung(rows) {
  const gueltig = rows.filter((r) => r.res.ok).map((r) => auswertungZeile(r.res.state));
  const n = gueltig.length;
  const proRaum = Object.fromEntries(Object.keys(RAUM_FLAGS).map((r) => [r, gueltig.filter((z) => z.raeume[r]).length]));
  const quizWerte = gueltig.map((z) => z.quiz).filter((q) => q !== null);
  return {
    gesamt: rows.length,
    gueltig: n,
    ungueltig: rows.length - n,
    proRaum,
    quizGespielt: quizWerte.length,
    quizSchnitt: quizWerte.length ? Math.round((quizWerte.reduce((a, b) => a + b, 0) / quizWerte.length) * 10) / 10 : null,
    fertig: gueltig.filter((z) => z.quizDone).length,
  };
}

const csvZelle = (v) => `"${String(v ?? '').replaceAll('"', '""')}"`;

export function csvText(rows) {
  const kopf = ['Name', 'Empfang', 'Labor', 'Sauna', 'Trainingsfläche', 'Shake-Bar', 'Aufgaben (von 6)', 'Zusatz (von 2)', 'Karten', 'Auflösung (von 4)', 'Fall (Verursacher)', 'Niveau Labor', 'Niveau Sauna', 'Niveau Trainingsfläche', 'Niveau Shake-Bar', 'Hinweis'];
  const zeilen = rows.map((r) => {
    if (!r.res.ok) return [r.name, ...Array(kopf.length - 2).fill(''), r.res.reason];
    const z = auswertungZeile(r.res.state);
    return [r.name, ...Object.keys(RAUM_FLAGS).map((k) => (z.raeume[k] ? 'ja' : 'nein')), z.aufgaben, z.zusatz, z.karten, z.quiz ?? '', z.fall, ...['labor', 'sauna', 'training', 'shakebar'].map((k) => z.niveaus[k]), ''];
  });
  return [kopf, ...zeilen].map((z) => z.map(csvZelle).join(';')).join('\n');
}
