// Aufgabentypen. Jede Funktion baut ihre Bedienung in `host` und meldet über `api`:
//   api.say(text)  Hinweis ohne Fehlversuch     api.fail(text)  Fehlversuch (zählt für die Hilfen)
//   api.ok(text)   Schritt gelöst
// Rückgabe: { reveal() } zeigt die Lösung (nach dem dritten Fehlversuch).

import { h } from '../ui/dom.js';
import { aminoDiagram, peptidDiagram, ketteDiagram, denatDiagram } from './molecule.js';
import { LABOR_TYPES } from './labor-types.js';
import { M4_TYPES } from './m4-types.js';
import { NEU_TYPES } from './neu-types.js';
import { formelTippTreffer, checkZahl, checkLuecken, reactionPair, leavingParticles, dipeptidFormula, dipeptidName, checkOrdnen, parseNumber } from './check.js';

const PART_NAMES = { amino: 'die Aminogruppe', carboxy: 'die Carboxygruppe', rest: 'der Rest R' };
const PART_AKK = { amino: 'die Aminogruppe', carboxy: 'die Carboxygruppe', rest: 'den Rest R' };
const PART_LABEL = { amino: 'Aminogruppe', carboxy: 'Carboxygruppe', rest: 'Rest R' };

/**
 * Formel-Tippen: Die gefragten Teile dürfen in beliebiger Reihenfolge angetippt werden.
 * Ist der Rest R = H (Glycin), zählt auch das H unten am zentralen C als Rest (beide H sind richtig).
 */
function formelTippen(host, step, api, ctx) {
  const mol = ctx.data.molekuele[step.molekuel];
  const offen = new Set(step.teile);
  const prompt = h('p', 'frage');
  const dia = aminoDiagram(mol, { onPart });
  host.append(prompt, h('div', 'formel-box', dia.svg));
  const rest = () => [...offen].map((p) => PART_LABEL[p]).join(', ');
  const ask = () => { prompt.textContent = `${mol.name}: Tippe alle gefragten Teile an (Reihenfolge egal). Noch offen: ${rest()}.`; };
  ask();

  function onPart(part) {
    const r = formelTippTreffer(step, mol, offen, part);
    if (r.art === 'neu') {
      offen.delete(r.ziel);
      dia.mark(part, part === 'h' ? 'Rest R (= H)' : PART_LABEL[part]);
      if (!offen.size) { prompt.textContent = `${mol.name}: alle Teile gefunden.`; api.ok('Richtig, alle Teile gefunden.'); } else { api.say(`Richtig: ${PART_LABEL[r.ziel]}.`); ask(); }
    } else if (r.art === 'auchRest') {
      dia.mark(part, 'Rest R (= H)');
      api.say('Richtig: Bei Glycin ist der Rest R ein Wasserstoffatom, also zählen beide H.');
    } else if (r.art === 'schon') {
      api.say(`${PART_LABEL[r.ziel]} hast du schon gefunden.`);
    } else if (part === 'c') {
      api.fail('Das ist das zentrale Kohlenstoffatom. Es hält alle Teile zusammen und ist selbst keine Gruppe.');
    } else if (part === 'h') {
      api.fail('Dieses H sitzt fest am zentralen C und gehört zum Grundgerüst, nicht zu den gefragten Teilen.');
    } else {
      api.fail(`Das ist ${PART_NAMES[part]}. Das war nicht gefragt.`);
    }
  }
  return {
    reveal() {
      [...offen].forEach((p) => dia.mark(p, PART_LABEL[p]));
      offen.clear();
      prompt.textContent = `${mol.name}: so sieht die Lösung aus.`;
    },
  };
}

