import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { checkMehrfach, quizErgebnis, raumFertig, fehlendeKarten } from '../src/tasks/check.js';
import { FLAG_LIST } from '../src/state/progress.js';
import { flagsVon } from '../src/state/zugang.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (f) => JSON.parse(readFileSync(join(root, 'data', f), 'utf8'));
const A = read('aufgaben.json');
const W = read('wissen.json');
const S = read('szenen.json');
const WB = read('werbung.json');
const H = read('hefter.json');

test('Räume: alle fünf Raumeinträge haben Aufgaben und eigene Flags', () => {
  for (const r of ['empfang', 'labor', 'sauna', 'training', 'shakebar', 'abschluss']) {
    const room = A.raeume[r];
    assert.ok(room, r);
    assert.ok(FLAG_LIST.includes(room.fertigFlag), `${r}: fertigFlag ${room.fertigFlag}`);
    for (const id of room.aufgaben) {
      assert.ok(A.aufgaben[id], `${r}: Aufgabe ${id}`);
      assert.ok(FLAG_LIST.includes(A.aufgaben[id].flag), `${id}: Flag ${A.aufgaben[id].flag}`);
      assert.notEqual(A.aufgaben[id].flag, room.fertigFlag, `${id}: Aufgaben-Flag und Raum-Flag müssen verschieden sein`);
    }
  }
  const flags = Object.values(A.aufgaben).map((t) => t.flag);
  assert.equal(new Set(flags).size, flags.length, 'doppelte Aufgaben-Flags');
});

test('Türen: Freischaltung folgt der Reihenfolge Empfang → Labor → Sauna → Trainingsfläche → Shake-Bar', () => {
  const tueren = S.szenen.find((s) => s.id === 'empfang').hotspots.filter((h) => h.type === 'door');
  const req = Object.fromEntries(tueren.map((t) => [t.to, t.requires || null]));
  // Labor und Sauna brauchen zusätzlich Ausweis bzw. Saunacode (Liste, alle Flags nötig); der Raum davor muss immer dabei sein
  assert.ok(flagsVon(req.labor).includes(A.raeume.empfang.fertigFlag));
  assert.ok(flagsVon(req.sauna).includes(A.raeume.labor.fertigFlag));
  assert.ok(flagsVon(req.training).includes(A.raeume.sauna.fertigFlag));
  assert.ok(flagsVon(req.shakebar).includes(A.raeume.training.fertigFlag));
});

test('Jede Aufgabe fordert nur Karten aus ihrem Raum oder Vorgängerräumen, und die Karten sind dort erreichbar', () => {
  const reihenfolge = ['empfang', 'labor', 'sauna', 'training', 'shakebar'];
  const kartenRaum = Object.fromEntries(W.karten.map((k) => [k.id, k.raum]));
  for (const [raum, aufgaben] of Object.entries({ empfang: ['a0'], labor: ['a4'], sauna: ['a5'], training: ['a3', 'a1', 'a2'], shakebar: ['a6', 'z1'] })) {
    for (const id of aufgaben) {
      for (const k of A.aufgaben[id].braucht.filter((f) => f.startsWith('k_') || f.startsWith('z_'))) {
        assert.ok(reihenfolge.indexOf(kartenRaum[k]) <= reihenfolge.indexOf(raum), `${id}: Karte ${k} liegt in einem späteren Raum`);
      }
    }
  }
  for (const k of W.karten) {
    const hs = S.szenen.flatMap((s) => s.hotspots.map((h) => ({ ...h, szene: s.id }))).find((h) => h.karte === k.id);
    assert.ok(hs, `${k.id}: kein Hotspot`);
    assert.equal(hs.szene, k.raum, `${k.id}: Hotspot im falschen Raum`);
    assert.ok(FLAG_LIST.includes(k.id), `${k.id}: fehlt in FLAG_LIST`);
  }
});

test('Sauna: Zuordnung deckt alle vier Auslöser genau einmal ab', () => {
  for (const n of ['A', 'B', 'C']) {
    const z = A.aufgaben.a5.niveaus[n].find((s) => s.type === 'zuordnen');
    assert.deepEqual(z.paare.map((p) => p.richtig).sort(), [...z.optionen].sort());
    for (const p of z.paare) assert.ok(z.optionen.includes(p.richtig));
  }
  const lueck = A.aufgaben.a5.niveaus.C.find((s) => s.type === 'luecken');
  assert.deepEqual(lueck.loesungen.slice(0, 4).sort(), ['Alkohol', 'Hitze', 'Säure', 'Schwermetallsalze'].sort());
  assert.doesNotMatch(JSON.stringify(A.aufgaben.a5), /Aminosäure|Struktur|gefaltet/, 'Stufe 2 nennt noch keine Aminosäuren und keine Faltung');
});

