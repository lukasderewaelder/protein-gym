// Scroll-Audit für den Browser (Konsole oder Vorschau-Tool): öffnet alle Fenster des Spiels und meldet, wo etwas scrollt,
// abgeschnitten wird oder aus dem Bild ragt. Ziel: keine Treffer ab 1024×660 im Querformat.
// Benutzung auf einer laufenden Vorschau (localhost, Service Worker aus):
//   const { audit } = await import('/tools/scroll-audit.mjs'); await audit.alles();
// Voraussetzung: window.__pg (Konsolenhilfen des Spiels).

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const holen = (n) => fetch(`data/${n}.json`).then((r) => r.json());

/** Probleme innerhalb von `root`: Elemente mit verborgenem oder scrollbarem Überlauf, deren Inhalt höher ist als sie selbst. */
export function probleme(root) {
  const out = [];
  for (const e of [root, ...root.querySelectorAll('*')]) {
    const cs = getComputedStyle(e);
    if (cs.display === 'none' || cs.visibility === 'hidden' || e.closest('[hidden], [data-seite-aus]')) continue;
    if (cs.overflowY !== 'visible' && e.scrollHeight > e.clientHeight + 1) out.push(`${e.tagName.toLowerCase()}.${(e.className || e.id || '').toString().split(' ')[0]} ${e.scrollHeight}>${e.clientHeight}`);
  }
  const r = root.getBoundingClientRect();
  if (r.bottom > innerHeight + 1 || r.top < -1) out.push(`ausserhalb ${Math.round(r.top)}..${Math.round(r.bottom)}`);
  return out;
}

const schliesseAlles = () => {
  document.querySelectorAll('dialog[open]').forEach((d) => d.close());
  const t = document.querySelector('#task'); if (t) t.hidden = true;
  const z = document.querySelector('#zert'); if (z) z.hidden = true;
};

