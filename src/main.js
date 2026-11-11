// Protein-Gym: Start, Szenenwechsel, Laufen per Tippen, Hotspots, Dialoge.

import { createStore, browserStorage } from './state/store.js';
import { createViewport } from './engine/viewport.js';
import { buildGrid, findPath, nearestWalkable } from './engine/grid.js';
import { createPlayer, setPath, updatePlayer } from './engine/player.js';
import { drawScene, SHIRTS, SKINS, HAIRS, FIGURE_HEIGHT } from './engine/render.js';
import { loadFirst, loadFigureSprites, loadNpcSprite } from './engine/assets.js';
import { createDialog, fillNames } from './ui/dialog.js';
import { initStart } from './ui/start.js';
import { vollbildMoeglich, istVollbild, vollbildAn, umschalten, beiVollbildwechsel } from './ui/vollbild.js';
import { createEditor, loadEdits } from './engine/editor.js';
import { createNotebook } from './ui/notebook.js';
import { createTaskPanel } from './ui/taskpanel.js';
import { encodeProgress } from './state/progress.js';
import { alleFallKarten } from './state/fall.js';
import { merkePosition, holePosition } from './state/zwischenstand.js';
import { h, clear } from './ui/dom.js';
import { renderFund, fundIcon } from './ui/funde.js';
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
let cur = null;               // { scene, grid, bg, npcs }
let figureSprites = null;
let pending = null;           // Hotspot, der bei Ankunft ausgelöst wird
let busy = false;
let editor = null;

