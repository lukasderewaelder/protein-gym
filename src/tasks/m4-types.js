// Schritt-Typen für Sauna, Shake-Bar und Abschlussquiz: Zuordnen, Mehrfachwahl, Werbung prüfen, Rückblick.

import { h } from '../ui/dom.js';
import { checkMehrfach } from './check.js';

function zuordnen(host, step, api) {
  const gelöst = new Array(step.paare.length).fill(false);
  const zeilen = step.paare.map((p, i) => {
    const btns = step.optionen.map((o) => h('button', { type: 'button', class: 'option', onclick: () => pick(i, o, btns) }, o));
    const row = h('div', 'probe', h('strong', {}, p.text), h('div', 'zeile', btns));
    return { row, btns };
  });
  host.append(h('p', 'frage', step.auftrag), ...zeilen.map((z) => z.row));
  function setRichtig(i, btns) {
    gelöst[i] = true;
    btns.forEach((b) => {
      b.disabled = true;
      if (b.textContent.replace(/^[✓✗] /, '') === step.paare[i].richtig) { b.classList.add('richtig'); b.textContent = `✓ ${step.paare[i].richtig}`; }
    });
  }
  function pick(i, o, btns) {
    if (gelöst[i]) return;
    if (o === step.paare[i].richtig) {
      setRichtig(i, btns);
      if (gelöst.every(Boolean)) api.ok('Alle Situationen sind richtig zugeordnet.'); else api.say('Richtig. Weiter mit der nächsten Situation.');
    } else {
      const b = btns.find((x) => x.textContent === o);
      b.classList.add('falsch');
      b.textContent = `✗ ${o}`;
      b.disabled = true;
      api.fail('Das passt nicht. Überlege, was in dieser Situation mit dem Eiweiß passiert.');
    }
  }
  return {
    reveal() { zeilen.forEach((z, i) => { if (!gelöst[i]) setRichtig(i, z.btns); }); },
  };
}

function mehrfach(host, step, api) {
  const boxes = step.optionen.map((o, i) => h('input', { type: 'checkbox', id: `mf${i}` }));
  const check = h('button', { class: 'primary', type: 'button', onclick: onCheck }, 'Prüfen');
  host.append(
    h('p', 'frage', step.frage),
    h('ul', 'checkliste', step.optionen.map((o, i) => h('li', {}, h('label', {}, boxes[i], ` ${o}`)))),
    check,
  );
  function onCheck() {
    const chosen = boxes.map((b, i) => (b.checked ? i : -1)).filter((i) => i >= 0);
    const res = checkMehrfach(step, chosen);
    if (res.reason === 'anzahl') { api.say(`Wähle genau ${step.anzahl} aus.`); return; }
    if (!res.ok) { api.fail('Mindestens eine Antwort ist kein Auslöser. Prüfe noch einmal.'); return; }
    check.disabled = true;
    boxes.forEach((b) => { b.disabled = true; });
    api.ok(step.erklaerung);
  }
  return {
    reveal() {
      boxes.forEach((b, i) => { b.checked = step.richtig.slice(0, step.anzahl).includes(i); b.disabled = true; });
      check.disabled = true;
    },
  };
}

