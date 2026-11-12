// Digitaler Versuch (statt des echten Versuchs bei der Lehrkraft): Die Lernenden führen bei jedem Glas selbst die Schritte aus
// (Aktionen je Probe in data/versuch.json, Feld `aktionen`) und sehen das Ergebnis im Glas. Die Erwartung aus dem Skript wird hier nicht
// verraten; die Beobachtung folgt im nächsten Schritt. Texte: data/versuch.json, versuchSchritt.digital.

import { h } from '../ui/dom.js';

/**
 * opts: { station (Stationsdaten), t (Texte digital), api, tubeSvg(pr, fertig, startfarbe), probenName(pr), start (Farbe),
 * nachAenderung() (wird nach jedem Neuzeichnen gerufen, damit das Blättern neu misst) }.
 * Gibt { knoten, alleFertig } zurück: `knoten` sind die Blöcke des Schritts (Einleitung, Gläser, Hinweis), die der Aufrufer
 * direkt in den Schrittkörper setzt, damit sie sich auf Seiten verteilen lassen.
 */
export function digitalVersuch({ station, t, api, tubeSvg, probenName, start, nachAenderung = () => {} }) {
  const schritte = new Map(station.proben.map((p) => [p.id, 0])); // erledigte Aktionen je Glas
  const wirkt = new Set(); // Gläser, bei denen gerade die kurze Animation läuft
  const area = h('div', 'rack digital');
  let beendet = false;

  const alleFertig = () => station.proben.every((p) => schritte.get(p.id) >= p.aktionen.length);

  function render() {
    area.replaceChildren(...station.proben.map((pr) => {
      const n = schritte.get(pr.id);
      const fertig = n >= pr.aktionen.length;
      const laeuft = wirkt.has(pr.id);
      const knopf = h('button', {
        type: 'button',
        disabled: beendet || laeuft,
        onclick: () => {
          if (fertig) { schritte.set(pr.id, 0); render(); return; }
          wirkt.add(pr.id); render();
          // kurze Wirkzeit, beim letzten Schritt etwas länger; danach zeigt das Glas das Ergebnis
          setTimeout(() => {
            wirkt.delete(pr.id); schritte.set(pr.id, n + 1);
            // Sind alle Gläser fertig, geht es direkt weiter (kein Aufräumen, kein Code der Lehrkraft)
            if (alleFertig()) beendet = true;
            render();
            if (beendet) api.ok(t.fertig);
          }, n + 1 === pr.aktionen.length ? 1400 : 600);
        },
      }, fertig ? t.zuruecksetzen : pr.aktionen[n]);
      const erledigt = pr.aktionen.slice(0, n).map((a) => `✓ ${a}`).join(' · ');
      return h('div', 'tube-karte',
        tubeSvg(pr, fertig, start),
        h('strong', {}, `Glas ${pr.nr}`),
        h('span', {}, probenName(pr)),
        knopf,
        h('span', { class: 'tube-ergebnis', 'aria-live': 'polite' }, laeuft ? 'Wirkt …' : (fertig ? '✓ Fertig' : erledigt)),
      );
    }));
    nachAenderung();
  }

  render();
  return { knoten: [h('p', 'frage', t.einleitung), area, h('p', 'hint', t.hinweis)], alleFertig };
}
