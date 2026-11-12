// Aufgabenfenster: Menü je Raum, Niveauwahl, Schritte, Fehlerrückmeldung mit vier Hilfestufen.
//   1 Notizbuch/Glossar (immer)   2 Tipp (nach dem 2. Fehlversuch)   3 Hilfekarte (ebenfalls)
//   4 Lösungsbeispiel (nach dem 3. Fehlversuch). Hilfen kosten nichts; es gibt keine Punkte.

import { h, clear } from './dom.js';
import { TYPES } from '../tasks/types.js';
import { fehlendeKarten, raumFertig, quizErgebnis, aehnlicheAufgabe } from '../tasks/check.js';
import { encodeProgress } from '../state/progress.js';
import { macheSeiten } from './seiten.js';
import { merkeFortschritt, holeFortschritt, loescheFortschritt } from '../state/zwischenstand.js';

/** Namen für Freigaben, die keine Wissenskarte sind (Anzeige im gesperrten Menüeintrag). */
const FLAG_TEXTE = {
  spind_gesehen: 'den Spind im Empfang einmal öffnen',
  shakebar_done: 'alle vier Räume',
  quiz_done: 'die Auflösung des Falls bei Markus',
  lieferung_done: 'die Prüfung der neuen Lieferung im Labor',
};