test('Sauna: Merksätze nennen weder Katalysatoren noch Enzymbegriffe (Lehrplan-Leitplanke)', () => {
  const alles = JSON.stringify([A, W, H, read('dialoge.json'), WB]);
  assert.doesNotMatch(alles, /Katalysator|Enzym/i);
  assert.match(read('dialoge.json')['sauna.hannes'].lines.join(' '), /später/);
});

test('Shake-Check: Zutaten, fünf Aussagen, gültige Urteile und Begründungen', () => {
  assert.ok(WB.produkt.zutaten.length >= 3);
  assert.doesNotMatch(JSON.stringify(WB), /Tryptophan|essentiell/i, 'essentielle Aminosäuren sind nur Zusatzwissen');
  assert.equal(WB.aussagen.length, 5);
  assert.equal(WB.aussagen.filter((a) => a.urteil === 0).length, 1, 'genau eine Aussage stimmt');
  for (const a of WB.aussagen) {
    assert.ok(a.urteil >= 0 && a.urteil < WB.urteile.length);
    assert.ok(a.richtig >= 0 && a.richtig < a.begruendungen.length);
    assert.ok(a.begruendungen.length >= 3 && a.erklaerung);
  }
  const richtigPositionen = new Set(WB.aussagen.map((a) => a.richtig));
  assert.ok(richtigPositionen.size >= 2, 'richtige Begründung steht nicht immer an derselben Stelle');
  assert.match(WB.aussagen[0].erklaerung, /Fremdwort/);
});

test('Shake-Check: keine Körperideale, Gewicht- oder Kalorienangaben', () => {
  assert.doesNotMatch(JSON.stringify({ produkt: WB.produkt, aussagen: WB.aussagen }), /Kalorie|kcal|Kilo|kg\b|abnehmen|Bauch|Sixpack|Körperfett/i);
});

test('Auflösung: vier gewertete Fragen, Verursacher-Wahl, Rückblick, genaue Zahl der richtigen Antworten', () => {
  const steps = A.aufgaben.quiz.niveaus.alle;
  assert.equal(steps.filter((s) => s.zaehlt).length, 4);
  assert.deepEqual(steps.slice(-2).map((s) => s.type), ['verdaechtige', 'rueckblick']);
  for (const s of steps.filter((x) => x.zaehlt)) assert.ok(s.erklaerung, 'Kurzbegründung fehlt');
  assert.deepEqual(quizErgebnis(steps, [true, true, false, true, true, true]), { richtig: 3, von: 4 });
  assert.deepEqual(quizErgebnis(steps, []), { richtig: 0, von: 4 });
});

test('Quiz-Antworten entsprechen den Lernzielen', () => {
  const s = A.aufgaben.quiz.niveaus.alle;
  assert.match(s[0].optionen[s[0].richtig], /Protein und Eiweiß sind dasselbe, und Aminosäuren sind die Bausteine/);
  assert.match(s[1].optionen[s[1].richtig], /„aktive“ Form geht dauerhaft verloren.*Reihenfolge der Aminosäuren/);
  assert.match(s[2].frage, /Wähle alle Ursachen aus/);
  assert.equal(s[2].alle, true);
  assert.deepEqual(s[2].richtig.map((i) => s[2].optionen[i]).sort(), ['Ethanol', 'Hitze', 'Schwermetalle', 'Säuren']);
  for (const falsch of ['Kälte', 'Wasser', 'Zucker']) assert.ok(s[2].optionen.includes(falsch) && !s[2].richtig.includes(s[2].optionen.indexOf(falsch)), falsch);
  assert.doesNotMatch(s[2].frage, /Auslöser/);
  assert.match(s[3].optionen[s[3].richtig], /einzelner Baustein.*lange Kette/);
  assert.doesNotMatch(JSON.stringify(s), /Biuret/, 'der Nachweis wird erst nach der Auflösung geprüft und im Schlussquiz abgefragt');
});

