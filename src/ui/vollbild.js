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

/** Vollbild anfordern. Gibt true zurück, wenn der Browser zugesagt hat; Fehler (keine Geste, blockiert) brechen nichts ab. */
export async function vollbildAn(doc = document, scr = (typeof screen !== 'undefined' ? screen : null)) {
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
  return true;
}

export async function vollbildAus(doc = document) {
  if (!istVollbild(doc)) return;
  try {
    if (doc.exitFullscreen) await doc.exitFullscreen();
    else if (doc.webkitExitFullscreen) await doc.webkitExitFullscreen();
  } catch { /* egal */ }
}

export async function umschalten(doc = document, scr) {
  if (istVollbild(doc)) { await vollbildAus(doc); return false; }
  return vollbildAn(doc, scr);
}

/** Auf Änderungen des Vollbildzustands hören (auch wenn die Person mit Esc beendet). Gibt eine Abmeldefunktion zurück. */
export function beiVollbildwechsel(fn, doc = document) {
  const h = () => fn(istVollbild(doc));
  doc.addEventListener('fullscreenchange', h);
  doc.addEventListener('webkitfullscreenchange', h);
  return () => { doc.removeEventListener('fullscreenchange', h); doc.removeEventListener('webkitfullscreenchange', h); };
}
