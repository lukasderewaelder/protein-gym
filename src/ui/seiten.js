// Seiten statt Scrollen: Zu langer Inhalt wird auf Seiten verteilt, die man mit „Zurück“ und „Weiter“ blättert.
// Die Aufteilung (verteileSeiten) ist reine Logik und testbar; macheSeiten ist die dünne DOM-Hülle darum.

/**
 * Verteilt Blöcke gierig auf Seiten. `hoehen` = Höhe jedes Blocks in Pixel (inklusive Abstand), `verfuegbar` = Höhe einer Seite.
 * Ein Block wird nie geteilt; ist ein einzelner Block höher als eine Seite, bekommt er eine eigene Seite.
 * `kleben[i]` (optional): Block i bleibt mit Block i+1 auf einer Seite, solange beide zusammen auf eine Seite passen.
 * Gibt eine Liste von Seiten zurück, jede Seite ist eine Liste von Block-Indizes. Ohne Blöcke gibt es genau eine leere Seite.
 */
export function verteileSeiten(hoehen, verfuegbar, kleben = []) {
  // Einheiten bilden: Ein Block mit kleben[i] = true bleibt mit dem nächsten zusammen (zum Beispiel Frage und Antworten)
  const einheiten = [];
  let lauf = [];
  hoehen.forEach((_, i) => {
    lauf.push(i);
    if (!kleben[i] || i === hoehen.length - 1) { einheiten.push(lauf); lauf = []; }
  });
  const hoeheVon = (e) => e.reduce((sum, i) => sum + hoehen[i], 0);
  // Zu hohe Einheiten werden wieder in einzelne Blöcke aufgelöst, damit nichts abgeschnitten wird
  const teile = einheiten.flatMap((e) => (e.length > 1 && hoeheVon(e) > verfuegbar ? e.map((i) => [i]) : [e]));
  const seiten = [];
  let aktuell = [];
  let summe = 0;
  for (const e of teile) {
    const h = hoeheVon(e);
    if (aktuell.length && summe + h > verfuegbar) {
      seiten.push(aktuell);
      aktuell = [];
      summe = 0;
    }
    aktuell.push(...e);
    summe += h;
  }
  if (aktuell.length) seiten.push(aktuell);
  return seiten.length ? seiten : [[]];
}

/** Nummer der Seite, auf der Block `blockIndex` steht (0, wenn es ihn nicht gibt). */
export function seiteVon(seiten, blockIndex) {
  const s = seiten.findIndex((blocks) => blocks.includes(blockIndex));
  return s < 0 ? 0 : s;
}

/**
 * Blättern in einem Container: Die Kinder von `host` sind die Blöcke. Der Container muss eine feste Höhe haben, die nicht vom
 * Inhalt abhängt (zum Beispiel Flex-Bereich mit `min-height: 0` und `overflow: hidden`). `nav` ist ein leeres Element für
 * „Zurück · Seite x von y · Weiter“; es bleibt verborgen, solange eine Seite genügt.
 * Optionen: `ignorieren(kind)` nimmt ein Kind von der Aufteilung aus (bleibt immer sichtbar), `beiWechsel(seite, seitenAnzahl)`.
 * Gibt { neu(), zeige(i), zeigeBlock(element), seite, anzahl, ende() } zurück.
 */
export function macheSeiten(host, { nav, ignorieren = () => false, kleben = () => false, kompakt = true, beiWechsel = null, doc = document } = {}) {
  let seiten = [[]];
  let aktuelle = 0;
  let blocks = [];
  let wartet = false;
  const zurueck = doc.createElement('button');
  const vor = doc.createElement('button');
  const text = doc.createElement('span');
  zurueck.type = vor.type = 'button';
  zurueck.textContent = '← Zurück';
  vor.textContent = 'Weiter →';
  text.className = 'seiten-text';
  text.setAttribute('aria-live', 'polite');
  nav.replaceChildren(zurueck, text, vor);
  nav.classList.add('seiten-nav');
  zurueck.addEventListener('click', () => zeige(aktuelle - 1));
  vor.addEventListener('click', () => zeige(aktuelle + 1));

  const sichtbar = (k) => !k.hasAttribute('data-seite-weg') && getComputedStyle(k).display !== 'none';

  function zeige(i) {
    aktuelle = Math.max(0, Math.min(seiten.length - 1, i));
    blocks.forEach((k, bi) => { k.hidden = !seiten[aktuelle].includes(bi); });
    nav.hidden = seiten.length <= 1;
    text.textContent = `Seite ${aktuelle + 1} von ${seiten.length}`;
    zurueck.disabled = aktuelle === 0;
    vor.disabled = aktuelle >= seiten.length - 1;
    if (beiWechsel) beiWechsel(aktuelle, seiten.length);
  }

  /** Neu messen und aufteilen; die Seite, auf der der erste sichtbare Block stand, bleibt erhalten. */
  function neu() {
    const merk = blocks[seiten[aktuelle][0]] || null;
    const kinder = [...host.children].filter((k) => !ignorieren(k));
    kinder.forEach((k) => { k.hidden = false; });
    blocks = kinder.filter(sichtbar);
    // Zum Messen füllt der Container den ganzen freien Platz (Klasse „seiten-voll“), unabhängig vom Inhalt
    host.classList.add('seiten-voll');
    const messen = () => {
      const hoehen = blocks.map((k, i) => {
        const nachbar = blocks[i + 1];
        const unten = nachbar ? nachbar.offsetTop : k.offsetTop + k.offsetHeight + parseFloat(getComputedStyle(k).marginBottom || '0');
        return unten - k.offsetTop;
      });
      return verteileSeiten(hoehen, host.clientHeight, blocks.map((k, i) => i < blocks.length - 1 && kleben(k)));
    };
    // Erst normal versuchen, dann mit engeren Abständen (Klasse „kompakt“), erst danach auf mehrere Seiten verteilen
    host.classList.remove('kompakt');
    seiten = messen();
    if (kompakt && seiten.length > 1) {
      host.classList.add('kompakt');
      const eng = messen();
      if (eng.length < seiten.length) seiten = eng; else host.classList.remove('kompakt');
    }
    if (seiten.length <= 1) host.classList.remove('seiten-voll'); // eine Seite genügt: der Container passt sich dem Inhalt an
    const i = merk ? blocks.indexOf(merk) : 0;
    zeige(i < 0 ? 0 : seiteVon(seiten, i));
  }

  function geplant() {
    if (wartet) return;
    wartet = true;
    (doc.defaultView || window).requestAnimationFrame(() => { wartet = false; neu(); });
  }

  const beobachter = new (doc.defaultView || window).MutationObserver(geplant);
  beobachter.observe(host, { childList: true });
  const groesse = new (doc.defaultView || window).ResizeObserver(geplant);
  groesse.observe(host);
  const onKey = (e) => {
    if (host.closest('[hidden]') || nav.hidden) return;
    if (e.key === 'PageDown') zeige(aktuelle + 1);
    else if (e.key === 'PageUp') zeige(aktuelle - 1);
  };
  (doc.defaultView || window).addEventListener('keydown', onKey);

  return {
    neu,
    zeige,
    /** Seite zeigen, auf der `el` (ein Kind des Containers) steht. */
    zeigeBlock(el) { const i = blocks.indexOf(el); if (i >= 0) zeige(seiteVon(seiten, i)); },
    get seite() { return aktuelle; },
    get anzahl() { return seiten.length; },
    ende() { beobachter.disconnect(); groesse.disconnect(); (doc.defaultView || window).removeEventListener('keydown', onKey); },
  };
}
