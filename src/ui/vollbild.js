// Vollbildmodus. Browser erlauben ihn nur nach einer Geste (Tippen oder Klick) und nicht überall (iPhone: nein, iPad: ja).
// Alle Browserzugriffe laufen über ein übergebenes Dokument, damit sich das ohne Browser testen lässt.

/** Das Element, das in den Vollbildmodus gehen soll (ganze Seite). */
function wurzel(doc) { return doc.documentElement; }

export function vollbildMoeglich(doc = document) {
  const el = wurzel(doc);
  return Boolean(el && (el.requestFullscreen || el.webkitRequestFullscreen));
}

export function istVollbild(doc = document) {
  return Boolean(doc.fullscreenElement || doc.webkitFullscreenElement);
}

/** iPhone, iPad und iPod (auch iPadOS, das sich als Mac meldet): Dort heißt der Weg zum Vollbild „Zum Home-Bildschirm“. */
export function istApple(nav) {
  if (!nav) return false;
  return /iPhone|iPad|iPod/.test(nav.userAgent || '') || (nav.platform === 'MacIntel' && (nav.maxTouchPoints || 0) > 1);
}

/**
 * Welcher Hinweis gehört ins Menü, wenn Vollbild nicht (mehr) per Knopf geht? 'app' = läuft schon ohne Leisten, 'ios' = nicht möglich auf
 * Apple-Geräten, 'abgelehnt' = sonst (nicht unterstützt oder vom Browser abgelehnt). Texte stehen als data-Attribute in index.html.
 */
export function vollbildHinweis({ moeglich, appModus, ios }) {
  if (appModus) return 'app';
  if (!moeglich && ios) return 'ios';
  return 'abgelehnt';
}

/** Vollbild anfordern. Gibt true zurück, wenn der Browser zugesagt hat; Fehler (keine Geste, blockiert) brechen nichts ab. */
export async function vollbildAn(doc = document, scr = (typeof screen !== 'undefined' ? screen : null), nav = (typeof navigator !== 'undefined' ? navigator : null)) {
  if (!vollbildMoeglich(doc)) return false;
  if (istVollbild(doc)) return true;
  const el = wurzel(doc);
  try {
    if (el.requestFullscreen) await el.requestFullscreen({ navigationUI: 'hide' });
    else await el.webkitRequestFullscreen();
  } catch { return false; }
  // Querformat sperren: klappt nur auf Android und nur im Vollbild
  try {
    if (scr && scr.orientation && scr.orientation.lock) await scr.orientation.lock('landscape');
  } catch { /* Sperre nicht verfügbar */ }
  // Esc abfangen (Chrome): Ein kurzer Druck schließt dann Spielfenster, statt das Vollbild zu beenden; nur langes Halten beendet es
  try {
    if (nav && nav.keyboard && nav.keyboard.lock) await nav.keyboard.lock(['Escape']);
  } catch { /* Sperre nicht verfügbar */ }
  return true;
}

export async function vollbildAus(doc = document, nav = (typeof navigator !== 'undefined' ? navigator : null)) {
  if (!istVollbild(doc)) return;
  try { if (nav && nav.keyboard && nav.keyboard.unlock) nav.keyboard.unlock(); } catch { /* egal */ }
  try {
    if (doc.exitFullscreen) await doc.exitFullscreen();
    else if (doc.webkitExitFullscreen) await doc.webkitExitFullscreen();
  } catch { /* egal */ }
}

export async function umschalten(doc = document, scr, nav) {
  if (istVollbild(doc)) { await vollbildAus(doc, nav); return false; }
  return vollbildAn(doc, scr, nav);
}

/** Felder, in die man tippt (Text, Zahl, Passwort …) und die die Bildschirmtastatur öffnen; Kästchen, Knöpfe und Regler nicht. */
export function istEingabe(el) {
  if (!el) return false;
  if (el.isContentEditable) return true;
  const tag = String(el.tagName || '').toLowerCase();
  if (tag === 'textarea' || tag === 'select') return true;
  if (tag !== 'input') return false;
  const art = String(el.type || 'text').toLowerCase();
  return !['checkbox', 'radio', 'button', 'submit', 'reset', 'range', 'color', 'file', 'image'].includes(art);
}

/** Tippen auf ein Feld oder auf die Beschriftung (label) eines Feldes. */
function zielIstEingabe(ziel) {
  if (istEingabe(ziel)) return true;
  const label = ziel && ziel.closest && ziel.closest('label');
  return Boolean(label && istEingabe(label.control));
}

/**
 * Wächter: Wollte die Person Vollbild und ist es verschwunden (Druckdialog, Teilen, App-Wechsel, Neuladen), holt das nächste Tippen es
 * zurück. Browser erlauben Vollbild nur nach einer Geste, auf Touch zählt erst das Loslassen (pointerup/click).
 * `wunsch()` sagt, ob Vollbild gewünscht ist; `nachholen()` fordert es an; `ausser(ziel)` nimmt Tipps aus (der Vollbild-Knopf selbst
 * entscheidet allein). **Eingabefelder bleiben in Ruhe:** Wer ein Feld antippt oder in einem schreibt, hat die Bildschirmtastatur offen, und
 * ein neues Vollbild würde sie nach etwa einer Sekunde wieder schließen. Darum holt der Wächter Vollbild nicht zurück, solange ein Feld den
 * Fokus hat, kurz nach einem Fokuswechsel (`ruhe` ms nach Fokus, 300 ms nach dem Verlassen) und beim Tippen auf ein Feld. Das nächste Tippen
 * außerhalb eines Feldes holt es dann zurück. Gibt eine Abmeldefunktion zurück.
 */
export function vollbildWaechter(doc, { wunsch, nachholen, ausser = () => false, jetzt = () => Date.now(), ruhe = 1500 }) {
  let laeuft = false;
  let ruhigBis = 0;
  const h = (e) => {
    const ziel = e && e.target;
    if (laeuft || ausser(ziel) || !wunsch() || istVollbild(doc) || !vollbildMoeglich(doc)) return;
    if (zielIstEingabe(ziel) || istEingabe(doc.activeElement) || jetzt() < ruhigBis) return;
    laeuft = true;
    Promise.resolve().then(nachholen).catch(() => {}).finally(() => { laeuft = false; });
  };
  const fokus = (e) => { if (istEingabe(e && e.target)) ruhigBis = jetzt() + ruhe; };
  const verlassen = (e) => { if (istEingabe(e && e.target)) ruhigBis = Math.max(ruhigBis, jetzt() + 300); };
  doc.addEventListener('pointerup', h, true);
  doc.addEventListener('click', h, true);
  doc.addEventListener('focusin', fokus, true);
  doc.addEventListener('focusout', verlassen, true);
  return () => {
    doc.removeEventListener('pointerup', h, true); doc.removeEventListener('click', h, true);
    doc.removeEventListener('focusin', fokus, true); doc.removeEventListener('focusout', verlassen, true);
  };
}

/** Auf Änderungen des Vollbildzustands hören (auch wenn die Person mit Esc beendet). Gibt eine Abmeldefunktion zurück. */
export function beiVollbildwechsel(fn, doc = document) {
  const h = () => fn(istVollbild(doc));
  doc.addEventListener('fullscreenchange', h);
  doc.addEventListener('webkitfullscreenchange', h);
  return () => { doc.removeEventListener('fullscreenchange', h); doc.removeEventListener('webkitfullscreenchange', h); };
}