test('Schlussquiz: zwei gewertete Fragen zum Nachweis, eigener Raum, kommt nach der Prüfung der Lieferung', () => {
  const t = A.aufgaben.quiz2;
  const steps = t.niveaus.alle;
  assert.equal(steps.filter((s) => s.zaehlt).length, 2);
  for (const s of steps) assert.ok(s.erklaerung, 'Kurzbegründung fehlt');
  assert.equal(t.zaehlen, 'quiz2');
  assert.deepEqual(t.braucht, ['lieferung_done']);
  assert.equal(A.raeume.schluss.fertigFlag, 'quiz2_done');
  assert.deepEqual(quizErgebnis(steps, [true, false]), { richtig: 1, von: 2 });
  assert.match(steps[0].optionen[steps[0].richtig], /Violett/);
  assert.match(steps[1].optionen[steps[1].richtig], /kein Eiweiß/);
});

test('Mehrfachwahl: Anzahl und Richtigkeit', () => {
  const step = { richtig: [0, 2, 4], anzahl: 2 };
  assert.equal(checkMehrfach(step, [0]).reason, 'anzahl');
  assert.equal(checkMehrfach(step, [0, 1]).reason, 'falsch');
  assert.equal(checkMehrfach(step, [2, 4]).ok, true);
  assert.equal(checkMehrfach(step, [0, 2, 4]).reason, 'anzahl');
});

test('Mehrfachwahl „alle auswählen“: nur die vollständige Menge zählt, die Anzahl wird nicht verraten', () => {
  const step = { richtig: [1, 3, 5, 6], alle: true };
  assert.equal(checkMehrfach(step, [1, 3, 5, 6]).ok, true);
  assert.equal(checkMehrfach(step, [6, 5, 3, 1]).ok, true, 'Reihenfolge egal');
  assert.equal(checkMehrfach(step, [1, 3, 5]).reason, 'fehlt');
  assert.equal(checkMehrfach(step, [1, 3, 5, 6, 0]).reason, 'falsch');
  assert.equal(checkMehrfach(step, []).reason, 'fehlt');
});

test('Denaturieren: Hefter und Quiz sagen „verändert, nicht zerstört“, die Kette bleibt (Eintrag 2)', () => {
  const m = H.eintraege[0].teile.find((t) => t.typ === 'merksatz');
  assert.equal(m.merke, 'Denaturieren');
  assert.match(m.text, /Stocken, Gerinnen/);
  assert.match(m.text, /verändert das Eiweiß seine Struktur, es wird z\. B\. fest/);
  assert.match(m.text, /Organismen abgetötet/);
  assert.match(m.text, /nicht umkehrbar/);
  const e2 = JSON.stringify(H.eintraege[1].teile);
  assert.match(e2, /„aktive“ Form dauerhaft verloren/);
  assert.match(e2, /Reihenfolge der Aminosäuren in der Kette bleibt erhalten/);
  assert.doesNotMatch(JSON.stringify(H.eintraege[0].teile), /Reihenfolge der Aminosäuren|Kette/, 'die Kette kommt erst nach der Trainingsfläche (Eintrag 2)');
  assert.equal(H.eintraege.flatMap((e) => e.teile).filter((t) => t.typ === 'merksatz').length, 2, 'nur Denaturieren und Aminosäuren sind Merksätze');
});

