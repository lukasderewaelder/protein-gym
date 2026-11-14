// Protein-Gym: Start, Szenenwechsel, Laufen per Tippen, Hotspots, Dialoge.

import { createStore, browserStorage } from './state/store.js';
import { createViewport } from './engine/viewport.js';
import { buildGrid, findPath, nearestWalkable } from './engine/grid.js';
import { createPlayer, setPath, updatePlayer } from './engine/player.js';
import { drawScene, zielPos, SHIRTS, SKINS, HAIRS, FIGURE_HEIGHT } from './engine/render.js';
import { loadFirst, loadFigureSprites, loadNpcSprite } from './engine/assets.js';
import { createDialog, zeilenFuellen } from './ui/dialog.js';
import { initStart } from './ui/start.js';
import { vollbildMoeglich, istVollbild, vollbildAn, umschalten, beiVollbildwechsel, vollbildHinweis, istApple } from './ui/vollbild.js';
import { sperreZoom, haltePosition } from './ui/ruhe.js';
import { createEditor, loadEdits } from './engine/editor.js';
import { createNotebook } from './ui/notebook.js';
import { createTaskPanel } from './ui/taskpanel.js';
import { encodeProgress } from './state/progress.js';
import { alleFallKarten } from './state/fall.js';
import { merkePosition, holePosition } from './state/zwischenstand.js';
import { erfuellt, istSichtbar, tafelKarte } from './state/zugang.js';
import { sperrenderEintrag } from './state/hefter.js';
import { wortPasst, schluesselAus } from './state/lehrcode.js';
import { ladeSchluessel, speichereSchluessel, entferneSchluessel } from './state/klassenwort.js';
import { createZugang, ausweisKarte } from './ui/zugang.js';
import { liste as inventarListe, neuAnzahl, markiereGesehen } from './state/inventar.js';
import { renderInventar } from './ui/inventar.js';
import { naechsterSchritt, zielZeile, wegStationen } from './state/naechster-schritt.js';
import { zaehleTuerVersuch, tuerHilfeDialog } from './state/tuerhilfe.js';
import { h, clear } from './ui/dom.js';
import { renderFund, fundIcon } from './ui/funde.js';
import { macheSeiten } from './ui/seiten.js';
import { fundart, istZusatz } from './ui/funde-core.js';

const $ = (sel) => document.querySelector(sel);
const params = new URLSearchParams(location.search);
const storage = browserStorage();
const store = createStore(storage);
store.load();

const canvas = $('#stage');
const ctx = canvas.getContext('2d');
const vp = createViewport(canvas);
const dialog = createDialog($('#dialog'));
const player = createPlayer(0, 0);

const DATA = { scenes: new Map(), dialogs: {}, wissen: null, aufgaben: null, glossar: null, cards: new Map() };
let notebook = null;
let taskPanel = null;
let zugang = null;
let tuerAnim = null;          // { id, t0 }: Tür gleitet auf (Zeichnung in render.js)
let cur = null;               // { scene, grid, bg, npcs }
let figureSprites = null;
let pending = null;           // Hotspot, der bei Ankunft ausgelöst wird
let busy = false;
let editor = null;
let vollbildKnoepfe = null;   // Beschriftung der Vollbild-Knöpfe neu setzen (aus wireVollbild)

