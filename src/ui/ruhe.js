// Ruhige Seite: kein Zoom und kein Verrutschen. Alle Browserzugriffe laufen über übergebene Objekte, damit sich das ohne Browser testen lässt.
// iPad-Safari ignoriert `user-scalable=no`, darum fängt das Spiel die Zoom-Gesten selbst ab. Nach der Bildschirmtastatur schiebt iOS die Seite
// manchmal nicht zurück; dann lägen Knöpfe und Spielfläche versetzt und Tippen träfe daneben.

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

const ZOOM_TASTEN = new Set(['+', '-', '=', '0', 'Add', 'Subtract']);

/** Gesten und Tasten, die die Seite vergrößern würden: true = abfangen. Ein Finger, normales Scrollen in Fenstern und Tippen bleiben frei. */
export function istZoomGeste(typ, e) {
  if (!e) return false;
  if (typ === 'gesturestart' || typ === 'gesturechange' || typ === 'gestureend') return true; // Safari: Zwei-Finger-Zoom
  if (typ === 'touchmove') return Boolean(e.touches && e.touches.length > 1);
  if (typ === 'wheel') return Boolean(e.ctrlKey); // Touchpad-Zoom und Strg + Mausrad
  if (typ === 'keydown') return Boolean((e.ctrlKey || e.metaKey) && ZOOM_TASTEN.has(e.key));
  return false;
}

/** Zoom-Gesten auf der ganzen Seite abfangen (nicht passiv, sonst wirkt preventDefault nicht). Gibt eine Abmeldefunktion zurück. */
export function sperreZoom(doc) {
  const typen = ['gesturestart', 'gesturechange', 'gestureend', 'touchmove', 'wheel', 'keydown'];
  const hoerer = typen.map((typ) => {
    const f = (e) => { if (istZoomGeste(typ, e) && e.cancelable !== false) e.preventDefault(); };
    doc.addEventListener(typ, f, { passive: false, capture: true });
    return [typ, f];
  });
  return () => hoerer.forEach(([typ, f]) => doc.removeEventListener(typ, f, { capture: true }));
}

/**
 * Die Seite steht still: Verrutscht sie (Tastatur, Fokus auf ein Feld, Gummiband), setzt das Spiel sie nach oben links zurück. Während ein
 * Feld den Fokus hat, darf iOS die Seite verschieben, damit das Feld über der Tastatur sichtbar bleibt; erst nach dem Verlassen (focusout)
 * und wenn die Tastatur zu ist (visualViewport.resize) wird zurückgesetzt. Danach `nachher()` (zum Beispiel die Spielfläche neu messen).
 * Die Fenster schrumpfen bei offener Tastatur bewusst nicht: Sonst würde eine Aufgabe mitten beim Tippen neu geblättert.
 */
export function haltePosition(doc, win, { nachher = () => {} } = {}) {
  const feldAktiv = () => istEingabe(doc.activeElement);
  const zurueck = () => {
    if (feldAktiv()) return;
    if ((win.scrollX || 0) !== 0 || (win.scrollY || 0) !== 0) win.scrollTo(0, 0);
    const s = doc.scrollingElement;
    if (s && (s.scrollTop || s.scrollLeft)) { s.scrollTop = 0; s.scrollLeft = 0; }
    nachher();
  };
  const nachFokus = () => setTimeout(zurueck, 50);
  win.addEventListener('scroll', zurueck, { passive: true });
  doc.addEventListener('focusout', nachFokus, true);
  if (win.visualViewport) win.visualViewport.addEventListener('resize', zurueck);
  return () => {
    win.removeEventListener('scroll', zurueck);
    doc.removeEventListener('focusout', nachFokus, true);
    if (win.visualViewport) win.visualViewport.removeEventListener('resize', zurueck);
  };
}
