// Verschlüsselte Lehrkräfte-Seite: Klartext inhalt/lehrkraft-quelle.html (nur lokal, .gitignore) <-> Paket in lehrkraft.html.
// Aufruf: node tools/lehrkraft-seite.mjs einpacken   -> Klartext verschlüsseln und in lehrkraft.html eintragen (nur wenn er sich geändert hat)
//         node tools/lehrkraft-seite.mjs auspacken   -> Klartext aus lehrkraft.html zurückholen (anderer Rechner, Datei verloren)
//         node tools/lehrkraft-seite.mjs --check     -> Exit-Code 1, wenn lehrkraft.html nicht zum lokalen Klartext passt
// Passwort: Standard ist das öffentliche Standard-Klassenwort; ein anderes über die Umgebungsvariable LEHRKRAFT_WORT (nie in eine Datei schreiben).
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { verschluesseln, entschluesseln } from '../src/state/tresor.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
export const SEITE = join(root, 'lehrkraft.html');
export const QUELLE = join(root, 'inhalt', 'lehrkraft-quelle.html');
export const STANDARD_WORT = 'Proteine';
const PAKET_RE = /(<!-- >>> paket -->\n)([\s\S]*?)(\n<!-- <<< paket -->)/;

const wort = () => process.env.LEHRKRAFT_WORT || STANDARD_WORT;
const lf = (s) => s.replace(/\r\n/g, '\n');

export function lesePaket(html = readFileSync(SEITE, 'utf8')) {
  const m = PAKET_RE.exec(lf(html));
  if (!m) throw new Error('lehrkraft.html: Marken „>>> paket“ / „<<< paket“ fehlen');
  return JSON.parse(m[2]);
}

export async function klartextDerSeite(w = wort()) {
  const paket = lesePaket();
  const r = paket.daten ? await entschluesseln(paket, w) : null;
  return r ? r.text : null;
}

async function einpacken() {
  if (!existsSync(QUELLE)) throw new Error(`${QUELLE} fehlt (erst „auspacken“)`);
  const text = lf(readFileSync(QUELLE, 'utf8'));
  const alt = lesePaket();
  if (alt.daten && (await klartextDerSeite()) === text) { console.log('lehrkraft.html ist aktuell.'); return; }
  // Salz behalten: Wer „angemeldet bleiben“ gewählt hat, bleibt es auch nach einer Änderung (gleiches Passwort, gleicher Schlüssel)
  const paket = await verschluesseln(text, wort(), alt.salz ? { salz: alt.salz, iterationen: alt.iterationen } : {});
  const html = lf(readFileSync(SEITE, 'utf8')).replace(PAKET_RE, (_, a, __, c) => a + JSON.stringify(paket) + c);
  writeFileSync(SEITE, html);
  console.log('lehrkraft.html neu verschlüsselt.');
}

async function auspacken() {
  const text = await klartextDerSeite();
  if (text === null) throw new Error('Entschlüsseln ging nicht (falsches Passwort? LEHRKRAFT_WORT setzen).');
  if (existsSync(QUELLE) && lf(readFileSync(QUELLE, 'utf8')) !== text && !process.argv.includes('--force')) {
    throw new Error(`${QUELLE} existiert und weicht ab. Erst einpacken oder mit --force überschreiben.`);
  }
  writeFileSync(QUELLE, text);
  console.log(`Klartext liegt in ${QUELLE}`);
}

async function pruefe() {
  const text = await klartextDerSeite();
  if (text === null) { console.error('lehrkraft.html lässt sich nicht entschlüsseln.'); process.exit(1); }
  if (existsSync(QUELLE) && lf(readFileSync(QUELLE, 'utf8')) !== text) {
    console.error('lehrkraft.html passt nicht zu inhalt/lehrkraft-quelle.html. Bitte: node tools/lehrkraft-seite.mjs einpacken');
    process.exit(1);
  }
  console.log('lehrkraft.html ist aktuell.');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const befehl = process.argv[2];
  const lauf = befehl === 'einpacken' ? einpacken : befehl === 'auspacken' ? auspacken : befehl === '--check' ? pruefe : null;
  if (!lauf) { console.error('Befehl: einpacken | auspacken [--force] | --check'); process.exit(2); }
  lauf().catch((e) => { console.error(e.message); process.exit(1); });
}
