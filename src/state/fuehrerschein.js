// Laborführerschein: drei Sicherheitsfragen mit gestuften Rückmeldungen. Reine Logik ohne Browser.
//   richtig  → positive Rückmeldung mit Begründung
//   1. Fehler → Hinweis ohne Lösung
//   ab dem 2. Fehler bei derselben Frage → konkretere Hilfe (die Lösung wird nie verraten)
// Es gibt keinen Neustart: falsche Antworten werden nur ausgegraut, der Test geht an derselben Frage weiter.

export function mische(liste, zufall = Math.random) {
  const a = [...liste];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(zufall() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Test starten: Antworten je Frage mischen. */
export function startTest(fragen, zufall = Math.random) {
  return {
    fragen: fragen.map((f) => ({
      ...f,
      optionen: mische([{ text: f.richtig, richtig: true }, ...f.falsch.map((t) => ({ text: t, richtig: false }))], zufall),
    })),
    i: 0,
    fehler: 0,
    gewaehlt: new Set(),
  };
}

export const aktuelle = (t) => t.fragen[t.i];
export const istFertig = (t) => t.i >= t.fragen.length;

/** Antwort geben. Gibt { richtig, stufe, text } zurück; bei „richtig“ ist die Frage gelöst und weiter() geht zur nächsten. */
export function antworte(t, index) {
  const f = aktuelle(t);
  const opt = f.optionen[index];
  if (!opt || t.gewaehlt.has(index)) return { richtig: false, stufe: 'nichts', text: '' };
  if (opt.richtig) return { richtig: true, stufe: 'gut', text: f.erklaerung };
  t.gewaehlt.add(index);
  t.fehler++;
  return t.fehler >= 2
    ? { richtig: false, stufe: 'hilfe', text: f.hilfe }
    : { richtig: false, stufe: 'hinweis', text: f.hinweis };
}

export function weiter(t) {
  t.i++;
  t.fehler = 0;
  t.gewaehlt = new Set();
}
