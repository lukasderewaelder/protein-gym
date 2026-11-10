// Dialogbox am unteren Rand: Porträt, Namensschild, Text, „Weiter". Normale HTML-Fläche über dem Canvas,
// damit Text, Schriftgröße und Zoom zuverlässig funktionieren.

import { loadFirst } from '../engine/assets.js';

/** {name} im Text durch die Namen der Gruppe ersetzen. */
export function fillNames(text, names) {
  const list = names.filter(Boolean);
  let who = 'Trainingspartner';
  if (list.length === 1) who = list[0];
  else if (list.length > 1) who = `${list.slice(0, -1).join(', ')} und ${list[list.length - 1]}`;
  return text.replaceAll('{name}', who);
}

export function createDialog(root) {
  const box = root.querySelector('.dialog-box');
  const nameEl = root.querySelector('.dialog-name');
  const textEl = root.querySelector('.dialog-text');
  const portraitEl = root.querySelector('.dialog-portrait');
  const nextBtn = root.querySelector('.dialog-next');
  let queue = [];
  let done = null;
  let open = false;

  function setPortrait(id, speaker) {
    portraitEl.innerHTML = '';
    const fallback = () => {
      portraitEl.textContent = (speaker || '?').trim().charAt(0).toUpperCase();
      portraitEl.dataset.fallback = 'true';
    };
    if (!id) { fallback(); return; }
    delete portraitEl.dataset.fallback;
    // „trainer“ meint den ersten Ausdruck (trainer_0); „trainer_2“ wählt einen anderen Ausdruck aus dem Porträt-Sheet.
    loadFirst(`assets/portraits/${id}`).then((img) => img || loadFirst(`assets/portraits/${id}_0`)).then((img) => {
      if (!img) { fallback(); return; }
      const el = document.createElement('img');
      el.src = img.src;
      el.alt = '';
      portraitEl.appendChild(el);
    });
  }

  function showNext() {
    if (!queue.length) {
      close();
      return;
    }
    textEl.textContent = queue.shift();
    nextBtn.textContent = queue.length ? 'Weiter →' : 'OK';
  }

  function close() {
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
      queue = lines.slice();
      done = onDone || null;
      nameEl.textContent = speaker || '';
      nameEl.hidden = !speaker;
      setPortrait(portrait, speaker);
      root.hidden = false;
      open = true;
      showNext();
      nextBtn.focus({ preventScroll: true });
    },
  };
}
