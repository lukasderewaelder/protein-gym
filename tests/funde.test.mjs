// Fundstücke: jede Hinweiskarte hat eine Fundart mit eigenem Aussehen und eigenem Tonfall.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { FUNDARTEN, FUNDART_IDS, fundart, fundText, parseChat, parseProtokoll, parseSteckbrief, tafelText, parseFelder, istZusatz } from '../src/ui/funde-core.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const W = JSON.parse(readFileSync(join(root, 'data/wissen.json'), 'utf8'));
const CSS = readFileSync(join(root, 'assets/css/funde.css'), 'utf8');
const karten = W.karten;

test('Jede Karte hat Fundart, Kopf, Zeilen und Buchverweis', () => {
  for (const k of karten) {
    assert.ok(FUNDART_IDS.includes(k.medium), `${k.id}: unbekannte Fundart ${k.medium}`);
    assert.ok(k.kopf && k.kopf.length > 2, `${k.id}: kopf`);
    assert.ok(Array.isArray(k.zeilen) && k.zeilen.length >= 2, `${k.id}: zeilen`);
    for (const z of k.zeilen) assert.ok(typeof z === 'string' && z.length > 3, `${k.id}: leere Zeile`);
    assert.ok(k.titel && k.ort && k.raum, `${k.id}: Titel, Ort, Raum`);
    assert.equal(k.text, undefined, `${k.id}: altes Feld „text“ entfernt`);
  }
});

test('Vielfalt: mindestens 12 Fundarten, jede höchstens zweimal', () => {
  const zaehler = {};
  for (const k of karten) zaehler[k.medium] = (zaehler[k.medium] || 0) + 1;
  assert.ok(Object.keys(zaehler).length >= 12, `nur ${Object.keys(zaehler).length} Fundarten`);
  for (const [m, n] of Object.entries(zaehler)) assert.ok(n <= 2, `${m} kommt ${n}-mal vor`);
});

test('Zusatzkarten sind erkennbar markiert', () => {
  const zusatz = karten.filter(istZusatz);
  assert.ok(zusatz.length >= 4);
  for (const k of zusatz) assert.match(k.titel, /Zusatzwissen/, k.id);
  assert.ok(karten.filter((k) => !istZusatz(k)).every((k) => k.typ === 'pflicht'));
});

