// Hefter-Texte als Markdown: inhalt/hefter.md ist die Quelle, data/hefter.json wird daraus gebaut (das Spiel liest nur die JSON).
// Aufruf:  node tools/hefter-md.mjs            -> data/hefter.json aus inhalt/hefter.md bauen
//          node tools/hefter-md.mjs --check    -> Exit-Code 1, wenn data/hefter.json nicht zur MD passt
//          node tools/hefter-md.mjs export     -> inhalt/hefter.md einmalig aus data/hefter.json erzeugen (nur mit --force überschreiben)
// Format der MD-Datei: siehe Kopfkommentar, den `nachMd` schreibt. Die Rundreise JSON → MD → JSON ist verlustfrei (Test hefter-md).

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
export const MD_PFAD = join(root, 'inhalt', 'hefter.md');
export const JSON_PFAD = join(root, 'data', 'hefter.json');

const ALLGEMEIN = [
  ['Blatt-Titel', (h) => h.blatt && h.blatt.titel],
  ['Hinweis über dem Blatt', (h) => h.hinweis],
  ['Arbeitsauftrag oben im Spind', (h) => h.arbeitsauftrag],
  ['Meldung bei einem neuen Eintrag', (h) => h.hinweisNeu],
];

const KOPF = `# Hefter-Texte des Protein-Gyms

Diese Datei ist die Quelle der Hefter-Texte. Das Spiel liest data/hefter.json, die aus dieser Datei gebaut wird (node tools/hefter-md.mjs oder npm run hefter). Alles vor „# Allgemein“ ist nur Erklärung und wird nicht eingelesen.

Bitte nur die Texte ändern; die Zeichen am Zeilenanfang haben eine Bedeutung:

- „# Eintrag …“: Titel eines Eintrags (so steht er im Spind). Darunter „Dauer: …“ (Zeit zum Abschreiben).
- „## Anweisungen“: was die Lernenden tun sollen, je Zeile mit „- “ ein Satz.
- „## Blatt“: der Text, der genau so in den Hefter kommt:
  - „### …“: grüne Teilüberschrift
  - eine Zeile Text: ein Absatz (darf über mehrere Zeilen gehen, bis zur nächsten Leerzeile)
  - Text mit „- “-Zeilen direkt darunter: Einleitungssatz mit Stichpunkten
  - „> **Merke: …** …“: roter Merksatz-Kasten
  - „**…**“ mit „| … |“-Zeilen darunter: Tabelle mit fetter Überschrift (erste Zeile ist der Kopf, die Zeile mit --- nicht ändern)
  - Block „abbildung“ zwischen drei Backticks: Zeichnung (art und formeln sind technisch, label und unterschrift sind Text)
- Zwischen den Teilen steht immer eine Leerzeile. Die unsichtbare Zeile mit „id:“ unter jedem Eintrag bitte nicht ändern.
`;

// ---------- JSON → MD ----------
export function nachMd(h) {
  const z = [KOPF, '# Allgemein', ''];
  for (const [name, wert] of ALLGEMEIN) {
    const v = wert(h);
    if (v == null) continue;
    z.push(`## ${name}`, v, '');
  }
  for (const e of h.eintraege) {
    z.push(`# ${e.titel}`, `<!-- id: ${e.id} · ab: ${e.ab} · sperrt: ${e.sperrt} · erledigtMit: ${e.erledigtMit} -->`);
    if (e.dauer) z.push(`Dauer: ${e.dauer}`);
    z.push('', '## Anweisungen', ...e.anweisungen.map((a) => `- ${a}`), '', '## Blatt', '');
    for (const t of e.teile) {
      if (t.ueb) z.push(`### ${t.ueb}`, '');
      if (t.typ === 'text') z.push(t.text);
      else if (t.typ === 'liste') z.push(...(t.einleitung ? [t.einleitung] : []), ...t.punkte.map((p) => `- ${p}`));
      else if (t.typ === 'merksatz') z.push(`> **${t.merke ? `Merke: ${t.merke}` : 'Merke'}** ${t.text}`);
      else if (t.typ === 'tabelle') {
        if (t.label) z.push(`**${t.label}**`);
        z.push(`| ${t.kopf.join(' | ')} |`, `|${t.kopf.map(() => '---').join('|')}|`, ...t.zeilen.map((r) => `| ${r.join(' | ')} |`));
      } else if (t.typ === 'abbildung') {
        z.push('```abbildung', `art: ${t.art}`);
        if (t.label) z.push(`label: ${t.label}`);
        if (t.formeln) z.push(`formeln: ${t.formeln.map(([n, r]) => `${n} = ${r}`).join('; ')}`);
        if (t.unterschrift) z.push(`unterschrift: ${t.unterschrift}`);
        z.push('```');
      } else throw new Error(`Unbekannter Teil: ${t.typ}`);
      z.push('');
    }
  }
  return `${z.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd()}\n`;
}

