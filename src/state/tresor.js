// Verschlüsselte Lehrkräfte-Seite (Wunsch der Lehrkraft 2026-11-18): Der Inhalt von lehrkraft.html liegt nur verschlüsselt im Repo.
// AES-GCM 256, Schlüssel per PBKDF2-SHA-256 aus dem Passwort (eigenes Salz, damit er nie dem Schlüssel der Versuchscodes gleicht).
// Läuft im Browser und in Node (Web Crypto). Eine Hürde gegen Neugierige: Das Spiel selbst ist öffentlicher Quelltext.

export const TRESOR_ITERATIONEN = 250000;

const enc = new TextEncoder();
const dec = new TextDecoder();

function zuHex(bytes) { return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join(''); }
function ausHex(hex) { return new Uint8Array((hex.match(/../g) || []).map((x) => parseInt(x, 16))); }
function zuB64(bytes) {
  let s = '';
  const u = new Uint8Array(bytes);
  for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000));
  return btoa(s);
}
function ausB64(b64) { return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)); }

/** Rohschlüssel (32 Byte, hex) aus Passwort und Salz des Pakets. Merkt sich die Seite „angemeldet bleiben“, speichert sie nur diesen. */
export async function tresorSchluessel(wort, paket) {
  const basis = await crypto.subtle.importKey('raw', enc.encode(String(wort)), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: ausHex(paket.salz), iterations: paket.iterationen }, basis, 256);
  return zuHex(bits);
}

async function aesSchluessel(hex) {
  return crypto.subtle.importKey('raw', ausHex(hex), 'AES-GCM', false, ['encrypt', 'decrypt']);
}

/** Text verschlüsseln. Gibt das Paket { v, salz, iv, iterationen, daten } zurück (alles Text, für JSON). */
export async function verschluesseln(text, wort, { iterationen = TRESOR_ITERATIONEN, salz, iv } = {}) {
  const paket = {
    v: 1,
    salz: salz || zuHex(crypto.getRandomValues(new Uint8Array(16))),
    iv: iv || zuHex(crypto.getRandomValues(new Uint8Array(12))),
    iterationen,
  };
  const key = await aesSchluessel(await tresorSchluessel(wort, paket));
  const daten = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: ausHex(paket.iv) }, key, enc.encode(text));
  return { ...paket, daten: zuB64(daten) };
}

/** Mit dem Rohschlüssel (hex) entschlüsseln. Falscher Schlüssel: null. */
export async function entschluesselnMitSchluessel(paket, hex) {
  try {
    const key = await aesSchluessel(hex);
    const klar = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: ausHex(paket.iv) }, key, ausB64(paket.daten));
    return dec.decode(klar);
  } catch {
    return null;
  }
}

/** Mit dem Passwort entschlüsseln. Gibt { text, schluessel } zurück, bei falschem Passwort null. */
export async function entschluesseln(paket, wort) {
  const schluessel = await tresorSchluessel(wort, paket);
  const text = await entschluesselnMitSchluessel(paket, schluessel);
  return text === null ? null : { text, schluessel };
}

/** SHA-256 als hex (Prüfwert für die Freigabe des Lehrkraft-Modus im Spiel). */
export async function sha256(text) {
  return zuHex(await crypto.subtle.digest('SHA-256', enc.encode(String(text))));
}