test('Jede Fundart hat Symbol, Farbe und CSS-Klasse', () => {
  assert.equal(new Set(FUNDART_IDS).size, FUNDARTEN.length);
  for (const f of FUNDARTEN) {
    assert.ok(f.pfade.length >= 2 && f.pfade.every((p) => /^M/.test(p)), `${f.id}: Pfade`);
    assert.match(f.farbe, /^#[0-9a-f]{6}$/i, `${f.id}: Farbe`);
    assert.match(CSS, new RegExp(`\\.fund\\.${f.id}\\b`), `${f.id}: CSS-Klasse fehlt`);
  }
  assert.equal(fundart('gibt-es-nicht').id, FUNDARTEN[0].id, 'Rückfall auf die erste Fundart');
});

test('Chat-Funde: Zeilen „Name: Text“, zwei Sprecher, erste Person links', () => {
  for (const k of karten.filter((x) => x.medium === 'chat')) {
    const m = parseChat(k.zeilen);
    assert.equal(m.length, k.zeilen.length, `${k.id}: jede Zeile ist eine Nachricht`);
    assert.ok(new Set(m.map((x) => x.von)).size >= 2, `${k.id}: mindestens zwei Sprecher`);
    assert.equal(m[0].seite, 'links');
    assert.ok(m.some((x) => x.seite === 'rechts'));
  }
  assert.deepEqual(parseChat(['A: hi', 'B: ho', 'A: hey']).map((x) => x.seite), ['links', 'rechts', 'links']);
  assert.deepEqual(parseChat(['kein Doppelpunkt']), []);
});

test('Protokoll-Funde: Frage und Antwort im Wechsel', () => {
  for (const k of karten.filter((x) => x.medium === 'protokoll')) {
    const p = parseProtokoll(k.zeilen);
    assert.equal(p.length, k.zeilen.length);
    assert.deepEqual(p.map((x) => x.art), p.map((_, i) => (i % 2 ? 'A' : 'F')));
  }
});

test('Schautafel und Formulare lassen sich in Teile zerlegen', () => {
  const tafel = karten.find((k) => k.medium === 'schautafel');
  const formeln = parseSteckbrief(tafel.zeilen);
  assert.deepEqual(formeln.map((s) => s.name), ['Glycin (Gly)', 'Alanin (Ala)']);
  assert.deepEqual(formeln.map((s) => s.felder), [['H'], ['CH₃']]);
  assert.ok(tafelText(tafel.zeilen).length >= 2, 'Erklärzeilen unter den Formeln');
  assert.match(tafelText(tafel.zeilen).join(' '), /Grundgerüst/);
  assert.match(tafelText(tafel.zeilen).join(' '), /Rest R/);
  assert.match(tafelText(tafel.zeilen).join(' '), /Aminogruppe/);
  assert.match(tafelText(tafel.zeilen).join(' '), /Carboxygruppe/);
  for (const k of karten.filter((x) => ['laborzettel', 'bericht', 'etikett'].includes(x.medium))) {
    const f = parseFelder(k.zeilen);
    assert.ok(f.filter((x) => x.label).length >= 2, `${k.id}: mindestens zwei beschriftete Felder`);
  }
  assert.deepEqual(parseFelder(['Probe: Eiklar', 'frei']), [{ label: 'Probe', wert: 'Eiklar' }, { label: '', wert: 'frei' }]);
});

test('Zeitungsfunde haben Vorspann, Lauftext in mindestens zwei Absätzen', () => {
  for (const k of karten.filter((x) => x.medium === 'zeitung')) {
    assert.ok(k.vorspann, `${k.id}: Vorspann`);
    assert.ok(k.zeilen.length >= 2);
  }
  assert.match(fundText({ vorspann: 'A.', zeilen: ['B.', 'C.'] }), /^A\. B\. C\.$/);
});

test('Leitplanken gelten auch in den Funden: keine Enzyme, keine Körper- und Kalorienzahlen, keine realen Namen', () => {
  const alles = JSON.stringify(karten);
  assert.doesNotMatch(alles, /Katalysator|Enzym|Xanthoprotein/i);
  assert.doesNotMatch(alles, /Kalorie|kcal|\bkg\b|Körperfett|Sixpack|abnehmen/i);
  assert.doesNotMatch(alles, /Rühl|Arnold|Schwarzenegger/i);
});

test('Fachkerne bleiben in den umformulierten Funden erhalten', () => {
  const text = (id) => fundText(karten.find((k) => k.id === id));
  assert.match(text('k_protein'), /Protein = Eiweiß/);
  assert.match(text('k_bauplan'), /Aminosäuren sind die Bausteine der Proteine/);
  assert.match(text('k_denat'), /gerinnt/);
  assert.match(text('k_ausloeser'), /Hitze \(ab etwa 60 Grad\) lässt Eiweiß denaturieren.*Salzsäure.*Ethanol.*Kupfersulfat-Lösung.*Kontrollprobe/s);
  // Vor dem echten Versuch wird die Lösung nicht verraten: Nur Hitze ist als Beispiel bekannt, die anderen Stoffe werden nur eingeordnet
  assert.doesNotMatch(text('k_ausloeser'), /(Salzsäure|Säure|Ethanol|Alkohol|Kupfersulfat|Schwermetall)[^.]*(lässt|lassen)[^.]*(denaturier|gerinn)/);
  assert.match(text('k_biuret'), /Violett = Eiweiß/);
  assert.match(text('z_ninhydrin'), /Ninhydrin weist Aminosäuren nach/);
  assert.match(text('k_umkehr'), /nicht umkehrbar/);
  assert.match(text('z_peptid'), /n − 1/);
});

test('Eiklar wird nie zu Eiweiß und wird nicht selbst fest: fest wird das Eiweiß im Eiklar', async () => {
  const { readdirSync } = await import('node:fs');
  const dateien = [
    ...readdirSync(join(root, 'data')).filter((f) => f.endsWith('.json')).map((f) => join(root, 'data', f)),
    ...['src/main.js', 'src/tasks/check.js', 'src/tasks/m4-types.js', 'src/tasks/labor-types.js'].map((f) => join(root, f)),
  ];
  const falsch = [
    /aus (klarem |flüssigem |klarem, flüssigem )?Eiklar wird [^.]*Eiweiß/i,
    /(?<!Eiweiß im (klaren, flüssigen |klaren )?)Eiklar (wird|stockt|gerinnt)/i,
  ];
  for (const f of dateien) {
    const s = readFileSync(f, 'utf8');
    for (const satz of s.split(/(?<=[.!?“"])\s/)) {
      for (const muster of falsch) assert.doesNotMatch(satz, muster, `${f}: ${satz.slice(0, 120)}`);
    }
  }
});

test('Geblätterte Karten lassen Platz für Leiste und Knopf (sonst kommt man aus Handy-Chats nicht mehr heraus)', () => {
  const css = readFileSync(new URL('../assets/css/funde.css', import.meta.url), 'utf8');
  for (const regel of ['.fund.geblaettert {', '.fund.geblaettert.ganz {']) {
    const zeile = css.split(/\r?\n/).find((z) => z.startsWith(regel) && /dvh/.test(z));
    assert.ok(zeile, `${regel} begrenzt die Höhe mit dvh`);
    assert.match(zeile, /min\(76vh, calc\(100dvh - 2\d\dpx\)\)/, 'Höhe = Bildschirm minus Platz für Titel, Leiste und Knopf');
  }
});
