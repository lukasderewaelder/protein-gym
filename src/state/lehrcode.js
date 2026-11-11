// Zeitbasierte Codes nach dem echten Versuch (Prinzip wie bei einem Authenticator, TOTP).
// Die Lehrkraft-Seite und das Spiel berechnen aus demselben geheimen Klassenwort denselben sechsstelligen Code, der sich alle
// `sekunden` Sekunden ändert. Im Quelltext steht nie das Klassenwort, nur ein Prüfwert (PBKDF2-Hash), mit dem das Spiel erkennt,
// ob ein eingegebenes Wort das richtige ist. Der HMAC-Schlüssel wird mit anderem Salz aus dem Wort abgeleitet und nur auf den Geräten gespeichert.
// Läuft im Browser und in Node (globalThis.crypto.subtle). Reine Funktionen, die Zeit kommt als Parameter.

const enc = new TextEncoder();
const SALZ_PRUEFWERT = 'protein-gym-klassenwort-pruefwert-v1';
const SALZ_SCHLUESSEL = 'protein-gym-klassenwort-schluessel-v1';

export const ITERATIONEN = 600000;
/** Vorgaben, falls data/versuch.json (codeZeit) etwas nicht nennt. */
export const CODE_ZEIT = { sekunden: 30, vorher: 1, nachher: 1, stellen: 6 };

const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
const unhex = (s) => Uint8Array.from(s.match(/../g) || [], (h) => parseInt(h, 16));

async function pbkdf2(wort, salz, iterationen) {
  const roh = await globalThis.crypto.subtle.importKey('raw', enc.encode(String(wort).normalize('NFC').trim()), 'PBKDF2', false, ['deriveBits']);
  const bits = await globalThis.crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode(salz), iterations: iterationen }, roh, 256);
  return hex(bits);
}

/** Prüfwert eines Klassenworts (steht in data/versuch.json unter klassenwort.hash). */
export function pruefwertVon(wort, iterationen = ITERATIONEN) {
  return pbkdf2(wort, SALZ_PRUEFWERT, iterationen);
}

/** HMAC-Schlüssel (Hex) aus dem Klassenwort; er wird auf dem Gerät gespeichert, nicht das Wort. */
export function schluesselAus(wort, iterationen = ITERATIONEN) {
  return pbkdf2(wort, SALZ_SCHLUESSEL, iterationen);
}

/** Gehört das Wort zum Prüfwert? */
export async function wortPasst(wort, pruefwert, iterationen = ITERATIONEN) {
  return Boolean(pruefwert) && (await pruefwertVon(wort, iterationen)) === pruefwert;
}

/** Nummer des Zeitschritts zu einem Zeitpunkt (Millisekunden). */
export function schrittVon(zeitMs, sekunden = CODE_ZEIT.sekunden) {
  return Math.floor(zeitMs / 1000 / sekunden);
}

/** Sekunden bis zum nächsten Wechsel des Codes (1 bis `sekunden`). */
export function restSekunden(zeitMs, sekunden = CODE_ZEIT.sekunden) {
  return Math.ceil(sekunden - ((zeitMs / 1000) % sekunden)) || sekunden;
}

/** Code für einen Versuch („A“ Hitze, „L“ Lieferung) und einen Zeitschritt. Sechs Ziffern wie beim HOTP-Verfahren. */
export async function codeFuer(schluesselHex, versuchId, schritt, stellen = CODE_ZEIT.stellen) {
  const key = await globalThis.crypto.subtle.importKey('raw', unhex(schluesselHex), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = new Uint8Array(await globalThis.crypto.subtle.sign('HMAC', key, enc.encode(`${versuchId}:${schritt}`)));
  const o = mac[mac.length - 1] & 15;
  const zahl = (((mac[o] & 0x7f) << 24) | (mac[o + 1] << 16) | (mac[o + 2] << 8) | mac[o + 3]) % 10 ** stellen;
  return String(zahl).padStart(stellen, '0');
}

/** Der Code, der gerade gilt (für die Lehrkraft-Seite). */
export function aktuellerCode(schluesselHex, versuchId, zeitMs, cfg = {}) {
  const c = { ...CODE_ZEIT, ...cfg };
  return codeFuer(schluesselHex, versuchId, schrittVon(zeitMs, c.sekunden), c.stellen);
}

/**
 * Stimmt die Eingabe mit dem Code des aktuellen, vorherigen oder nächsten Zeitschritts überein?
 * Gibt den passenden Zeitschritt zurück (der aktuelle zuerst) oder null. Die Toleranz deckt Tippzeit und kleine Uhr-Abweichungen ab.
 */
export async function pruefeCode(schluesselHex, versuchId, eingabe, zeitMs, cfg = {}) {
  const c = { ...CODE_ZEIT, ...cfg };
  const e = String(eingabe || '').replace(/\s+/g, '');
  if (!new RegExp(`^[0-9]{${c.stellen}}$`).test(e)) return null;
  const jetzt = schrittVon(zeitMs, c.sekunden);
  const reihe = [0];
  for (let d = 1; d <= Math.max(c.vorher, c.nachher); d++) {
    if (d <= c.vorher) reihe.push(-d);
    if (d <= c.nachher) reihe.push(d);
  }
  for (const d of reihe) {
    if ((await codeFuer(schluesselHex, versuchId, jetzt + d, c.stellen)) === e) return jetzt + d;
  }
  return null;
}

/** Wurde dieser Zeitschritt auf diesem Gerät für den Versuch noch nicht benutzt? */
export function schrittFrei(benutzt, versuchId, schritt) {
  return !((benutzt || {})[versuchId] || []).includes(schritt);
}

/** Zeitschritt als benutzt merken (gibt ein neues Objekt zurück; es bleiben nur die letzten Schritte). */
export function schrittMerken(benutzt, versuchId, schritt) {
  const alt = (benutzt || {})[versuchId] || [];
  return { ...(benutzt || {}), [versuchId]: [...alt, schritt].slice(-20) };
}