test('Hefter: drei Einträge, frei nach Raum, auf dem Blatt nur Abschreibstoff, Anweisungen in der Leiste, Pflicht vor dem nächsten Raum', () => {
  assert.equal(H.eintraege.length, 3);
  assert.equal(H.eintraege[0].ab, A.raeume.sauna.fertigFlag);
  assert.equal(H.eintraege[1].ab, A.raeume.training.fertigFlag);
  assert.equal(H.eintraege[2].ab, A.raeume.lieferung.fertigFlag, 'der Biuret-Eintrag erscheint erst nach der Prüfung der Lieferung');
  assert.deepEqual(H.eintraege.map((e) => e.sperrt), ['training', 'shakebar', 'schluss']);
  assert.deepEqual(H.eintraege.map((e) => e.erledigtMit), ['training_done', 'shakebar_done', 'quiz2_done']);
  assert.equal(H.blatt.titel, '2. Eiweiße');
  for (const e of H.eintraege) {
    assert.ok(e.anweisungen && e.anweisungen.length >= 1, `${e.id}: Anweisungen für die Leiste`);
    for (const t of e.teile) {
      assert.ok(['merksatz', 'text', 'abbildung', 'liste', 'tabelle'].includes(t.typ), `${e.id}: auf dem Blatt nur Abschreibstoff (${t.typ})`);
      assert.doesNotMatch([t.text, t.einleitung, ...(t.punkte || []), ...(t.zeilen || []).flat()].filter(Boolean).join(' '), /Schreibe|Übernimm|abschreiben|Zeichne/, `${e.id}: keine Anweisung auf dem Blatt`);
      if (t.typ === 'liste') assert.ok(Array.isArray(t.punkte) && t.punkte.length >= 2, `${e.id}: eine Liste hat mindestens zwei Stichpunkte`);
      if (t.typ === 'tabelle') assert.ok(t.kopf.length >= 2 && t.zeilen.length >= 1 && t.zeilen.every((z) => z.length === t.kopf.length), `${e.id}: Tabelle mit passenden Spalten`);
    }
    const merksaetze = e.teile.filter((t) => t.typ === 'merksatz');
    for (const m of merksaetze) assert.ok(m.merke, 'Merksatz braucht den Begriff für „Merke: …“');
    assert.ok(merksaetze.length < e.teile.length, 'nicht alles darf ein Merksatz sein');
  }
  const merke = H.eintraege.flatMap((e) => e.teile).filter((t) => t.typ === 'merksatz').map((t) => t.merke);
  assert.deepEqual(merke, ['Denaturieren', 'Aminosäuren'], 'nur die wichtigen Pflichtinhalte sind Merksätze');
  // Grüne Überschriften (ueb) nur für echte Teilüberschriften; kleine Beschriftungen sind ein label (fette schwarze Zeile)
  const ERLAUBT = ['Vorkommen und Verwendung', 'Bau', 'Denaturierung', 'Nachweis'];
  const alleUeb = H.eintraege.flatMap((e) => e.teile.map((t) => t.ueb).filter(Boolean));
  for (const u of alleUeb) assert.ok(ERLAUBT.some((x) => u === x || u === `${x} (Fortsetzung)`), `keine echte Teilüberschrift: ${u}`);
  assert.deepEqual(alleUeb, ['Vorkommen und Verwendung', 'Denaturierung', 'Bau', 'Denaturierung (Fortsetzung)', 'Nachweis']);
  assert.match(H.eintraege[1].teile.find((t) => t.ueb === 'Denaturierung (Fortsetzung)').punkte.join(' '), /Reihenfolge der Aminosäuren/, 'Faltung und Gerinnen steht unter Denaturierung');
  assert.match(H.eintraege[1].anweisungen.join(' '), /unter deine Überschrift Denaturierung/);
  // Längere Texte stehen als Stichpunkte oder Übersicht (weniger Fließtext); Wofür und warum stehen vor dem Begriff „Protein und Eiweiß“
  const t1 = H.eintraege[0].teile;
  assert.equal(t1[0].typ, 'liste', 'Eiweiße im Körper als Stichpunkte');
  assert.match(t1[0].punkte.join(' '), /Muskeln.*Transport.*Schutz/);
  const warum = t1.findIndex((t) => /^Der Körper baut/.test(t.text || ''));
  assert.ok(warum > 0 && warum < t1.findIndex((t) => /^Protein und Eiweiß bedeuten/.test(t.text || '')));
  assert.ok(t1.some((t) => t.typ === 'liste' && /Schwermetallsalze/.test(t.punkte.join(' '))), 'Ursachen des Denaturierens als Stichpunkte');
  assert.ok(H.eintraege.flatMap((e) => e.teile).filter((t) => t.typ === 'tabelle').length === 2, 'beide Versuchstabellen als Übersicht');
  for (const e of H.eintraege) for (const t of e.teile) if (t.typ === 'text') assert.ok(t.text.length <= 130, `${e.id}: lange Texte gehören in Stichpunkte (${t.text.slice(0, 30)}…)`);
  assert.deepEqual(H.eintraege.flatMap((e) => e.teile.map((t) => t.label).filter(Boolean)), ['Versuchstabelle: Denaturierung', 'Aufbau einer Aminosäure', 'Versuchstabelle: Lieferung']);
  // Abbildungen: bekannte Arten, Formeln nur Glycin und Alanin (plus allgemein)
  const abb = H.eintraege.flatMap((e) => e.teile).filter((t) => t.typ === 'abbildung');
  for (const t of abb) assert.ok(['aminosaeure', 'kette'].includes(t.art), t.art);
  assert.deepEqual(abb.find((t) => t.art === 'aminosaeure').formeln.map((f) => f[0]), ['allgemein', 'Glycin', 'Alanin']);
  assert.match(JSON.stringify(H.eintraege[2]), /Biuret.*Lehrkraft ab/);
  assert.doesNotMatch(JSON.stringify(H.eintraege[0]), /Biuret/, 'Eintrag 1 handelt nur vom Gerinnen');
});

