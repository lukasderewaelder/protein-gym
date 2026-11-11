// Fortschrittscode: kurzer Text, mit dem Lernende nach Speicherverlust weiterspielen können.
// Enthält Figur-Look, Raum, Fortschritts-Flags (63 Plätze), Täter des Falls (2 Bit), Saunacode (14 Bit) und Niveau je Raum, dazu eine Prüfsumme gegen Tippfehler.
// Version 5 (Protein-Gym 2.0); Codes der Version 4 bleiben lesbar und werden nachgerüstet (siehe zugang.js).
// Namen stehen bewusst NICHT im Code (Datenschutz); sie werden beim Wiederherstellen neu eingegeben.
// Der Code ist keine Sicherheitsmaßnahme: Wer den Quelltext liest, kann ihn nachbauen.

import { FALL_LIST } from './fall.js';
import { ZUGANG_FLAGS, migriereZweiNull, istSaunaCode } from './zugang.js';

export const CODE_VERSION = 5;

/** Feste Reihenfolge der Flags. Neue Flags nur am Ende anhängen, freie Plätze heißen reserve_NN. */
export const FLAG_LIST = [
  'intro_done', 'training_done', 'labor_done', 'sauna_done', 'shakebar_done',
  'a1_done', 'a2_done', 'z1_done', 'a4_done', 'a5_done', 'a6_done',
  'k_bauplan', 'k_rest', 'k_protein', 'z_peptid', 'k_kette',
  'z_essentiell', 'z_protein', 'z_struktur', 'z_quellen',
  'lab_frei', 'k_denat', 'k_ausloeser', 'k_biuret',
  'quiz_done', 'k_struktur', 'k_umkehr', 'k_haltbar', 'k_dose', 'k_abbau', 'k_geronnen', 'empfang_done',
  'quiz_task', 'z_ninhydrin', 'a0_done', 'a3_done', 'spind_gesehen', 'k_wichtig', 'k_hitze', 'f_labor',
  'f_sauna', 'f_training', 'f_shakebar', 'fall_geloest',
  ...ZUGANG_FLAGS,
];
/** Die 44 Flags der Version 4 (Reihenfolge eingefroren), damit alte Codes lesbar bleiben. */
const FLAG_LIST_V4 = FLAG_LIST.slice(0, 44);

export const SCENE_LIST = ['empfang', 'training', 'labor', 'sauna', 'shakebar'];
export const ROOM_LIST = ['training', 'labor', 'sauna', 'shakebar'];

const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'; // 32 Zeichen ohne I, L, O, U
const LOOK_BITS = { shirt: 2, hair: 2, skin: 2 };
const QUIZ_BITS = 3; // 0 bis 4 richtige Antworten, 7 = Auflösung nicht gespielt
const FALL_BITS = 2; // Täter des Falls (Index in FALL_LIST)
const SAUNA_BITS = 14; // Saunacode 0 bis 9999 (0 = noch keiner gewürfelt)
const bodyBits = (flags, sauna) => 4 + LOOK_BITS.shirt + LOOK_BITS.hair + LOOK_BITS.skin + 3 + flags + ROOM_LIST.length * 2 + QUIZ_BITS + FALL_BITS + sauna;
const BODY_BITS = bodyBits(FLAG_LIST.length, SAUNA_BITS);
const TOTAL_BITS = BODY_BITS + 8;
export const CODE_CHARS = Math.ceil(TOTAL_BITS / 5);
/** Aufbau je Version: Flag-Liste, Bits für den Saunacode, Länge in Zeichen. */
const LAYOUTS = {
  5: { flags: FLAG_LIST, sauna: SAUNA_BITS, bits: BODY_BITS, chars: CODE_CHARS },
  4: { flags: FLAG_LIST_V4, sauna: 0, bits: bodyBits(FLAG_LIST_V4.length, 0), chars: Math.ceil((bodyBits(FLAG_LIST_V4.length, 0) + 8) / 5) },
};

function crc8(bits) {
  // Prüfsumme über die Nutzbits (als BigInt), Polynom 0x07
  let crc = 0;
  let b = bits;
  const bytes = [];
  while (b > 0n) { bytes.push(Number(b & 0xffn)); b >>= 8n; }
  for (const byte of bytes.reverse()) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) crc = (crc & 0x80) ? ((crc << 1) ^ 0x07) & 0xff : (crc << 1) & 0xff;
  }
  return crc;
}