function werbung(host, step, api, ctx) {
  const w = ctx.werbung;
  const gelöst = new Array(w.aussagen.length).fill(false);
  const cards = [];
  host.append(
    h('p', 'frage', 'Alex hält die Dose „' + w.produkt.name + '“ in der Hand. Prüfe jede Werbeaussage: Wähle erst, ob sie stimmt, dann die passende Begründung.'),
    h('div', 'etikett',
      h('strong', {}, `Etikett: ${w.produkt.name} (frei erfunden)`),
      h('p', {}, `Zutaten: ${w.produkt.zutaten.join(', ')}.`)),
  );
  w.aussagen.forEach((a, i) => {
    const urteile = w.urteile.map((u, ui) => h('button', { type: 'button', class: 'option', onclick: () => urteil(i, ui) }, u));
    const gruende = h('div', { class: 'optionen', hidden: true });
    const erkl = h('p', { class: 'hint', hidden: true });
    const card = h('div', 'probe', h('strong', {}, `Aussage ${i + 1}: „${a.text}“`), h('div', 'zeile', urteile), gruende, erkl);
    cards.push({ urteile, gruende, erkl, a });
    host.append(card);
  });
  function fertig(i) {
    gelöst[i] = true;
    const c = cards[i];
    c.erkl.hidden = false;
    c.erkl.textContent = c.a.erklaerung;
    if (gelöst.every(Boolean)) api.ok('Alle fünf Aussagen sind geprüft.'); else api.say('Richtig. Weiter mit der nächsten Aussage.');
  }
  function zeigeGruende(i) {
    const c = cards[i];
    c.gruende.hidden = false;
    c.gruende.replaceChildren(h('p', 'frage', 'Welche Begründung passt?'), ...c.a.begruendungen.map((g, gi) => h('button', { type: 'button', class: 'option', onclick: () => grund(i, gi) }, g)));
  }
  function urteil(i, ui) {
    const c = cards[i];
    if (gelöst[i] || !c.gruende.hidden) return;
    if (ui === c.a.urteil) {
      c.urteile.forEach((b, k) => { b.disabled = true; if (k === ui) { b.classList.add('richtig'); b.textContent = `✓ ${b.textContent}`; } });
      api.say('Das Urteil passt. Jetzt die Begründung.');
      zeigeGruende(i);
    } else {
      c.urteile[ui].classList.add('falsch');
      c.urteile[ui].textContent = `✗ ${c.urteile[ui].textContent}`;
      c.urteile[ui].disabled = true;
      api.fail('Das Urteil passt noch nicht. Prüfe die Aussage mit den Karten im Spind.');
    }
  }
  function grund(i, gi) {
    const c = cards[i];
    const btns = [...c.gruende.querySelectorAll('button')];
    if (gelöst[i]) return;
    if (gi === c.a.richtig) {
      btns.forEach((b, k) => { b.disabled = true; if (k === gi) { b.classList.add('richtig'); b.textContent = `✓ ${b.textContent}`; } });
      fertig(i);
    } else {
      btns[gi].classList.add('falsch');
      btns[gi].textContent = `✗ ${btns[gi].textContent}`;
      btns[gi].disabled = true;
      api.fail('Diese Begründung passt nicht zur Aussage.');
    }
  }
  return {
    reveal() {
      w.aussagen.forEach((a, i) => {
        if (gelöst[i]) return;
        const c = cards[i];
        c.urteile.forEach((b, k) => { b.disabled = true; if (k === a.urteil) { b.classList.add('richtig'); b.textContent = `✓ ${w.urteile[k]}`; } });
        zeigeGruende(i);
        const btns = [...c.gruende.querySelectorAll('button')];
        btns.forEach((b, k) => { b.disabled = true; if (k === a.richtig) { b.classList.add('richtig'); b.textContent = `✓ ${a.begruendungen[k]}`; } });
        gelöst[i] = true;
        c.erkl.hidden = false;
        c.erkl.textContent = a.erklaerung;
      });
    },
  };
}

function rueckblick(host, step, api, ctx) {
  const vorher = ctx.store.state.protokoll && ctx.store.state.protokoll.vorher;
  if (step.zwischen) {
    // Zwischenfazit nach „Bau und Faltung“: Die Eingangsfrage lässt sich jetzt erklären.
    host.append(
      h('p', 'frage', 'Zwischenstand: Am Anfang hast du überlegt, warum Eiklar in der Pfanne fest wird.'),
      h('p', 'frage', vorher ? `Deine Idee damals: „${vorher}“` : 'Du hattest damals keine Idee aufgeschrieben.'),
      h('div', 'muster',
        h('p', 'muster-text', h('strong', {}, 'Jetzt kannst du es erklären: '), 'Hitze löst die schwachen Verbindungen, die die Falten des Eiweißes halten. Die Kette entfaltet sich und verklumpt: Das Eiweiß gerinnt, und das ist nicht umkehrbar.')),
      h('button', { class: 'primary', type: 'button', onclick: () => api.ok('Gut. Jetzt weißt du, wie ein Eiweiß aufgebaut ist.') }, 'Weiter'),
    );
    return { reveal() {} };
  }
  host.append(
    h('p', 'frage', 'Zum Schluss ein Rückblick: Am Anfang hast du überlegt, warum Eiklar in der Pfanne fest wird.'),
    h('p', 'frage', vorher ? `Deine Idee damals: „${vorher}“` : 'Du hattest damals keine Idee aufgeschrieben.'),
    h('div', 'muster',
      h('p', 'muster-text', h('strong', {}, 'Das wissen wir jetzt: '), 'Eiklar wird fest, weil Hitze die räumliche Struktur der Eiweiße zerstört: Das Eiweiß wird denaturiert, man sagt auch, es gerinnt. Die Aminosäuren bleiben, aber der Vorgang ist nicht umkehrbar.')),
    h('button', { class: 'primary', type: 'button', onclick: () => api.ok('Gut. Jetzt bekommst du dein Zertifikat.') }, 'Weiter zum Zertifikat'),
  );
  return { reveal() {} };
}

export const M4_TYPES = { zuordnen, mehrfach, werbung, rueckblick };