test('Hefter-Pflicht: ein offener Eintrag sperrt den nächsten Raum, Haken oder geschaffter Folgeraum geben ihn frei', async () => {
  const { sperrenderEintrag, offeneEintraege, eintragAb } = await import('../src/state/hefter.js');
  assert.equal(sperrenderEintrag(H, {}, {}, 'training'), null, 'vor der Sauna sperrt nichts');
  assert.equal(sperrenderEintrag(H, { sauna_done: true }, {}, 'training').id, 'h1');
  assert.equal(sperrenderEintrag(H, { sauna_done: true }, {}, 'shakebar'), null);
  assert.equal(sperrenderEintrag(H, { sauna_done: true }, { h1: true }, 'training'), null, 'Haken gesetzt');
  assert.equal(sperrenderEintrag(H, { sauna_done: true, training_done: true }, {}, 'training'), null, 'nach einem Code mit geschaffter Trainingsfläche');
  assert.equal(sperrenderEintrag(H, { sauna_done: true, training_done: true }, {}, 'shakebar').id, 'h2');
  assert.equal(sperrenderEintrag(H, { lieferung_done: true }, {}, 'schluss').id, 'h3');
  assert.deepEqual(offeneEintraege(H, { sauna_done: true, training_done: true, shakebar_done: true }, {}).map((e) => e.id), []);
  assert.equal(eintragAb(H, 'sauna_done').id, 'h1');
});

test('Gating: Quiz nur nach der Shake-Bar, Räume schließen unabhängig voneinander', () => {
  assert.deepEqual(fehlendeKarten(A.aufgaben.quiz, {}), ['shakebar_done']);
  assert.equal(raumFertig(A.raeume.sauna, A.aufgaben, 1, { a5_done: true }), true);
  assert.equal(raumFertig(A.raeume.shakebar, A.aufgaben, 1, {}), false);
  assert.equal(raumFertig(A.raeume.abschluss, A.aufgaben, 1, { quiz_task: true }), true);
});

test('Sauna a5: jede Situation hat eine kurze Überschrift und mindestens drei Sätze, gestuft je Niveau', () => {
  const saetze = (t) => t.split(/(?<=[.!?])\s+/).filter((x) => x.trim().length > 3).length;
  const texte = {};
  for (const n of ['A', 'B', 'C']) {
    const s = A.aufgaben.a5.niveaus[n][0];
    assert.equal(s.type, 'zuordnen');
    for (const p of s.paare) {
      assert.ok(p.titel && p.titel.length < 40, `${n}: kurze Überschrift`);
      assert.ok(saetze(p.text) >= 3, `${n} ${p.titel}: mindestens drei Sätze`);
      (texte[p.richtig] ||= []).push(p.text);
    }
  }
  for (const [art, t] of Object.entries(texte)) assert.equal(new Set(t).size, 3, `${art}: A, B und C unterscheiden sich`);
  const C = A.aufgaben.a5.niveaus.C[0].paare.map((p) => p.text).join(' ');
  assert.doesNotMatch(C, /Ethanol|Säure|Schwermetall|Zitronensaft/, 'Niveau C nennt die Stoffe nur indirekt');
  const ae = read('aehnlich.json')['a5.*.0'];
  for (const p of ae.paare) assert.ok(p.titel && saetze(p.text) >= 3, `Übung ${p.titel}`);
});

test('Allgemeiner Arbeitsauftrag: mitschreiben erlaubt, Hefter Pflicht, Hinweise zur Orientierung und zum Verursacher (Einweisung und Spind)', async () => {
  const { readFileSync } = await import('node:fs');
  const lies = (n) => JSON.parse(readFileSync(new URL(`../data/${n}.json`, import.meta.url), 'utf8'));
  const auftrag = lies('hefter').arbeitsauftrag;
  assert.match(auftrag, /^Arbeitsauftrag: /);
  assert.match(auftrag, /[Mm]itschreiben/);
  assert.match(auftrag, /„Hefter“ steht, muss in deinen Hefter/);
  assert.match(auftrag, /Orientierung.*Verursacher/);
  const intro = lies('dialoge')['empfang.intro'].lines.join(' ');
  assert.match(intro, /Arbeitsauftrag: Du darfst dir alles mitschreiben/);
  assert.match(intro, /muss aber auf jeden Fall in deinen Hefter/);
  assert.match(intro, /Verursacher.*Versehen/);
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /id="nb-auftrag"/, 'Zeile im Spind');
});