/** Aufgabenfenster hängen sich hier ein: tasks.<name> = (hotspot) => { ... } (Hotspot-Feld "task"). */
const tasks = {
  empfang_menu: () => taskPanel.openMenu('empfang'),
  training_menu: () => taskPanel.openMenu('training'),
  labor_menu: () => taskPanel.openMenu('labor'),
  lieferung_menu: () => taskPanel.openMenu('lieferung'),
  sauna_menu: () => taskPanel.openMenu('sauna'),
  shake_menu: () => taskPanel.openMenu('shakebar'),
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function loadData() {
  const [scenes, dialogs, wissen, aufgaben, glossar, versuch, werbung, hefter, aehnlich, fall, fuehrerschein, inventar, faecher, hilfe] = await Promise.all(
    ['szenen', 'dialoge', 'wissen', 'aufgaben', 'glossar', 'versuch', 'werbung', 'hefter', 'aehnlich', 'fall', 'fuehrerschein', 'inventar', 'schliessfaecher', 'hilfe'].map((n) => fetch(`data/${n}.json`).then((r) => r.json())),
  );
  DATA.aehnlich = aehnlich;
  DATA.fuehrerschein = fuehrerschein;
  DATA.inventar = inventar;
  DATA.faecher = faecher;
  DATA.hilfe = hilfe;
  // Inhalte der Bonus-Schließfächer landen als Gegenstände in der Tasche
  for (const f of faecher.faecher) {
    inventar.gegenstaende.push({ id: `fach${f.id}`, name: f.name, text: f.text, emoji: f.emoji, symbol: 'emoji', hat: f.flag });
    // Schlüssel (Schloss „schluessel“): liegen versteckt im Raum (Flag bz_N) und passen in das Fach mit derselben Nummer
    if (f.schloss === 'schluessel') {
      inventar.gegenstaende.push({
        id: `schluessel${f.id}`, name: f.schluessel.name, text: f.schluessel.fundort, emoji: '🔑', symbol: 'emoji', hat: `bz_${f.id}`, benutzt: f.flag,
        hinweisNeu: `Zu welchem Schließfach im Empfang passt er? Auf dem Anhänger steht die Nummer ${f.id}.`, hinweisBenutzt: `Benutzt: Schließfach ${f.id} ist offen.`,
      });
    }
  }
  DATA.fall = fall;
  DATA.versuch = versuch;
  DATA.werbung = werbung;
  DATA.hefter = hefter;
  for (const s of scenes.szenen) DATA.scenes.set(s.id, s);
  DATA.dialogs = dialogs;
  DATA.wissen = wissen;
  DATA.aufgaben = aufgaben;
  DATA.glossar = glossar;
  for (const k of wissen.karten) DATA.cards.set(k.id, k);
}

/** Die vier Fall-Hinweise passend zum gewürfelten Verursacher als Karten bereitstellen (Pinnwand, Leiste, Fund-Fenster). */
function buildFallCards() {
  const karten = DATA.wissen.karten;
  for (let i = karten.length - 1; i >= 0; i--) if (karten[i].fall) { DATA.cards.delete(karten[i].id); karten.splice(i, 1); }
  for (const k of alleFallKarten(store.state.fall.taeter, DATA.fall)) { karten.push(k); DATA.cards.set(k.id, k); }
}

/** Markus, der Trainer im Empfang: Einweisung, danach Hinweise zum nächsten Raum, am Ende die Auflösung des Falls, die Prüfung der neuen Lieferung und das Schlussquiz. */
function coach() {
  if (!store.hasFlag('empfang_done')) {
    if (!store.hasFlag('spind_gesehen')) playDialog('empfang.coach.spind');
    else if (!store.hasFlag('k_protein') && !store.hasFlag('k_wichtig')) playDialog('empfang.coach.keinhinweis');
    else taskPanel.openMenu('empfang');
    return;
  }
  if (store.hasFlag('shakebar_done')) {
    // Auflösung → neue Lieferung im Labor prüfen → Schlussquiz → Zertifikat
    if (!store.hasFlag('quiz_done')) taskPanel.openTask('quiz', 'abschluss');
    else if (!store.hasFlag('lieferung_done')) playDialog('empfang.coach.lieferung');
    else if (!store.hasFlag('quiz2_done')) { if (hefterSperre('schluss')) hefterSperreZeigen(); else playDialog('empfang.coach.schlussquiz', undefined, () => taskPanel.openTask('quiz2', 'schluss')); }
    else showZertifikat();
    return;
  }
  const weiter = !store.hasFlag('labor_done') ? 'labor' : !store.hasFlag('sauna_done') ? 'sauna' : !store.hasFlag('training_done') ? 'training' : 'shakebar';
  playDialog(`empfang.coach.${weiter}`);
}

function showInfo(title, ...nodes) {
  const dlg = $('#info');
  $('#info-title').textContent = title;
  $('#info-body').replaceChildren(...nodes);
  dlg.showModal();
}

function showCode() {
  showInfo('Fortschrittscode', h('p', {}, 'Notiere den Code. Damit kannst du nach Verlust des Spielstands weiterspielen:'), h('p', 'code', encodeProgress(store.state)), h('p', 'hint', 'Der Code enthält keine Namen.'));
}

function showCall() {
  const el = $('#call');
  el.hidden = false;
  el.focus({ preventScroll: true });
}

/** Tafel im Labor: Plakat mit den Sicherheitsregeln. Den Code gibt es erst nach dem Versuch (Schritt „versuch“). */
function openFreigabe() {
  showFund(tafelKarte(DATA.versuch), false);
}

function collectCard(id) {
  const card = DATA.cards.get(id);
  const isNew = !store.hasFlag(id);
  if (isNew) store.setFlag(id);
  showFund(card, isNew);
  renderTray(isNew ? id : null);
}

/** Fund in seiner Fundart (Haftnotiz, Zeitung, Chat …) groß anzeigen. Neue Funde mit „Einstecken“, sie bleiben in Leiste und Pinnwand. */
let fundSeiten = null;
function showFund(card, isNew = false, extra = []) {
  const dlg = $('#fund');
  const box = $('#fund-inhalt');
  if (fundSeiten) { fundSeiten.ende(); fundSeiten = null; }
  dlg.classList.remove('breit');
  clear(box);
  // Kein null an append geben: Es würde als Text „null“ über der Karte erscheinen
  box.append(...[
    isNew ? h('p', 'fund-neu', 'Neues Hinweiskärtchen!') : null,
    renderFund(card),
    ...extra,
    h('button', { class: 'primary', type: 'button', onclick: () => dlg.close() }, isNew ? 'Einstecken' : 'Schließen'),
  ].filter(Boolean));
  if (!dlg.open) dlg.showModal();
  passeFundEin(box.querySelector('article.fund'));
}

// Zweiter Weg aus einer Karte: neben die Karte (auf den dunklen Hintergrund) tippen schließt sie wie der Knopf
$('#fund').addEventListener('click', (e) => { if (e.target === e.currentTarget) e.currentTarget.close(); });

/** Kein Scrollen: Ist eine Karte zu lang, wird das Fenster erst breiter, dann werden ihre Zeilen auf Seiten verteilt. */
function passeFundEin(art) {
  if (!art) return;
  const zuLang = () => art.scrollHeight > art.clientHeight + 1;
  requestAnimationFrame(() => {
    if (!zuLang()) return;
    $('#fund').classList.add('breit');
    if (!zuLang()) return;
    const liste = art.querySelector('.fund-text, .fund-liste, .fund-verhoer, .fund-chat, .fund-spalten, .fund-felder-liste');
    if (!liste) return;
    art.classList.add('geblaettert');
    liste.classList.add('fund-seiten');
    const nav = h('nav', { class: 'fund-nav', 'aria-label': 'Seiten der Karte' });
    art.after(nav);
    fundSeiten = macheSeiten(liste, { nav, kompakt: false, kleben: (k) => k.tagName === 'DT' || k.classList.contains('fund-frage') });
    fundSeiten.neu();
    // Reicht das nicht (zum Beispiel große Formeln auf der Schautafel), wird die ganze Karte Block für Block geblättert
    requestAnimationFrame(() => {
      if (!zuLang() && liste.scrollHeight <= liste.clientHeight + 1) return;
      fundSeiten.ende();
      liste.classList.remove('fund-seiten', 'seiten-voll');
      art.classList.add('ganz');
      fundSeiten = macheSeiten(art, { nav, kompakt: false, ignorieren: (k) => k.classList.contains('fund-deko'), kleben: (k) => k.classList.contains('fund-kopf') || k.classList.contains('fund-vorspann') });
      fundSeiten.neu();
    });
  });
}

function trayKarte(k, neu) {
  const art = fundart(k.medium);
  const titel = k.titel.replace(/ \(Zusatzwissen\)$/, '');
  return h('button', {
    type: 'button', class: `tray-karte${istZusatz(k) ? ' zusatz' : ''}${neu ? ' neu' : ''}`, style: `--fund-farbe:${art.farbe}`,
    title: istZusatz(k) ? `${titel} (Zusatzwissen)` : titel, 'aria-label': `Hinweiskärtchen: ${titel}`, onclick: () => showFund(k, false),
  }, h('span', 'tray-haken', fundIcon(art.id, 22)));
}

/**
 * Hinweiskärtchen dieses Raums als eine Zeile in der oberen Leiste (nie über der Szene): gefundene als antippbares Symbol der Fundart,
 * fehlende als leere Plätze, dazu der Zähler. Zusatzkarten erscheinen erst nach dem Fund.
 */
function renderTray(neuId = null) {
  const tray = $('#tray');
  clear(tray);
  if (!cur) { tray.hidden = true; return; }
  const alle = DATA.wissen.karten.filter((k) => k.raum === cur.scene.id);
  const pflicht = alle.filter((k) => k.typ === 'pflicht');
  const zusatz = alle.filter((k) => k.typ === 'zusatz' && store.hasFlag(k.id));
  if (!pflicht.length && !zusatz.length) { tray.hidden = true; return; }
  tray.hidden = false;
  const gefunden = pflicht.filter((k) => store.hasFlag(k.id)).length;
  if (pflicht.length) tray.append(h('span', { class: 'tray-kopf', 'aria-label': `Hinweise: ${gefunden} von ${pflicht.length} gefunden` }, h('span', {}, 'Hinweise'), h('span', {}, `${gefunden}/${pflicht.length}`)));
  for (const k of pflicht) tray.append(store.hasFlag(k.id) ? trayKarte(k, k.id === neuId) : h('span', { class: 'tray-leer', 'aria-hidden': 'true' }));
  for (const k of zusatz) tray.append(trayKarte(k, k.id === neuId));
}

/** Sprites der einen Spielfigur laden (figur_v1_walk_*). Fehlen sie, zeichnet das Spiel eine Platzhalterfigur. */
async function refreshFigure() {
  figureSprites = (await loadFigureSprites(1)) || null;
}

function applyFontScale() {
  const k = Math.min(1.5, Math.max(0.9, store.state.fontScale || 1));
  document.documentElement.style.setProperty('--font-scale', String(k));
}

/** Noch nicht abgeschriebener Heftereintrag, der den Raum sperrt (Pflicht vor dem nächsten Raum), sonst null. */
function hefterSperre(raum) {
  return sperrenderEintrag(DATA.hefter, store.state.flags, store.state.hefterHaken, raum);
}
function hefterSperreZeigen() {
  playDialog('hefter.sperre', undefined, () => notebook.open('hefter'));
}

function isLocked(hs) {
  return !erfuellt(hs.requires, (f) => store.hasFlag(f));
}

async function loadNpcs(scene) {
  const list = [];
  for (const hs of scene.hotspots) {
    if (hs.type === 'npc') list.push({ hs, sprite: await loadNpcSprite(hs.id) });
  }
  return list;
}

async function enterScene(id, { fade = true, pos = null } = {}) {
  const def = DATA.scenes.get(id);
  if (!def) return;
  busy = true;
  const fadeEl = $('#fade');
  // Immer antippbar: Scheitert das Laden (Bild fehlt, Netz weg), darf `busy` nicht hängen bleiben, sonst läuft die Figur nie wieder
  try {
    await szeneLaden(id, def, { fade, pos, fadeEl });
  } catch (err) {
    console.error('Raum konnte nicht geladen werden', err);
    return;
  } finally {
    busy = false;
    fadeEl.classList.remove('on');
  }
  if (id === 'empfang' && !store.hasFlag('intro_done')) playDialog('empfang.intro', undefined, askVorher);
  else if (raumGruss(id)) playDialog(`raum.${id}.start`);
}

async function szeneLaden(id, def, { fade, pos, fadeEl }) {
  if (fade) { fadeEl.classList.add('on'); await sleep(210); }

  const scene = structuredClone(def);
  if (params.has('edit')) {
    const e = loadEdits(id, storage);
    if (e) { scene.blocked = e.blocked; scene.hotspots = e.hotspots; }
  }
  const bg = await loadFirst(`assets/szenen/${scene.bg}`);
  cur = { scene, grid: buildGrid(scene), bg, npcs: await loadNpcs(scene) };

  const [sx, sy] = pos ? [pos.x, pos.y] : scene.spawn; // gespeicherte Position nach Neuladen, sonst der Eingang
  const spawn = nearestWalkable(cur.grid, sx, sy) || { x: sx, y: sy };
  player.x = spawn.x;
  player.y = spawn.y;
  player.dir = 'down';
  player.path = [];
  pending = null;

  store.state.scene = id;
  merkePosition(store.state, id, player.x, player.y);
  store.save();
  $('#room-chip').textContent = scene.name;
  renderTray();
  zielAktualisieren();

  if (fade) { await sleep(40); fadeEl.classList.remove('on'); }
}

/** Beim ersten Betreten eines Raums sagt die Figur dort kurz die Reihenfolge (erst Hinweise, dann Aufgabe); nicht, wenn der Raum schon geschafft ist. */
function raumGruss(id) {
  return Boolean(DATA.dialogs[`raum.${id}.start`]) && !store.hasFlag(`raum_${id}_gruss`) && !store.hasFlag(`${id}_done`);
}

function rebuildCurrent() {
  if (!cur) return;
  cur.grid = buildGrid(cur.scene);
  loadNpcs(cur.scene).then((n) => { cur.npcs = n; });
}

function playDialog(id, fallback, after) {
  const entry = DATA.dialogs[id] || fallback || { speaker: '', lines: ['(Hier fehlt noch ein Text.)'] };
  const names = store.state.names;
  dialog.show(
    { speaker: entry.speaker, portrait: entry.portrait, lines: zeilenFuellen(entry.lines, names) },
    () => {
      if (entry.setFlag) store.setFlag(entry.setFlag);
      if (after) after();
    },
  );
}

/** Die Eingangsfrage („Warum wird das Eiweiß im Eiklar fest?“) wird gespeichert und im Abschluss-Rückblick wieder gezeigt. */
function askVorher() {
  if (store.state.protokoll && store.state.protokoll.vorher) return;
  const ta = h('textarea', { rows: 3, 'aria-label': 'Deine Idee', placeholder: 'Meine Idee: …' });
  showInfo('Deine Idee',
    h('p', {}, 'Warum wird das Eiweiß im Eiklar in der Pfanne eigentlich fest? Schreibe kurz auf, was du vermutest. Es gibt kein Richtig oder Falsch, am Ende vergleichst du.'),
    ta,
    h('button', {
      class: 'primary', type: 'button',
      onclick: () => {
        store.state.protokoll = store.state.protokoll || {};
        store.state.protokoll.vorher = ta.value.trim().slice(0, 300);
        store.save();
        $('#info').close();
      },
    }, 'Speichern'));
  ta.focus({ preventScroll: true });
}

async function showZertifikat() {
  const names = store.state.names;
  $('#zert-namen').textContent = names.join(', ') || 'Trainingspartner';
  $('#zert-datum').textContent = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' });
  const q = store.state.quiz;
  $('#zert-quiz').textContent = q ? `Auflösung des Falls: ${q.richtig} von ${q.von} Fragen gleich beim ersten Versuch richtig.` : '';
  const q2 = store.state.quiz2;
  $('#zert-quiz2').textContent = q2 ? `Schlussquiz zum Nachweis: ${q2.richtig} von ${q2.von} Fragen gleich beim ersten Versuch richtig.` : '';
  $('#zert-code').textContent = encodeProgress(store.state);
  const rahmen = await loadFirst('assets/szenen/zertifikat_rahmen');
  $('#zert-karte').style.backgroundImage = rahmen ? `url(${rahmen.src})` : '';
  $('#zert-karte').classList.toggle('mit-rahmen', Boolean(rahmen));
  $('#zert').hidden = false;
  $('#zert-zu').focus({ preventScroll: true });
  passeZertifikatEin();
}

/** Kein Scrollen: Passt der Text nicht in die Urkunde, wird nur die Urkunde etwas kleiner gesetzt (die Druckansicht bleibt unberührt). */
function passeZertifikatEin() {
  const karte = $('#zert-karte');
  karte.style.removeProperty('--font-scale');
  requestAnimationFrame(() => {
    const basis = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--font-scale')) || 1;
    for (let f = basis; f > 0.6 && karte.scrollHeight > karte.clientHeight + 1; f -= 0.05) karte.style.setProperty('--font-scale', f.toFixed(2));
  });
}

function trigger(hs) {
  pending = null;
  if (hs.type === 'door') {
    if (isLocked(hs)) {
      // Führerschein und Zahlenschloss sind der richtige Weg, kein Fehlversuch; sonst gibt es ab dem 2. Mal konkrete Hilfe von der passenden Figur
      const richtigerWeg = (hs.sperre === 'labor' && store.hasFlag('empfang_done') && !store.hasFlag('lf_bestanden'))
        || (hs.sperre === 'sauna' && store.hasFlag('labor_done') && !store.hasFlag('sauna_offen'));
      if (!richtigerWeg && tuerHilfeZeigen(hs)) return;
      if (hs.sperre) sperre(hs);
      else playDialog(`tuer.${hs.id}`, { speaker: 'Tür', lines: [hs.lockedText || 'Noch gesperrt.'] });
    } else if (hefterSperre(hs.to)) {
      hefterSperreZeigen();
    } else {
      enterScene(hs.to);
    }
    return;
  }
  if (hs.karte) {
    // Beim ersten Mal das ganze Gespräch, danach (falls vorhanden) die kurze Fassung „<id>.nochmal“
    const wieder = hs.dialog && store.hasFlag(hs.karte) && DATA.dialogs[`${hs.dialog}.nochmal`];
    if (hs.dialog) playDialog(wieder ? `${hs.dialog}.nochmal` : hs.dialog, undefined, () => collectCard(hs.karte));
    else collectCard(hs.karte);
    return;
  }
  if (hs.aktion === 'notizbuch') { notebook.open(); return; }
  if (hs.aktion === 'freigabe') { openFreigabe(); return; }
  if (hs.aktion === 'coach') { coach(); return; }
  if (hs.aktion === 'leser') { leser(hs); return; }
  if (hs.aktion === 'fach') { zugang.fach(DATA.faecher.faecher.find((x) => x.id === hs.fach)); return; }
  if (hs.aktion === 'zettel') { zettelAnsehen(hs); return; }
  if (hs.task && tasks[hs.task]) { tasks[hs.task](hs); return; }
  playDialog(hs.dialog || `${cur.scene.id}.${hs.id}`, { speaker: hs.label, lines: ['(Hier fehlt noch ein Text.)'] });
}

/**
 * Verschlossene Tür mehrfach angetippt: Ab dem 2. Mal sagt die Figur, die zum fehlenden Schritt gehört, was konkret noch zu lösen ist
 * (Schritt aus naechsterSchritt, Texte in data/hilfe.json). Gibt true zurück, wenn die Hilfe gezeigt wird.
 */
function tuerHilfeZeigen(hs) {
  const n = zaehleTuerVersuch(store.state, hs.id);
  store.save();
  const schritt = naechsterSchritt(store.state.flags, { aufgaben: DATA.aufgaben, karten: DATA.wissen.karten, hefter: DATA.hefter, haken: store.state.hefterHaken });
  const entry = tuerHilfeDialog(n, schritt, DATA.hilfe);
  if (!entry) return false;
  playDialog('tuer.hilfe', entry);
  return true;
}

/** Gesperrte Tür mit eigener Geschichte: Labor (Führerschein, Ausweis) und Sauna (Zahlenschloss). */
function sperre(hs) {
  const text = () => playDialog(`tuer.${hs.id}`, { speaker: 'Tür', lines: [hs.lockedText || 'Noch gesperrt.'] });
  if (hs.sperre === 'labor') {
    if (!store.hasFlag('empfang_done')) text();
    else if (!store.hasFlag('lf_bestanden')) {
      playDialog('empfang.fuehrerschein', undefined, () => zugang.fuehrerschein({ beiBestanden: () => playDialog('empfang.fuehrerschein.ok') }));
    } else playDialog('tuer.tuer_labor.verriegelt');
    return;
  }
  if (hs.sperre === 'sauna') {
    if (!store.hasFlag('labor_done')) { text(); return; }
    if (store.hasFlag('sauna_offen')) { enterScene(hs.to); return; }
    zugang.tastenfeld({
      titel: 'Tür der Sauna',
      text: 'Zugang gesperrt. Bitte vierstelligen Sicherheitscode eingeben.',
      stellen: 4,
      code: store.state.codes.sauna,
      falschText: 'Falscher Code.',
      richtigText: 'Code erkannt. Sauna entriegelt!',
      beiRichtig: () => {
        store.setFlag('sauna_offen');
        tuerAnim = { id: hs.id, t0: performance.now() };
        busy = true;
        setTimeout(() => { busy = false; tuerAnim = null; }, 1100);
      },
    });
    return;
  }
  text();
}

/** Ziel-Zeile in der oberen Leiste: zeigt immer die nächste Station (dieselbe Logik wie „Wie geht’s weiter?“); Antippen öffnet die genauere Hilfe. */
let zielMerker = '';
function zielAktualisieren() {
  const knopf = $('#ziel');
  if (!DATA.hilfe || !DATA.aufgaben || !store.hasNames()) { knopf.hidden = true; return; }
  const daten = { aufgaben: DATA.aufgaben, karten: DATA.wissen.karten, hefter: DATA.hefter, haken: store.state.hefterHaken };
  const z = zielZeile(naechsterSchritt(store.state.flags, daten), store.state.flags, daten, DATA.hilfe);
  if (!z) { knopf.hidden = true; return; }
  const schluessel = `${z.ort}|${z.text}`;
  if (schluessel === zielMerker && !knopf.hidden) return;
  zielMerker = schluessel;
  $('#ziel-ort').textContent = z.ort && z.ort !== 'Überall' ? z.ort : '';
  $('#ziel-text').textContent = z.text;
  knopf.title = `Als Nächstes: ${z.ort && z.ort !== 'Überall' ? `${z.ort}: ` : ''}${z.text}. Antippen für genauere Hilfe.`;
  knopf.hidden = false;
}

/** „Wie geht’s weiter?“: Markus nennt die nächste Station, auf Wunsch genauer. */
function weiterDialog() {
  const id = naechsterSchritt(store.state.flags, { aufgaben: DATA.aufgaben, karten: DATA.wissen.karten, hefter: DATA.hefter, haken: store.state.hefterHaken });
  zugang.hilfe({
    titel: DATA.hilfe.titel, knopf: DATA.hilfe.stufe2Knopf, schritt: DATA.hilfe.schritte[id], weg: wegStationen(store.state.flags),
    // Hilfe 3 beim Saunacode: Spind öffnen, der kleine Zettel rechts oben an der Pinnwand blinkt kurz
    beiStufe3: (aktion) => { if (aktion === 'saunazettel') { zugang.schliesse(); notebook.open('karten', { hervorheben: true }); } },
  });
}

/** Zettel mit einem Fachcode oder ein versteckter Schlüssel: wird beim ersten Ansehen gefunden und bleibt als Haken im Raum. */
function zettelAnsehen(hs) {
  const f = DATA.faecher.faecher.find((x) => x.id === hs.zettel);
  const neu = !store.hasFlag(`bz_${f.id}`);
  if (neu) store.setFlag(`bz_${f.id}`);
  if (f.schloss === 'schluessel') { zugang.schluesselFund(f, neu); return; }
  const zeilen = f.zettel.zeilen.map((z) => z.replaceAll('{code}', f.code));
  showFund({ id: `bz_${f.id}`, medium: 'haftnotiz', titel: 'Zettel mit Zahlen', kopf: 'Zettel mit Zahlen', zeilen }, neu);
}

/** Tasche: Zählpunkt für neue Gegenstände, Knopf poppt beim Einsammeln. */
let neuZuletzt = 0;
function taschePruefen(pop = true) {
  if (!DATA.inventar) return;
  const items = inventarListe(DATA.inventar.gegenstaende, (f) => store.hasFlag(f));
  const neu = neuAnzahl(items, store.state.inventarGesehen);
  const zahl = $('#tasche-zahl');
  zahl.hidden = neu === 0;
  zahl.textContent = String(neu);
  const knopf = $('#btn-tasche');
  if (pop && neu > neuZuletzt) { knopf.classList.remove('pop'); void knopf.offsetWidth; knopf.classList.add('pop'); }
  neuZuletzt = neu;
}
function inventarGesehen() {
  const items = inventarListe(DATA.inventar.gegenstaende, (f) => store.hasFlag(f));
  store.state.inventarGesehen = markiereGesehen(items, store.state.inventarGesehen || {});
  store.save();
  taschePruefen(false);
}
function taschenFenster() {
  zugang.zeige('Tasche', h('div', 'tasche-liste', ...renderInventar({ daten: DATA.inventar, store })));
  inventarGesehen();
}

/** Notizen, die im Spielverlauf an der Pinnwand entstehen (derzeit keine: der Saunazettel hängt immer rechts oben). */
function extraKarten() {
  return [];
}
/** Der Zettel rechts oben an der Pinnwand wurde nach Markus’ Hinweis gesehen: der Code gilt als gesehen (die Hilfe fragt dann nicht mehr danach). */
function saunaZettelGesehen() {
  if (!store.hasFlag('sauna_code_gesehen')) store.setFlag('sauna_code_gesehen');
}
function codeAnsehen() {
  const neu = !store.hasFlag('sauna_code_gesehen');
  if (neu) store.setFlag('sauna_code_gesehen');
  zugang.codeGross(store.state.codes.sauna, neu);
  notebook.refresh();
}

/** Kartenlesegerät neben der Labortür: Ausweis wird gezückt, Lämpchen wird grün, die Tür gleitet auf. */
function leser(hs) {
  if (store.hasFlag('labor_offen')) { playDialog('empfang.leser.offen'); return; }
  if (!store.hasFlag('item_ausweis')) { playDialog('empfang.leser.ohne'); return; }
  busy = true;
  const karte = ausweisKarte(store.state.names, true);
  karte.classList.add('ausweis-flug');
  document.body.append(karte);
  const reduziert = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  setTimeout(() => {
    karte.remove();
    store.setFlag('item_ausweis_benutzt');
    store.setFlag('labor_offen');
    tuerAnim = { id: 'tuer_labor', t0: performance.now() };
    setTimeout(() => { busy = false; tuerAnim = null; playDialog('empfang.leser.ok'); }, reduziert ? 200 : 1100);
  }, reduziert ? 200 : 1000);
}

function hitHotspot(p) {
  const list = cur.scene.hotspots;
  const minR = 28 / vp.v.scale; // Tippfläche mindestens ca. 56 Pixel breit
  for (let i = list.length - 1; i >= 0; i--) {
    const hs = list[i];
    if (!istSichtbar(hs, (f) => store.hasFlag(f))) continue;
    // Mit `ziel` zählt nur der Gegenstand selbst (genau dort, wo Funke oder Haken zu sehen sind), nicht der Boden davor
    if (hs.ziel) {
      const z = zielPos(hs);
      if (Math.hypot(p.x - z.x, p.y - z.y) <= Math.max(hs.ziel.r || 55, minR)) return hs;
      continue;
    }
    const r = Math.max(hs.r || 60, minR);
    const body = hs.type === 'npc' ? FIGURE_HEIGHT * 0.5 : 0;
    if (Math.hypot(p.x - hs.x, p.y - hs.y) <= r || (body && Math.hypot(p.x - hs.x, p.y - (hs.y - body)) <= r)) return hs;
  }
  return null;
}

function onPointerDown(e) {
  if (!cur || busy || dialog.isOpen || $('#zugang').open || !$('#start').hidden || $('#menu').open || $('#notebook').open || $('#info').open || (taskPanel && taskPanel.isOpen) || !$('#call').hidden || !$('#zert').hidden) return;
  const p = vp.toWorld(e.clientX, e.clientY);
  if (editor && editor.active) { editor.pointerDown(p); canvas.setPointerCapture(e.pointerId); return; }
  const hs = hitHotspot(p);
  if (hs) {
    const path = findPath(cur.grid, player, { x: hs.x, y: hs.y });
    const near = Math.hypot(player.x - hs.x, player.y - hs.y) <= (hs.r || 60) * 0.9;
    if (near || !path.length) { setPath(player, []); trigger(hs); return; }
    pending = hs;
    setPath(player, path);
  } else {
    pending = null;
    setPath(player, findPath(cur.grid, player, p));
  }
}

canvas.addEventListener('pointerdown', onPointerDown);
canvas.addEventListener('pointermove', (e) => {
  if (editor && editor.active) editor.pointerMove(vp.toWorld(e.clientX, e.clientY));
});
canvas.addEventListener('pointerup', () => { if (editor) editor.pointerUp(); });

let last = performance.now();
let time = 0;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  time += dt;
  if (cur && !busy) {
    if (updatePlayer(player, dt) && pending) trigger(pending);
  }
  if (cur) {
    ctx.save();
    vp.apply(ctx);
    drawScene(ctx, {
      scene: cur.scene,
      bg: cur.bg,
      figureSprites,
      player,
      shirtCss: SHIRTS[store.state.shirt]?.css,
      skinCss: SKINS[store.state.skin]?.css,
      hairStyle: HAIRS[store.state.hair]?.style,
      npcs: cur.npcs,
      time,
      isLocked,
      fachOffen: (hs) => store.hasFlag(`bonus_${hs.fach}`),
      isHidden: (hs) => !istSichtbar(hs, (f) => store.hasFlag(f)),
      geraetOffen: (hs) => (hs.leser === 'labor' ? store.hasFlag('labor_offen') : false),
      tuerAnim: tuerAnim ? { ...tuerAnim, p: Math.min(1, (performance.now() - tuerAnim.t0) / 1000) } : null,
      isFound: (hs) => Boolean((hs.karte && store.hasFlag(hs.karte)) || (hs.zettel && store.hasFlag(`bz_${hs.zettel}`))),
      fundInfo: (hs) => DATA.cards.get(hs.karte) || null,
      showAll: Boolean(editor),
      showLabels: editor ? true : undefined,
      overlay: editor ? editor.overlay : null,
    });
    ctx.restore();
  }
  requestAnimationFrame(frame);
}

