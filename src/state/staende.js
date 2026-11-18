// Fortschrittscode auf der Lehrkräfte-Seite erzeugen (Wunsch der Lehrkraft 2026-11-18): Wer seinen Code verloren hat, bekommt
// einen Code für den Stand, an dem die Gruppe war. Je Station zwei Stände: „gerade angekommen“ und „geschafft“ (gleiche Stände
// zusammengelegt). Reine Logik ohne Browser, Test tests/staende.test.mjs.

import { FLAG_LIST } from './progress.js';
import { FALL_LIST } from './fall.js';
import { wuerfleSaunaCode } from './zugang.js';

/** Pflicht-Hinweise eines Raums (aus den Wissenskarten). */
const pflichtKarten = (karten, raum) => karten.filter((k) => k.raum === raum && k.typ === 'pflicht').map((k) => k.id);

/**
 * Die Stände in Spielreihenfolge. Jeder Stand enthält alle Flags der Stände davor.
 * neu: Flags, die dazukommen (Karten über `raum`), szene: wo die Figur steht.
 */
export const STAENDE = [
  { id: 'empfang_anfang', name: 'Empfang: gerade angefangen', szene: 'empfang', neu: ['intro_done'] },
  { id: 'empfang_fertig', name: 'Empfang geschafft (Einweisung erledigt)', szene: 'empfang', neu: ['spind_gesehen', 'a0_done', 'empfang_done'], raum: 'empfang' },
  { id: 'labor_anfang', name: 'Labor: Führerschein bestanden, gerade im Labor', szene: 'labor', neu: ['lf_bestanden', 'item_ausweis', 'item_ausweis_benutzt', 'labor_offen'] },
  { id: 'labor_fertig', name: 'Labor geschafft (Aufgabe 2), Sauna noch zu', szene: 'empfang', neu: ['f_labor', 'a4_done', 'labor_done', 'sauna_info'], raum: 'labor' },
  { id: 'sauna_anfang', name: 'Sauna: Tür offen, gerade in der Sauna', szene: 'sauna', neu: ['sauna_code_gesehen', 'sauna_offen'] },
  { id: 'sauna_fertig', name: 'Sauna geschafft', szene: 'empfang', neu: ['f_sauna', 'a5_done', 'sauna_done'], raum: 'sauna' },
  { id: 'training_anfang', name: 'Trainingsfläche: gerade angekommen', szene: 'training', neu: [] },
  { id: 'training_fertig', name: 'Trainingsfläche geschafft', szene: 'empfang', neu: ['f_training', 'a3_done', 'a1_done', 'training_done'], raum: 'training' },
  { id: 'shakebar_anfang', name: 'Shake-Bar: gerade angekommen', szene: 'shakebar', neu: [] },
  { id: 'shakebar_fertig', name: 'Shake-Bar geschafft, Auflösung bei Markus offen', szene: 'empfang', neu: ['f_shakebar', 'a6_done', 'shakebar_done'], raum: 'shakebar' },
  { id: 'aufloesung_fertig', name: 'Auflösung geschafft, neue Lieferung im Labor offen', szene: 'empfang', neu: ['quiz_task', 'quiz_done'], quiz: true },
  { id: 'lieferung_fertig', name: 'Lieferung geprüft, Schlussquiz offen', szene: 'empfang', neu: ['a7_done', 'lieferung_done'] },
  { id: 'schluss_fertig', name: 'Schlussquiz geschafft (Zertifikat)', szene: 'empfang', neu: ['quiz2_task', 'quiz2_done'], quiz2: true },
];

/** Alle Flags eines Stands (kumuliert). karten: Wissenskarten aus data/wissen.json. Unbekannter Stand: null. */
export function standFlags(id, karten) {
  const bis = STAENDE.findIndex((s) => s.id === id);
  if (bis < 0) return null;
  const flags = {};
  for (const s of STAENDE.slice(0, bis + 1)) {
    for (const f of s.neu) flags[f] = true;
    if (s.raum) for (const k of pflichtKarten(karten, s.raum)) flags[k] = true;
  }
  return flags;
}

/**
 * Spielstand für encodeProgress. optionen: { taeter ('zufall' oder desi/kurt/hannes/zoe), niveaus { labor, sauna, training, shakebar } (0–2),
 * quiz (0–4 richtige Antworten der Auflösung), quiz2 (0–2) }. Look der Figur bleibt Standard, Saunacode wird gewürfelt.
 */
export function standZustand(id, karten, optionen = {}, zufall = Math.random) {
  const flags = standFlags(id, karten);
  if (!flags) return null;
  const s = STAENDE.find((x) => x.id === id);
  const bis = STAENDE.indexOf(s);
  const erreicht = (feld) => STAENDE.slice(0, bis + 1).some((x) => x[feld]);
  const taeter = FALL_LIST.includes(optionen.taeter) ? optionen.taeter : FALL_LIST[Math.floor(zufall() * FALL_LIST.length)];
  const zahl = (v, max, std) => (Number.isInteger(v) ? Math.min(max, Math.max(0, v)) : std);
  const n = optionen.niveaus || {};
  return {
    shirt: 0, hair: 0, skin: 0,
    scene: s.szene,
    flags,
    levels: { labor: zahl(n.labor, 2, 1), sauna: zahl(n.sauna, 2, 1), training: zahl(n.training, 2, 1), shakebar: zahl(n.shakebar, 2, 1) },
    quiz: erreicht('quiz') ? { richtig: zahl(optionen.quiz, 4, 4), von: 4 } : null,
    quiz2: erreicht('quiz2') ? { richtig: zahl(optionen.quiz2, 2, 2), von: 2 } : null,
    fall: { taeter },
    codes: { sauna: wuerfleSaunaCode(zufall) },
  };
}

/** Prüfhilfe für Tests: Flags, die nicht im Fortschrittscode stehen (wären verloren). */
export function fremdeFlags(karten) {
  const alle = new Set(STAENDE.flatMap((s) => Object.keys(standFlags(s.id, karten))));
  return [...alle].filter((f) => !FLAG_LIST.includes(f));
}
