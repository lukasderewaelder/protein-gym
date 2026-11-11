import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { beobachtungPasst, reihenfolge, alleProben, protokollText, probenName } from '../src/tasks/check.js';
import { FLAG_LIST } from '../src/state/progress.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (f) => JSON.parse(readFileSync(join(root, 'data', f), 'utf8'));
const V = read('versuch.json');
const A = read('aufgaben.json');
const S = read('szenen.json');

test('Versuchsdaten: acht Proben, eindeutige IDs, Erwartungen und Treffer-Listen', () => {
  const alle = alleProben(V);
  assert.equal(alle.length, 8);
  assert.equal(new Set(alle.map((p) => p.id)).size, 8);
  for (const p of alle) {
    assert.ok(probenName(p) && p.erwartung, p.id);
    assert.equal(p.zusatz, undefined, `${p.id}: kein Feld „zusatz“ mehr (Einfluss oder Probe)`);
    assert.ok(Array.isArray(p.passt) && p.passt.length, `${p.id}: passt`);
    for (const w of p.passt) assert.ok(V.beobachtungOptionen.includes(w), `${p.id}: ${w} ist keine Beobachtungsoption`);
    assert.ok(/^#[0-9a-f]{6}$/i.test(p.sim.farbe), `${p.id}: Farbe`);
  }
  assert.equal(V.stationA.proben.length, 5, 'Station Hitze hat fünf Proben');
  assert.equal(V.stationB.proben.length, 3, 'Station Nachweis hat drei Proben');
  assert.ok(V.stationA.proben.some((p) => /Wasser/.test(probenName(p))), 'Kontrolle mit Wasser');
});

test('Je Glas nur ein Versuch: Station A hat fünf verschiedene Einflüsse, Salzsäure statt Essigsäure', () => {
  const namen = V.stationA.proben.map(probenName);
  assert.equal(new Set(namen).size, 5);
  assert.deepEqual(namen.map((n) => n.split(' ')[0]), ['Hitze', 'Salzsäure', 'Kupfersulfat-Lösung', 'Ethanol', 'Wasser']);
  assert.doesNotMatch(JSON.stringify([V, A.aufgaben.a4]), /Essigsäure/);
  assert.match(V.stationA.regel + V.stationB.regel, /nur ein/);
  for (const p of V.stationB.proben) assert.ok(!/ \+ | und /.test(probenName(p)), `${p.id}: nur eine Probe im Glas`);
});

test('Schutzkleidung im Labor: Kittel und Schutzbrille, keine Handschuhe', () => {
  const alles = JSON.stringify([V, A, read('fuehrerschein.json'), read('dialoge.json'), read('hefter.json'), read('glossar.json')]);
  assert.doesNotMatch(alles, /Handschuh/i);
  assert.match(V.sicherheit[0], /Kittel und Schutzbrille/);
  assert.match(read('fuehrerschein.json').fragen[0].richtig, /Kittel/);
});

test('Fehling I steht nur zusammen mit Kupfersulfat-Lösung, nie allein', () => {
  const alle = ['versuch', 'aufgaben', 'wissen', 'glossar', 'hefter', 'aehnlich', 'dialoge', 'fall'].map((n) => readFileSync(join(root, 'data', `${n}.json`), 'utf8')).join('\n');
  const treffer = alle.match(/Fehling I/g) || [];
  assert.ok(treffer.length >= 6, 'Fehling I kommt im Labor mehrfach vor');
  assert.equal((alle.match(/Kupfersulfat-Lösung \(Fehling I|Kupfersulfat-Lösung, bei uns auch Fehling I|auch Fehling I/g) || []).length, treffer.length, 'jedes Fehling I hängt an Kupfersulfat');
});

test('Das Labor schickt zur Lehrkraft: kein virtueller Versuch mehr', () => {
  for (const n of ['A', 'B', 'C']) assert.ok(!A.aufgaben.a4.niveaus[n].some((s) => s.type === 'simulation'), n);
});

test('Beobachtung wird nie als falsch behandelt, nur mit dem Skript verglichen', () => {
  const eiklarBiuret = V.stationB.proben[0];
  assert.equal(beobachtungPasst(eiklarBiuret, 'violett'), true);
  assert.equal(beobachtungPasst(eiklarBiuret, 'hellblau'), false);
  assert.equal(beobachtungPasst(eiklarBiuret, ''), false);
});

test('Station A und B nutzen unterschiedliche Namen und nicht „Niveau A/B“-Begriffe', () => {
  assert.match(V.stationA.name, /Hitze/);
  assert.match(V.stationB.name, /Nachweis/);
});

test('Reihenfolge: richtige Präfixe, falsche Schritte, fertig', () => {
  const k = ['a', 'b', 'c'];
  assert.deepEqual(reihenfolge(k, []), { prefixOk: true, fertig: false });
  assert.deepEqual(reihenfolge(k, ['a', 'b']), { prefixOk: true, fertig: false });
  assert.deepEqual(reihenfolge(k, ['b']), { prefixOk: false, fertig: false });
  assert.deepEqual(reihenfolge(k, ['a', 'b', 'c']), { prefixOk: true, fertig: true });
});

test('Protokolltext enthält Namen, Vermutung, Beobachtung und Erwartung', () => {
  const protokoll = {
    vermutung: { p1: { wahl: 'trüb oder fest', warum: 'Hitze' }, b1: { wahl: 'violett', warum: '' } },
    beobachtung: { p1: { wahl: 'trüb und fest', notiz: 'nach 2 Minuten' }, b3: { wahl: 'blau (kein Violett)', notiz: '' } },
    notiz: 'Probe 2 nur leicht trüb',
  };
  const t = protokollText({ names: ['Mia', 'Tom'], versuch: V, protokoll });
  assert.match(t, /Namen: Mia, Tom/);
  assert.match(t, /1 \| Hitze im Wasserbad \| trüb oder fest \(Hitze\) \| trüb und fest \(nach 2 Minuten\) \| trüb, fest/);
  assert.match(t, /3 \| Zuckerlösung \| – \| blau \(kein Violett\) \| kein Violett \(blau\)/);
  assert.match(t, /Besonderheiten: Probe 2 nur leicht trüb/);
  assert.match(t, /Denaturieren \(Gerinnen\)/);
});

test('Protokolltext funktioniert auch ohne jede Eingabe', () => {
  const t = protokollText({ names: [], versuch: V, protokoll: {} });
  assert.match(t, /\(ohne Namen\)/);
  assert.equal(t.split('\n').filter((l) => /^\d \|/.test(l)).length, 8);
});

test('Labor: Aufgabe 4 ist im Raum eingetragen, braucht Freigabe und drei Karten, Flags existieren', () => {
  assert.deepEqual(A.raeume.labor.aufgaben, ['a4']);
  assert.deepEqual(A.raeume.labor.pflicht, ['a4']);
  assert.deepEqual(A.raeume.shakebar.aufgaben, ['a6', 'z1'], 'Spurensicherung ist freiwillig und liegt in der Shake-Bar');
  assert.equal(A.raeume.labor.fertigFlag, 'labor_done');
  for (const f of A.aufgaben.a4.braucht) assert.ok(FLAG_LIST.includes(f), f);
  assert.ok(A.aufgaben.a4.braucht.includes('lab_frei'));
  const kartenHotspots = S.szenen.find((s) => s.id === 'labor').hotspots.map((h) => h.karte).filter(Boolean);
  for (const k of A.aufgaben.a4.braucht.filter((f) => f.startsWith('k_'))) assert.ok(kartenHotspots.includes(k), `${k} im Labor erreichbar`);
});

test('Labor: alle drei Niveaus haben dieselben Stationsschritte und enden mit Export', () => {
  for (const n of ['A', 'B', 'C']) {
    const types = A.aufgaben.a4.niveaus[n].map((s) => s.type);
    assert.equal(types[0], 'vermutung');
    assert.ok(types.includes('versuch') && types.includes('beobachtung'));
    assert.equal(types[types.length - 1], 'export');
  }
  assert.equal(A.aufgaben.a4.niveaus.A[1].type, 'anleitung');
  assert.equal(A.aufgaben.a4.niveaus.B[1].type, 'reihenfolge');
  assert.equal(A.aufgaben.a4.niveaus.C[1].type, 'reihenfolge');
});

test('Sicherheitstexte nennen Schutz, Ätzendes und Entsorgung und geben keine Mengen vor', () => {
  const s = V.sicherheit.join(' ');
  assert.match(s, /Schutzbrille/);
  assert.match(s, /ätzend/);
  assert.match(s, /Sammelbehälter/);
  assert.doesNotMatch(JSON.stringify(A.aufgaben.a4), /\d+\s?(ml|mL|g|mol)/, 'keine erfundenen Mengen');
  assert.match(V.hinweisCode, /keine Sicherheitsfreigabe/);
});
