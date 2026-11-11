// Vorwissen: Karten und Glossar nennen nur Begriffe, die in einem früheren Raum (oder in der Karte selbst) eingeführt wurden.
// Reihenfolge der Räume: Empfang < Labor < Sauna < Trainingsfläche < Shake-Bar. Im selben Raum ist die Reihenfolge frei,
// deshalb darf eine Karte Begriffe aus dem eigenen Raum nur benutzen, wenn sie die Begriffe selbst einführt.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const W = JSON.parse(readFileSync(join(root, 'data/wissen.json'), 'utf8'));
const G = JSON.parse(readFileSync(join(root, 'data/glossar.json'), 'utf8'));
const RAEUME = ['empfang', 'labor', 'sauna', 'training', 'shakebar'];

/** Begriff (Muster), Raum der Einführung, Karten-IDs, die ihn einführen dürfen. */
const BEGRIFFE = [
  { name: 'Aminosäure', re: /Aminosäure/, raum: 'training', ein: ['k_bauplan', 'k_rest', 'k_kette', 'k_struktur', 'z_peptid', 'z_essentiell', 'z_ninhydrin'] },
  { name: 'Grundgerüst/Rest R', re: /Grundgerüst|Rest R|Rest \(R\)/, raum: 'training', ein: ['k_bauplan', 'k_rest'] },
  { name: 'Wasserabspaltung', re: /Wasserabspaltung|Wassermolekül/, raum: 'training', ein: ['k_bauplan', 'z_peptid'] },
  { name: 'Peptid', re: /Peptid/, raum: 'training', ein: ['z_peptid'] },
  { name: 'Kondensation', re: /Kondensation/, raum: 'training', ein: ['k_bauplan', 'z_peptid'] },
  { name: 'Denaturieren', re: /denaturier|Denaturier/, raum: 'labor', ein: ['k_denat', 'k_ausloeser'] }, // k_ausloeser erklärt es selbst: „lässt Eiweiß denaturieren, also gerinnen bzw. stocken“
  { name: 'gefaltete Form', re: /gefaltet|entfaltet|Form/, raum: 'labor', ein: ['k_denat', 'k_struktur'] },
  { name: 'Auslöser', re: /Auslöser|Schwermetallsalz|Kupfersulfat/, raum: 'labor', ein: ['k_ausloeser', 'k_biuret'] },
  { name: 'Biuret', re: /Biuret/, raum: 'labor', ein: ['k_biuret'] },
  { name: 'Ninhydrin', re: /Ninhydrin/, raum: 'shakebar', ein: ['z_ninhydrin'] },
  { name: 'Wasserstoffbrücken', re: /Wasserstoffbrücke|schwache Verbindungen/, raum: 'training', ein: ['k_struktur'] },
];

const index = (raum) => RAEUME.indexOf(raum);

function pruefe(text, id, raum) {
  for (const b of BEGRIFFE) {
    if (!b.re.test(text)) continue;
    const frueher = index(b.raum) < index(raum);
    assert.ok(frueher || b.ein.includes(id), `${id} (${raum}) nennt „${b.name}“, das erst in ${b.raum} eingeführt wird`);
  }
}

test('Karten nennen nur bereits bekannte Begriffe', () => {
  for (const k of W.karten) {
    // Titel und Text zusammen prüfen; „Zusatz“-Hinweise sind keine Begriffe
    pruefe([k.titel, k.kopf, k.vorspann, ...(k.zeilen || []), k.fuss].filter(Boolean).join(' '), k.id, k.raum);
  }
});

test('Glossar: jeder Begriff hängt an einer vorhandenen Karte und nennt nichts aus späteren Räumen', () => {
  const ids = new Map(W.karten.map((k) => [k.id, k]));
  for (const g of G.begriffe) {
    assert.ok(g.ab && ids.has(g.ab), `${g.begriff}: Feld „ab“ muss eine Karten-ID sein`);
    pruefe(g.text, g.ab, ids.get(g.ab).raum);
  }
});

test('Aminosäuren-Karte erklärt Wasserabspaltung und Rest R in einfacher Sprache', () => {
  const k = W.karten.find((x) => x.id === 'k_bauplan');
  const t = k.zeilen.join(' ');
  assert.match(k.titel, /So entstehen Eiweiße/);
  assert.match(t, /Monomere/);
  assert.match(t, /Polymer/);
  assert.match(t, /Wasserabspaltung/);
  assert.match(t, /Rest/);
  assert.doesNotMatch(t, /NH₂|COOH|Aminogruppe|Carboxygruppe/, 'Gruppen stehen nur auf der Schautafel');
});

test('Zusatzaufgabe Ninhydrin verlangt auch die Biuret-Karte', () => {
  const A = JSON.parse(readFileSync(join(root, 'data/aufgaben.json'), 'utf8'));
  assert.ok(A.aufgaben.z1.braucht.includes('z_ninhydrin'));
  assert.ok(A.aufgaben.z1.braucht.includes('k_biuret'));
});
