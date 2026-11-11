// Der Fall: zufälliger Täter, Beweis- und Alibi-Hinweise, Auflösung, Speicherung im Fortschrittscode.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { FALL_LIST, FALL_HINWEISE, FALL_FLAGS, wuerfleTaeter, hinweisArt, fallKarte, alleFallKarten, taeterRichtig, hinweisZurWahl } from '../src/state/fall.js';
import { FUNDART_IDS, parseProtokoll, parseFelder } from '../src/ui/funde-core.js';
import { encodeProgress, decodeProgress, FLAG_LIST, CODE_VERSION } from '../src/state/progress.js';
import { createStore } from '../src/state/store.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const F = JSON.parse(readFileSync(join(root, 'data/fall.json'), 'utf8'));

test('Täter wird zufällig gewürfelt: alle vier Enden sind möglich, der Zufall ist austauschbar', () => {
  assert.deepEqual([0, 0.26, 0.51, 0.76, 0.999].map((z) => wuerfleTaeter(() => z)), ['desi', 'kurt', 'hannes', 'zoe', 'zoe']);
  const gesehen = new Set();
  for (let i = 0; i < 400; i++) gesehen.add(wuerfleTaeter());
  assert.equal(gesehen.size, 4, 'alle vier Täter kommen vor');
});

test('Jeder Raum gehört genau einem Verdächtigen, jede Person hat Name, Raum und Auslöser', () => {
  assert.deepEqual(Object.keys(FALL_HINWEISE).sort(), ['labor', 'sauna', 'shakebar', 'training']);
  assert.deepEqual(Object.values(FALL_HINWEISE).map((h) => h.verdaechtiger).sort(), [...FALL_LIST].sort());
  assert.equal(new Set(FALL_FLAGS).size, 4);
  for (const f of FALL_FLAGS) assert.ok(FLAG_LIST.includes(f), `${f} fehlt in FLAG_LIST`);
  for (const id of FALL_LIST) {
    const v = F.verdaechtige[id];
    assert.ok(v.name && v.ort && v.ausloeser && v.portrait, id);
  }
});

test('Zu jedem Täter gibt es genau einen Beweis und drei Alibis, der Beweis gehört zum Täter', () => {
  for (const taeter of FALL_LIST) {
    const karten = alleFallKarten(taeter, F);
    assert.equal(karten.length, 4);
    const beweise = karten.filter((k) => k.art === 'beweis');
    assert.equal(beweise.length, 1, `${taeter}: genau ein Beweis`);
    assert.equal(beweise[0].verdaechtiger, taeter);
    assert.equal(karten.filter((k) => k.art === 'alibi').length, 3);
    for (const k of karten) {
      assert.equal(hinweisArt(k.verdaechtiger, taeter), k.art);
      assert.equal(k.typ, 'pflicht');
      assert.ok(k.fall);
    }
  }
});

test('Fall-Karten haben eine bekannte Fundart, Text in der passenden Form und eine Aussage am Ende', () => {
  for (const raum of Object.keys(FALL_HINWEISE)) {
    const t = F.hinweise[raum];
    assert.ok(FUNDART_IDS.includes(t.medium), `${raum}: Fundart ${t.medium}`);
    for (const art of ['alibi', 'beweis']) {
      const k = fallKarte(raum, art === 'beweis' ? FALL_HINWEISE[raum].verdaechtiger : FALL_LIST.find((x) => x !== FALL_HINWEISE[raum].verdaechtiger), F);
      assert.equal(k.art, art);
      assert.ok(k.zeilen.length >= 3 && k.fuss && k.titel && k.ort && k.kopf, `${raum}/${art}`);
      if (t.medium === 'protokoll') assert.equal(parseProtokoll(k.zeilen).length, k.zeilen.length, `${raum}/${art}: F/A-Zeilen`);
      if (['bericht', 'laborzettel'].includes(t.medium)) assert.ok(parseFelder(k.zeilen).filter((f) => f.label).length >= 3, `${raum}/${art}: Felder`);
      const ende = k.zeilen[k.zeilen.length - 1];
      assert.doesNotMatch(k.zeilen.join(' ') + k.fuss, /entlastet|belastet|entkräftet|Alibi|Verdacht/i, `${raum}/${art}: kein Urteil im Hinweis, das finden die Lernenden selbst heraus`);
      assert.ok(ende.length > 10, `${raum}/${art}: letzte Zeile`);
    }
  }
});