export const audit = {
  probleme,

  async funde() {
    const bad = [];
    const w = await holen('wissen');
    schliesseAlles();
    for (const k of w.karten) {
      window.__pg.showFund(k.id, true); await wait(250);
      const p = probleme(document.querySelector('#fund'));
      if (p.length) bad.push(`Fund ${k.id}: ${p.join('; ')}`);
      document.querySelector('#fund').close();
    }
    return bad;
  },

  async aufgaben(nur = null) {
    const pg = window.__pg; const bad = []; const a = await holen('aufgaben');
    const roomOf = {};
    if (!nur || nur.length) audit.mehrseitig = audit.mehrseitig || [];
    for (const [rid, r] of Object.entries(a.raeume)) for (const t of r.aufgaben) roomOf[t] = [rid, r.niveauVon || rid];
    for (const [tid, t] of Object.entries(a.aufgaben)) {
      if (nur && !nur.includes(tid)) continue;
      const [rid, lr] = roomOf[tid] || ['empfang', 'empfang'];
      const stufen = t.niveaus.alle ? [['alle', 0]] : [['A', 0], ['B', 1], ['C', 2]];
      for (const [key, idx] of stufen) {
        const steps = t.niveaus[key];
        for (let i = 0; i < steps.length; i++) {
          pg.store.state.levels = { ...(pg.store.state.levels || {}), [lr]: idx };
          pg.store.state.taskProgress = { ...(pg.store.state.taskProgress || {}), [tid]: { level: key, step: i, first: [] } };
          document.querySelector('#task').hidden = true;
          try { pg.openTask(tid, rid); } catch (e) { bad.push(`${tid}/${key}/${i}: Fehler ${e.message}`); continue; }
          await wait(350);
          document.querySelector('#task .task-feedback').textContent = ''; // „Willkommen zurück“ gibt es nur beim Fortsetzen
          await wait(250);
          let p = probleme(document.querySelector('#task .task-card'));
          if (p.length) { await wait(700); p = probleme(document.querySelector('#task .task-card')); } // zweiter Blick nach dem Neumessen
          const nav = document.querySelector('#task .task-nav');
          if (!nav.hidden) audit.mehrseitig.push(`${tid}/${key}/${i + 1} ${steps[i].type}: ${nav.textContent.match(/von (\d+)/)[1]} Seiten`);
          if (p.length) bad.push(`${tid}/${key}/${i + 1} ${steps[i].type}: ${p.join('; ')}`);
        }
      }
    }
    pg.store.state.taskProgress = {};
    document.querySelector('#task').hidden = true;
    return bad;
  },

  async raumMenues() {
    const pg = window.__pg; const bad = []; const a = await holen('aufgaben');
    for (const rid of Object.keys(a.raeume)) {
      document.querySelector('#task').hidden = true;
      pg.openMenu(rid); await wait(150);
      const p = probleme(document.querySelector('#task .task-card'));
      if (p.length) bad.push(`Menü ${rid}: ${p.join('; ')}`);
    }
    document.querySelector('#task').hidden = true;
    return bad;
  },

  async spind() {
    const bad = [];
    schliesseAlles();
    document.querySelector('#btn-notebook').click(); await wait(500);
    const nb = document.querySelector('#notebook');
    for (const b of [...nb.querySelectorAll('.nb-tabs button')]) {
      b.click(); await wait(400);
      const p = probleme(nb);
      if (p.length) bad.push(`Spind ${b.textContent.trim()}: ${p.join('; ')}`);
    }
    nb.close();
    return bad;
  },

  async fenster() {
    const bad = [];
    schliesseAlles();
    for (const [name, oeffne, dlg] of [
      ['Menü', () => document.querySelector('#btn-menu').click(), '#menu'],
      ['Hilfe', () => document.querySelector('#btn-hilfe').click(), '#zugang'],
      ['Tasche', () => document.querySelector('#btn-tasche').click(), '#zugang'],
    ]) {
      oeffne(); await wait(400);
      const el = document.querySelector(dlg);
      const p = probleme(el);
      if (p.length) bad.push(`${name}: ${p.join('; ')}`);
      el.close();
    }
    window.__pg.showZertifikat(); await wait(400);
    const p = probleme(document.querySelector('#zert .zert-karte') || document.querySelector('#zert'));
    if (p.length) bad.push(`Zertifikat: ${p.join('; ')}`);
    document.querySelector('#zert').hidden = true;
    return bad;
  },

  /**
   * Nichts liegt über der Spielfläche: In jedem Raum darf kein sichtbares Bedienelement (Leiste, Hinweis-Kärtchen, Knöpfe) die Szene
   * oder die Tippfläche eines Hotspots schneiden. Das Gesprächsfeld wird getrennt gemeldet (es sperrt die Szene, solange es offen ist).
   */
  async ueberlagerung() {
    const pg = window.__pg;
    const szenen = (await fetch('data/szenen.json').then((r) => r.json())).szenen;
    const schnitt = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
    const bad = [];
    const gespraech = [];
    for (const sz of szenen) {
      await pg.goto(sz.id);
      await new Promise((r) => setTimeout(r, 500));
      const st = document.querySelector('#stage').getBoundingClientRect();
      const k = Math.min(st.width / 1536, st.height / 1024);
      const ox = st.left + (st.width - 1536 * k) / 2;
      const oy = st.top + (st.height - 1024 * k) / 2;
      const welt = { left: ox, top: oy, right: ox + 1536 * k, bottom: oy + 1024 * k };
      const ui = [...document.querySelectorAll('#hud, #hud *')].filter((el) => el.getClientRects().length).map((el) => ({ el, r: el.getBoundingClientRect() }));
      for (const { el, r } of ui) if (schnitt(r, welt)) bad.push(`${sz.id}: ${el.id || el.className || el.tagName} liegt über der Szene`);
      const box = document.querySelector('#dialog .dialog-box');
      for (const hs of sz.hotspots) {
        const z = hs.ziel || hs;
        const rad = Math.max(z.r || 40, 28 / k) * k;
        const ziel = { left: ox + z.x * k - rad, right: ox + z.x * k + rad, top: oy + z.y * k - rad, bottom: oy + z.y * k + rad };
        for (const { el, r } of ui) if (schnitt(r, ziel)) bad.push(`${sz.id}: ${hs.id} verdeckt von ${el.id || el.className || el.tagName}`);
        if (box) {
          document.querySelector('#dialog').hidden = false;
          if (schnitt(box.getBoundingClientRect(), ziel)) gespraech.push(`${sz.id}: ${hs.id}`);
          document.querySelector('#dialog').hidden = true;
        }
      }
    }
    return { size: `${innerWidth}x${innerHeight}`, bad, gespraechsfeldUeber: gespraech };
  },

  async alles() {
    const pg = window.__pg;
    pg.unlockAll();
    for (const f of ['k_protein', 'k_wichtig', 'k_denat', 'k_ausloeser', 'k_biuret', 'lab_frei', 'quiz_done', 'shakebar_done', 'training_done', 'sauna_done', 'labor_done', 'empfang_done']) pg.store.setFlag(f);
    const out = { size: `${innerWidth}x${innerHeight}` };
    for (const n of ['funde', 'aufgaben', 'raumMenues', 'spind', 'fenster']) out[n] = await audit[n]();
    return out;
  },
};
