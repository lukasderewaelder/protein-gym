// Bildschirmtastatur im Spiel: Zahlenfeld und QWERTZ mit Umlauten, Groß- und Kleinschreibung.
// Die Systemtastatur öffnet sich dadurch gar nicht erst (Felder sind `readonly`, `inputmode="none"`), das Vollbild bleibt (iPad-Safari
// beendet Vollbild sonst bei jeder Eingabe). Eine echte Tastatur (Chromebook, PC) tippt weiter mit: Ihre Tasten landen im offenen Feld.
// Oben: reine Logik (ohne Browser, getestet in tests/tastatur.test.mjs). Unten: das Fenster (createTastatur).

export const LOESCHEN = '⌫';
export const UMSCHALT = '⇧';
export const LEER = 'Leer';
export const OK = 'OK';

/** Zahlenfeld: Ziffern, Punkt (Notfallcode ist ein Datum) und Löschen; darunter OK. */
export const ZIFFERN = [['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9'], ['.', '0', LOESCHEN]];

/** QWERTZ wie auf deutschen Tastaturen, mit Ziffernreihe, ß, Ü, Ö, Ä; unten Leertaste und OK. */
export const QWERTZ = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'ß'],
  ['q', 'w', 'e', 'r', 't', 'z', 'u', 'i', 'o', 'p', 'ü'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'ö', 'ä'],
  [UMSCHALT, 'y', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '-', LOESCHEN],
  ['?', '!', LEER, OK],
];

/** Was eine Buchstabentaste schreibt: groß bei Umschalt (ß bleibt ß, sonst würde daraus „SS“). */
export function zeichen(taste, gross) {
  if (!gross || taste === 'ß') return taste;
  return taste.toUpperCase();
}

/**
 * Umschalt-Zustand: 'aus' (klein), 'einmal' (der nächste Buchstabe groß, danach wieder klein) oder 'fest' (alles groß).
 * Ein Tipp auf ⇧ schaltet aus → einmal → fest → aus.
 */
export function naechsterUmschalt(u) {
  return u === 'aus' ? 'einmal' : u === 'einmal' ? 'fest' : 'aus';
}

/**
 * Eine Taste drücken. zustand: { wert, umschalt }. Gibt den neuen Zustand zurück, dazu `fertig: true` bei OK.
 * max: höchstens so viele Zeichen (maxlength des Feldes). Geschrieben wird immer am Ende.
 */
export function druecke(zustand, taste, { max = Infinity } = {}) {
  const wert = String(zustand.wert || '');
  const umschalt = zustand.umschalt || 'aus';
  if (taste === OK) return { wert, umschalt, fertig: true };
  if (taste === UMSCHALT) return { wert, umschalt: naechsterUmschalt(umschalt) };
  if (taste === LOESCHEN) return { wert: [...wert].slice(0, -1).join(''), umschalt };
  const z = taste === LEER ? ' ' : zeichen(taste, umschalt !== 'aus');
  const neu = [...wert].length < max ? wert + z : wert;
  return { wert: neu, umschalt: umschalt === 'einmal' && /\p{L}/u.test(z) ? 'aus' : umschalt };
}

/**
 * Taste einer echten Tastatur in eine Taste der Bildschirmtastatur übersetzen (null = nicht für uns).
 * Strg, Alt und Cmd bleiben dem Browser (Kopieren, Zoom-Sperre); Zeichen kommen so, wie die echte Tastatur sie schreibt.
 */
export function tasteVon(e) {
  if (!e || e.ctrlKey || e.metaKey || e.altKey) return null;
  if (e.key === 'Backspace') return LOESCHEN;
  if (e.key === 'Enter') return OK;
  if (e.key === ' ') return LEER;
  if (typeof e.key === 'string' && [...e.key].length === 1) return { roh: e.key };
  return null;
}