function luecken(host, step, api) {
  const answers = new Array(step.loesungen.length).fill(null);
  const state = new Array(step.loesungen.length).fill(null);
  let active = 0;
  const gaps = [];
  const sentence = h('p', 'satz');
  for (const p of step.text.split(/(\{\d+\})/)) {
    const m = /^\{(\d+)\}$/.exec(p);
    if (m) {
      const i = Number(m[1]) - 1;
      const b = h('button', { class: 'luecke', type: 'button', onclick: () => { answers[i] = null; state[i] = null; active = i; render(); } });
      gaps[i] = b;
      sentence.append(b);
    } else {
      sentence.append(document.createTextNode(p));
    }
  }
  const chips = h('div', 'chips', step.optionen.map((o) => h('button', { class: 'chip', type: 'button', onclick: () => pick(o) }, o)));
  const check = h('button', { class: 'primary', type: 'button', onclick: onCheck }, 'Prüfen');
  host.append(h('p', 'frage', step.auftrag || 'Ergänze den Satz.'), sentence, chips, check);

  function render() {
    gaps.forEach((b, i) => {
      const mark = state[i] === 'ok' ? '✓ ' : state[i] === 'wrong' ? '✗ ' : '';
      b.textContent = answers[i] ? `${mark}${answers[i]}` : '____';
      b.className = `luecke${i === active ? ' aktiv' : ''}${state[i] ? ' ' + state[i] : ''}`;
      b.setAttribute('aria-label', `Lücke ${i + 1}: ${answers[i] || 'leer'}${state[i] === 'wrong' ? ', falsch' : state[i] === 'ok' ? ', richtig' : ''}`);
    });
  }
  function pick(o) {
    let i = answers[active] == null ? active : answers.findIndex((a) => a == null);
    if (i < 0) i = active;
    answers[i] = o;
    state[i] = null;
    const next = answers.findIndex((a) => a == null);
    active = next < 0 ? i : next;
    render();
  }
  function onCheck() {
    const res = checkLuecken(step, answers);
    if (res.empty.length) { api.say('Fülle erst alle Lücken.'); return; }
    answers.forEach((_, i) => { state[i] = res.wrong.includes(i) ? 'wrong' : 'ok'; });
    render();
    if (res.ok) { check.disabled = true; api.ok('Richtig!'); } else api.fail('Mindestens eine Lücke stimmt noch nicht (mit ✗ markiert). Tippe auf eine Lücke, um sie zu leeren.');
  }
  render();
  return {
    reveal() {
      step.loesungen.forEach((s, i) => { answers[i] = s; state[i] = 'ok'; });
      check.disabled = true;
      render();
    },
  };
}

function freitext(host, step, api) {
  const ta = h('textarea', { rows: 4, 'aria-label': 'Deine Antwort', placeholder: 'Schreibe deine Antwort hier auf …' });
  const show = h('button', { class: 'primary', type: 'button', onclick: reveal }, 'Mustertext zeigen');
  const box = h('div', { class: 'muster', hidden: true },
    h('p', 'muster-text', h('strong', {}, 'Mustertext: '), step.muster),
    h('p', 'frage', 'Vergleiche ehrlich mit deiner Antwort:'),
    h('ul', 'checkliste', step.checkliste.map((c, i) => h('li', {}, h('label', {}, h('input', { type: 'checkbox', id: `cl${i}` }), ` ${c}`)))),
  );
  const done = h('button', { class: 'primary', type: 'button', onclick: () => { done.disabled = true; api.ok('Gut. Fehlt etwas in deiner Antwort, ergänze es jetzt.'); } }, 'Fertig verglichen');
  box.append(done);
  if (step.bild === 'denat') host.append(h('div', 'formel-box', denatDiagram()));
  host.append(h('p', 'frage', step.auftrag), ta, show, box);
  function reveal() {
    if (ta.value.trim().length < 8) { api.say('Schreibe zuerst deine Antwort auf. Dann vergleichst du sie mit dem Mustertext.'); return; }
    box.hidden = false;
    show.hidden = true;
  }
  return { reveal() { box.hidden = false; show.hidden = true; } };
}