/** Menü „Für die Lehrkraft“: Klassenwort prüfen und nur den abgeleiteten Schlüssel auf dem Gerät speichern (src/state/klassenwort.js). */
function lehrkraftEinrichten() {
  const kw = DATA.versuch.klassenwort || {};
  zugang.klassenwortFenster({
    eingerichtet: Boolean(ladeSchluessel(globalThis.localStorage)),
    hatPruefwert: Boolean(kw.hash),
    pruefen: async (wort) => {
      if (!(await wortPasst(wort, kw.hash, kw.iterationen))) return false;
      return speichereSchluessel(globalThis.localStorage, await schluesselAus(wort, kw.iterationen));
    },
    entfernen: () => entferneSchluessel(globalThis.localStorage),
  });
}

function wireMenu() {
  const menu = $('#menu');
  $('#btn-menu').addEventListener('click', () => {
    $('#btn-zert').hidden = !store.hasFlag('quiz2_done');
    $('#menu-code').textContent = encodeProgress(store.state);
    $('#menu-code-info').textContent = '';
    menu.showModal();
  });
  $('#btn-code-kopieren').addEventListener('click', async () => {
    const code = encodeProgress(store.state);
    const info = $('#menu-code-info');
    try {
      await navigator.clipboard.writeText(code);
      info.textContent = 'Kopiert.';
    } catch {
      // Zwischenablage nicht erlaubt (zum Beispiel im eingebetteten Fenster): Code markieren, dann von Hand kopieren
      const sel = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents($('#menu-code'));
      sel.removeAllRanges();
      sel.addRange(range);
      info.textContent = 'Der Code ist markiert. Kopiere ihn mit Strg+C oder halte den Finger darauf.';
    }
  });
  $('#btn-zert').addEventListener('click', () => { menu.close(); showZertifikat(); });
  $('#zert-zu').addEventListener('click', () => { $('#zert').hidden = true; });
  $('#zert-druck').addEventListener('click', () => window.print());
  $('#menu-close').addEventListener('click', () => menu.close());
  $('#btn-code').addEventListener('click', () => { menu.close(); showCode(); });
  $('#btn-lehrkraft').addEventListener('click', () => { menu.close(); lehrkraftEinrichten(); });
  $('#info-close').addEventListener('click', () => $('#info').close());
  $('#btn-notebook').addEventListener('click', () => notebook.open());
  $('#call').addEventListener('click', () => { $('#call').hidden = true; });
  const bump = (d) => {
    store.state.fontScale = Math.round(Math.min(1.5, Math.max(0.9, (store.state.fontScale || 1) + d)) * 100) / 100;
    store.save();
    applyFontScale();
  };
  $('#font-down').addEventListener('click', () => bump(-0.1));
  $('#font-up').addEventListener('click', () => bump(0.1));
  // Eigenes Fenster statt window.confirm: Browser-Dialoge beenden das Vollbild. Nach dem Neuladen holt der Start-Knopf es zurück.
  const neuFrage = $('#neu-frage');
  $('#btn-reset').addEventListener('click', () => { menu.close(); neuFrage.showModal(); });
  $('#neu-abbrechen').addEventListener('click', () => neuFrage.close());
  $('#neu-loeschen').addEventListener('click', () => {
    store.reset();
    location.reload();
  });
}