test('Die richtige Wahl wird nur für den gewürfelten Täter akzeptiert, eine falsche liefert einen Hinweis', () => {
  for (const taeter of FALL_LIST) {
    for (const wahl of FALL_LIST) {
      assert.equal(taeterRichtig(wahl, taeter), wahl === taeter);
      if (wahl === taeter) continue;
      const alleGefunden = Object.fromEntries(FALL_FLAGS.map((f) => [f, true]));
      assert.match(hinweisZurWahl(wahl, taeter, F, alleGefunden), /Lies noch einmal/);
      assert.doesNotMatch(hinweisZurWahl(wahl, taeter, F, alleGefunden), /entlastet|Alibi/);
      assert.match(hinweisZurWahl(wahl, taeter, F, {}), /fehlt dir noch ein Hinweis/);
    }
    assert.equal(taeterRichtig(null, taeter), false);
  }
});

test('Auflösungstexte: je Ende drei Zeilen, nennen den Auslöser und erklären das Gerinnen', () => {
  for (const id of FALL_LIST) {
    const z = F.aufloesung[id];
    assert.equal(z.length, 3, id);
    assert.ok(z[0].includes(F.verdaechtige[id].name.split('-').pop().split(' ').pop()), `${id}: nennt die Person`);
    assert.match(z.join(' '), /gerinn|flock/i, `${id}: Gerinnen`);
  }
  assert.match(F.aufloesung.desi.join(' '), /Alkohol/);
  assert.match(F.aufloesung.kurt.join(' '), /Schwermetallsalz/);
  assert.match(F.aufloesung.hannes.join(' '), /Hitze/);
  assert.match(F.aufloesung.zoe.join(' '), /Säure/);
});

test('Texte in Labor und Sauna nehmen nichts vorweg (keine Aminosäuren, keine Faltung)', () => {
  for (const raum of ['labor', 'sauna']) {
    assert.doesNotMatch(JSON.stringify(F.hinweise[raum]), /Aminosäure|Struktur|gefaltet|Kette/, raum);
  }
  assert.doesNotMatch(JSON.stringify(F), /Rühl|Arnold|Schwarzenegger/);
});

test('Der Täter steckt im Fortschrittscode (Version 5) und bleibt beim Weiterspielen erhalten', () => {
  assert.equal(CODE_VERSION, 5);
  for (const taeter of FALL_LIST) {
    const res = decodeProgress(encodeProgress({ shirt: 0, hair: 0, skin: 0, scene: 'labor', flags: { f_labor: true }, levels: {}, quiz: null, fall: { taeter } }));
    assert.equal(res.ok, true);
    assert.equal(res.state.fall.taeter, taeter);
    assert.equal(res.state.flags.f_labor, true);
  }
});

test('Der Speicherstand würfelt den Täter beim Start einmal und behält ihn', () => {
  const mem = {};
  const st = { getItem: (k) => mem[k] ?? null, setItem: (k, v) => { mem[k] = v; }, removeItem: (k) => { delete mem[k]; } };
  const a = createStore(st, () => 0.6);
  a.load();
  assert.equal(a.state.fall.taeter, 'hannes');
  a.save();
  const b = createStore(st, () => 0.1); // anderer Zufall: der gespeicherte Täter bleibt
  b.load();
  assert.equal(b.state.fall.taeter, 'hannes');
  b.reset();
  assert.equal(b.state.fall.taeter, 'desi', 'neues Spiel würfelt neu');
});