function waehlen(host, step, api) {
  if (step.bild === 'denat') host.append(h('div', 'formel-box', denatDiagram()));
  if (step.bild && step.bild.kette) host.append(h('div', 'formel-box', ketteDiagram(step.bild.kette)));
  const buttons = step.optionen.map((o, i) => h('button', { class: 'option', type: 'button', onclick: () => choose(i) }, o));
  host.append(h('p', 'frage', step.frage), h('div', 'optionen', buttons));
  function lock() { buttons.forEach((b) => { b.disabled = true; }); }
  function choose(i) {
    if (i === step.richtig) {
      buttons[i].classList.add('richtig');
      buttons[i].textContent = `✓ ${step.optionen[i]}`;
      lock();
      api.ok(step.erklaerung || 'Richtig!');
    } else {
      buttons[i].classList.add('falsch');
      buttons[i].textContent = `✗ ${step.optionen[i]}`;
      buttons[i].disabled = true;
      api.fail('Das stimmt nicht. Probiere eine andere Antwort.');
    }
  }
  return {
    reveal() {
      buttons[step.richtig].classList.add('richtig');
      buttons[step.richtig].textContent = `✓ ${step.optionen[step.richtig]}`;
      lock();
    },
  };
}

function zahl(host, step, api) {
  if (step.bild && step.bild.kette) host.append(h('div', 'formel-box', ketteDiagram(step.bild.kette)));
  const input = h('input', { class: 'zahl', type: 'text', inputmode: 'numeric', autocomplete: 'off', 'aria-label': 'Deine Zahl' });
  const btn = h('button', { class: 'primary', type: 'button', onclick: onCheck }, 'Prüfen');
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') onCheck(); });
  host.append(h('p', 'frage', step.frage), h('div', 'zeile', input, btn));
  function onCheck() {
    if (Number.isNaN(parseNumber(input.value))) { api.say('Gib eine Zahl ein, zum Beispiel 12.'); return; }
    if (checkZahl(step, input.value)) {
      input.disabled = true;
      btn.disabled = true;
      api.ok(step.erklaerung || 'Richtig!');
    } else {
      api.fail('Das stimmt noch nicht. Rechne noch einmal nach.');
    }
  }
  return { reveal() { input.value = String(step.richtig); input.disabled = true; btn.disabled = true; } };
}