/** Aufgabenfenster hängen sich hier ein: tasks.<name> = (hotspot) => { ... } (Hotspot-Feld "task"). */
const tasks = {
  empfang_menu: () => taskPanel.openMenu('empfang'),
  training_menu: () => taskPanel.openMenu('training'),
  labor_menu: () => taskPanel.openMenu('labor'),
  sauna_menu: () => taskPanel.openMenu('sauna'),
  shake_menu: () => taskPanel.openMenu('shakebar'),
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function loadData() {
  const [scenes, dialogs, wissen, aufgaben, glossar, versuch, werbung, hefter, aehnlich, fall] = await Promise.all(
    ['szenen', 'dialoge', 'wissen', 'aufgaben', 'glossar', 'versuch', 'werbung', 'hefter', 'aehnlich', 'fall'].map((n) => fetch(`data/${n}.json`).then((r) => r.json())),
  );
  DATA.aehnlich = aehnlich;
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

/** Die vier Fall-Hinweise passend zum gewürfelten Täter als Karten bereitstellen (Pinnwand, Leiste, Fund-Fenster). */
function buildFallCards() {
  const karten = DATA.wissen.karten;
  for (let i = karten.length - 1; i >= 0; i--) if (karten[i].fall) { DATA.cards.delete(karten[i].id); karten.splice(i, 1); }
  for (const k of alleFallKarten(store.state.fall.taeter, DATA.fall)) { karten.push(k); DATA.cards.set(k.id, k); }
}

/** Markus, der Trainer im Empfang: Einweisung, danach Hinweise zum nächsten Raum, am Ende die Auflösung des Falls. */
function coach() {
  if (!store.hasFlag('empfang_done')) {
    if (!store.hasFlag('spind_gesehen')) playDialog('empfang.coach.spind');
    else taskPanel.openMenu('empfang');
    return;
  }
  if (store.hasFlag('shakebar_done')) {
    if (store.hasFlag('quiz_done')) showZertifikat();
    else taskPanel.openTask('quiz', 'abschluss');
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

/** Tafel „Versuch frei?“: Die Lehrkraft nennt den Code. Nur eine Hürde, keine Sicherheitsfreigabe. */
function openFreigabe() {
  if (store.hasFlag('lab_frei')) {
    playDialog('labor.tafel.frei', { speaker: 'Tafel', lines: ['Versuch frei! Denk an Schutzbrille und Handschuhe. Den Versuch findest du an den Stationen.'] });
    return;
  }
  const input = h('input', { class: 'name-input', type: 'text', inputmode: 'numeric', autocomplete: 'off', maxlength: '12', 'aria-label': 'Code der Lehrkraft', placeholder: 'Code' });
  const msg = h('p', { class: 'error', role: 'alert' });
  const submit = () => {
    if (input.value.trim().toLowerCase() === String(DATA.versuch.freigabeCode).toLowerCase()) {
      store.setFlag('lab_frei');
      $('#info').close();
      playDialog('labor.freigabe', { speaker: 'Tafel', lines: ['Versuch frei! Denk an die Sicherheit:', ...DATA.versuch.sicherheit] });
    } else {
      msg.textContent = 'Das ist nicht der Code der Lehrkraft.';
    }
  };
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
  showInfo('Versuch frei?',
    h('p', {}, 'Die Lehrkraft nennt den Code, wenn Material und Sicherheitsunterweisung bereit sind.'),
    input, msg,
    h('button', { class: 'primary', type: 'button', onclick: submit }, 'Freigeben'),
    h('p', 'hint', DATA.versuch.hinweisCode));
  input.focus({ preventScroll: true });
}

function collectCard(id) {
  const card = DATA.cards.get(id);
  const isNew = !store.hasFlag(id);
  if (isNew) store.setFlag(id);
  showFund(card, isNew);
  renderTray(isNew ? id : null);
}

/** Fund in seiner Fundart (Haftnotiz, Zeitung, Chat …) groß anzeigen. Neue Funde mit „Einstecken“, sie bleiben in Leiste und Pinnwand. */
function showFund(card, isNew = false) {
  const dlg = $('#fund');
  const box = $('#fund-inhalt');
  clear(box);
  box.append(
    isNew ? h('p', 'fund-neu', 'Neues Hinweiskärtchen!') : null,
    renderFund(card),
    h('button', { class: 'primary', type: 'button', onclick: () => dlg.close() }, isNew ? 'Einstecken' : 'Schließen'),
  );
  if (!dlg.open) dlg.showModal();
}

function trayKarte(k, neu) {
  const art = fundart(k.medium);
  return h('button', { type: 'button', class: `tray-karte${istZusatz(k) ? ' zusatz' : ''}${neu ? ' neu' : ''}`, style: `--fund-farbe:${art.farbe}`, title: art.name, onclick: () => showFund(k, false) },
    h('span', 'tray-haken', fundIcon(art.id, 20)), k.titel.replace(/ (Zusatzwissen)$/, ''));
}

/** Leiste mit den Hinweiskärtchen dieses Raums: gefundene sind dauerhaft antippbar, fehlende zeigen nur, dass noch etwas zu entdecken ist. */
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
  if (pflicht.length) {
    tray.append(h('div', 'tray-kopf',
      h('span', {}, `Hinweise: ${gefunden} von ${pflicht.length}`),
      h('span', 'tray-punkte', pflicht.map((k) => h('i', { class: store.hasFlag(k.id) ? 'an' : '' })))));
  }
  for (const k of pflicht.filter((x) => store.hasFlag(x.id))) {
    tray.append(trayKarte(k, k.id === neuId));
  }
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

function isLocked(hs) {
  return Boolean(hs.requires) && !store.hasFlag(hs.requires);
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

  if (fade) { await sleep(40); fadeEl.classList.remove('on'); }
  busy = false;

  if (id === 'empfang' && !store.hasFlag('intro_done')) playDialog('empfang.intro', undefined, askVorher);
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
    { speaker: entry.speaker, portrait: entry.portrait, lines: entry.lines.map((l) => fillNames(l, names)) },
    () => {
      if (entry.setFlag) store.setFlag(entry.setFlag);
      if (after) after();
    },
  );
}

/** Die Eingangsfrage („Warum wird Eiklar fest?“) wird gespeichert und im Abschluss-Rückblick wieder gezeigt. */
function askVorher() {
  if (store.state.protokoll && store.state.protokoll.vorher) return;
  const ta = h('textarea', { rows: 3, 'aria-label': 'Deine Idee', placeholder: 'Meine Idee: …' });
  showInfo('Deine Idee',
    h('p', {}, 'Warum wird Eiklar in der Pfanne eigentlich fest? Schreibe kurz auf, was du vermutest. Es gibt kein Richtig oder Falsch, am Ende vergleichst du.'),
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
  $('#zert-code').textContent = encodeProgress(store.state);
  const rahmen = await loadFirst('assets/szenen/zertifikat_rahmen');
  $('#zert-karte').style.backgroundImage = rahmen ? `url(${rahmen.src})` : '';
  $('#zert-karte').classList.toggle('mit-rahmen', Boolean(rahmen));
  $('#zert').hidden = false;
  $('#zert-zu').focus({ preventScroll: true });
}

function trigger(hs) {
  pending = null;
  if (hs.type === 'door') {
    if (isLocked(hs)) {
      playDialog(`tuer.${hs.id}`, { speaker: 'Tür', lines: [hs.lockedText || 'Noch gesperrt.'] });
    } else {
      enterScene(hs.to);
    }
    return;
  }
  if (hs.karte) {
    if (hs.dialog) playDialog(hs.dialog, undefined, () => collectCard(hs.karte));
    else collectCard(hs.karte);
    return;
  }
  if (hs.aktion === 'notizbuch') { notebook.open(); return; }
  if (hs.aktion === 'freigabe') { openFreigabe(); return; }
  if (hs.aktion === 'coach') { coach(); return; }
  if (hs.task && tasks[hs.task]) { tasks[hs.task](hs); return; }
  playDialog(hs.dialog || `${cur.scene.id}.${hs.id}`, { speaker: hs.label, lines: ['(Hier fehlt noch ein Text.)'] });
}

function hitHotspot(p) {
  const list = cur.scene.hotspots;
  const minR = 28 / vp.v.scale; // Tippfläche mindestens ca. 56 Pixel breit
  for (let i = list.length - 1; i >= 0; i--) {
    const hs = list[i];
    const r = Math.max(hs.r || 60, minR);
    const body = hs.type === 'npc' ? FIGURE_HEIGHT * 0.5 : 0;
    if (Math.hypot(p.x - hs.x, p.y - hs.y) <= r || (body && Math.hypot(p.x - hs.x, p.y - (hs.y - body)) <= r)) return hs;
  }
  return null;
}

function onPointerDown(e) {
  if (!cur || busy || dialog.isOpen || !$('#start').hidden || $('#menu').open || $('#notebook').open || $('#info').open || (taskPanel && taskPanel.isOpen) || !$('#call').hidden || !$('#zert').hidden) return;
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
      isFound: (hs) => Boolean(hs.karte && store.hasFlag(hs.karte)),
      fundInfo: (hs) => DATA.cards.get(hs.karte) || null,
      showAll: Boolean(editor),
      showLabels: editor ? true : undefined,
      overlay: editor ? editor.overlay : null,
    });
    ctx.restore();
  }
  requestAnimationFrame(frame);
}

function wireMenu() {
  const menu = $('#menu');
  $('#btn-menu').addEventListener('click', () => { $('#btn-zert').hidden = !store.hasFlag('quiz_done'); menu.showModal(); });
  $('#btn-zert').addEventListener('click', () => { menu.close(); showZertifikat(); });
  $('#zert-zu').addEventListener('click', () => { $('#zert').hidden = true; });
  $('#zert-druck').addEventListener('click', () => window.print());
  $('#menu-close').addEventListener('click', () => menu.close());
  $('#btn-code').addEventListener('click', () => { menu.close(); showCode(); });
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
  $('#btn-reset').addEventListener('click', () => {
    if (window.confirm('Alle Daten auf diesem Gerät löschen und neu beginnen?')) {
      store.reset();
      location.reload();
    }
  });
}

/** Vollbild: Schalter im Menü, Zustand merken, nach dem Neuladen beim ersten Tippen wieder anfordern. */
function wireVollbild() {
  const knopf = $('#btn-vollbild');
  const hinweis = $('#vollbild-hinweis');
  if (!vollbildMoeglich()) {
    // iPhone und ähnliche Browser: kein Vollbild möglich; als App auf dem Home-Bildschirm läuft das Spiel ohne Leisten
    const app = window.matchMedia && window.matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches;
    hinweis.hidden = app;
    return;
  }
  knopf.hidden = false;
  const zeige = (an) => { knopf.textContent = `Vollbild: ${an ? 'an' : 'aus'}`; knopf.setAttribute('aria-pressed', String(an)); };
  zeige(istVollbild());
  knopf.addEventListener('click', async () => {
    const an = await umschalten();
    store.state.vollbild = an;
    store.save();
    zeige(istVollbild());
  });
  beiVollbildwechsel((an) => {
    zeige(an);
    if (store.state.vollbild !== an) { store.state.vollbild = an; if (store.hasNames()) store.save(); } // auch Esc des Browsers
    setTimeout(vp.resize, 100);
  });
  // Nach dem Neuladen darf der Browser Vollbild erst nach einer Geste erlauben: beim ersten Tippen nachholen
  if (store.state.vollbild && store.hasNames() && !istVollbild()) {
    document.addEventListener('pointerdown', () => { vollbildAn(); }, { once: true, capture: true });
  }
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
  if (!storage) showInfo('Speichern nicht möglich', h('p', {}, 'Dieser Browser speichert nichts (zum Beispiel im privaten Fenster). Dein Fortschritt geht verloren, wenn du den Browser schließt.'), h('p', {}, 'Notiere dir deshalb nach jedem Raum den Fortschrittscode (Menü → Fortschrittscode anzeigen).'));
}

/** Position der Figur und Spielstand sichern, auch wenn der Browser plötzlich geschlossen wird. */
function sichereZwischenstand() {
  if (!cur || busy || !store.hasNames()) return;
  merkePosition(store.state, cur.scene.id, player.x, player.y);
  store.save();
}

async function boot() {
  applyFontScale();
  vp.resize();
  window.addEventListener('resize', vp.resize);
  window.addEventListener('orientationchange', () => setTimeout(vp.resize, 200));
  wireMenu();
  wireVollbild();
  registerServiceWorker();
  await loadData();
  buildFallCards();
  await refreshFigure();
  notebook = createNotebook({ onOpen: () => store.setFlag('spind_gesehen'), onFund: (k) => showFund(k, false), dialogEl: $('#notebook'), wissen: DATA.wissen, glossar: DATA.glossar, hefter: DATA.hefter, store });
  taskPanel = createTaskPanel({
    root: $('#task'),
    data: { aufgaben: DATA.aufgaben, wissen: DATA.wissen, versuch: DATA.versuch, werbung: DATA.werbung, aehnlich: DATA.aehnlich, fall: DATA.fall },
    store,
    notebook,
    showCall,
    onRoomDone: (room) => {
      if (room !== 'abschluss') return false;
      taskPanel.close();
      showZertifikat();
      return true;
    },
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
    onGeste: () => { if (vollbildMoeglich()) { store.state.vollbild = true; vollbildAn(); } },
    onNew: async ({ names }) => {
      Object.assign(store.state, { names, shirt: 0, hair: 0, skin: 0 });
      store.save();
      await refreshFigure();
      start.hide();
      begin();
    },
    onRestore: async ({ names, shirt, hair, skin, scene, flags, levels, quiz, fall }) => {
      Object.assign(store.state, { names, shirt, hair, skin, scene, flags, levels, quiz, fall, pos: null, taskProgress: {} });
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
    unlockAll: () => ['empfang_done', 'labor_done', 'sauna_done', 'training_done', 'spind_gesehen'].forEach((f) => store.setFlag(f)),
    setFall: (id) => { store.state.fall = { taeter: id }; store.save(); buildFallCards(); },
    allCards: () => { DATA.wissen.karten.forEach((k) => store.setFlag(k.id)); store.setFlag('lab_frei'); },
    openTask: (id, room) => taskPanel.openTask(id, room),
    openMenu: (room) => taskPanel.openMenu(room),
    showFund: (id, neu = false) => showFund(DATA.cards.get(id), neu),
    showZertifikat,
    coach,
    get scene() { return cur && cur.scene; },
  };
}

boot();