// ---------- MD → JSON ----------
/** Blöcke = durch Leerzeilen getrennte Zeilengruppen; ein ```-Block bleibt zusammen. Kommentare fallen weg (außer der id-Zeile). */
function bloecke(zeilen) {
  const out = [];
  let akt = [];
  let imZaun = false;
  const schliesse = () => { if (akt.length) out.push(akt); akt = []; };
  for (const roh of zeilen) {
    const l = roh.replace(/\s+$/, '');
    if (imZaun) { akt.push(l); if (l.startsWith('```')) { imZaun = false; schliesse(); } continue; }
    if (l.startsWith('```')) { schliesse(); akt.push(l); imZaun = true; continue; }
    if (!l.trim()) { schliesse(); continue; }
    akt.push(l);
  }
  schliesse();
  return out;
}

const ohneKommentare = (text) => text.replace(/<!--(?!\s*id:)[\s\S]*?-->/g, '');

function teilAus(block, ueb) {
  const mitUeb = (typ, rest) => (ueb ? { typ, ueb, ...rest } : { typ, ...rest });
  const erste = block[0];
  if (erste.startsWith('```abbildung')) {
    const f = {};
    for (const l of block.slice(1, -1)) { const m = /^(\w+):\s?(.*)$/.exec(l); if (m) f[m[1]] = m[2]; }
    const teil = {};
    if (f.label) teil.label = f.label;
    teil.art = f.art;
    if (f.formeln) teil.formeln = f.formeln.split(';').map((s) => s.split('=').map((x) => x.trim()));
    if (f.unterschrift) teil.unterschrift = f.unterschrift;
    return mitUeb('abbildung', teil);
  }
  if (erste.startsWith('> ')) {
    const satz = block.map((l) => l.replace(/^>\s?/, '')).join(' ');
    const m = /^\*\*Merke(?::\s*(.+?))?\*\*\s*(.*)$/.exec(satz);
    if (!m) throw new Error(`Merksatz ohne **Merke**: ${satz.slice(0, 60)}`);
    return mitUeb('merksatz', m[1] ? { merke: m[1], text: m[2] } : { text: m[2] });
  }
  const tabStart = block.findIndex((l) => l.startsWith('|'));
  if (tabStart >= 0) {
    const label = tabStart === 1 && /^\*\*(.+)\*\*$/.exec(block[0]);
    const zellen = (l) => l.split('|').slice(1, -1).map((c) => c.trim());
    const rows = block.slice(tabStart).filter((l) => !/^\|\s*-{3,}/.test(l)).map(zellen);
    return mitUeb('tabelle', { ...(label ? { label: label[1] } : {}), kopf: rows[0], zeilen: rows.slice(1) });
  }
  const punktStart = block.findIndex((l) => l.startsWith('- '));
  if (punktStart >= 0) {
    const einleitung = block.slice(0, punktStart).join(' ');
    return mitUeb('liste', { ...(einleitung ? { einleitung } : {}), punkte: block.slice(punktStart).map((l) => l.slice(2)) });
  }
  return mitUeb('text', { text: block.join(' ') });
}