function peptidVerbinden(host, step, api, ctx) {
  const mols = [ctx.data.molekuele[step.a], ctx.data.molekuele[step.b]];
  const prompt = h('p', 'frage');
  let phase = 1;
  let first = null;
  let pair = null;
  let taps = [];
  const result = h('div', { class: 'ergebnis', hidden: true });
  const dia = peptidDiagram(mols, { onBox, onAtom });
  host.append(prompt, h('div', 'formel-box', dia.svg), result);

  function setPrompt() {
    if (phase === 1) prompt.textContent = first ? 'Tippe jetzt die passende Gruppe der anderen Aminosäure an.' : 'Schritt 1: Tippe zwei Gruppen an, die miteinander reagieren (von verschiedenen Molekülen).';
    else if (phase === 2) prompt.textContent = 'Schritt 2: Welche Teilchen lösen sich als Wasser? Tippe das OH und ein H an.';
    else prompt.textContent = 'Geschafft: Es ist ein Dipeptid entstanden.';
  }
  setPrompt();

  function onBox(m, end) {
    if (phase !== 1) return;
    const el = dia.boxEl(m, end);
    if (!first) { first = { mol: m, end }; el.classList.add('gewaehlt'); setPrompt(); return; }
    if (first.mol === m && first.end === end) { first = null; el.classList.remove('gewaehlt'); setPrompt(); return; }
    const res = reactionPair(first, { mol: m, end });
    if (!res.ok) {
      api.fail(res.reason === 'gleiches-molekuel'
        ? 'Beide Gruppen gehören zur selben Aminosäure. Es reagieren zwei verschiedene Moleküle miteinander.'
        : 'Du brauchst eine Carboxygruppe und eine Aminogruppe, nicht zweimal dieselbe.');
      dia.boxEl(first.mol, first.end).classList.remove('gewaehlt');
      first = null;
      setPrompt();
      return;
    }
    pair = res;
    el.classList.add('gewaehlt');
    phase = 2;
    dia.setPhase(2);
    api.say('Richtig: Carboxygruppe und Aminogruppe reagieren.');
    setPrompt();
  }

  function onAtom(m, kind, idx) {
    if (phase !== 2) return;
    const el = dia.atomEl(m, kind, idx);
    const same = taps.find((t) => t.mol === m && t.kind === kind && t.idx === idx);
    if (same) { el.classList.remove('gewaehlt'); taps = taps.filter((t) => t !== same); return; }
    const other = taps.find((t) => t.kind === kind);
    if (other) { dia.atomEl(other.mol, other.kind, other.idx).classList.remove('gewaehlt'); taps = taps.filter((t) => t !== other); }
    taps.push({ mol: m, kind, idx });
    el.classList.add('gewaehlt');
    if (taps.length < 2) return;
    const res = leavingParticles(pair, taps);
    if (res.ok) { finish(taps); return; }
    api.fail(res.reason === 'molekuel'
      ? 'Das OH stammt aus der Carboxygruppe, das H aus der Aminogruppe der beiden Moleküle, die reagieren.'
      : 'Du brauchst ein OH und ein H.');
    taps.forEach((t) => dia.atomEl(t.mol, t.kind, t.idx).classList.remove('gewaehlt'));
    taps = [];
  }

  function finish(list) {
    phase = 3;
    dia.setPhase(3);
    dia.showWater(list.map((t) => dia.atomEl(t.mol, t.kind, t.idx)));
    const a = mols[pair.carboxyMol];
    const b = mols[pair.aminoMol];
    const formula = dipeptidFormula(a, b);
    const [before, after] = formula.split('CO–NH');
    result.hidden = false;
    result.replaceChildren(
      h('p', {}, `Es entsteht das Dipeptid ${dipeptidName(a, b)} und Wasser (H₂O). Die neue Bindung zwischen C und N heißt Peptidbindung:`),
      h('p', 'formelzeile', before, h('mark', {}, 'CO–NH'), after),
    );
    setPrompt();
    api.ok(`Geschafft: ${dipeptidName(a, b)} und H₂O.`);
  }

  return {
    reveal() {
      if (phase === 3) return;
      if (!pair) { pair = { ok: true, carboxyMol: 0, aminoMol: 1 }; dia.boxEl(0, 'carboxy').classList.add('gewaehlt'); dia.boxEl(1, 'amino').classList.add('gewaehlt'); }
      finish([{ mol: pair.carboxyMol, kind: 'OH', idx: 0 }, { mol: pair.aminoMol, kind: 'H', idx: 0 }]);
    },
  };
}