/**
 * Vollbild nur per Knopf (Vorgabe der Lehrkraft): beim Start einmal, danach nur über den Knopf ⛶ in der Leiste oder im Menü. Kein Tippen im
 * Spiel fordert Vollbild an; sonst springt das Bild mitten im Tipp und der Tipp geht verloren. Endet Vollbild durch den Browser (Tastatur, Esc,
 * App-Wechsel, Neuladen), bleibt das Spiel ruhig im Fenster, und der Leisten-Knopf leuchtet, solange Vollbild gewünscht war.
 */
function wireVollbild() {
  const knopf = $('#btn-vollbild');
  const leiste = $('#btn-vollbild-leiste');
  const hinweis = $('#vollbild-hinweis');
  // Geht Vollbild nicht oder lehnt der Browser ab, erklärt ein Hinweis im Menü den Weg (Home-Bildschirm, Browser-Menü).
  // App-Modus = vom Home-Bildschirm gestartet. Chrome meldet „display-mode: fullscreen“ auch beim Vollbild per Knopf, das zählt nicht als App.
  const appModus = () => !istVollbild() && Boolean(window.matchMedia && window.matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches);
  const zeigeHinweis = (art) => { hinweis.textContent = hinweis.dataset[art] || ''; hinweis.hidden = !hinweis.textContent; };
  const zeige = () => {
    const an = istVollbild();
    const app = appModus();
    knopf.textContent = app ? 'Vollbild: an (App)' : `Vollbild: ${an ? 'an' : 'aus'}`;
    knopf.setAttribute('aria-pressed', String(an || app));
    // Leisten-Knopf nur, wo Vollbild per Knopf möglich ist (nicht iPhone, nicht als App vom Home-Bildschirm)
    leiste.hidden = app || !vollbildMoeglich();
    leiste.setAttribute('aria-pressed', String(an));
    const titel = an ? 'Vollbild aus' : 'Vollbild an';
    leiste.title = titel;
    leiste.setAttribute('aria-label', titel);
    leiste.classList.toggle('zurueck', !an && Boolean(store.state.vollbild));
  };
  const schalte = async (mitHinweis) => {
    hinweis.hidden = true;
    const moeglich = vollbildMoeglich();
    if (appModus() || !moeglich) { if (mitHinweis) zeigeHinweis(vollbildHinweis({ moeglich, appModus: appModus(), ios: istApple(navigator) })); return; }
    const warAn = istVollbild();
    const an = await umschalten();
    if (!warAn && !an && mitHinweis) zeigeHinweis(vollbildHinweis({ moeglich, appModus: false, ios: istApple(navigator) })); // abgelehnt
    store.state.vollbild = an;
    store.save();
    zeige();
  };
  knopf.addEventListener('click', () => schalte(true));
  leiste.addEventListener('click', () => schalte(false));
  zeige();
  beiVollbildwechsel(() => {
    zeige();
    setTimeout(() => vp.sync(), 100);
  });
  return zeige;
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
  if (local && !params.has('sw')) return; // lokal aus, damit Änderungen sofort sichtbar sind
  navigator.serviceWorker.register('sw.js').catch(() => { /* ohne Offline-Betrieb weiterspielen */ });
}