export function ausMd(text) {
  const zeilen = ohneKommentare(text.replace(/\r\n/g, '\n')).split('\n');
  const h = {};
  const eintraege = [];
  let e = null;
  let bereich = null; // 'allgemein' | 'anweisungen' | 'blatt' | 'kopf'
  let feld = null;
  let puffer = [];
  let begonnen = false;
  const allgemeinSetzen = () => {
    if (bereich !== 'allgemein' || !feld) return;
    const wert = puffer.join(' ').trim();
    if (feld === 'Blatt-Titel') h.blatt = { titel: wert };
    else if (feld === 'Hinweis über dem Blatt') h.hinweis = wert;
    else if (feld === 'Arbeitsauftrag oben im Spind') h.arbeitsauftrag = wert;
    else if (feld === 'Meldung bei einem neuen Eintrag') h.hinweisNeu = wert;
    else throw new Error(`Unbekanntes Feld unter „Allgemein“: ${feld}`);
    puffer = [];
  };
  let blattZeilen = [];
  const blattAbschliessen = () => {
    if (!e || !blattZeilen.length) return;
    let ueb = null;
    for (const b of bloecke(blattZeilen)) {
      if (b.length === 1 && b[0].startsWith('### ')) { ueb = b[0].slice(4).trim(); continue; }
      e.teile.push(teilAus(b, ueb));
      ueb = null;
    }
    blattZeilen = [];
  };
  for (const l of zeilen) {
    if (/^# /.test(l)) {
      allgemeinSetzen(); blattAbschliessen();
      const titel = l.slice(2).trim();
      if (titel === 'Allgemein') { begonnen = true; bereich = 'allgemein'; feld = null; e = null; continue; }
      if (!begonnen) continue; // alles vor „# Allgemein“ ist Erklärung
      e = { id: null, titel, ab: null, sperrt: null, erledigtMit: null, anweisungen: [], teile: [] };
      eintraege.push(e);
      bereich = 'kopf';
      continue;
    }
    if (bereich === 'allgemein') {
      if (/^## /.test(l)) { allgemeinSetzen(); feld = l.slice(3).trim(); continue; }
      if (l.trim()) puffer.push(l.trim());
      continue;
    }
    if (!e) continue;
    const meta = /^<!--\s*id:\s*(.+?)\s*-->$/.exec(l.trim());
    if (meta) {
      for (const teil of `id: ${meta[1]}`.split('·')) {
        const m = /^\s*(\w+):\s*(.+?)\s*$/.exec(teil);
        if (m) e[m[1]] = m[2];
      }
      continue;
    }
    if (/^## Anweisungen/.test(l)) { blattAbschliessen(); bereich = 'anweisungen'; continue; }
    if (/^## Blatt/.test(l)) { bereich = 'blatt'; continue; }
    if (bereich === 'kopf') { const d = /^Dauer:\s*(.+)$/.exec(l); if (d) e.dauer = d[1].trim(); continue; }
    if (bereich === 'anweisungen') { if (l.startsWith('- ')) e.anweisungen.push(l.slice(2).trim()); continue; }
    if (bereich === 'blatt') blattZeilen.push(l);
  }
  allgemeinSetzen(); blattAbschliessen();
  // Feste Reihenfolge der Felder, wie bisher in data/hefter.json
  h.eintraege = eintraege.map((x) => {
    const o = { id: x.id, titel: x.titel, ab: x.ab, sperrt: x.sperrt, erledigtMit: x.erledigtMit };
    if (x.dauer) o.dauer = x.dauer;
    o.anweisungen = x.anweisungen;
    o.teile = x.teile;
    for (const k of ['id', 'ab', 'sperrt', 'erledigtMit']) if (!o[k]) throw new Error(`${x.titel}: ${k} fehlt (Zeile <!-- id: … -->)`);
    return o;
  });
  const { blatt, hinweis, arbeitsauftrag, hinweisNeu, eintraege: ein } = h;
  return { blatt, hinweis, arbeitsauftrag, hinweisNeu, eintraege: ein };
}

export const alsJson = (obj) => `${JSON.stringify(obj, null, 2)}\n`;

// ---------- Kommandozeile ----------
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  if (args[0] === 'export') {
    if (existsSync(MD_PFAD) && !args.includes('--force')) { console.error(`${MD_PFAD} gibt es schon (überschreiben mit --force).`); process.exit(1); }
    mkdirSync(dirname(MD_PFAD), { recursive: true });
    writeFileSync(MD_PFAD, nachMd(JSON.parse(readFileSync(JSON_PFAD, 'utf8'))));
    console.log(`geschrieben: ${MD_PFAD}`);
  } else {
    const neu = alsJson(ausMd(readFileSync(MD_PFAD, 'utf8')));
    const alt = existsSync(JSON_PFAD) ? readFileSync(JSON_PFAD, 'utf8') : '';
    if (args.includes('--check')) {
      if (neu !== alt) { console.error('data/hefter.json passt nicht zu inhalt/hefter.md (node tools/hefter-md.mjs ausführen).'); process.exit(1); }
      console.log('data/hefter.json ist aktuell.');
    } else {
      writeFileSync(JSON_PFAD, neu);
      console.log(neu === alt ? 'data/hefter.json war schon aktuell.' : 'data/hefter.json neu gebaut.');
    }
  }
}
