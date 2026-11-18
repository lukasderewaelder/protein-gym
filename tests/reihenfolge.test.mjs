// Alle Aufgaben müssen in beliebiger Antwortreihenfolge richtig gewertet werden; gleichwertige Teile zählen alle.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { checkLuecken, reihenfolge, falscheZeilen, verschiebe, formelTippTreffer, mische } from '../src/tasks/check.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const A = JSON.parse(readFileSync(join(root, 'data/aufgaben.json'), 'utf8'));
const AE = JSON.parse(readFileSync(join(root, 'data/aehnlich.json'), 'utf8'));

test('Lücken: austauschbare Lücken gelten in jeder Besetzung', () => {
  const step = { loesungen: ['geronnen', 'denaturiert', 'Struktur'], austauschbar: [[1, 2]] };
  assert.equal(checkLuecken(step, ['geronnen', 'denaturiert', 'Struktur']).ok, true);
  assert.equal(checkLuecken(step, ['denaturiert', 'geronnen', 'Struktur']).ok, true, 'vertauscht');
  const doppelt = checkLuecken(step, ['geronnen', 'geronnen', 'Struktur']);
  assert.equal(doppelt.ok, false, 'dasselbe Wort zweimal ist falsch');
  assert.deepEqual(doppelt.wrong, [1]);
  assert.deepEqual(checkLuecken(step, ['Struktur', 'denaturiert', 'Struktur']).wrong, [0], 'fremdes Wort in der Gruppe');
});

test('Lücken ohne Gruppe bleiben streng, leere Lücken werden gemeldet', () => {
  const step = { loesungen: ['a', 'b'] };
  assert.equal(checkLuecken(step, ['b', 'a']).ok, false);
  assert.deepEqual(checkLuecken(step, ['a', null]).empty, [1]);
  assert.equal(checkLuecken({ loesungen: ['x', 'x'] }, ['x', 'x']).ok, true, 'gleiche Lösung in zwei Lücken');
});

test('Ablauf ordnen: gleichwertige Schritte dürfen vertauscht werden, sonst gilt die Reihenfolge', () => {
  const k = ['brille', 'beschriften', 'einfüllen', 'kontrolle', 'zusatz', 'beobachten'];
  const g = [[1, 2], [3, 4]];
  assert.equal(reihenfolge(k, ['brille', 'beschriften', 'einfüllen'], g).prefixOk, true);
  assert.equal(reihenfolge(k, ['brille', 'einfüllen', 'beschriften'], g).prefixOk, true, 'vertauscht');
  assert.equal(reihenfolge(k, ['brille', 'einfüllen', 'beschriften', 'zusatz', 'kontrolle', 'beobachten'], g).fertig, true);
  assert.equal(reihenfolge(k, ['einfüllen'], g).prefixOk, false, 'Brille muss zuerst kommen');
  assert.equal(reihenfolge(k, ['brille', 'zusatz'], g).prefixOk, false, 'Gruppe darf nicht übersprungen werden');
  assert.equal(reihenfolge(k, ['brille', 'beschriften', 'beschriften'], g).prefixOk, false, 'kein Schritt doppelt');
  assert.equal(reihenfolge(k, ['brille', 'beobachten'], g).prefixOk, false);
  assert.deepEqual(reihenfolge(['a', 'b'], ['b']), { prefixOk: false, fertig: false }, 'ohne Gruppen wie bisher');
});

test('Formel-Tippen: beliebige Reihenfolge, bei Glycin zählen beide H als Rest', () => {
  const step = { teile: ['amino', 'carboxy', 'rest'] };
  const gly = { rest: 'H' };
  const ala = { rest: 'CH₃' };
  // umgekehrte Reihenfolge: erst Rest, dann Carboxy, dann Amino
  const offen = new Set(step.teile);
  for (const p of ['rest', 'carboxy', 'amino']) {
    const r = formelTippTreffer(step, ala, offen, p);
    assert.equal(r.art, 'neu', p);
    offen.delete(r.ziel);
  }
  assert.equal(offen.size, 0);
  // Glycin: H unten zuerst, danach das H oben
  const o2 = new Set(step.teile);
  const r1 = formelTippTreffer(step, gly, o2, 'h');
  assert.deepEqual(r1, { art: 'neu', ziel: 'rest' });
  o2.delete('rest');
  assert.equal(formelTippTreffer(step, gly, o2, 'rest').art, 'auchRest', 'zweites H ist ebenfalls richtig');
  assert.equal(formelTippTreffer(step, gly, o2, 'h').art, 'auchRest');
  // Glycin: H oben zuerst, danach das H unten
  const o3 = new Set(['rest']);
  assert.equal(formelTippTreffer({ teile: ['rest'] }, gly, o3, 'rest').art, 'neu');
  // Alanin: das H unten ist kein Rest
  assert.equal(formelTippTreffer(step, ala, new Set(step.teile), 'h').art, 'falsch');
  assert.equal(formelTippTreffer(step, ala, new Set(['carboxy']), 'amino').art, 'schon');
  assert.equal(formelTippTreffer(step, ala, new Set(step.teile), 'c').art, 'falsch');
});

