// Startbildschirm: Namen (1 bis 3, oder ein Gruppenname) oder Weiterspielen mit Fortschrittscode. Es gibt nur eine Spielfigur.

import { decodeProgress } from '../state/progress.js';

export function cleanName(text) {
  return String(text || '').replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 12);
}

export function initStart(root, { onNew, onRestore }) {
  const form = root.querySelector('#start-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const names = ['n1', 'n2', 'n3'].map((k) => cleanName(data.get(k))).filter(Boolean);
    if (!names.length) return;
    onNew({ names });
  });

  const restore = root.querySelector('#restore-form');
  const msg = root.querySelector('#restore-msg');
  root.querySelector('#btn-restore').addEventListener('click', () => {
    restore.hidden = !restore.hidden;
    if (!restore.hidden) restore.querySelector('input[name="code"]').focus({ preventScroll: true });
  });
  restore.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(restore);
    const names = ['r1', 'r2', 'r3'].map((k) => cleanName(data.get(k))).filter(Boolean);
    const res = decodeProgress(data.get('code'));
    if (!res.ok) { msg.textContent = res.reason; return; }
    if (!names.length) { msg.textContent = 'Bitte gib mindestens einen Namen ein.'; return; }
    msg.textContent = '';
    onRestore({ names, ...res.state });
  });

  return {
    show() { root.hidden = false; form.querySelector('input[name="n1"]').focus({ preventScroll: true }); },
    hide() { root.hidden = true; },
  };
}