/** Feld für die Bildschirmtastatur vorbereiten. art: 'ziffern' (Codes) oder 'text' (Wörter, Notizen). Gibt das Feld zurück. */
export function tastaturFeld(feld, art = 'text') {
  feld.readOnly = true; // keine Systemtastatur, auch nicht auf dem iPad
  feld.setAttribute('inputmode', 'none');
  feld.setAttribute('autocomplete', 'off');
  feld.dataset.tastatur = art;
  feld.setAttribute('aria-haspopup', 'true');
  return feld;
}

// ---------- Fenster (Browser) ----------

const istTastaturFeld = (el) => Boolean(el && el.dataset && el.dataset.tastatur && !el.disabled);

/**
 * Die Tastatur hängt sich in das Fenster des Feldes (offener <dialog>, Aufgabenfenster), sonst wäre sie hinter einem modalen Fenster
 * nicht antippbar. Oben zeigt sie, wohin geschrieben wird (Beschriftung und Inhalt des Feldes), unten die Tasten. OK schließt sie und
 * löst im Feld „Enter“ aus (Codes werden dann wie bisher geprüft). Ein Tipp neben die Tastatur schließt sie auch.
 */
export function createTastatur(doc = document) {
  let feld = null;
  let el = null;
  let anzeige = null;
  let umschalt = 'aus';
  let tastenKnoepfe = [];
  let wache = null;

  const mk = (tag, cls, text) => { const e = doc.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

  function beschriftung(f) {
    return f.getAttribute('aria-label') || f.getAttribute('placeholder') || 'Eingabe';
  }

  function zeigeWert() {
    if (!feld || !anzeige) return;
    const w = feld.value || '';
    const text = feld.type === 'password' ? '•'.repeat([...w].length) : w;
    anzeige.replaceChildren(doc.createTextNode(text), mk('span', 'tastatur-cursor', '|'));
    anzeige.classList.toggle('leer', !w);
    anzeige.dataset.platz = w ? '' : (feld.getAttribute('placeholder') || '');
    const gross = umschalt !== 'aus';
    for (const [b, t] of tastenKnoepfe) {
      if (t === UMSCHALT) {
        b.textContent = umschalt === 'fest' ? '⇪' : UMSCHALT;
        b.setAttribute('aria-pressed', String(gross));
        b.setAttribute('aria-label', umschalt === 'fest' ? 'Großschreibung fest' : umschalt === 'einmal' ? 'Nächster Buchstabe groß' : 'Großschreibung');
      } else if (t.length === 1 && /\p{L}/u.test(t)) b.textContent = zeichen(t, gross);
    }
  }

  function schreibe(neu) {
    if (neu === feld.value) return;
    feld.value = neu;
    feld.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function druck(taste) {
    if (!feld || !feld.isConnected || feld.disabled) { schliesse(); return; }
    const max = feld.maxLength > 0 ? feld.maxLength : Infinity;
    let z;
    if (taste && typeof taste === 'object') z = { wert: [...(feld.value || '')].length < max ? (feld.value || '') + taste.roh : feld.value, umschalt };
    else z = druecke({ wert: feld.value, umschalt }, taste, { max });
    umschalt = z.umschalt;
    schreibe(z.wert);
    if (z.fertig) {
      const f = feld;
      schliesse();
      // Codes prüfen wie mit der echten Enter-Taste (Textfelder ohne Enter-Hörer schließen nur)
      if (f.tagName !== 'TEXTAREA') f.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      return;
    }
    zeigeWert();
  }

  function taste(t, art) {
    const b = mk('button', 'taste');
    b.type = 'button';
    b.textContent = t === LEER ? 'Leertaste' : t;
    if (t === LOESCHEN) { b.classList.add('breit'); b.setAttribute('aria-label', 'Löschen'); }
    if (t === UMSCHALT) b.classList.add('breit', 'umschalt');
    if (t === LEER) { b.classList.add('leer'); b.setAttribute('aria-label', 'Leertaste'); }
    if (t === OK) { b.classList.add('ok', 'primary'); b.textContent = art === 'ziffern' ? 'OK ↵' : 'Fertig ↵'; }
    // Kein Fokuswechsel beim Tippen (sonst springt der Fokus aus dem Feld), die Taste wirkt beim Loslassen wie jeder Knopf
    b.addEventListener('pointerdown', (e) => e.preventDefault());
    b.addEventListener('click', () => druck(t));
    tastenKnoepfe.push([b, t]);
    return b;
  }

  function oeffne(f) {
    if (feld === f && el && el.isConnected) return;
    schliesse();
    feld = f;
    umschalt = 'aus';
    tastenKnoepfe = [];
    const art = f.dataset.tastatur === 'ziffern' ? 'ziffern' : 'text';
    el = mk('div', `tastatur ${art}`);
    el.setAttribute('role', 'group');
    el.setAttribute('aria-label', art === 'ziffern' ? 'Zahlenfeld' : 'Bildschirmtastatur');
    const kopf = mk('div', 'tastatur-kopf');
    anzeige = mk('div', 'tastatur-anzeige');
    anzeige.setAttribute('aria-live', 'polite');
    const zu = mk('button', 'tastatur-zu', '✕');
    zu.type = 'button';
    zu.setAttribute('aria-label', 'Tastatur schließen');
    zu.addEventListener('pointerdown', (e) => e.preventDefault());
    zu.addEventListener('click', () => schliesse());
    kopf.append(mk('span', 'tastatur-label', beschriftung(f)), anzeige, zu);
    el.append(kopf);
    if (art === 'ziffern') {
      const raster = mk('div', 'tastatur-raster');
      for (const reihe of ZIFFERN) for (const t of reihe) raster.append(taste(t, art));
      el.append(raster, taste(OK, art));
    } else {
      for (const reihe of QWERTZ) {
        const r = mk('div', 'tastatur-reihe');
        for (const t of reihe) r.append(taste(t, art));
        el.append(r);
      }
    }
    const wohin = f.closest('dialog[open]') || f.closest('.task') || f.closest('.screen') || doc.body;
    wohin.append(el);
    f.classList.add('tastatur-aktiv');
    zeigeWert();
    // Verschwindet das Feld oder sein Fenster (Schritt gewechselt, Fenster zu), geht die Tastatur mit
    wache = setInterval(() => {
      if (!feld || !feld.isConnected || feld.disabled || !feld.getClientRects().length) schliesse();
    }, 400);
  }

  function schliesse() {
    if (wache) { clearInterval(wache); wache = null; }
    if (feld) feld.classList.remove('tastatur-aktiv');
    if (el) el.remove();
    el = null; anzeige = null; feld = null; tastenKnoepfe = [];
  }

  // Antippen eines Feldes öffnet die Tastatur; ein Tipp daneben schließt sie (der Tipp selbst wirkt normal weiter)
  doc.addEventListener('pointerdown', (e) => {
    const ziel = e.target;
    if (el && el.contains(ziel)) return;
    const f = ziel && ziel.closest ? ziel.closest('[data-tastatur]') : null;
    if (!istTastaturFeld(f) && el) schliesse();
  }, true);
  doc.addEventListener('click', (e) => {
    const f = e.target && e.target.closest ? e.target.closest('[data-tastatur]') : null;
    if (istTastaturFeld(f)) oeffne(f);
  }, true);
  // Echte Tastatur: tippt ins offene Feld; ist das Feld nur fokussiert (Tab), öffnet der erste Tastendruck die Tastatur
  doc.addEventListener('keydown', (e) => {
    if (e.isTrusted === false) return; // das eigene „Enter“ nach OK nicht wieder auffangen
    if (!el && istTastaturFeld(doc.activeElement) && tasteVon(e)) oeffne(doc.activeElement);
    if (!el) return;
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); schliesse(); return; }
    const t = tasteVon(e);
    if (!t) return;
    e.preventDefault();
    e.stopPropagation(); // sonst löste Enter im Feld die Prüfung doppelt aus
    druck(t);
  }, true);

  return { oeffne, schliesse, get offen() { return Boolean(el); }, get feld() { return feld; } };
}
