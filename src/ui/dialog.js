// Dialogbox am unteren Rand: Porträt, Namensschild, Text, „Weiter". Normale HTML-Fläche über dem Canvas,
// damit Text, Schriftgröße und Zoom zuverlässig funktionieren.
// Eine Zeile ist ein Text (spricht der Standard-Sprecher) oder { von, text, portrait? } für einen Sprecherwechsel
// (so führt Kupfer-Kurt ein Gespräch mit dem Spieler). Der Text läuft Buchstabe für Buchstabe; Tippen zeigt ihn ganz.

import { loadFirst } from '../engine/assets.js';

/** {name} im Text durch die Namen der Gruppe ersetzen. */
export function fillNames(text, names) {
  const list = names.filter(Boolean);
  let who = 'Trainingspartner';
  if (list.length === 1) who = list[0];
  else if (list.length > 1) who = `${list.slice(0, -1).join(', ')} und ${list[list.length - 1]}`;
  return text.replaceAll('{name}', who);
}

/** Eine Dialogzeile in Sprecher, Porträt und Text auflösen. Ohne „von“ gilt der Standard-Sprecher. */
export function zeileAufloesen(zeile, standard = {}) {
  if (typeof zeile === 'string') return { von: standard.speaker || '', portrait: standard.portrait || null, text: zeile };
  const von = zeile.von || standard.speaker || '';
  const gleich = von === (standard.speaker || '');
  // Wer nur mit Namen eintritt (zum Beispiel „Du“), bekommt kein Porträt des Standard-Sprechers
  return { von, portrait: zeile.portrait || (gleich ? standard.portrait || null : null), text: zeile.text };
}

/** Alle Zeilen eines Dialogs für die Anzeige vorbereiten ({name} ersetzen, Objekte behalten ihre Felder). */
export function zeilenFuellen(lines, names) {
  return lines.map((l) => (typeof l === 'string' ? fillNames(l, names) : { ...l, text: fillNames(l.text, names) }));
}

/** Die ersten n Zeichen eines Textes (für den laufenden Text). n über der Länge ergibt den ganzen Text. */
export function textBisZeichen(text, n) {
  return Array.from(text).slice(0, Math.max(0, n)).join('');
}

const ZEICHEN_PRO_SEKUNDE = 55;

export function createDialog(root) {
  const box = root.querySelector('.dialog-box');
  const nameEl = root.querySelector('.dialog-name');
  const textEl = root.querySelector('.dialog-text');
  const portraitEl = root.querySelector('.dialog-portrait');
  const nextBtn = root.querySelector('.dialog-next');
  let queue = [];
  let done = null;
  let open = false;
  let standard = {};
  let portraitId; // aktuell gezeigtes Porträt, damit es bei gleichem Sprecher nicht flackert
  let laeuft = null; // { timer, text, n }

  function setPortrait(id, speaker) {
    const key = `${id || ''}|${speaker || ''}`;
    if (key === portraitId) return;
    portraitId = key;
    portraitEl.innerHTML = '';
    const fallback = () => {
      portraitEl.textContent = (speaker || '?').trim().charAt(0).toUpperCase();
      portraitEl.dataset.fallback = 'true';
    };
    if (!id) { fallback(); return; }
    delete portraitEl.dataset.fallback;
    // „trainer“ meint den ersten Ausdruck (trainer_0); „trainer_2“ wählt einen anderen Ausdruck aus dem Porträt-Sheet.
    loadFirst(`assets/portraits/${id}`).then((img) => img || loadFirst(`assets/portraits/${id}_0`)).then((img) => {
      if (key !== portraitId) return; // inzwischen spricht jemand anderes
      if (!img) { fallback(); return; }
      const el = document.createElement('img');
      el.src = img.src;
      el.alt = '';
      portraitEl.appendChild(el);
    });
  }

  function ohneAnimation() {
    try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
  }

  function stoppeText() {
    if (laeuft) { clearInterval(laeuft.timer); laeuft = null; }
  }

  /** Text einblenden; auf Wunsch (reduzierte Bewegung) sofort ganz. */
  function zeigeText(text) {
    stoppeText();
    const laenge = Array.from(text).length;
    if (ohneAnimation() || laenge <= 1) { textEl.textContent = text; return; }
    textEl.textContent = '';
    const l = { n: 0, text, timer: 0 };
    laeuft = l;
    l.timer = setInterval(() => {
      l.n += Math.max(1, Math.round(ZEICHEN_PRO_SEKUNDE / 20));
      textEl.textContent = textBisZeichen(text, l.n);
      if (l.n >= laenge) stoppeText();
    }, 50);
  }

  function showNext() {
    if (laeuft) { // erst Tippen: den ganzen Satz zeigen, erst das zweite Tippen geht weiter
      textEl.textContent = laeuft.text;
      stoppeText();
      return;
    }
    if (!queue.length) {
      close();
      return;
    }
    const z = zeileAufloesen(queue.shift(), standard);
    nameEl.textContent = z.von;
    nameEl.hidden = !z.von;
    setPortrait(z.portrait, z.von);
    zeigeText(z.text);
    nextBtn.textContent = queue.length ? 'Weiter →' : 'OK';
  }

  function close() {
    stoppeText();
    root.hidden = true;
    open = false;
    const cb = done;
    done = null;
    if (cb) cb();
  }

  nextBtn.addEventListener('click', showNext);
  box.addEventListener('click', (e) => { if (e.target === box || e.target === textEl) showNext(); });
  window.addEventListener('keydown', (e) => {
    if (open && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); showNext(); }
  });

  return {
    get isOpen() { return open; },
    show({ speaker, portrait, lines }, onDone) {
      stoppeText();
      queue = lines.slice();
      done = onDone || null;
      standard = { speaker, portrait };
      portraitId = undefined;
      root.hidden = false;
      open = true;
      showNext();
      nextBtn.focus({ preventScroll: true });
    },
  };
}