async function begin() {
  $('#hud').hidden = false;
  const szene = DATA.scenes.has(store.state.scene) ? store.state.scene : 'empfang';
  await enterScene(szene, { fade: false, pos: holePosition(store.state, szene) });
  // Speicher soll nicht von selbst gelöscht werden; wo er fehlt, deutlich warnen
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch { /* egal */ }
  if (!storage) showInfo('Speichern nicht möglich', h('p', {}, 'Dieser Browser speichert nichts (zum Beispiel im privaten Fenster). Dein Fortschritt geht verloren, wenn du den Browser schließt.'), h('p', {}, 'Notiere dir deshalb nach jedem Raum den Fortschrittscode (Menü → Mein Code).'));
}

/** Position der Figur und Spielstand sichern, auch wenn der Browser plötzlich geschlossen wird. */
function sichereZwischenstand() {
  if (!cur || busy || !store.hasNames()) return;
  merkePosition(store.state, cur.scene.id, player.x, player.y);
  store.save();
}

/** Ein Raum ist geschafft: im Labor meldet sich Markus per Funk, nach dem Schlussquiz gibt es das Zertifikat. true = das Aufgabenfenster zeigt nichts weiter an. */
function raumGeschafft(room) {
  if (room === 'labor') {
    // Sauna gesperrt (Markus verrät nicht, wo der Code ist). Danach zeigt das Fenster den Fortschrittscode.
    taskPanel.close();
    playDialog('labor.markus.sauna', undefined, () => taskPanel.showRoomDone('labor'));
    return true;
  }
  if (room === 'abschluss') {
    // Fall gelöst: Markus schickt noch einmal ins Labor (neue Lieferung), das Zertifikat kommt erst nach dem Schlussquiz
    taskPanel.close();
    playDialog('empfang.coach.lieferung', undefined, () => taskPanel.showRoomDone('abschluss'));
    return true;
  }
  if (room === 'lieferung') {
    taskPanel.close();
    playDialog('labor.lieferung.fertig', undefined, () => taskPanel.showRoomDone('lieferung'));
    return true;
  }
  if (room === 'schluss') {
    taskPanel.close();
    showZertifikat();
    return true;
  }
  return false;
}

