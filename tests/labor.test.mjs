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
  assert.equal(V.lieferung.proben.length, 3, 'Die neue Lieferung hat drei Proben');
  assert.deepEqual(V.lieferung.proben.map(probenName), ['Eiweißshake', 'Zuckerlösung', 'Wasser']);
  assert.ok(V.stationA.proben.some((p) => /Wasser/.test(probenName(p))), 'Kontrolle mit Wasser');
});

test('Je Glas nur ein Versuch: Station A hat fünf verschiedene Einflüsse, Salzsäure statt Essigsäure', () => {
  const namen = V.stationA.proben.map(probenName);
  assert.equal(new Set(namen).size, 5);
  assert.deepEqual(namen.map((n) => n.split(' ')[0]), ['Hitze', 'Salzsäure', 'Kupfersulfat-Lösung', 'Ethanol', 'Wasser']);
  assert.doesNotMatch(JSON.stringify([V, A.aufgaben.a4]), /Essigsäure/);
  assert.match(V.stationA.regel + V.lieferung.regel, /Ein Glas, ein/);
  for (const p of V.lieferung.proben) assert.ok(!/ \+ | und /.test(probenName(p)), `${p.id}: nur eine Probe im Glas`);
});

test('Schutzkleidung im Labor: Kittel und Schutzbrille, keine Handschuhe', () => {
  const alles = JSON.stringify([V, A, read('fuehrerschein.json'), read('dialoge.json'), read('hefter.json'), read('glossar.json')]);
  assert.doesNotMatch(alles, /Handschuh/i);
  assert.match(V.sicherheit[0], /Kittel und Schutzbrille/);
  assert.equal(V.sicherheit.length, 3, 'nur drei Sicherheitspunkte');
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
  const eiklarBiuret = V.lieferung.proben[0]; // Eiweißshake
  assert.equal(beobachtungPasst(eiklarBiuret, 'violett'), true);
  assert.equal(beobachtungPasst(eiklarBiuret, 'hellblau'), false);
  assert.equal(beobachtungPasst(eiklarBiuret, ''), false);
});

test('Hitze-Station und Nachweis-Station haben unterschiedliche Namen und nicht „Niveau A/B“-Begriffe', () => {
  assert.match(V.stationA.name, /Hitze/);
  assert.match(V.lieferung.name, /Nachweis/);
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
    beobachtung: { p1: { wahl: 'trüb und fest', notiz: 'nach 2 Minuten' }, b2: { wahl: 'blau (kein Violett)', notiz: '' } },
    notiz: 'Probe 2 nur leicht trüb',
  };
  const t = protokollText({ names: ['Mia', 'Tom'], versuch: V, protokoll });
  assert.match(t, /Namen: Mia, Tom/);
  assert.match(t, /1 \| Hitze im Wasserbad \| trüb oder fest \(Hitze\) \| trüb und fest \(nach 2 Minuten\) \| trüb, fest/);
  assert.match(t, /2 \| Zuckerlösung \| – \| blau \(kein Violett\) \| kein Violett \(blau\)/);
  assert.match(t, /Besonderheiten: Probe 2 nur leicht trüb/);
  assert.match(t, /Denaturieren \(Gerinnen\)/);
});

