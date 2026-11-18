# Hefter-Texte des Protein-Gyms

Diese Datei ist die Quelle der Hefter-Texte. Das Spiel liest data/hefter.json, die aus dieser Datei gebaut wird (node tools/hefter-md.mjs oder npm run hefter). Alles vor „# Allgemein“ ist nur Erklärung und wird nicht eingelesen.

Bitte nur die Texte ändern; die Zeichen am Zeilenanfang haben eine Bedeutung:

- „# Eintrag …“: Titel eines Eintrags (so steht er im Spind). Darunter „Dauer: …“ (Zeit zum Abschreiben).
- „## Anweisungen“: was die Lernenden tun sollen, je Zeile mit „- “ ein Satz.
- „## Blatt“: der Text, der genau so in den Hefter kommt:
  - „### …“: grüne Teilüberschrift
  - eine Zeile Text: ein Absatz (darf über mehrere Zeilen gehen, bis zur nächsten Leerzeile)
  - Text mit „- “-Zeilen direkt darunter: Einleitungssatz mit Stichpunkten
  - „> **Merke: …** …“: roter Merksatz-Kasten
  - „**…**“ mit „| … |“-Zeilen darunter: Tabelle mit fetter Überschrift (erste Zeile ist der Kopf, die Zeile mit --- nicht ändern)
  - Block „abbildung“ zwischen drei Backticks: Zeichnung (art und formeln sind technisch, label und unterschrift sind Text)
- Zwischen den Teilen steht immer eine Leerzeile. Die unsichtbare Zeile mit „id:“ unter jedem Eintrag bitte nicht ändern.

# Allgemein

## Blatt-Titel
2. Eiweiße

## Hinweis über dem Blatt
Genau so in deinen Hefter: alles abschreiben, mit Überschriften, Merksätzen, Tabellen und Zeichnungen.

## Arbeitsauftrag oben im Spind
Arbeitsauftrag: Mitschreiben darfst du alles. Was unter „Hefter“ steht, muss in deinen Hefter. Viele Hinweise dienen der Orientierung, einige zeigen auf den Verursacher.

## Meldung bei einem neuen Eintrag
Neuer Heftereintrag! Übernimm ihn jetzt in deinen Hefter und setze im Spind den Haken „abgeschrieben“. Erst dann geht es weiter.

# Eintrag 1: Eiweiß und Gerinnen
<!-- id: h1 · ab: sauna_done · sperrt: training · erledigtMit: training_done -->
Dauer: ca. 5 Minuten

## Anweisungen
- Übernimm alles, was auf dem Blatt steht, in deinen Hefter.
- Die Versuchstabelle übernimmst du aus deinem Versuchsprotokoll.

## Blatt

### Vorkommen und Verwendung

Eiweiße im Körper:
- Baustoffe für Muskeln, Haut und Haare
- Transport von Stoffen im Körper
- Schutz vor Krankheitserregern

Der Körper baut seine Eiweiße ständig ab und neu. Deshalb müssen wir täglich Eiweiß mit der Nahrung aufnehmen.

Protein und Eiweiß bedeuten dasselbe.

### Denaturierung

> **Merke: Denaturieren** Beim Denaturieren (Stocken, Gerinnen) verändert das Eiweiß seine Struktur, es wird z. B. fest. So können z. B. Organismen abgetötet werden. Der Vorgang ist nicht umkehrbar.

Eiweiß denaturiert durch:
- Hitze (ab etwa 60 Grad)
- Säuren
- Alkohol
- Schwermetallsalze

**Versuchstabelle: Denaturierung**
| Probe | Einfluss | Beobachtung |
|---|---|---|
| 1 | Hitze im Wasserbad |  |
| 2 | Salzsäure |  |
| 3 | Kupfersulfat-Lösung (Fehling I) |  |
| 4 | Ethanol |  |
| 5 | Wasser (Kontrolle) |  |

# Eintrag 2: Bau der Eiweiße und Aminosäuren
<!-- id: h2 · ab: training_done · sperrt: shakebar · erledigtMit: shakebar_done -->
Dauer: ca. 7 Minuten

## Anweisungen
- Übernimm alles, was auf dem Blatt steht, in deinen Hefter, und zeichne die Abbildungen ab.
- Schreibe die Fortsetzung unter deine Überschrift Denaturierung aus Eintrag 1.
- Glycin und Alanin musst du nur abzeichnen, nicht auswendig lernen.
- Zusatz für Schnelle: Zwei Aminosäuren verbinden sich über die Peptidbindung zu einem Dipeptid, dabei wird Wasser frei.

## Blatt

### Bau

> **Merke: Aminosäuren** Proteine (Eiweiße) bestehen aus Aminosäuren. Die Aminosäuren sind die Bausteine (Monomere), das Eiweiß ist ein langes Molekül aus vielen Aminosäuren (Polymer).

Bei der Verknüpfung wird Wasser abgespalten (Kondensation).

```abbildung
art: aminosaeure
label: Aufbau einer Aminosäure
formeln: allgemein = R; Glycin = H; Alanin = CH₃
unterschrift: Links die Aminogruppe (H₂N), rechts die Carboxygruppe (COOH), oben der Rest R.
```

### Denaturierung (Fortsetzung)

Faltung und Denaturieren:
- Die Kette eines Proteins ist zu ihrer Struktur gefaltet. Schwache Verbindungen (Wasserstoffbrücken) halten die Falten.
- Hitze, Säuren, Alkohol oder Schwermetallsalze lösen diese Verbindungen: Die Kette entfaltet sich und verklumpt.
- Dabei geht die „aktive“ Form dauerhaft verloren.
- Zerstört ist das Eiweiß aber nicht: Die Reihenfolge der Aminosäuren in der Kette bleibt erhalten.

```abbildung
art: kette
unterschrift: Jede Perle ist eine Aminosäure. Die Reihenfolge der Perlen bleibt beim Entfalten gleich.
```

# Eintrag 3: Biuret-Nachweis
<!-- id: h3 · ab: lieferung_done · sperrt: schluss · erledigtMit: quiz2_done -->
Dauer: ca. 4 Minuten

## Anweisungen
- Übernimm alles, was auf dem Blatt steht, in deinen Hefter.
- Die Versuchstabelle übernimmst du aus deinem Versuchsprotokoll. Das Protokoll zum Biuret-Nachweis holst du bei deiner Lehrkraft ab.

## Blatt

### Nachweis

Biuret-Nachweis (Beobachtung: Farbe der Probe):
- Probe mit Natronlauge versetzen
- Kupfersulfat-Lösung (Fehling I) zugeben
- Violett: Eiweiß ist enthalten
- Bleibt die Probe blau: kein Eiweiß enthalten

**Versuchstabelle: Lieferung**
| Probe | Beobachtung | Ergebnis |
|---|---|---|
| Eiweißshake |  |  |
| Zuckerlösung |  |  |
| Wasser |  |  |