function bausteineOrdnen(host, step, api) {
  const placed = new Array(step.slots.length).fill(null);
  const pieces = step.ablage.map((text, id) => ({ id, text, used: false }));
  let selected = null;     // angetippter Baustein (Baustein zuerst)
  let selectedSlot = null; // angetippter leerer Platz (Platz zuerst, beliebige Reihenfolge)
  let phase = 1;
  const prompt = h('p', 'frage', step.auftrag);
  const slotBtns = step.slots.map((_, i) => h('button', { class: 'platz', type: 'button', onclick: () => onSlot(i) }));
  const row = h('div', 'kette-zeile');
  slotBtns.forEach((b, i) => { if (i) row.append(h('span', 'strich', '–')); row.append(b); });
  const bank = h('div', 'chips', pieces.map((p) => h('button', { class: 'chip', type: 'button', onclick: () => onPiece(p.id) }, p.text)));
  const check = h('button', { class: 'primary', type: 'button', onclick: onCheck }, 'Prüfen');
  host.append(prompt, row, bank, check);

  function render(marks = {}) {
    slotBtns.forEach((b, i) => {
      const mark = marks[i] === 'ok' ? '✓ ' : marks[i] === 'wrong' ? '✗ ' : '';
      b.textContent = placed[i] ? `${mark}${placed[i]}` : `${i + 1}`;
      b.className = `platz${placed[i] ? ' voll' : ''}${marks[i] ? ' ' + marks[i] : ''}${phase === 2 && step.peptid.includes(i) ? ' peptid' : ''}`;
      b.classList.toggle('gewaehlt', selectedSlot === i);
      b.setAttribute('aria-label', `Platz ${i + 1}: ${placed[i] || 'leer'}`);
    });
    [...bank.children].forEach((c, i) => {
      c.disabled = pieces[i].used;
      c.classList.toggle('gewaehlt', selected === i);
    });
  }
  function place(slot, id) {
    placed[slot] = pieces[id].text;
    pieces[id].used = true;
    pieces[id].slot = slot;
    selected = null;
    selectedSlot = null;
  }
  function onPiece(id) {
    if (phase !== 1 || pieces[id].used) return;
    if (selectedSlot != null && placed[selectedSlot] == null) { place(selectedSlot, id); render(); return; }
    selected = selected === id ? null : id;
    render();
  }
  function onSlot(i) {
    if (phase === 2) {
      if (step.peptid.includes(i)) { api.ok('Richtig: Die Peptidbindung ist –CO–NH–.'); phase = 3; } else api.fail('Das ist nicht die Peptidbindung. Sie liegt zwischen dem C und dem N.');
      return;
    }
    if (phase !== 1) return;
    if (placed[i] != null) {
      const p = pieces.find((x) => x.used && x.text === placed[i] && x.slot === i);
      if (p) { p.used = false; delete p.slot; }
      placed[i] = null;
    } else if (selected != null) {
      place(i, selected);
    } else {
      selectedSlot = selectedSlot === i ? null : i;
    }
    render();
  }
  function onCheck() {
    if (phase !== 1) return;
    const res = checkOrdnen(step, placed);
    if (res.empty.length) { api.say('Besetze erst alle Plätze der Kette.'); return; }
    const marks = {};
    placed.forEach((_, i) => { marks[i] = res.wrong.includes(i) ? 'wrong' : 'ok'; });
    render(marks);
    if (res.ok && !step.peptid) {
      phase = 3;
      check.hidden = true;
      bank.hidden = true;
      api.ok(step.erklaerung || 'Die Kette stimmt.');
    } else if (res.ok) {
      phase = 2;
      check.hidden = true;
      bank.hidden = true;
      prompt.textContent = 'Jetzt: Tippe auf die Peptidbindung in der Kette.';
      api.say('Die Kette stimmt. Jetzt noch die Peptidbindung markieren.');
      render(marks);
    } else {
      api.fail('Mindestens ein Baustein steht am falschen Platz (mit ✗ markiert). Tippe ihn an, um ihn zu entfernen.');
    }
  }
  render();
  return {
    reveal() {
      phase = 3;
      step.slots.forEach((s, i) => { placed[i] = s; });
      check.hidden = true;
      bank.hidden = true;
      const marks = {};
      placed.forEach((_, i) => { marks[i] = 'ok'; });
      phase = 2;
      render(marks);
      phase = 3;
      slotBtns.forEach((b, i) => b.classList.toggle('peptid', (step.peptid || []).includes(i)));
      prompt.textContent = step.peptid ? 'Lösung: Die Peptidbindung ist –CO–NH– (markiert).' : 'Lösung: So sieht die richtige Kette aus.';
    },
  };
}

export const TYPES = {
  'formel-tippen': formelTippen,
  luecken,
  freitext,
  waehlen,
  zahl,
  'peptid-verbinden': peptidVerbinden,
  'bausteine-ordnen': bausteineOrdnen,
  ...LABOR_TYPES,
  ...M4_TYPES,
  ...NEU_TYPES,
};