test('Denaturierung und Biuret-Nachweis sind getrennte Versuche: a4 ohne Biuret, a7 nur mit der Lieferung', () => {
  for (const n of ['A', 'B', 'C']) {
    for (const st of A.aufgaben.a4.niveaus[n]) if (st.stationen) assert.deepEqual(st.stationen, ['stationA'], `a4/${n}`);
    for (const st of A.aufgaben.a7.niveaus[n]) if (st.stationen) assert.deepEqual(st.stationen, ['lieferung'], `a7/${n}`);
    assert.doesNotMatch(JSON.stringify(A.aufgaben.a4.niveaus[n]), /Biuret|Zuckerlösung|Natronlauge/, `a4/${n}: kein Nachweis im Denaturierungsversuch`);
    assert.match(JSON.stringify(A.aufgaben.a7.niveaus[n]), /Biuret|Natronlauge/, `a7/${n}: der Nachweis steckt in der Lieferungs-Prüfung`);
  }
  assert.ok(!A.aufgaben.a4.braucht.includes('k_biuret'), 'a4 braucht die Biuret-Karte nicht mehr');
  assert.ok(A.aufgaben.a7.braucht.includes('quiz_done'), 'die Prüfung der Lieferung kommt nach der Auflösung');
  assert.equal(A.raeume.lieferung.fertigFlag, 'lieferung_done');
  assert.equal(A.raeume.lieferung.niveauVon, 'labor');
  assert.deepEqual(alleProben(V, ['stationA']).map((p) => p.id), ['p1', 'p2', 'p3', 'p4', 'p5']);
  assert.deepEqual(alleProben(V, ['lieferung']).map((p) => p.id), ['b1', 'b2', 'b3']);
  const nurLieferung = protokollText({ names: ['Mia'], versuch: V, protokoll: {}, stationen: ['lieferung'] });
  assert.match(nurLieferung, /Protokoll: Neue Lieferung/);
  assert.equal(nurLieferung.split('\n').filter((l) => /^\d \|/.test(l)).length, 3);
  assert.match(nurLieferung, /Eiweißshake/);
  assert.doesNotMatch(nurLieferung, /Hitze im Wasserbad/);
});

test('Nachweis-Station im Labor: vor der Auflösung leer, danach die Lieferungs-Prüfung', () => {
  const hs = S.szenen.find((s) => s.id === 'labor').hotspots.filter((h) => h.label === 'Nachweis-Station');
  const leer = hs.find((h) => h.nicht === 'quiz_done');
  const echt = hs.find((h) => h.wenn === 'quiz_done');
  assert.ok(leer && echt, 'zwei Fassungen');
  assert.equal(echt.task, 'lieferung_menu');
  assert.deepEqual([leer.x, leer.y], [echt.x, echt.y]);
});

test('Protokolltext funktioniert auch ohne jede Eingabe', () => {
  const t = protokollText({ names: [], versuch: V, protokoll: {} });
  assert.match(t, /\(ohne Namen\)/);
  assert.equal(t.split('\n').filter((l) => /^\d \|/.test(l)).length, 8);
});

test('Labor: Aufgabe 4 ist im Raum eingetragen, braucht keine Freigabe vorher, Karten erreichbar, Flags existieren', () => {
  assert.deepEqual(A.raeume.labor.aufgaben, ['a4']);
  assert.deepEqual(A.raeume.labor.pflicht, ['a4']);
  assert.deepEqual(A.raeume.shakebar.aufgaben, ['a6', 'z1'], 'Spurensicherung ist freiwillig und liegt in der Shake-Bar');
  assert.equal(A.raeume.labor.fertigFlag, 'labor_done');
  for (const f of A.aufgaben.a4.braucht) assert.ok(FLAG_LIST.includes(f), f);
  for (const id of ['a4', 'a7']) assert.ok(!A.aufgaben[id].braucht.includes('lab_frei'), `${id}: kein Code vor dem Versuch`);
  const kartenHotspots = S.szenen.find((s) => s.id === 'labor').hotspots.map((h) => h.karte).filter(Boolean);
  for (const k of A.aufgaben.a4.braucht.filter((f) => f.startsWith('k_'))) assert.ok(kartenHotspots.includes(k), `${k} im Labor erreichbar`);
});

test('Labor: alle drei Niveaus haben dieselben Stationsschritte, kein Export (das echte Protokoll kommt von der Lehrkraft)', () => {
  for (const n of ['A', 'B', 'C']) {
    const types = A.aufgaben.a4.niveaus[n].map((s) => s.type);
    assert.equal(types[0], 'vermutung');
    assert.ok(types.includes('versuch') && types.includes('beobachtung'));
    assert.ok(!types.includes('export'));
    assert.ok(!A.aufgaben.a7.niveaus[n].some((s) => s.type === 'export'), 'a7 ohne Export');
  }
  assert.equal(A.aufgaben.a4.niveaus.A[1].type, 'anleitung');
  assert.equal(A.aufgaben.a4.niveaus.B[1].type, 'reihenfolge');
  assert.equal(A.aufgaben.a4.niveaus.C[1].type, 'reihenfolge');
});