test('Daten: austauschbare Lücken und gleichwertige Schritte verweisen auf gültige Positionen', () => {
  const pruefe = (s, wo) => {
    if (s.type === 'luecken' && s.austauschbar) {
      for (const g of s.austauschbar) {
        assert.ok(g.length >= 2, `${wo}: Gruppe zu klein`);
        for (const n of g) assert.ok(Number.isInteger(n) && n >= 1 && n <= s.loesungen.length, `${wo}: Lücke ${n}`);
      }
      assert.equal(checkLuecken(s, [...s.loesungen]).ok, true, `${wo}: Lösung gilt`);
      for (const g of s.austauschbar) {
        const vertauscht = [...s.loesungen];
        const [a, b] = [g[0] - 1, g[1] - 1];
        [vertauscht[a], vertauscht[b]] = [vertauscht[b], vertauscht[a]];
        assert.equal(checkLuecken(s, vertauscht).ok, true, `${wo}: Vertauschung gilt`);
      }
    }
    if (s.type === 'reihenfolge' && s.gleichwertig) {
      for (const g of s.gleichwertig) {
        assert.deepEqual(g, [...g].sort((x, y) => x - y), `${wo}: Gruppe sortiert`);
        g.forEach((p, i) => { if (i) assert.equal(p, g[i - 1] + 1, `${wo}: Gruppe muss zusammenhängen`); });
        for (const p of g) assert.ok(p >= 0 && p < s.korrekt.length, `${wo}: Position ${p}`);
      }
      const alle = s.gleichwertig.flat();
      assert.equal(new Set(alle).size, alle.length, `${wo}: Position in zwei Gruppen`);
      const vertauscht = [...s.korrekt];
      for (const g of s.gleichwertig) vertauscht.splice(g[0], g.length, ...g.map((p) => s.korrekt[p]).reverse());
      assert.equal(reihenfolge(s.korrekt, vertauscht, s.gleichwertig).fertig, true, `${wo}: umgekehrte Gruppen`);
    }
  };
  for (const [id, t] of Object.entries(A.aufgaben)) for (const [n, steps] of Object.entries(t.niveaus)) steps.forEach((s, i) => pruefe(s, `${id}.${n}.${i}`));
  for (const [k, s] of Object.entries(AE)) pruefe(s, k);
});

test('Daten: Zuordnen-Aufgaben haben pro Situation genau eine richtige Option (Reihenfolge der Situationen egal)', () => {
  for (const [id, t] of Object.entries(A.aufgaben)) {
    for (const [n, steps] of Object.entries(t.niveaus)) {
      for (const s of steps.filter((x) => x.type === 'zuordnen')) {
        assert.ok(s.paare.length >= 2, `${id}.${n}`);
        for (const p of s.paare) assert.ok(s.optionen.includes(p.richtig), `${id}.${n}: ${p.richtig}`);
      }
    }
  }
});

test('Mischen: gleiche Elemente, Eingabe bleibt unverändert, Zufallsquelle steuert die Reihenfolge', () => {
  const eingabe = [0, 1, 2, 3];
  const a = mische(eingabe, () => 0);
  assert.deepEqual(eingabe, [0, 1, 2, 3]);
  assert.deepEqual([...a].sort(), [0, 1, 2, 3]);
  const b = mische(eingabe, () => 0.99);
  assert.deepEqual(b, [0, 1, 2, 3], 'mit größtem Zufall bleibt die Reihenfolge');
  assert.notDeepEqual(a, eingabe, 'mit kleinstem Zufall wird gemischt');
  assert.deepEqual(mische([]), []);
});