export function createTaskPanel({ root, data, store, notebook, showCall, onRoomDone }) {
  const card = root.querySelector('.task-card');
  const titleEl = root.querySelector('#task-title');
  const metaEl = root.querySelector('.task-meta');
  const levelsEl = root.querySelector('.task-levels');
  const stepsEl = root.querySelector('.task-steps');
  const barEl = root.querySelector('.task-bar');
  const bodyEl = root.querySelector('.task-body');
  const navEl = root.querySelector('.task-nav');
  const feedbackEl = root.querySelector('.task-feedback');
  const helpEl = root.querySelector('.task-help');
  const footEl = root.querySelector('.task-foot');
  const kartenById = new Map(data.wissen.karten.map((k) => [k.id, k]));
  // Kein Scrollen: Was nicht auf eine Seite passt, wird auf Seiten verteilt (Zurück/Weiter unter dem Aufgabenbereich)
  const seiten = macheSeiten(bodyEl, { nav: navEl, kleben: (k) => k.matches('.frage, .task-auftrag, h3, .satz, ol.gewaehlt, .task-levels') });
  let S = null;
  let roomId = null;

  // Die Lieferungs-Prüfung teilt sich das Niveau mit dem Labor (nur dort steckt es im Fortschrittscode)
  const levelRoom = () => (data.aufgaben.raeume[roomId] && data.aufgaben.raeume[roomId].niveauVon) || roomId;
  const levelOf = () => (store.state.levels && store.state.levels[levelRoom()]) ?? 1;
  const levelKey = () => data.aufgaben.niveaus[levelOf()].id;
  const stufe = () => (S.t.niveaus.alle ? 'alle' : levelKey());

  function close() {
    root.hidden = true;
    S = null;
  }
  root.querySelector('#task-close').addEventListener('click', close);
  window.addEventListener('keydown', (e) => { if (!root.hidden && e.key === 'Escape') close(); });

  function renderLevels(onChange) {
    clear(levelsEl);
    data.aufgaben.niveaus.forEach((n, i) => {
      levelsEl.append(h('button', {
        type: 'button',
        'aria-pressed': String(levelOf() === i),
        title: n.text,
        onclick: () => {
          store.state.levels = { ...store.state.levels, [levelRoom()]: i };
          store.save();
          onChange();
        },
      }, n.name));
    });
  }

  // ---------- Menü ----------
  function openMenu(room) {
    roomId = room;
    S = null;
    const rd = data.aufgaben.raeume[room];
    root.hidden = false;
    titleEl.textContent = rd.titel;
    metaEl.textContent = 'Wähle ein Niveau und eine Aufgabe. Zuerst die Wissenskarten im Raum sammeln!';
    renderLevels(() => openMenu(room));
    levelsEl.hidden = rd.aufgaben.every((tid) => data.aufgaben.aufgaben[tid].niveaus.alle);
    stepsEl.textContent = '';
    barEl.hidden = true;
    helpEl.hidden = true;
    feedbackEl.textContent = '';
    clear(bodyEl);
    clear(footEl);
    const flags = store.state.flags;
    const level = levelOf();
    const list = h('div', 'task-menu');
    for (const id of rd.aufgaben) {
      const t = data.aufgaben.aufgaben[id];
      const missing = fehlendeKarten(t, flags);
      const done = Boolean(flags[t.flag]);
      const optional = !rd.pflicht.includes(id) && !(level === 2 && (rd.pflichtSchwer || []).includes(id));
      const info = missing.length
        ? `Noch gesperrt. Es fehlt: ${missing.map((m) => (kartenById.get(m) ? `${kartenById.get(m).titel} (${kartenById.get(m).ort})` : (FLAG_TEXTE[m] || 'noch ein Hinweis im Raum'))).join(', ')}.`
        : `${t.zeit}${optional ? ' · freiwillig' : ''}${done ? ' · ✓ geschafft' : ''}`;
      list.append(h('button', {
        type: 'button', class: `task-eintrag${done ? ' fertig' : ''}`, disabled: missing.length > 0,
        onclick: () => openTask(id, room),
      }, h('strong', {}, `${done ? '✓ ' : ''}${t.titel}`), h('span', {}, info)));
    }
    bodyEl.append(list);
    if (raumFertig(rd, data.aufgaben.aufgaben, level, flags)) {
      bodyEl.append(h('p', 'task-fertig', '✓ Der Raum ist geschafft.'), h('button', { class: 'primary', type: 'button', onclick: () => showRoomDone(room) }, 'Fortschrittscode anzeigen'));
    }
  }

  // ---------- Aufgabe ----------
  function openTask(id, room) {
    roomId = room;
    const t = data.aufgaben.aufgaben[id];
    S = { id, t, step: 0, attempts: 0, solved: false, inst: null, first: [] };
    root.hidden = false;
    titleEl.textContent = t.titel;
    metaEl.textContent = t.buch ? `${t.zeit} · ${t.buch}` : t.zeit;
    levelsEl.hidden = Boolean(t.niveaus.alle);
    renderLevels(() => { S.step = 0; S.first = []; loescheFortschritt(store.state); store.save(); renderStep(); });
    // Zwischenstand: nach Schließen oder Neuladen beim gemerkten Schritt weitermachen
    const rest = holeFortschritt(store.state, id, stufe(), steps().length);
    if (rest) { S.step = rest.step; S.first = rest.first; }
    renderStep();
    if (rest) { feedbackEl.className = 'task-feedback'; feedbackEl.textContent = `Willkommen zurück! Du machst bei Schritt ${S.step + 1} weiter.`; }
  }

  function steps() {
    return S.t.niveaus[levelKey()] || S.t.niveaus.alle;
  }

  function renderStep() {
    S.attempts = 0;
    S.solved = false;
    S.helped = false;
    const list = steps();
    const step = list[S.step];
    stepsEl.textContent = `${S.t.zaehlen ? 'Frage' : 'Schritt'} ${S.step + 1} von ${list.length}`;
    barEl.hidden = false;
    barEl.firstElementChild.style.setProperty('--fortschritt', `${Math.round(((S.step + 1) / list.length) * 100)}%`);
    feedbackEl.textContent = '';
    feedbackEl.className = 'task-feedback';
    helpEl.hidden = true;
    clear(helpEl);
    S.inSimilar = false;
    S.similar = aehnlicheAufgabe({
      step, taskId: S.id, level: levelKey(), index: S.step,
      aehnlich: data.aehnlich || {}, molekuele: data.aufgaben.molekuele,
    });
    mountStep(step);
  }

  /** Baut die Bedienung eines Schritts auf (auch für die Ähnlichkeitsaufgabe) und verbindet die Rückmeldungen. */
  function mountStep(step) {
    clear(bodyEl);
    // Der Auftrag der Aufgabe steht nur im ersten Schritt, als erster Block der ersten Seite
    if (!S.inSimilar && S.step === 0 && S.t.auftrag) bodyEl.append(h('p', 'task-auftrag', S.t.auftrag));
    const api = {
      say(msg) { feedbackEl.className = 'task-feedback'; feedbackEl.textContent = msg; },
      ok(msg) {
        if (!S.solved && !S.inSimilar) S.first[S.step] = S.attempts === 0;
        S.solved = true;
        feedbackEl.className = 'task-feedback gut';
        feedbackEl.textContent = `✓ ${msg}`;
        refreshFoot();
      },
      fail(msg) {
        S.attempts++;
        feedbackEl.className = 'task-feedback schlecht';
        feedbackEl.textContent = `✗ ${msg}`;
        card.classList.remove('wackeln');
        void card.offsetWidth;
        card.classList.add('wackeln');
        if (S.attempts >= 3 && !S.solved) revealSolution();
        refreshFoot();
      },
    };
    S.inst = TYPES[step.type](bodyEl, step, api, { data: data.aufgaben, versuch: data.versuch, werbung: data.werbung, fall: data.fall, store });
    bodyEl.append(helpEl); // Tipp, Hilfekarte und Lösung sind der letzte Block des Schritts
    seiten.zeige(0);
    refreshFoot();
  }

  function revealSolution() {
    S.helped = true;
    S.solved = true;
    if (!S.inSimilar) S.first[S.step] = false;
    if (S.inst && S.inst.reveal) S.inst.reveal();
    showHelp('loesung');
  }

  /** Nach dem Lösungsbeispiel: eine ähnliche Aufgabe zum Üben. Zählt nicht für das Quiz-Ergebnis. */
  function startSimilar() {
    S.inSimilar = true;
    S.attempts = 0;
    S.solved = false;
    S.helped = false;
    helpEl.hidden = true;
    feedbackEl.className = 'task-feedback';
    feedbackEl.textContent = 'Jetzt eine ähnliche Aufgabe zum Üben. Du schaffst das!';
    mountStep(S.similar);
  }

  function showHelp(kind) {
    clear(helpEl);
    helpEl.hidden = false;
    queueMicrotask(() => { seiten.neu(); seiten.zeigeBlock(helpEl); });
    if (kind === 'tipp') helpEl.append(h('h3', {}, 'Tipp'), h('p', {}, S.t.tipp));
    else if (kind === 'karte') {
      const k = S.t.hilfekarte;
      helpEl.append(h('h3', {}, k.titel), h('ul', {}, k.zeilen.map((z) => h('li', {}, z))));
    } else {
      helpEl.append(h('h3', {}, 'Lösungsbeispiel'), h('p', {}, S.t.loesung));
    }
  }

  function refreshFoot() {
    clear(footEl);
    if (!S) return;
    const unlocked = S.attempts >= 2 || S.helped;
    footEl.append(
      h('button', { type: 'button', onclick: () => notebook.open('karten') }, 'Spind'),
      h('button', { type: 'button', onclick: () => notebook.open('glossar') }, 'Glossar'),
      h('button', { type: 'button', disabled: !unlocked, onclick: () => showHelp('tipp') }, unlocked ? 'Tipp' : 'Tipp (nach 2 Fehlern)'),
      h('button', { type: 'button', disabled: !unlocked, onclick: () => showHelp('karte') }, unlocked ? 'Hilfekarte' : 'Hilfekarte (nach 2 Fehlern)'),
      h('button', { type: 'button', onclick: () => showCall() }, 'Hilfe rufen'),
    );
    if (S.helped && S.similar && !S.inSimilar) {
      footEl.append(h('button', { class: 'primary', type: 'button', onclick: startSimilar }, 'Ähnliche Aufgabe üben'));
    }
    if (S.solved) {
      const last = S.step >= steps().length - 1;
      footEl.append(h('button', { class: 'primary', type: 'button', onclick: next }, last ? 'Aufgabe abschließen' : 'Weiter →'));
    }
  }

  function next() {
    if (S.step < steps().length - 1) {
      S.step++;
      merkeFortschritt(store.state, S.id, stufe(), S.step, S.first);
      store.save();
      renderStep();
      return;
    }
    completeTask();
  }

  function completeTask() {
    const rd = data.aufgaben.raeume[roomId];
    if (S.t.zaehlen) {
      const ergebnis = quizErgebnis(steps(), S.first);
      if (S.t.zaehlen === 'quiz2') store.state.quiz2 = ergebnis; else store.state.quiz = ergebnis;
      store.save();
    }
    loescheFortschritt(store.state, S.id);
    store.setFlag(S.t.flag);
    const done = raumFertig(rd, data.aufgaben.aufgaben, levelOf(), store.state.flags);
    if (done && !store.hasFlag(rd.fertigFlag)) {
      store.setFlag(rd.fertigFlag);
      const handled = onRoomDone && onRoomDone(roomId);
      if (handled !== true) showRoomDone(roomId);
    } else {
      openMenu(roomId);
    }
  }

  function showRoomDone(room) {
    root.hidden = false;
    roomId = room;
    S = null;
    titleEl.textContent = 'Raum geschafft!';
    metaEl.textContent = '';
    levelsEl.hidden = true;
    stepsEl.textContent = '';
    barEl.hidden = true;
    helpEl.hidden = true;
    feedbackEl.textContent = '';
    clear(bodyEl);
    clear(footEl);
    const rd = data.aufgaben.raeume[room];
    const neu = data.hefter && rd && data.hefter.eintraege.find((e) => e.ab === rd.fertigFlag);
    bodyEl.append(
      neu ? h('div', 'hefter-neu', h('p', {}, h('strong', {}, 'Markus: '), data.hefter.hinweisNeu), h('p', 'hint', neu.titel)) : null,
      h('p', {}, 'Gut gemacht! Notiere diesen Fortschrittscode. Wenn dein Spielstand einmal weg ist, kannst du damit weiterspielen:'),
      h('p', 'code', encodeProgress(store.state)),
      h('p', 'hint', 'Der Code enthält keine Namen. Die gibst du beim Weiterspielen neu ein.'),
    );
    if (neu) footEl.append(h('button', { class: 'primary', type: 'button', onclick: () => { close(); notebook.open('hefter'); } }, 'Hefter öffnen'));
    else footEl.append(h('button', { class: 'primary', type: 'button', onclick: close }, 'Zurück zum Spiel'));
  }

  return { openMenu, openTask, showRoomDone, close, get isOpen() { return !root.hidden; } };
}