export function encodeProgress(state) {
  let v = 0n;
  const put = (value, width) => { v = (v << BigInt(width)) | (BigInt(value) & ((1n << BigInt(width)) - 1n)); };
  put(CODE_VERSION, 4);
  put(state.shirt || 0, LOOK_BITS.shirt);
  put(state.hair || 0, LOOK_BITS.hair);
  put(state.skin || 0, LOOK_BITS.skin);
  put(Math.max(0, SCENE_LIST.indexOf(state.scene)), 3);
  for (const f of FLAG_LIST) put(state.flags && state.flags[f] ? 1 : 0, 1);
  for (const r of ROOM_LIST) put(Math.min(2, Math.max(0, (state.levels && state.levels[r]) ?? 1)), 2);
  put(state.quiz && Number.isInteger(state.quiz.richtig) ? Math.min(5, Math.max(0, state.quiz.richtig)) : 7, QUIZ_BITS);
  put(Math.max(0, FALL_LIST.indexOf(state.fall && state.fall.taeter)), FALL_BITS);
  put(state.codes && istSaunaCode(state.codes.sauna) ? Number(state.codes.sauna) : 0, SAUNA_BITS);
  put(crc8(v), 8);
  let s = '';
  for (let i = CODE_CHARS - 1; i >= 0; i--) s += ALPHABET[Number((v >> BigInt(i * 5)) & 31n)];
  return `PG-${s.match(/.{1,4}/g).join('-')}`;
}

export function normalizeCode(text) {
  return String(text || '')
    .toUpperCase()
    .replace(/^\s*PG/, '')
    .replace(/[^0-9A-Z]/g, '')
    .replace(/O/g, '0')
    .replace(/[IL]/g, '1')
    .replace(/U/g, 'V');
}

/** Gibt { ok: true, state } oder { ok: false, reason } zurück. Version 4 und 5 werden erkannt (an der Länge). */
export function decodeProgress(text) {
  const s = normalizeCode(text);
  const layout = Object.values(LAYOUTS).find((l) => l.chars === s.length);
  if (!layout) return { ok: false, reason: 'Der Code hat nicht die richtige Länge.' };
  let v = 0n;
  for (const ch of s) {
    const i = ALPHABET.indexOf(ch);
    if (i < 0) return { ok: false, reason: 'Der Code enthält ein ungültiges Zeichen.' };
    v = (v << 5n) | BigInt(i);
  }
  const crc = Number(v & 0xffn);
  const body = v >> 8n;
  if (crc8(body) !== crc) return { ok: false, reason: 'Der Code stimmt nicht. Prüfe ihn auf Tippfehler.' };

  let pos = BigInt(layout.bits);
  const take = (width) => {
    pos -= BigInt(width);
    return Number((body >> pos) & ((1n << BigInt(width)) - 1n));
  };
  const version = take(4);
  if (LAYOUTS[version] !== layout) return { ok: false, reason: 'Dieser Code stammt aus einer anderen Spielversion.' };
  const shirt = take(LOOK_BITS.shirt);
  const hair = take(LOOK_BITS.hair);
  const skin = take(LOOK_BITS.skin);
  const scene = SCENE_LIST[take(3)] || 'empfang';
  const flags = {};
  for (const f of layout.flags) if (take(1) === 1) flags[f] = true;
  const levels = {};
  for (const r of ROOM_LIST) levels[r] = Math.min(2, take(2));
  const q = take(QUIZ_BITS);
  const quiz = q <= 5 ? { richtig: q, von: 4 } : null;
  const fall = { taeter: FALL_LIST[take(FALL_BITS)] || FALL_LIST[0] };
  const state = { shirt, hair, skin, scene, flags, levels, quiz, fall, codes: { sauna: null } };
  if (layout.sauna) {
    const c = String(take(layout.sauna));
    state.codes.sauna = istSaunaCode(c) ? c : null; // fehlt er, würfelt der Speicher einen neuen
  } else {
    migriereZweiNull(state); // Code aus der Zeit vor 2.0: Ausweis und offene Türen nachrüsten
  }
  return { ok: true, state };
}