test('Sicherheit: drei kurze Punkte (Kittel und Schutzbrille, Tablet, Entsorgung), keine Mengen, kein KI-Ton', () => {
  const s = V.sicherheit.join(' ');
  assert.match(s, /Kittel und Schutzbrille/);
  assert.match(s, /Tablet/);
  assert.match(s, /Sammelbehälter/);
  assert.match(s, /Ausguss/);
  for (const st of [V.stationA, V.lieferung]) assert.match(st.entsorgung, /Sammelbehälter/, `${st.id}: Entsorgung`);
  assert.match(V.stationA.entsorgung, /Ausguss/, 'Rest der Hitze-Station in den Ausguss');
  const texte = JSON.stringify([V.sicherheit, V.versuchSchritt, V.stationA, V.lieferung]);
  assert.doesNotMatch(texte, /vorab|um Zeit zu sparen|Gefährdungsbeurteilung|nur von der Lehrkraft/);
  assert.doesNotMatch(JSON.stringify(A.aufgaben.a4), /\d+\s?(ml|mL|g|mol)/, 'keine erfundenen Mengen');
  assert.match(V.codeHinweis, /keine Sicherheitsfreigabe/);
});

test('Beide Versuche nennen den Ablauf am Lehrertisch: Protokoll abholen, ausrüsten, Material, Tablet bleibt am Platz, Protokoll, aufräumen, Code', () => {
  assert.ok(V.versuchSchritt.ablaufTitel && /Lehrertisch/.test(V.versuchSchritt.ablaufTitel));
  const reihenfolge = [/Lehrertisch.*[Pp]rotokoll.*ab\./, /Kittel und Schutzbrille/, /Materialien stehen auf dem Lehrertisch/, /Tablet bleibt an eurem Platz/, /Papierprotokoll/, /Räumt auf: \{entsorgung\}/, /Code/];
  for (const st of [V.stationA, V.lieferung]) {
    assert.equal(st.ablauf.length, reihenfolge.length, `${st.id}: sieben Schritte`);
    st.ablauf.forEach((s, i) => assert.match(s, reihenfolge[i], `${st.id}, Schritt ${i + 1}`));
    const text = st.ablauf.join(' ');
    assert.doesNotMatch(text, /Handschuh|Auslöser/i, `${st.id}: nur Kittel und Schutzbrille, kein „Auslöser“`);
    assert.match(text, /Kupfersulfat-Lösung \(Fehling I\)/, `${st.id}: Kupfersulfat-Lösung mit Fehling I`);
  }
  assert.match(V.stationA.ablauf[2], /Eiklarlösung.*Salzsäure.*Kupfersulfat-Lösung \(Fehling I\).*Ethanol.*Wasser.*Wasserbad/);
  assert.match(V.lieferung.ablauf[2], /Eiweißshake.*Zuckerlösung.*Wasser.*Natronlauge.*Kupfersulfat-Lösung \(Fehling I\)/);
});

test('Code der Lehrkraft erst nach dem Versuch: zeitbasiert, im Quelltext nur ein Prüfwert, keine festen Codes', () => {
  assert.equal(V.freigabeCode, undefined, 'kein Code vor dem Versuch');
  for (const st of [V.stationA, V.lieferung]) assert.equal(st.codeNachVersuch, undefined, 'keine festen Codes im Quelltext');
  assert.notEqual(V.stationA.id, V.lieferung.id, 'jeder Versuch hat seine eigene Kennung für den Code');
  assert.match(V.klassenwort.hash, /^[0-9a-f]{64}$/, 'Prüfwert des Klassenworts');
  assert.ok(V.klassenwort.iterationen >= 300000, 'viele Runden gegen Raten');
  assert.deepEqual(V.codeZeit, { sekunden: 30, vorher: 1, nachher: 1, stellen: 6 });
  for (const k of ['codeFalsch', 'codeBenutzt', 'codeNichtEingerichtet', 'codeRichtig']) assert.ok(V.versuchSchritt[k], k);
  for (const id of ['a4', 'a7']) for (const n of Object.values(A.aufgaben[id].niveaus)) {
    const i = n.findIndex((s) => s.type === 'versuch');
    assert.ok(i > 0 && n[i + 1].type === 'beobachtung', `${id}: Beobachtung direkt nach dem Versuch (mit Code)`);
  }
});
