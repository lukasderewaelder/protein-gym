// Fundarten der Hinweiskärtchen: reine Daten und Parser (ohne Browser), damit sie sich testen lassen.
// Jede Karte in data/wissen.json hat medium, kopf, zeilen und optional vorspann und fuss.

/** Fundarten mit Anzeigename, Rahmenfarbe und Symbol (Pfade für ein 24×24-Raster, gezeichnet als Linien). */
export const FUNDARTEN = [
  { id: 'haftnotiz', name: 'Haftnotiz', farbe: '#f2d84b', pfade: ['M4 4h16v12l-4 4H4z', 'M16 20v-4h4'] },
  { id: 'karteikarte', name: 'Karteikarte', farbe: '#e27070', pfade: ['M3 6h18v12H3z', 'M6 10h12', 'M6 14h8'] },
  { id: 'schautafel', name: 'Schautafel', farbe: '#6aa8d8', pfade: ['M3 4h18v12H3z', 'M12 16v4', 'M8 20h8', 'M7 9h4', 'M13 7l4 4-4 4'] },
  { id: 'whiteboard', name: 'Whiteboard', farbe: '#9ad0f0', pfade: ['M3 4h18v12H3z', 'M8 20l2-4', 'M16 20l-2-4', 'M6 10l3 3 3-3 3 3'] },
  { id: 'heft', name: 'Heftseite', farbe: '#6a8fe0', pfade: ['M5 3h14v18H5z', 'M8 3v18', 'M11 8h5', 'M11 12h5'] },
  { id: 'plakat', name: 'Plakat', farbe: '#e89a3c', pfade: ['M5 3h14v18H5z', 'M5 8h14', 'M8 12h8', 'M8 16h8'] },
  { id: 'zeitung', name: 'Zeitungsartikel', farbe: '#b9ad94', pfade: ['M3 5h14v14H5a2 2 0 0 1-2-2z', 'M17 8h4v9a2 2 0 0 1-2 2', 'M6 8h8', 'M6 12h8', 'M6 15h5'] },
  { id: 'laborzettel', name: 'Laborzettel', farbe: '#7fc8c8', pfade: ['M5 3h14v18H5z', 'M10 7h4', 'M11 7v4l-3 6h8l-3-6V7'] },
  { id: 'protokoll', name: 'Protokoll', farbe: '#b07a50', pfade: ['M6 4h12v17H6z', 'M9 2h6v4H9z', 'M9 11h6', 'M9 15h6'] },
  { id: 'bericht', name: 'Spurenbericht', farbe: '#c8433a', pfade: ['M10 4a6 6 0 1 0 0.01 0', 'M15 15l6 6', 'M8 10h4'] },
  { id: 'schild', name: 'Hinweisschild', farbe: '#9aa4a8', pfade: ['M3 7h18v10H3z', 'M6 10h0.01', 'M18 10h0.01', 'M6 14h0.01', 'M18 14h0.01', 'M9 12h6'] },
  { id: 'rezept', name: 'Rezeptkarte', farbe: '#e0a070', pfade: ['M5 3h14v18H5z', 'M12 10a3 3 0 1 0 0.01 0', 'M8 17h8'] },
  { id: 'chat', name: 'Handy-Chat', farbe: '#4fb870', pfade: ['M4 5h16v11H10l-4 4v-4H4z', 'M8 9h8', 'M8 12h5'] },
  { id: 'etikett', name: 'Dosenetikett', farbe: '#c9a15a', pfade: ['M3 12l9-9h8v8l-9 9z', 'M16 8h0.01'] },
];

export const FUNDART_IDS = FUNDARTEN.map((f) => f.id);
const BY_ID = new Map(FUNDARTEN.map((f) => [f.id, f]));

export function fundart(id) {
  return BY_ID.get(id) || FUNDARTEN[0];
}

/** Fließtext der Karte (Vorlesen, Tests, einfache Anzeige). */
export function fundText(karte) {
  const teile = [karte.vorspann, ...(karte.zeilen || [])].filter(Boolean);
  return teile.join(' ');
}

/** Chat-Zeilen „Name: Text“. Die erste Person steht links, alle anderen rechts. */
export function parseChat(zeilen) {
  const out = [];
  let erster = null;
  for (const z of zeilen) {
    const i = z.indexOf(': ');
    if (i < 1) continue;
    const von = z.slice(0, i);
    if (erster === null) erster = von;
    out.push({ von, text: z.slice(i + 2), seite: von === erster ? 'links' : 'rechts' });
  }
  return out;
}

/** Protokoll-Zeilen „F: Frage“ und „A: Antwort“. */
export function parseProtokoll(zeilen) {
  const out = [];
  for (const z of zeilen) {
    const m = /^([FA]): (.*)$/.exec(z);
    if (m) out.push({ art: m[1], text: m[2] });
  }
  return out;
}

/** Tafel-Zeilen „Name | Rest“. Zeilen ohne „ | “ sind Erklärtext und werden hier nicht geliefert. */
export function parseSteckbrief(zeilen) {
  return zeilen.filter((z) => z.includes(' | ')).map((z) => {
    const teile = z.split(' | ').map((t) => t.trim());
    return { name: teile[0], felder: teile.slice(1) };
  });
}

/** Erklärzeilen einer Schautafel (alle Zeilen ohne „ | “). */
export function tafelText(zeilen) {
  return zeilen.filter((z) => !z.includes(' | '));
}

/** Formularzeilen „Feld: Wert“; Zeilen ohne Doppelpunkt am Anfang werden zu freiem Text. */
export function parseFelder(zeilen) {
  return zeilen.map((z) => {
    const m = /^([A-ZÄÖÜ][\wäöüß ]{1,18}): (.*)$/.exec(z);
    return m ? { label: m[1], wert: m[2] } : { label: '', wert: z };
  });
}

/** Zusatzkarten sind lila gekennzeichnet. */
export const istZusatz = (karte) => karte.typ === 'zusatz';