test('Ziehen: verschiebe setzt einen Eintrag um und ändert die Eingabe nie', () => {
  const l = ['a', 'b', 'c', 'd'];
  assert.deepEqual(verschiebe(l, 0, 2), ['b', 'c', 'a', 'd']);
  assert.deepEqual(verschiebe(l, 3, 0), ['d', 'a', 'b', 'c']);
  assert.deepEqual(verschiebe(l, 1, 1), l);
  assert.deepEqual(verschiebe(l, -1, 2), l);
  assert.deepEqual(verschiebe(l, 1, 9), l);
  assert.deepEqual(l, ['a', 'b', 'c', 'd'], 'Eingabe bleibt unverändert');
});

test('Ziehen: falscheZeilen markiert nur Zeilen an falscher Stelle, gleichwertige Schritte dürfen tauschen', () => {
  const k = ['brille', 'beschriften', 'einfüllen', 'zusatz', 'beobachten'];
  assert.deepEqual(falscheZeilen(k, k), []);
  assert.deepEqual(falscheZeilen(k, ['brille', 'einfüllen', 'beschriften', 'zusatz', 'beobachten'], [[1, 2]]), [], 'gleichwertig vertauscht');
  assert.deepEqual(falscheZeilen(k, ['brille', 'einfüllen', 'beschriften', 'zusatz', 'beobachten']), [1, 2], 'ohne Gruppe falsch');
  assert.deepEqual(falscheZeilen(k, ['beobachten', 'beschriften', 'einfüllen', 'zusatz', 'brille'], [[1, 2]]), [0, 4]);
  // Übereinstimmung mit reihenfolge(): vollständig und ohne falsche Zeilen = fertig
  const g = [[1, 2]];
  for (const x of [k, ['brille', 'einfüllen', 'beschriften', 'zusatz', 'beobachten'], ['zusatz', 'brille', 'beschriften', 'einfüllen', 'beobachten']]) {
    assert.equal(falscheZeilen(k, x, g).length === 0, reihenfolge(k, x, g).fertig);
  }
});

test('Aufgabe 2 und Lieferung: Keine Ziehliste ist von Anfang an gelöst, Texte bleiben kurz genug für eine Seite', () => {
  for (const id of ['a4', 'a7']) {
    for (const [n, steps] of Object.entries(A.aufgaben[id].niveaus)) {
      for (const s of steps.filter((x) => x.type === 'reihenfolge')) {
        const gelegt = s.anzeige.map((i) => s.korrekt[i]);
        assert.notEqual(falscheZeilen(s.korrekt, gelegt, s.gleichwertig).length, 0, `${id}/${n}: schon gelöst`);
        assert.ok(s.korrekt.length <= 7, `${id}/${n}: höchstens 7 Karten`);
        for (const t of s.korrekt) assert.ok(t.length <= 110, `${id}/${n}: Karte zu lang: ${t.slice(0, 40)}`);
      }
    }
  }
});

test('Ziehliste: Pointer-Events für Finger und Maus, die gezogene Karte bleibt im Baum, ▲▼ als zweiter Weg', () => {
  const src = readFileSync(join(root, 'src/tasks/labor-types.js'), 'utf8');
  const css = readFileSync(join(root, 'assets/css/design.css'), 'utf8');
  for (const ev of ['pointerdown', 'pointermove', 'pointerup', 'pointercancel']) assert.ok(src.includes(`'${ev}'`), ev);
  assert.match(src, /setPointerCapture/);
  // Umhängen der gezogenen Karte selbst würde den Finger loslassen (lostpointercapture): nur die Nachbarn rücken
  assert.doesNotMatch(src, /list\.insertBefore\(z,/);
  assert.match(src, /aria-label': `Schritt \$\{i \+ 1\} nach oben`/);
  assert.match(css, /\.papier \.zieh-zeile \{[^}]*touch-action: none/);
  // Anweisung und „Prüfen“ stehen in einem Block mit der Liste (kein Seitenumbruch dazwischen)
  assert.match(src, /h\('div', 'zieh-block',\s*h\('div', 'zieh-kopf'/);
});