async function boot() {
  applyFontScale();
  vp.resize();
  window.addEventListener('resize', vp.resize);
  window.addEventListener('orientationchange', () => setTimeout(vp.resize, 200));
  // Kein Zoom (Zwei Finger, Strg + Mausrad, Strg + Plus) und die Seite steht still (nach Tastatur oder Fokus wieder ganz oben)
  sperreZoom(document);
  haltePosition(document, window, { nachher: () => vp.sync() });
  wireMenu();
  vollbildKnoepfe = wireVollbild();
  registerServiceWorker();
  await loadData();
  buildFallCards();
  await refreshFigure();
  zugang = createZugang({ dlg: $('#zugang'), store, daten: { fuehrerschein: DATA.fuehrerschein } });
  $('#zugang-zu').addEventListener('click', () => zugang.schliesse());
  $('#btn-tasche').addEventListener('click', taschenFenster);
  $('#btn-hilfe').addEventListener('click', weiterDialog);
  $('#ziel').addEventListener('click', weiterDialog);
  // Ziel-Zeile aktuell halten: bei jedem Flag, beim Raumwechsel (enterScene) und für Hefter-Haken, die kein Flag setzen
  store.onFlag(zielAktualisieren);
  setInterval(zielAktualisieren, 1000);
  zielAktualisieren();
  $('#btn-weiter').addEventListener('click', () => { $('#menu').close(); weiterDialog(); });
  store.onFlag(() => taschePruefen());
  taschePruefen(false);
  notebook = createNotebook({ onOpen: () => store.setFlag('spind_gesehen'), onFund: (k) => showFund(k, false), inventar: DATA.inventar, onInventar: inventarGesehen, extras: extraKarten, onCode: codeAnsehen, onZettel: saunaZettelGesehen, dialogEl: $('#notebook'), wissen: DATA.wissen, glossar: DATA.glossar, hefter: DATA.hefter, store });
  taskPanel = createTaskPanel({
    root: $('#task'),
    data: { aufgaben: DATA.aufgaben, wissen: DATA.wissen, versuch: DATA.versuch, werbung: DATA.werbung, aehnlich: DATA.aehnlich, fall: DATA.fall, hefter: DATA.hefter },
    store,
    notebook,
    showCall,
    onRoomDone: raumGeschafft,
  });

  if (params.has('edit')) {
    editor = createEditor({
      toolbar: $('#editor-bar'),
      output: $('#editor-out'),
      storage,
      getScene: () => cur.scene,
      onChange: rebuildCurrent,
    });
  }

  const start = initStart($('#start'), {
    // Tippen auf „Los geht’s“ / „Weiterspielen“ ist die Geste, die der Browser für Vollbild braucht
    onGeste: () => { if (vollbildMoeglich()) { store.state.vollbild = true; vollbildAn().then(() => vollbildKnoepfe && vollbildKnoepfe()); } },
    onNew: async ({ names }) => {
      Object.assign(store.state, { names, shirt: 0, hair: 0, skin: 0 });
      store.save();
      await refreshFigure();
      start.hide();
      begin();
    },
    onRestore: async ({ names, shirt, hair, skin, scene, flags, levels, quiz, fall, codes }) => {
      Object.assign(store.state, { names, shirt, hair, skin, scene, flags, levels, quiz, fall, codes, pos: null, taskProgress: {} });
      store.ensureCodes();
      store.save();
      buildFallCards();
      await refreshFigure();
      start.hide();
      begin();
    },
  });

  setInterval(sichereZwischenstand, 4000);
  window.addEventListener('pagehide', sichereZwischenstand);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') sichereZwischenstand(); });

  requestAnimationFrame(frame);
  if (store.hasNames()) begin();
  else start.show();

  // Entwicklungshilfe in der Konsole: __pg.unlockAll(), __pg.goto('labor'), __pg.allCards(), __pg.openTask('a1', 'training')
  window.__pg = {
    store,
    player,
    goto: (id) => enterScene(id),
    refreshFigure,
    setSprites: (s) => { figureSprites = s; },
    unlockAll: () => ['empfang_done', 'labor_done', 'sauna_done', 'training_done', 'spind_gesehen', 'lf_bestanden', 'item_ausweis', 'item_ausweis_benutzt', 'labor_offen', 'sauna_info', 'sauna_code_gesehen', 'sauna_offen'].forEach((f) => store.setFlag(f)),
    setFall: (id) => { store.state.fall = { taeter: id }; store.save(); buildFallCards(); },
    allCards: () => { DATA.wissen.karten.forEach((k) => store.setFlag(k.id)); },
    openTask: (id, room) => taskPanel.openTask(id, room),
    raumGeschafft,
    openMenu: (room) => taskPanel.openMenu(room),
    showFund: (id, neu = false) => showFund(DATA.cards.get(id), neu),
    showZertifikat,
    coach,
    get scene() { return cur && cur.scene; },
  };
}

boot();
