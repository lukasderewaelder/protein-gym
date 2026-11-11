# Grafik-Prompts für ChatGPT

Alle Bilder des Spiels Protein-Gym. Jeder Prompt ist vollständig und kann einzeln kopiert werden (der Stil-Block ist schon eingesetzt). Zu jedem Bild stehen Dateiname, Zielordner, das Werkzeug zum Weiterverarbeiten, die Beschreibung des Stils und eine Prüfliste. Die Prompts sind Englisch, weil ChatGPT Bildvorgaben so zuverlässiger trifft; alles andere ist Deutsch.

## 1. So gehst du vor

1. **Reihenfolge einhalten:** Die Szenen (Nr 1–6) sind schon fertig und eingebaut. Weiter mit dem Referenzblatt der Spielfigur, dann ein Lauf-Streifen, dann das Grafik-Werkzeug testen. Erst wenn das trägt, den Rest erzeugen.
2. **Ein Chat pro Bildfamilie:** Szenen in einem Chat, Spielfigur in einem Chat, jede NPC-Figur in einem eigenen Chat. So bleibt der Stil im Gedächtnis des Chats. Bei „Referenz“ im Prompt das genannte Bild als Anhang mitschicken und den Satz im Prompt unverändert lassen.
3. **Höchstens zwei Nachbesserungen je Bild.** Danach das Bild nehmen und kleine Fehler im Spiel kaschieren (Kollision und Hotspots im Editiermodus).
4. **Bildformat:** Szenen im Querformat 3:2 (voraussichtlich 1536 × 1024, das größte angebotene Format wählen, vorher prüfen). Sprites, Porträts und Icons quadratisch oder breit, egal; wichtig ist der einfarbige Hintergrund.
5. **Kein Text im Bild.** ChatGPT malt Pseudoschrift und falsche Formeln. Alle Beschriftungen, Formeln, Reagenzgläser, Dampf und Konfetti zeichnet das Spiel selbst.
6. **Keine Marken oder Spielnamen** in den Prompts. Der Stil wird beschrieben, nicht benannt.
7. **Danach:** Bild im Grafik-Werkzeug verarbeiten (siehe Abschnitt 9), Datei in den Zielordner legen, `node tools/precache.mjs` ausführen.

## 2. Allgemeiner Stil (gilt für alle Bilder)

| Merkmal | Vorgabe |
|---|---|
| Technik | Pixel-Art-Optik: sichtbare, kräftige Pixel, dunkle Konturen, weiche Zell-Schattierung. Kein Foto-Look, keine Unschärfe, kein Kantenglätten. Echtes Pixelraster ist nicht nötig (ChatGPT trifft es nicht exakt), es soll nur „nach Pixel-Art aussehen“. |
| Perspektive | Draufsicht leicht von schräg oben („Dreiviertelansicht“), wie ein klassisches 16-Bit-Abenteuerspiel. Figuren in Chibi-Proportionen, etwa 3 Köpfe hoch. |
| Farben | Warm und freundlich: Türkis, Off-White, warmes Holzbraun, Signalorange, weiches Grau, ein Hauch Gelb. Eigene Stimmung je Raum (siehe unten), aber immer dieselbe Farbfamilie. |
| Stimmung | Freundlich, schulgeeignet, sauber, ohne Körperideale und ohne Gewichts- oder Kalorienbezug. Figuren sind sympathisch, nie Karikaturen. |
| Inhalte | Nie Text, Buchstaben, Zahlen, Logos, Wasserzeichen. Poster, Tafeln, Etiketten bleiben leer. |
| Sprites | Einfarbiger Magenta-Hintergrund (#FF00FF), kein Verlauf, kein Schatten, Figur vollständig sichtbar. Es gibt nur eine Spielfigur (rotes Shirt), das Spiel verändert sie nicht. |
| Stimmung je Raum | Trainingsfläche: Grau und Türkis, Gummifliesen. Empfang: Türkis und Holz, Spindwand. Labor: Weiß, Hellgrau, Türkis, gelber Abfallbehälter. Sauna: Holz, Orange, Dampf. Shake-Bar: Zitronengelb, Orange, Türkis. |

**Stil-Block für Szenen und Objekte** (steckt schon in jedem Prompt):

```
Pixel art look, three-quarter top-down view like a classic 16-bit adventure game, chunky visible pixels, dark outlines, soft cel shading, warm friendly colours (teal, off-white, warm wood brown, signal orange, soft grey, a little yellow), clean readable shapes. No text, no letters, no numbers, no logos, no watermark, no photorealism, no blur. Friendly, school-appropriate mood.
```

**Zusatz für Sprites und Icons** (steckt ebenfalls schon drin):

```
Flat pure magenta background (#FF00FF) without gradient, texture or shadow. Nothing cropped. No ground shadow under the figure.
```

**Positionsangaben in den Szenen:** „x 50, y 30“ heißt 50 Prozent der Bildbreite von links und 30 Prozent der Bildhöhe von oben. Sie passen zu den Hotspots im Spiel (Spind, Poster, Hantelständer, Tafel …). Weichen die Objekte ab, passt du die Hotspots später im Editiermodus (`?edit=1`) an. Der Boden in der Mitte muss frei bleiben, dort läuft die Figur.

## 3. Übersicht aller Dateien

| Nr | Bild | Datei | Ordner | Werkzeug |
|---|---|---|---|---|
| 1 | Szene Trainingsfläche (zuerst erzeugen, legt den Stil fest) | szene_trainingsflaeche.webp | assets/szenen/ | Szene umwandeln |
| 2 | Szene Empfang | szene_empfang.webp | assets/szenen/ | Szene umwandeln |
| 3 | Szene Labor | szene_labor.webp | assets/szenen/ | Szene umwandeln |
| 4 | Szene Sauna | szene_sauna.webp | assets/szenen/ | Szene umwandeln |
| 5 | Szene Shake-Bar | szene_shakebar.webp | assets/szenen/ | Szene umwandeln |
| 6 | Titelbild (Studio-Fassade) | titel.webp | assets/szenen/ | Szene umwandeln |
| 7 | Spielfigur: Referenzblatt | figur_v1_ref.png (nur Referenz, nicht ins Spiel) | assets/figuren/ | nicht nötig (nur Vorlage für die nächsten Prompts) |
| 8 | Spielfigur: Lauf-Streifen down | figur_v1_walk_down.png | assets/figuren/ | Lauf-Streifen (Richtung down, Variante 1) |
| 9 | Spielfigur: Lauf-Streifen up | figur_v1_walk_up.png | assets/figuren/ | Lauf-Streifen (Richtung up, Variante 1) |
| 10 | Spielfigur: Lauf-Streifen left | figur_v1_walk_left.png | assets/figuren/ | Lauf-Streifen (Richtung left, Variante 1) |
| 11 | Spielfigur: Lauf-Streifen right | figur_v1_walk_right.png | assets/figuren/ | Lauf-Streifen (Richtung right, Variante 1) |
| 12 | Markus (Trainer): Sprite (Stehbild) | npc_trainer.png | assets/figuren/ | Einzel-Sprite (Art NPC, Name trainer) |
| 13 | Markus (Trainer): Porträt-Sheet (4 Ausdrücke) | trainer_0.png … trainer_3.png | assets/portraits/ | Sheet teilen (Spalten 4, Zeilen 1, quadratisch, 256 px, Name trainer) |
| 14 | Alex (Trainingspartner): Sprite (Stehbild) | npc_alex.png | assets/figuren/ | Einzel-Sprite (Art NPC, Name alex) |
| 15 | Alex (Trainingspartner): Porträt-Sheet (4 Ausdrücke) | alex_0.png … alex_3.png | assets/portraits/ | Sheet teilen (Spalten 4, Zeilen 1, quadratisch, 256 px, Name alex) |
| 16 | Hitze-Hannes (Sauna, Verdächtiger „Hitze“): Sprite (Stehbild) | npc_hannes.png | assets/figuren/ | Einzel-Sprite (Art NPC, Name hannes) |
| 17 | Hitze-Hannes (Sauna, Verdächtiger „Hitze“): Porträt-Sheet (3 Ausdrücke) | hannes_0.png … hannes_2.png | assets/portraits/ | Sheet teilen (Spalten 3, Zeilen 1, quadratisch, 256 px, Name hannes) |
| 18 | Zitrus-Zoe (Shake-Bar, Verdächtige „Säure“): Sprite (Stehbild) | npc_zoe.png | assets/figuren/ | Einzel-Sprite (Art NPC, Name zoe) |
| 19 | Zitrus-Zoe (Shake-Bar, Verdächtige „Säure“): Porträt-Sheet (3 Ausdrücke) | zoe_0.png … zoe_2.png | assets/portraits/ | Sheet teilen (Spalten 3, Zeilen 1, quadratisch, 256 px, Name zoe) |
| 20 | Desi (Empfang, Verdächtige „Alkohol“): Sprite (Stehbild) | npc_desi.png | assets/figuren/ | Einzel-Sprite (Art NPC, Name desi) |
| 21 | Desi (Empfang, Verdächtige „Alkohol“): Porträt-Sheet (3 Ausdrücke) | desi_0.png … desi_2.png | assets/portraits/ | Sheet teilen (Spalten 3, Zeilen 1, quadratisch, 256 px, Name desi) |
| 22 | Kupfer-Kurt (Labor, Verdächtiger „Schwermetallsalz“): Sprite (Stehbild) | npc_kurt.png | assets/figuren/ | Einzel-Sprite (Art NPC, Name kurt) |
| 23 | Kupfer-Kurt (Labor, Verdächtiger „Schwermetallsalz“): Porträt-Sheet (3 Ausdrücke) | kurt_0.png … kurt_2.png | assets/portraits/ | Sheet teilen (Spalten 3, Zeilen 1, quadratisch, 256 px, Name kurt) |
| 24 | Pfanne in drei Zuständen | obj_pfanne.png (Streifen mit drei Bildern) | assets/figuren/ | Sheet teilen (Spalten 3, Magenta freistellen, Name obj_pfanne) ergibt obj_pfanne_0 bis _2 |
| 25 | Hantelscheibe (Vorder- und Seitenansicht) | obj_scheibe.png | assets/figuren/ | Sheet teilen (Spalten 2, Magenta freistellen, Name obj_scheibe) |
| 26 | Kleine Gegenstände (Thermometer, Dose, Shaker, Handtuch) | obj_sonstiges_0.png … obj_sonstiges_3.png | assets/figuren/ | Sheet teilen (Spalten 4, Magenta freistellen, Name obj_sonstiges) |
| 27 | Eiweißquellen-Icons | icons_quellen_0.png … icons_quellen_5.png | assets/figuren/ | Sheet teilen (Spalten 3, Zeilen 2, Magenta freistellen, Name icons_quellen) |
| 28 | Strukturprotein-Icons | icons_struktur_0.png … icons_struktur_2.png | assets/figuren/ | Sheet teilen (Spalten 3, Magenta freistellen, Name icons_struktur) |
| 29 | Zertifikat-Rahmen (Mitgliedskarte) | zertifikat_rahmen.webp | assets/szenen/ | Szene umwandeln (Breite 1536, Höhe 1024) |
| 30 | App-Icon | icon.png (512 × 512) | assets/icons/ | Szene umwandeln (Breite 512, Höhe 512) oder von Hand skalieren |
| 31 | Haftnotiz (gelbes Papier) | fund_haftnotiz.png | assets/funde/ | Mit Pillow zu WebP umwandeln (Breite 1024, Höhe 683), Zieldatei fund_haftnotiz.webp |
| 32 | Karteikarte (Linien, rote Kopflinie) | fund_karteikarte.png | assets/funde/ | Mit Pillow zu WebP umwandeln (Breite 1024, Höhe 683), Zieldatei fund_karteikarte.webp |
| 33 | Zeitungspapier | fund_zeitung.png | assets/funde/ | Mit Pillow zu WebP umwandeln (Breite 1024, Höhe 683), Zieldatei fund_zeitung.webp |
| 34 | Karo-Heftseite | fund_heft.png | assets/funde/ | Mit Pillow zu WebP umwandeln (Breite 1024, Höhe 683), Zieldatei fund_heft.webp |
| 35 | Formularpapier | fund_formular.png | assets/funde/ | Mit Pillow zu WebP umwandeln (Breite 1024, Höhe 683), Zieldatei fund_formular.webp |
| 36 | Emailleschild (Metall) | fund_metallschild.png | assets/funde/ | Mit Pillow zu WebP umwandeln (Breite 1024, Höhe 683), Zieldatei fund_metallschild.webp |
| 37 | Korkwand (Pinnwand) | pinnwand_kork.png | assets/funde/ | Mit Pillow zu WebP umwandeln (Breite 1024, Höhe 683), Zieldatei pinnwand_kork.webp |
| 38 | Labor-Ausweis (Karte) | obj_ausweis.png | assets/figuren/ | Einzel-Sprite (Art Objekt, Name obj_ausweis), Magenta freistellen |
| 39 | Kartenlesegerät (Lämpchen rot und grün) | obj_leser_0.png … obj_leser_1.png | assets/figuren/ | Sheet teilen (Spalten 2, Magenta freistellen, Name obj_leser) |
| 40 | Zahlenschloss-Tastenfeld | obj_tastenfeld.png | assets/figuren/ | Einzel-Sprite (Art Objekt, Name obj_tastenfeld), Magenta freistellen |
| 41 | Zettel mit Gekritzel | obj_zettel.png | assets/figuren/ | Einzel-Sprite (Art Objekt, Name obj_zettel), Magenta freistellen |
| 42 | Taschensymbol (Inventar) | icon_tasche.png | assets/icons/ | Einzel-Sprite (Art Icon, Name icon_tasche), Magenta freistellen |
| 43 | Schließfach (zu und offen) | obj_fach_0.png … obj_fach_1.png | assets/figuren/ | Sheet teilen (Spalten 2, Magenta freistellen, Name obj_fach) |
| 44 | Aufkleber (vier Stück) | obj_aufkleber_0.png … obj_aufkleber_3.png | assets/figuren/ | Sheet teilen (Spalten 4, Magenta freistellen, Name obj_aufkleber) |

## 4. Szenen

Szenenbilder im Format 3:2, ohne Personen. Nach dem Erzeugen im Grafik-Werkzeug (Reiter „Szene umwandeln“) auf 1536 × 1024 bringen und als WebP speichern. Die NPCs und die Spielfigur werden später als eigene Sprites eingesetzt.

### Nr 1: Szene Trainingsfläche (zuerst erzeugen, legt den Stil fest)

- **Dateiname:** `szene_trainingsflaeche.webp`
- **Zielordner:** `assets/szenen/`
- **Verarbeiten mit:** Szene umwandeln
- **Referenzbild anhängen:** keins
- **Stil:** Helle, moderne Trainingsfläche in Pixel-Art-Optik, Draufsicht leicht von schräg oben. Türkis, Off-White und warmes Holzbraun, graue Gummifliesen mit türkisem Streifen. Dunkle Konturen, weiche Schattierung. Diese Szene bestimmt den Stil aller anderen Räume.

**Prompt:**

```
Pixel art look, three-quarter top-down view like a classic 16-bit adventure game, chunky visible pixels, dark outlines, soft cel shading, warm friendly colours (teal, off-white, warm wood brown, signal orange, soft grey, a little yellow), clean readable shapes. No text, no letters, no numbers, no logos, no watermark, no photorealism, no blur. Friendly, school-appropriate mood. A bright modern gym training floor, seen from above at a slight angle. 3:2 landscape image. Keep the middle of the floor completely empty and free for walking (roughly 15 to 85 percent of the width and 35 to 92 percent of the height). Positions are given as percent of image width (x) and height (y), measured from the top left. No people, no text anywhere. Back wall (top 30 percent of the image): in the centre (x 50) a large dumbbell rack with a barbell and empty plate holders; at x 30 a wall mirror with a small blank information board beside it; at x 66 a blank wall board for a training plan (empty light panel, no writing); at x 82 an empty framed poster with blank paper. Left wall: a padded bench at x 4 to 15, y 41 to 66, and a water cooler above it at x 9, y 38. Right wall: a sturdy wooden workbench at x 81 to 96, y 37 to 66, with a large blank dark screen mounted above it. Floor: grey rubber tiles with a teal stripe. One door in the middle of the bottom edge (x 50). Do not draw weight plates lying around.
```

**Prüfliste:**

- [ ] Kein Text, keine Buchstaben, keine Zahlen, keine Pseudoschrift (Poster und Tafeln leer).
- [ ] Die Mitte des Bodens ist frei (hier läuft die Figur).
- [ ] Keine Personen im Bild.
- [ ] Dieses Bild gilt als Stil-Vorgabe: Erst wenn es passt, die übrigen Szenen erzeugen und dieses Bild als Referenz anhängen.

### Nr 2: Szene Empfang

- **Dateiname:** `szene_empfang.webp`
- **Zielordner:** `assets/szenen/`
- **Verarbeiten mit:** Szene umwandeln
- **Referenzbild anhängen:** szene_trainingsflaeche (Ergebnis der Szene Trainingsfläche)
- **Stil:** Freundlicher Eingangsbereich desselben Studios, Türkis und Holz, Spindwand, Empfangstresen, vier Türen am unteren Rand mit kleinen Symbolen (Hantel, Reagenzglas, Dampf, Shaker). Gleicher Pixel-Stil wie die Trainingsfläche.

**Prompt:**

```
Pixel art look, three-quarter top-down view like a classic 16-bit adventure game, chunky visible pixels, dark outlines, soft cel shading, warm friendly colours (teal, off-white, warm wood brown, signal orange, soft grey, a little yellow), clean readable shapes. No text, no letters, no numbers, no logos, no watermark, no photorealism, no blur. Friendly, school-appropriate mood. Use the attached image as exact style reference (same pixel size, outlines, shading and colours). Reception area of the same gym, seen from above at a slight angle. 3:2 landscape image. Keep the middle of the floor completely empty and free for walking (roughly 15 to 85 percent of the width and 35 to 92 percent of the height). Positions are given as percent of image width (x) and height (y), measured from the top left. No people, no text anywhere. Back wall (top 30 percent): a wall of tall lockers spanning x 25 to 75, about 8 lockers, one slightly open, the middle locker at x 51; an empty framed poster with blank paper at x 69; a large blank cork board on the right wall at x 95, y 59. Left side: a reception counter at x 4 to 25, y 32 to 51, with a blank computer monitor, a lamp and a tray. Top right: a small sofa at x 74 to 94, y 29 to 45. A hand-sanitiser dispenser on the left wall at x 8, y 75. Bottom wall: four different doors evenly spaced at x 20, 39, 59 and 78, each with a small round symbol plate above it without any writing: a dumbbell, a test tube, a puff of steam, a shaker cup. Floor: warm wood with a teal runner.
```

**Prüfliste:**

- [ ] Kein Text, keine Buchstaben, keine Zahlen, keine Pseudoschrift (Poster und Tafeln leer).
- [ ] Die Mitte des Bodens ist frei (hier läuft die Figur).
- [ ] Keine Personen im Bild.
- [ ] Gleicher Stil und gleiche Perspektive wie die Referenzszene (Trainingsfläche).
- [ ] Wichtige Objekte stehen ungefähr dort, wo die Prozentangaben im Prompt sie verlangen (sonst im Editiermodus die Hotspots anpassen).
- [ ] Vier Türen am unteren Rand, jede mit eigenem Symbol, keine Schrift.

### Nr 3: Szene Labor

- **Dateiname:** `szene_labor.webp`
- **Zielordner:** `assets/szenen/`
- **Verarbeiten mit:** Szene umwandeln
- **Referenzbild anhängen:** szene_trainingsflaeche
- **Stil:** Kleines Schul-Chemielabor, sauber und hell: Weiß, Hellgrau und Türkis mit gelbem Abfallbehälter als Farbtupfer. Gleicher Pixel-Stil, aber kühler als die Trainingsfläche. Keine Chemikalien-Etiketten.

**Prompt:**

```
Pixel art look, three-quarter top-down view like a classic 16-bit adventure game, chunky visible pixels, dark outlines, soft cel shading, warm friendly colours (teal, off-white, warm wood brown, signal orange, soft grey, a little yellow), clean readable shapes. No text, no letters, no numbers, no logos, no watermark, no photorealism, no blur. Friendly, school-appropriate mood. Use the attached image as exact style reference (same pixel size, outlines, shading and colours). A small school chemistry lab room, bright and clean (white, light grey, teal), seen from above at a slight angle. 3:2 landscape image. Keep the middle of the floor completely empty and free for walking (roughly 15 to 85 percent of the width and 35 to 92 percent of the height). Positions are given as percent of image width (x) and height (y), measured from the top left. No people, no text anywhere. Back wall (top 30 percent): a large clean blank whiteboard at x 50, y 29; a framed blank wall chart (empty panel, no writing) at x 33; a fridge with a half-open door and egg cartons inside at x 66, a sink at x 18. Left side: a long lab table at x 4 to 21, y 32 to 83, carrying a hotplate and an empty water-bath pot (no test tubes), the hotplate at about x 21, y 59. Right side: a second long lab table at x 79 to 96, y 32 to 83, with an empty space for a test-tube rack (no tubes), the rack spot at about x 78, y 59. A yellow lidded waste bin near the right table. Hooks with safety goggles and white lab coats beside the door in the bottom wall (door at x 50). No test tubes, no bottles with labels.
```

**Prüfliste:**

- [ ] Kein Text, keine Buchstaben, keine Zahlen, keine Pseudoschrift (Poster und Tafeln leer).
- [ ] Die Mitte des Bodens ist frei (hier läuft die Figur).
- [ ] Keine Personen im Bild.
- [ ] Gleicher Stil und gleiche Perspektive wie die Referenzszene (Trainingsfläche).
- [ ] Wichtige Objekte stehen ungefähr dort, wo die Prozentangaben im Prompt sie verlangen (sonst im Editiermodus die Hotspots anpassen).
- [ ] Keine Reagenzgläser im Bild (die zeichnet das Spiel), keine beschrifteten Flaschen.

### Nr 4: Szene Sauna

- **Dateiname:** `szene_sauna.webp`
- **Zielordner:** `assets/szenen/`
- **Verarbeiten mit:** Szene umwandeln
- **Referenzbild anhängen:** szene_trainingsflaeche
- **Stil:** Warme Holzsauna mit kleiner Küchenzeile, Orange- und Honigtöne, sanfter Dampf, gedämpftes warmes Licht. Gleicher Pixel-Stil, aber wärmste Szene des Spiels.

**Prompt:**

```
Pixel art look, three-quarter top-down view like a classic 16-bit adventure game, chunky visible pixels, dark outlines, soft cel shading, warm friendly colours (teal, off-white, warm wood brown, signal orange, soft grey, a little yellow), clean readable shapes. No text, no letters, no numbers, no logos, no watermark, no photorealism, no blur. Friendly, school-appropriate mood. Use the attached image as exact style reference (same pixel size, outlines, shading and colours). A wooden sauna room with a small kitchenette corner, warm orange light and soft steam, seen from above at a slight angle. 3:2 landscape image. Keep the middle of the floor completely empty and free for walking (roughly 15 to 85 percent of the width and 35 to 92 percent of the height). Positions are given as percent of image width (x) and height (y), measured from the top left. No people, no text anywhere. Two tiers of wooden benches along the back wall and the left wall. A stone-filled sauna oven in the left corner at x 4 to 23, y 32 to 58 with soft steam rising, a bucket and ladle next to it. Back wall: an empty round thermometer plate at x 50, y 30 (no numbers, no marks). Right side: a small counter at x 79 to 96, y 37 to 60 with a single-plate hotplate, EMPTY (no pan on it), the hotplate at about x 87, y 62. A single door in the bottom wall (x 50).
```

**Prüfliste:**

- [ ] Kein Text, keine Buchstaben, keine Zahlen, keine Pseudoschrift (Poster und Tafeln leer).
- [ ] Die Mitte des Bodens ist frei (hier läuft die Figur).
- [ ] Keine Personen im Bild.
- [ ] Gleicher Stil und gleiche Perspektive wie die Referenzszene (Trainingsfläche).
- [ ] Wichtige Objekte stehen ungefähr dort, wo die Prozentangaben im Prompt sie verlangen (sonst im Editiermodus die Hotspots anpassen).
- [ ] Die Herdplatte ist leer (die Pfanne kommt als eigenes Objekt dazu).

### Nr 5: Szene Shake-Bar

- **Dateiname:** `szene_shakebar.webp`
- **Zielordner:** `assets/szenen/`
- **Verarbeiten mit:** Szene umwandeln
- **Referenzbild anhängen:** szene_trainingsflaeche
- **Stil:** Helle Smoothie- und Shake-Bar, Zitronengelb und Orange mit Türkis, frisch und freundlich. Gleicher Pixel-Stil. Alle Etiketten und Tafeln bleiben leer.

**Prompt:**

```
Pixel art look, three-quarter top-down view like a classic 16-bit adventure game, chunky visible pixels, dark outlines, soft cel shading, warm friendly colours (teal, off-white, warm wood brown, signal orange, soft grey, a little yellow), clean readable shapes. No text, no letters, no numbers, no logos, no watermark, no photorealism, no blur. Friendly, school-appropriate mood. Use the attached image as exact style reference (same pixel size, outlines, shading and colours). A gym smoothie and protein shake bar, fresh and bright (lemon yellow, orange, teal), seen from above at a slight angle. 3:2 landscape image. Keep the middle of the floor completely empty and free for walking (roughly 15 to 85 percent of the width and 35 to 92 percent of the height). Positions are given as percent of image width (x) and height (y), measured from the top left. No people, no text anywhere. A bar counter along the whole back wall (top 33 percent): a blender at x 50, y 34; shelves with plain unlabeled tubs at x 26, y 34; a bowl of citrus fruit on the counter at x 67; a glass display fridge with plain unlabeled bottles at x 81, y 34. Three bar stools in front of the counter. Left wall: a blank framed advertising board (empty panel, no writing) at x 4 to 13, y 39 to 68. One door in the bottom wall (x 50). All bottles, tubs and boards completely blank.
```

**Prüfliste:**

- [ ] Kein Text, keine Buchstaben, keine Zahlen, keine Pseudoschrift (Poster und Tafeln leer).
- [ ] Die Mitte des Bodens ist frei (hier läuft die Figur).
- [ ] Keine Personen im Bild.
- [ ] Gleicher Stil und gleiche Perspektive wie die Referenzszene (Trainingsfläche).
- [ ] Wichtige Objekte stehen ungefähr dort, wo die Prozentangaben im Prompt sie verlangen (sonst im Editiermodus die Hotspots anpassen).
- [ ] Alle Dosen und Flaschen ohne Etikett.

### Nr 6: Titelbild (Studio-Fassade)

- **Dateiname:** `titel.webp`
- **Zielordner:** `assets/szenen/`
- **Verarbeiten mit:** Szene umwandeln
- **Referenzbild anhängen:** szene_trainingsflaeche
- **Stil:** Außenansicht des Fitnessstudios am Abend, warmes Licht, große Glastür, leeres Schild. Gleicher Pixel-Stil. (Wird noch nicht im Spiel verwendet, ist für den Startbildschirm vorgesehen.)

**Prompt:**

```
Pixel art look, three-quarter top-down view like a classic 16-bit adventure game, chunky visible pixels, dark outlines, soft cel shading, warm friendly colours (teal, off-white, warm wood brown, signal orange, soft grey, a little yellow), clean readable shapes. No text, no letters, no numbers, no logos, no watermark, no photorealism, no blur. Friendly, school-appropriate mood. Use the attached image as style reference. The front of a friendly modern gym building seen from the street at dusk, 3:2 landscape image, a big glass door in the centre, an empty blank sign above the door (no writing), a small dumbbell symbol on the door, warm light from inside, a few potted plants. No people, no text, no letters.
```

**Prüfliste:**

- [ ] Kein Text, keine Buchstaben, keine Zahlen, keine Pseudoschrift (Poster und Tafeln leer).
- [ ] Schild über der Tür ist leer.

## 5. Spielfigur

Es gibt nur eine Spielfigur, keine Auswahl. Erst das Referenzblatt, dann die vier Lauf-Streifen. Das Referenzblatt ist nur Vorlage und wird nicht ins Spiel gelegt.

### Nr 7: Spielfigur: Referenzblatt

- **Dateiname:** `figur_v1_ref.png (nur Referenz, nicht ins Spiel)`
- **Zielordner:** `assets/figuren/`
- **Verarbeiten mit:** nicht nötig (nur Vorlage für die nächsten Prompts)
- **Referenzbild anhängen:** keins
- **Stil:** Freundliche, geschlechtsneutrale Jugendliche im Chibi-Stil (ca. 3 Köpfe hoch), rotes Shirt, dunkle Shorts, helle Sneaker. Es gibt nur diese eine Spielfigur (keine Auswahl). Dieses Blatt legt Figur, Proportionen und Farben für alle Lauf-Streifen und alle NPCs fest.

**Prompt:**

```
Pixel art look, three-quarter top-down view like a classic 16-bit adventure game, chunky visible pixels, dark outlines, soft cel shading, warm friendly colours (teal, off-white, warm wood brown, signal orange, soft grey, a little yellow), clean readable shapes. No text, no letters, no numbers, no logos, no watermark, no photorealism, no blur. Friendly, school-appropriate mood. Character reference sheet. A character: a friendly teenage gym-goer, gender-neutral, medium skin tone, short hair, a plain bright red t-shirt, dark sport shorts, white sneakers, a sweat band on one wrist, chibi-like proportions about 3 heads tall. Show four poses next to each other with clear empty space between them, same size and same proportions in every pose: standing facing down (towards the viewer), standing facing up (seen from behind), standing facing left, standing facing right. No text. Flat pure magenta background (#FF00FF) without gradient, texture or shadow. Nothing cropped. No ground shadow under the figure.
```

**Prüfliste:**

- [ ] Hintergrund ist einfarbiges Magenta, ohne Verlauf und ohne Schatten.
- [ ] Figur vollständig sichtbar, nicht abgeschnitten.
- [ ] Gleiche Figur, gleiche Farben, gleiche Proportionen wie im Referenzbild.
- [ ] Kein Text im Bild.

### Nr 8: Spielfigur: Lauf-Streifen down

- **Dateiname:** `figur_v1_walk_down.png`
- **Zielordner:** `assets/figuren/`
- **Verarbeiten mit:** Lauf-Streifen (Richtung down, Variante 1)
- **Referenzbild anhängen:** figur_v1_ref.png (Referenzblatt der Spielfigur)
- **Stil:** Vier Lauf-Bilder der Figur in einer Reihe, gleiche Größe, gleiche Fußlinie, Standbild-Schritt-Standbild-Schritt. Gleicher Pixel-Stil wie das Referenzblatt, Kleidung und Farben unverändert.

**Prompt:**

```
Pixel art look, three-quarter top-down view like a classic 16-bit adventure game, chunky visible pixels, dark outlines, soft cel shading, warm friendly colours (teal, off-white, warm wood brown, signal orange, soft grey, a little yellow), clean readable shapes. No text, no letters, no numbers, no logos, no watermark, no photorealism, no blur. Friendly, school-appropriate mood. Use the attached character exactly (same face, hair, colours, outfit and proportions). Create ONE horizontal strip with exactly 4 walking animation frames. The character faces down towards the viewer (front view). All four frames have the same size and are clearly separated by empty space, equally spaced, with the feet of all four frames on the same baseline. Frame 1 and frame 3 are a standing pose with legs together, frame 2 and frame 4 are a stride pose with opposite legs forward and arms swinging a little. Same pixel art look as the reference. No text. Flat pure magenta background (#FF00FF) without gradient, texture or shadow. Nothing cropped. No ground shadow under the figure.
```

**Prüfliste:**

- [ ] Hintergrund ist einfarbiges Magenta, ohne Verlauf und ohne Schatten.
- [ ] Figur vollständig sichtbar, nicht abgeschnitten.
- [ ] Gleiche Figur, gleiche Farben, gleiche Proportionen wie im Referenzbild.
- [ ] Kein Text im Bild.
- [ ] Genau vier Bilder, deutlicher Abstand dazwischen (die Figuren dürfen sich nicht berühren).

### Nr 9: Spielfigur: Lauf-Streifen up

- **Dateiname:** `figur_v1_walk_up.png`
- **Zielordner:** `assets/figuren/`
- **Verarbeiten mit:** Lauf-Streifen (Richtung up, Variante 1)
- **Referenzbild anhängen:** figur_v1_ref.png (Referenzblatt der Spielfigur)
- **Stil:** Vier Lauf-Bilder der Figur in einer Reihe, gleiche Größe, gleiche Fußlinie, Standbild-Schritt-Standbild-Schritt. Gleicher Pixel-Stil wie das Referenzblatt, Kleidung und Farben unverändert.

**Prompt:**

```
Pixel art look, three-quarter top-down view like a classic 16-bit adventure game, chunky visible pixels, dark outlines, soft cel shading, warm friendly colours (teal, off-white, warm wood brown, signal orange, soft grey, a little yellow), clean readable shapes. No text, no letters, no numbers, no logos, no watermark, no photorealism, no blur. Friendly, school-appropriate mood. Use the attached character exactly (same face, hair, colours, outfit and proportions). Create ONE horizontal strip with exactly 4 walking animation frames. The character faces away from the viewer (back view). All four frames have the same size and are clearly separated by empty space, equally spaced, with the feet of all four frames on the same baseline. Frame 1 and frame 3 are a standing pose with legs together, frame 2 and frame 4 are a stride pose with opposite legs forward and arms swinging a little. Same pixel art look as the reference. No text. Flat pure magenta background (#FF00FF) without gradient, texture or shadow. Nothing cropped. No ground shadow under the figure.
```

**Prüfliste:**

- [ ] Hintergrund ist einfarbiges Magenta, ohne Verlauf und ohne Schatten.
- [ ] Figur vollständig sichtbar, nicht abgeschnitten.
- [ ] Gleiche Figur, gleiche Farben, gleiche Proportionen wie im Referenzbild.
- [ ] Kein Text im Bild.
- [ ] Genau vier Bilder, deutlicher Abstand dazwischen (die Figuren dürfen sich nicht berühren).

### Nr 10: Spielfigur: Lauf-Streifen left

- **Dateiname:** `figur_v1_walk_left.png`
- **Zielordner:** `assets/figuren/`
- **Verarbeiten mit:** Lauf-Streifen (Richtung left, Variante 1)
- **Referenzbild anhängen:** figur_v1_ref.png (Referenzblatt der Spielfigur)
- **Stil:** Vier Lauf-Bilder der Figur in einer Reihe, gleiche Größe, gleiche Fußlinie, Standbild-Schritt-Standbild-Schritt. Gleicher Pixel-Stil wie das Referenzblatt, Kleidung und Farben unverändert.

**Prompt:**

```
Pixel art look, three-quarter top-down view like a classic 16-bit adventure game, chunky visible pixels, dark outlines, soft cel shading, warm friendly colours (teal, off-white, warm wood brown, signal orange, soft grey, a little yellow), clean readable shapes. No text, no letters, no numbers, no logos, no watermark, no photorealism, no blur. Friendly, school-appropriate mood. Use the attached character exactly (same face, hair, colours, outfit and proportions). Create ONE horizontal strip with exactly 4 walking animation frames. The character is seen from the side, facing left. All four frames have the same size and are clearly separated by empty space, equally spaced, with the feet of all four frames on the same baseline. Frame 1 and frame 3 are a standing pose with legs together, frame 2 and frame 4 are a stride pose with opposite legs forward and arms swinging a little. Same pixel art look as the reference. No text. Flat pure magenta background (#FF00FF) without gradient, texture or shadow. Nothing cropped. No ground shadow under the figure.
```

**Prüfliste:**

- [ ] Hintergrund ist einfarbiges Magenta, ohne Verlauf und ohne Schatten.
- [ ] Figur vollständig sichtbar, nicht abgeschnitten.
- [ ] Gleiche Figur, gleiche Farben, gleiche Proportionen wie im Referenzbild.
- [ ] Kein Text im Bild.
- [ ] Genau vier Bilder, deutlicher Abstand dazwischen (die Figuren dürfen sich nicht berühren).

### Nr 11: Spielfigur: Lauf-Streifen right

- **Dateiname:** `figur_v1_walk_right.png`
- **Zielordner:** `assets/figuren/`
- **Verarbeiten mit:** Lauf-Streifen (Richtung right, Variante 1)
- **Referenzbild anhängen:** figur_v1_ref.png (Referenzblatt der Spielfigur)
- **Stil:** Vier Lauf-Bilder der Figur in einer Reihe, gleiche Größe, gleiche Fußlinie, Standbild-Schritt-Standbild-Schritt. Gleicher Pixel-Stil wie das Referenzblatt, Kleidung und Farben unverändert.

**Prompt:**

```
Pixel art look, three-quarter top-down view like a classic 16-bit adventure game, chunky visible pixels, dark outlines, soft cel shading, warm friendly colours (teal, off-white, warm wood brown, signal orange, soft grey, a little yellow), clean readable shapes. No text, no letters, no numbers, no logos, no watermark, no photorealism, no blur. Friendly, school-appropriate mood. Use the attached character exactly (same face, hair, colours, outfit and proportions). Create ONE horizontal strip with exactly 4 walking animation frames. The character is seen from the side, facing right. All four frames have the same size and are clearly separated by empty space, equally spaced, with the feet of all four frames on the same baseline. Frame 1 and frame 3 are a standing pose with legs together, frame 2 and frame 4 are a stride pose with opposite legs forward and arms swinging a little. Same pixel art look as the reference. No text. Flat pure magenta background (#FF00FF) without gradient, texture or shadow. Nothing cropped. No ground shadow under the figure.
```

**Prüfliste:**

- [ ] Hintergrund ist einfarbiges Magenta, ohne Verlauf und ohne Schatten.
- [ ] Figur vollständig sichtbar, nicht abgeschnitten.
- [ ] Gleiche Figur, gleiche Farben, gleiche Proportionen wie im Referenzbild.
- [ ] Kein Text im Bild.
- [ ] Genau vier Bilder, deutlicher Abstand dazwischen (die Figuren dürfen sich nicht berühren).

## 6. NPCs

Zu jeder Figur zwei Prompts: erst der Sprite (Stehbild), dann das Porträt-Sheet mit dem Sprite als Referenz. Die Verdächtigen sind sympathisch gezeichnet und gehören je zu einem der vier Auslöser der Denaturierung (Hitze, Säure, Alkohol, Schwermetallsalz). Die Namen sind Vorschläge.

### Nr 12: Markus (Trainer): Sprite (Stehbild)

- **Dateiname:** `npc_trainer.png`
- **Zielordner:** `assets/figuren/`
- **Verarbeiten mit:** Einzel-Sprite (Art NPC, Name trainer)
- **Referenzbild anhängen:** figur_v1_ref.png (damit Proportionen und Stil passen)
- **Stil:** Sportlicher Trainer Markus, Anfang dreißig, türkisfarbener Trainingsanzug mit Trillerpfeife, freundlich. Führt durch das Spiel. Gleicher Chibi-Stil (ca. 3 Köpfe hoch) und gleiche Pixel-Optik wie die Spielfigur.

**Prompt:**

```
Pixel art look, three-quarter top-down view like a classic 16-bit adventure game, chunky visible pixels, dark outlines, soft cel shading, warm friendly colours (teal, off-white, warm wood brown, signal orange, soft grey, a little yellow), clean readable shapes. No text, no letters, no numbers, no logos, no watermark, no photorealism, no blur. Friendly, school-appropriate mood. Use the attached character sheet only as reference for the pixel art style, proportions (chibi-like, about 3 heads tall) and line work. Create a different character: a single full-body sprite of a friendly male coach in his thirties, athletic, wearing a teal tracksuit with a whistle around the neck, relaxed standing pose with arms down, kind smile. Standing facing the viewer. Flat pure magenta background (#FF00FF) without gradient, texture or shadow. Nothing cropped. No ground shadow under the figure. No text.
```

**Prüfliste:**

- [ ] Hintergrund ist einfarbiges Magenta, ohne Verlauf und ohne Schatten.
- [ ] Figur vollständig sichtbar, nicht abgeschnitten.
- [ ] Gleicher Stil und gleiche Proportionen wie die Spielfigur, aber erkennbar eine andere Person.
- [ ] Keine Beschriftung auf Kleidung, Flaschen oder Gegenständen.

### Nr 13: Markus (Trainer): Porträt-Sheet (4 Ausdrücke)

- **Dateiname:** `trainer_0.png … trainer_3.png`
- **Zielordner:** `assets/portraits/`
- **Verarbeiten mit:** Sheet teilen (Spalten 4, Zeilen 1, quadratisch, 256 px, Name trainer)
- **Referenzbild anhängen:** npc_trainer.png (der Sprite dieser Figur)
- **Stil:** Porträts im selben Pixel-Stil wie der Sprite, nur größer und detaillierter: Kopf und Schultern, gleiches Gesicht in jedem Porträt. Ausdrücke von links nach rechts: 0 = neutral and friendly, 1 = grinning, 2 = thoughtful with a hand on the chin, 3 = excited with raised eyebrows. Dunkelblaugrüner Hintergrund.

**Prompt:**

```
Pixel art look, frontal view in the style of a classic 16-bit adventure game dialogue portrait, chunky visible pixels, dark outlines, soft cel shading, warm friendly colours (teal, off-white, warm wood brown, signal orange, soft grey, a little yellow), clean readable shapes. No text, no letters, no numbers, no logos, no watermark, no photorealism, no blur. Friendly, school-appropriate mood. Use the attached character exactly (same face, hair, clothes and colours). Create a portrait sheet: 4 head-and-shoulders portraits in one row, same face in every portrait, same size, equal spacing, nothing cropped. Expressions from left to right: (1) neutral and friendly, (2) grinning, (3) thoughtful with a hand on the chin, (4) excited with raised eyebrows. Pixel art look as in the reference, square portraits. Flat dark teal background (#0F3B40) behind every portrait. No text.
```

**Prüfliste:**

- [ ] Genau 4 Porträts, gleich groß, gleicher Abstand.
- [ ] Dasselbe Gesicht und dieselbe Kleidung in jedem Porträt.
- [ ] Kein Text im Bild.
- [ ] Im Spiel: "portrait": "trainer_1" wählt den zweiten Ausdruck.

### Nr 14: Alex (Trainingspartner): Sprite (Stehbild)

- **Dateiname:** `npc_alex.png`
- **Zielordner:** `assets/figuren/`
- **Verarbeiten mit:** Einzel-Sprite (Art NPC, Name alex)
- **Referenzbild anhängen:** figur_v1_ref.png (damit Proportionen und Stil passen)
- **Stil:** Jugendlicher Trainingspartner in grauem Kapuzenpulli mit unbeschriftetem Shaker. Wirkt neugierig und etwas skeptisch (Bossfight in der Shake-Bar). Gleicher Chibi-Stil (ca. 3 Köpfe hoch) und gleiche Pixel-Optik wie die Spielfigur.

**Prompt:**

```
Pixel art look, three-quarter top-down view like a classic 16-bit adventure game, chunky visible pixels, dark outlines, soft cel shading, warm friendly colours (teal, off-white, warm wood brown, signal orange, soft grey, a little yellow), clean readable shapes. No text, no letters, no numbers, no logos, no watermark, no photorealism, no blur. Friendly, school-appropriate mood. Use the attached character sheet only as reference for the pixel art style, proportions (chibi-like, about 3 heads tall) and line work. Create a different character: a single full-body sprite of a teenage gym buddy, gender-neutral, wearing a grey hoodie and jeans, holding a protein shaker bottle without any label, relaxed standing pose. Standing facing the viewer. Flat pure magenta background (#FF00FF) without gradient, texture or shadow. Nothing cropped. No ground shadow under the figure. No text.
```

**Prüfliste:**

- [ ] Hintergrund ist einfarbiges Magenta, ohne Verlauf und ohne Schatten.
- [ ] Figur vollständig sichtbar, nicht abgeschnitten.
- [ ] Gleicher Stil und gleiche Proportionen wie die Spielfigur, aber erkennbar eine andere Person.
- [ ] Keine Beschriftung auf Kleidung, Flaschen oder Gegenständen.

### Nr 15: Alex (Trainingspartner): Porträt-Sheet (4 Ausdrücke)

- **Dateiname:** `alex_0.png … alex_3.png`
- **Zielordner:** `assets/portraits/`
- **Verarbeiten mit:** Sheet teilen (Spalten 4, Zeilen 1, quadratisch, 256 px, Name alex)
- **Referenzbild anhängen:** npc_alex.png (der Sprite dieser Figur)
- **Stil:** Porträts im selben Pixel-Stil wie der Sprite, nur größer und detaillierter: Kopf und Schultern, gleiches Gesicht in jedem Porträt. Ausdrücke von links nach rechts: 0 = curious, 1 = sceptical, 2 = convinced and smiling, 3 = disappointed. Dunkelblaugrüner Hintergrund.

**Prompt:**

```
Pixel art look, frontal view in the style of a classic 16-bit adventure game dialogue portrait, chunky visible pixels, dark outlines, soft cel shading, warm friendly colours (teal, off-white, warm wood brown, signal orange, soft grey, a little yellow), clean readable shapes. No text, no letters, no numbers, no logos, no watermark, no photorealism, no blur. Friendly, school-appropriate mood. Use the attached character exactly (same face, hair, clothes and colours). Create a portrait sheet: 4 head-and-shoulders portraits in one row, same face in every portrait, same size, equal spacing, nothing cropped. Expressions from left to right: (1) curious, (2) sceptical, (3) convinced and smiling, (4) disappointed. Pixel art look as in the reference, square portraits. Flat dark teal background (#0F3B40) behind every portrait. No text.
```

**Prüfliste:**

- [ ] Genau 4 Porträts, gleich groß, gleicher Abstand.
- [ ] Dasselbe Gesicht und dieselbe Kleidung in jedem Porträt.
- [ ] Kein Text im Bild.
- [ ] Im Spiel: "portrait": "alex_1" wählt den zweiten Ausdruck.

### Nr 16: Hitze-Hannes (Sauna, Verdächtiger „Hitze“): Sprite (Stehbild)

- **Dateiname:** `npc_hannes.png`
- **Zielordner:** `assets/figuren/`
- **Verarbeiten mit:** Einzel-Sprite (Art NPC, Name hannes)
- **Referenzbild anhängen:** figur_v1_ref.png (damit Proportionen und Stil passen)
- **Stil:** Gemütlicher, kräftiger Saunameister mit Handtuch und rotorangem Saunahut, leicht verschwitzt. Freundlich, keine Karikatur. Gleicher Chibi-Stil (ca. 3 Köpfe hoch) und gleiche Pixel-Optik wie die Spielfigur.

**Prompt:**

```
Pixel art look, three-quarter top-down view like a classic 16-bit adventure game, chunky visible pixels, dark outlines, soft cel shading, warm friendly colours (teal, off-white, warm wood brown, signal orange, soft grey, a little yellow), clean readable shapes. No text, no letters, no numbers, no logos, no watermark, no photorealism, no blur. Friendly, school-appropriate mood. Use the attached character sheet only as reference for the pixel art style, proportions (chibi-like, about 3 heads tall) and line work. Create a different character: a single full-body sprite of a stocky friendly sauna attendant, wearing a towel over one shoulder and a red-orange felt sauna hat, a little sweat on the forehead, standing relaxed. Standing facing the viewer. Flat pure magenta background (#FF00FF) without gradient, texture or shadow. Nothing cropped. No ground shadow under the figure. No text.
```

**Prüfliste:**

- [ ] Hintergrund ist einfarbiges Magenta, ohne Verlauf und ohne Schatten.
- [ ] Figur vollständig sichtbar, nicht abgeschnitten.
- [ ] Gleicher Stil und gleiche Proportionen wie die Spielfigur, aber erkennbar eine andere Person.
- [ ] Keine Beschriftung auf Kleidung, Flaschen oder Gegenständen.

### Nr 17: Hitze-Hannes (Sauna, Verdächtiger „Hitze“): Porträt-Sheet (3 Ausdrücke)

- **Dateiname:** `hannes_0.png … hannes_2.png`
- **Zielordner:** `assets/portraits/`
- **Verarbeiten mit:** Sheet teilen (Spalten 3, Zeilen 1, quadratisch, 256 px, Name hannes)
- **Referenzbild anhängen:** npc_hannes.png (der Sprite dieser Figur)
- **Stil:** Porträts im selben Pixel-Stil wie der Sprite, nur größer und detaillierter: Kopf und Schultern, gleiches Gesicht in jedem Porträt. Ausdrücke von links nach rechts: 0 = innocent, 1 = nervous, 2 = caught. Dunkelblaugrüner Hintergrund.

**Prompt:**

```
Pixel art look, frontal view in the style of a classic 16-bit adventure game dialogue portrait, chunky visible pixels, dark outlines, soft cel shading, warm friendly colours (teal, off-white, warm wood brown, signal orange, soft grey, a little yellow), clean readable shapes. No text, no letters, no numbers, no logos, no watermark, no photorealism, no blur. Friendly, school-appropriate mood. Use the attached character exactly (same face, hair, clothes and colours). Create a portrait sheet: 3 head-and-shoulders portraits in one row, same face in every portrait, same size, equal spacing, nothing cropped. Expressions from left to right: (1) innocent, (2) nervous, (3) caught. Pixel art look as in the reference, square portraits. Flat dark teal background (#0F3B40) behind every portrait. No text.
```

**Prüfliste:**

- [ ] Genau 3 Porträts, gleich groß, gleicher Abstand.
- [ ] Dasselbe Gesicht und dieselbe Kleidung in jedem Porträt.
- [ ] Kein Text im Bild.
- [ ] Im Spiel: "portrait": "hannes_1" wählt den zweiten Ausdruck.

### Nr 18: Zitrus-Zoe (Shake-Bar, Verdächtige „Säure“): Sprite (Stehbild)

- **Dateiname:** `npc_zoe.png`
- **Zielordner:** `assets/figuren/`
- **Verarbeiten mit:** Einzel-Sprite (Art NPC, Name zoe)
- **Referenzbild anhängen:** figur_v1_ref.png (damit Proportionen und Stil passen)
- **Stil:** Fröhliche Barkeeperin oder Barkeeper in gelber Schürze und zitronengelbem Stirnband, hält eine Zitrone. Freundlich, keine Karikatur. Gleicher Chibi-Stil (ca. 3 Köpfe hoch) und gleiche Pixel-Optik wie die Spielfigur.

**Prompt:**

```
Pixel art look, three-quarter top-down view like a classic 16-bit adventure game, chunky visible pixels, dark outlines, soft cel shading, warm friendly colours (teal, off-white, warm wood brown, signal orange, soft grey, a little yellow), clean readable shapes. No text, no letters, no numbers, no logos, no watermark, no photorealism, no blur. Friendly, school-appropriate mood. Use the attached character sheet only as reference for the pixel art style, proportions (chibi-like, about 3 heads tall) and line work. Create a different character: a single full-body sprite of a cheerful bartender wearing a yellow apron and a lemon-yellow headband, holding a lemon in one hand, standing relaxed. Standing facing the viewer. Flat pure magenta background (#FF00FF) without gradient, texture or shadow. Nothing cropped. No ground shadow under the figure. No text.
```

**Prüfliste:**

- [ ] Hintergrund ist einfarbiges Magenta, ohne Verlauf und ohne Schatten.
- [ ] Figur vollständig sichtbar, nicht abgeschnitten.
- [ ] Gleicher Stil und gleiche Proportionen wie die Spielfigur, aber erkennbar eine andere Person.
- [ ] Keine Beschriftung auf Kleidung, Flaschen oder Gegenständen.

### Nr 19: Zitrus-Zoe (Shake-Bar, Verdächtige „Säure“): Porträt-Sheet (3 Ausdrücke)

- **Dateiname:** `zoe_0.png … zoe_2.png`
- **Zielordner:** `assets/portraits/`
- **Verarbeiten mit:** Sheet teilen (Spalten 3, Zeilen 1, quadratisch, 256 px, Name zoe)
- **Referenzbild anhängen:** npc_zoe.png (der Sprite dieser Figur)
- **Stil:** Porträts im selben Pixel-Stil wie der Sprite, nur größer und detaillierter: Kopf und Schultern, gleiches Gesicht in jedem Porträt. Ausdrücke von links nach rechts: 0 = innocent, 1 = nervous, 2 = caught. Dunkelblaugrüner Hintergrund.

**Prompt:**

```
Pixel art look, frontal view in the style of a classic 16-bit adventure game dialogue portrait, chunky visible pixels, dark outlines, soft cel shading, warm friendly colours (teal, off-white, warm wood brown, signal orange, soft grey, a little yellow), clean readable shapes. No text, no letters, no numbers, no logos, no watermark, no photorealism, no blur. Friendly, school-appropriate mood. Use the attached character exactly (same face, hair, clothes and colours). Create a portrait sheet: 3 head-and-shoulders portraits in one row, same face in every portrait, same size, equal spacing, nothing cropped. Expressions from left to right: (1) innocent, (2) nervous, (3) caught. Pixel art look as in the reference, square portraits. Flat dark teal background (#0F3B40) behind every portrait. No text.
```

**Prüfliste:**

- [ ] Genau 3 Porträts, gleich groß, gleicher Abstand.
- [ ] Dasselbe Gesicht und dieselbe Kleidung in jedem Porträt.
- [ ] Kein Text im Bild.
- [ ] Im Spiel: "portrait": "zoe_1" wählt den zweiten Ausdruck.

### Nr 20: Desi (Empfang, Verdächtige „Alkohol“): Sprite (Stehbild)

- **Dateiname:** `npc_desi.png`
- **Zielordner:** `assets/figuren/`
- **Verarbeiten mit:** Einzel-Sprite (Art NPC, Name desi)
- **Referenzbild anhängen:** figur_v1_ref.png (damit Proportionen und Stil passen)
- **Stil:** Ordentliche Hygiene-Helferin oder -Helfer in hellblauer Kasack-Jacke mit leerer Sprühflasche (kein Etikett). Freundlich, keine Karikatur. Gleicher Chibi-Stil (ca. 3 Köpfe hoch) und gleiche Pixel-Optik wie die Spielfigur.

**Prompt:**

```
Pixel art look, three-quarter top-down view like a classic 16-bit adventure game, chunky visible pixels, dark outlines, soft cel shading, warm friendly colours (teal, off-white, warm wood brown, signal orange, soft grey, a little yellow), clean readable shapes. No text, no letters, no numbers, no logos, no watermark, no photorealism, no blur. Friendly, school-appropriate mood. Use the attached character sheet only as reference for the pixel art style, proportions (chibi-like, about 3 heads tall) and line work. Create a different character: a single full-body sprite of a tidy hygiene helper wearing a light blue tunic, holding a spray bottle with a completely blank bottle, standing relaxed. Standing facing the viewer. Flat pure magenta background (#FF00FF) without gradient, texture or shadow. Nothing cropped. No ground shadow under the figure. No text.
```

**Prüfliste:**

- [ ] Hintergrund ist einfarbiges Magenta, ohne Verlauf und ohne Schatten.
- [ ] Figur vollständig sichtbar, nicht abgeschnitten.
- [ ] Gleicher Stil und gleiche Proportionen wie die Spielfigur, aber erkennbar eine andere Person.
- [ ] Keine Beschriftung auf Kleidung, Flaschen oder Gegenständen.

### Nr 21: Desi (Empfang, Verdächtige „Alkohol“): Porträt-Sheet (3 Ausdrücke)

- **Dateiname:** `desi_0.png … desi_2.png`
- **Zielordner:** `assets/portraits/`
- **Verarbeiten mit:** Sheet teilen (Spalten 3, Zeilen 1, quadratisch, 256 px, Name desi)
- **Referenzbild anhängen:** npc_desi.png (der Sprite dieser Figur)
- **Stil:** Porträts im selben Pixel-Stil wie der Sprite, nur größer und detaillierter: Kopf und Schultern, gleiches Gesicht in jedem Porträt. Ausdrücke von links nach rechts: 0 = innocent, 1 = nervous, 2 = caught. Dunkelblaugrüner Hintergrund.

**Prompt:**

```
Pixel art look, frontal view in the style of a classic 16-bit adventure game dialogue portrait, chunky visible pixels, dark outlines, soft cel shading, warm friendly colours (teal, off-white, warm wood brown, signal orange, soft grey, a little yellow), clean readable shapes. No text, no letters, no numbers, no logos, no watermark, no photorealism, no blur. Friendly, school-appropriate mood. Use the attached character exactly (same face, hair, clothes and colours). Create a portrait sheet: 3 head-and-shoulders portraits in one row, same face in every portrait, same size, equal spacing, nothing cropped. Expressions from left to right: (1) innocent, (2) nervous, (3) caught. Pixel art look as in the reference, square portraits. Flat dark teal background (#0F3B40) behind every portrait. No text.
```

**Prüfliste:**

- [ ] Genau 3 Porträts, gleich groß, gleicher Abstand.
- [ ] Dasselbe Gesicht und dieselbe Kleidung in jedem Porträt.
- [ ] Kein Text im Bild.
- [ ] Im Spiel: "portrait": "desi_1" wählt den zweiten Ausdruck.

### Nr 22: Kupfer-Kurt (Labor, Verdächtiger „Schwermetallsalz“): Sprite (Stehbild)

- **Dateiname:** `npc_kurt.png`
- **Zielordner:** `assets/figuren/`
- **Verarbeiten mit:** Einzel-Sprite (Art NPC, Name kurt)
- **Referenzbild anhängen:** figur_v1_ref.png (damit Proportionen und Stil passen)
- **Stil:** Labortechniker im weißen Kittel, kupferfarbene Schutzbrille auf der Stirn, alter Kupferkessel an der Seite. Freundlich, keine Karikatur. Gleicher Chibi-Stil (ca. 3 Köpfe hoch) und gleiche Pixel-Optik wie die Spielfigur.

**Prompt:**

```
Pixel art look, three-quarter top-down view like a classic 16-bit adventure game, chunky visible pixels, dark outlines, soft cel shading, warm friendly colours (teal, off-white, warm wood brown, signal orange, soft grey, a little yellow), clean readable shapes. No text, no letters, no numbers, no logos, no watermark, no photorealism, no blur. Friendly, school-appropriate mood. Use the attached character sheet only as reference for the pixel art style, proportions (chibi-like, about 3 heads tall) and line work. Create a different character: a single full-body sprite of a laboratory technician wearing a white lab coat with copper-coloured safety goggles pushed up on the forehead, an old copper kettle standing at their side, standing relaxed. Standing facing the viewer. Flat pure magenta background (#FF00FF) without gradient, texture or shadow. Nothing cropped. No ground shadow under the figure. No text.
```

**Prüfliste:**

- [ ] Hintergrund ist einfarbiges Magenta, ohne Verlauf und ohne Schatten.
- [ ] Figur vollständig sichtbar, nicht abgeschnitten.
- [ ] Gleicher Stil und gleiche Proportionen wie die Spielfigur, aber erkennbar eine andere Person.
- [ ] Keine Beschriftung auf Kleidung, Flaschen oder Gegenständen.

### Nr 23: Kupfer-Kurt (Labor, Verdächtiger „Schwermetallsalz“): Porträt-Sheet (3 Ausdrücke)

- **Dateiname:** `kurt_0.png … kurt_2.png`
- **Zielordner:** `assets/portraits/`
- **Verarbeiten mit:** Sheet teilen (Spalten 3, Zeilen 1, quadratisch, 256 px, Name kurt)
- **Referenzbild anhängen:** npc_kurt.png (der Sprite dieser Figur)
- **Stil:** Porträts im selben Pixel-Stil wie der Sprite, nur größer und detaillierter: Kopf und Schultern, gleiches Gesicht in jedem Porträt. Ausdrücke von links nach rechts: 0 = innocent, 1 = nervous, 2 = caught. Dunkelblaugrüner Hintergrund.

**Prompt:**

```
Pixel art look, frontal view in the style of a classic 16-bit adventure game dialogue portrait, chunky visible pixels, dark outlines, soft cel shading, warm friendly colours (teal, off-white, warm wood brown, signal orange, soft grey, a little yellow), clean readable shapes. No text, no letters, no numbers, no logos, no watermark, no photorealism, no blur. Friendly, school-appropriate mood. Use the attached character exactly (same face, hair, clothes and colours). Create a portrait sheet: 3 head-and-shoulders portraits in one row, same face in every portrait, same size, equal spacing, nothing cropped. Expressions from left to right: (1) innocent, (2) nervous, (3) caught. Pixel art look as in the reference, square portraits. Flat dark teal background (#0F3B40) behind every portrait. No text.
```

**Prüfliste:**

- [ ] Genau 3 Porträts, gleich groß, gleicher Abstand.
- [ ] Dasselbe Gesicht und dieselbe Kleidung in jedem Porträt.
- [ ] Kein Text im Bild.
- [ ] Im Spiel: "portrait": "kurt_1" wählt den zweiten Ausdruck.

## 7. Objekte und Icons

Diese Bilder sind ergänzend. Pfanne, Scheibe und Sonstiges sind noch nicht im Spiel verdrahtet, das Zertifikat nutzt den Rahmen sofort.

### Nr 24: Pfanne in drei Zuständen

- **Dateiname:** `obj_pfanne.png (Streifen mit drei Bildern)`
- **Zielordner:** `assets/figuren/`
- **Verarbeiten mit:** Sheet teilen (Spalten 3, Magenta freistellen, Name obj_pfanne) ergibt obj_pfanne_0 bis _2
- **Referenzbild anhängen:** szene_sauna (für den Stil)
- **Stil:** Bratpfanne in Draufsicht (leicht schräg): leer, mit rohem Ei (glasig durchsichtiges Eiklar, gelbes Eigelb), mit gebratenem Ei (undurchsichtiges weißes Eiklar, goldenes Eigelb). Pixel-Optik wie die Szenen. Nicht im Spiel verdrahtet.

**Prompt:**

```
Pixel art look, three-quarter top-down view like a classic 16-bit adventure game, chunky visible pixels, dark outlines, soft cel shading, warm friendly colours (teal, off-white, warm wood brown, signal orange, soft grey, a little yellow), clean readable shapes. No text, no letters, no numbers, no logos, no watermark, no photorealism, no blur. Friendly, school-appropriate mood. Three frying pan states in one horizontal row, equal size and equal spacing, seen from above at a slight angle: (1) an empty black pan, (2) a pan with a raw egg: clear glossy transparent egg white and a yellow yolk, (3) a pan with a fried egg: opaque solid white egg white and a golden yolk. No text. Flat pure magenta background (#FF00FF) without gradient, texture or shadow. Nothing cropped. No ground shadow under the figure.
```

**Prüfliste:**

- [ ] Drei Pfannen, gleich groß, klarer Abstand.
- [ ] Rohes Ei sichtbar glasig, gebratenes Ei deutlich weiß und fest (der Unterschied ist die Lernaussage).

### Nr 25: Hantelscheibe (Vorder- und Seitenansicht)

- **Dateiname:** `obj_scheibe.png`
- **Zielordner:** `assets/figuren/`
- **Verarbeiten mit:** Sheet teilen (Spalten 2, Magenta freistellen, Name obj_scheibe)
- **Referenzbild anhängen:** keins
- **Stil:** Runde graue Hantelscheibe, links Vorderansicht (Loch in der Mitte), rechts Seitenansicht. Mittelgrau und ohne Aufschrift, damit sie im Spiel eingefärbt werden kann. Nicht im Spiel verdrahtet.

**Prompt:**

```
Pixel art look, three-quarter top-down view like a classic 16-bit adventure game, chunky visible pixels, dark outlines, soft cel shading, warm friendly colours (teal, off-white, warm wood brown, signal orange, soft grey, a little yellow), clean readable shapes. No text, no letters, no numbers, no logos, no watermark, no photorealism, no blur. Friendly, school-appropriate mood. Two views of one round grey barbell weight plate next to each other: left a front view (round, with a centre hole), right a side view. Neutral mid-grey, no numbers, no writing, no logo. Flat pure magenta background (#FF00FF) without gradient, texture or shadow. Nothing cropped. No ground shadow under the figure.
```

**Prüfliste:**

- [ ] Zwei Ansichten, neutral grau, ohne Zahlen.

### Nr 26: Kleine Gegenstände (Thermometer, Dose, Shaker, Handtuch)

- **Dateiname:** `obj_sonstiges_0.png … obj_sonstiges_3.png`
- **Zielordner:** `assets/figuren/`
- **Verarbeiten mit:** Sheet teilen (Spalten 4, Magenta freistellen, Name obj_sonstiges)
- **Referenzbild anhängen:** keins
- **Stil:** Vier Gegenstände in einer Reihe: rundes Thermometer-Zifferblatt ohne Zahlen, Proteinpulver-Dose ohne Etikett, Shaker-Flasche ohne Etikett, kleines Handtuch. Gleiche Größe, gleicher Abstand. Nicht im Spiel verdrahtet.

**Prompt:**

```
Pixel art look, three-quarter top-down view like a classic 16-bit adventure game, chunky visible pixels, dark outlines, soft cel shading, warm friendly colours (teal, off-white, warm wood brown, signal orange, soft grey, a little yellow), clean readable shapes. No text, no letters, no numbers, no logos, no watermark, no photorealism, no blur. Friendly, school-appropriate mood. Four small gym items in one horizontal row, same size, equal spacing: (1) a round wall thermometer face with no numbers and no marks, (2) a plain protein powder tub with no label, (3) a protein shaker bottle with no label, (4) a small plain folded gym towel. Flat pure magenta background (#FF00FF) without gradient, texture or shadow. Nothing cropped. No ground shadow under the figure.
```

**Prüfliste:**

- [ ] Vier Gegenstände, kein Aufdruck, keine Zahlen.

### Nr 27: Eiweißquellen-Icons

- **Dateiname:** `icons_quellen_0.png … icons_quellen_5.png`
- **Zielordner:** `assets/figuren/`
- **Verarbeiten mit:** Sheet teilen (Spalten 3, Zeilen 2, Magenta freistellen, Name icons_quellen)
- **Referenzbild anhängen:** keins
- **Stil:** Sechs einfache, gut lesbare Icons in Pixel-Optik: Ei, Milchpackung (blanko), Quark-Schüssel, Linsen-Schüssel, Fisch, Handvoll Nüsse. Raster 3 mal 2, gleiche Größe. Nicht im Spiel verdrahtet.

**Prompt:**

```
Pixel art look, three-quarter top-down view like a classic 16-bit adventure game, chunky visible pixels, dark outlines, soft cel shading, warm friendly colours (teal, off-white, warm wood brown, signal orange, soft grey, a little yellow), clean readable shapes. No text, no letters, no numbers, no logos, no watermark, no photorealism, no blur. Friendly, school-appropriate mood. A sheet of six simple food icons in a grid of 3 columns and 2 rows, same size, equal spacing: an egg, a blank milk carton (no writing), a bowl of quark, a bowl of lentils, a fish, a handful of nuts. Flat pure magenta background (#FF00FF) without gradient, texture or shadow. Nothing cropped. No ground shadow under the figure.
```

**Prüfliste:**

- [ ] Sechs Icons im Raster, jedes klar erkennbar, keine Schrift auf der Milchpackung.

### Nr 28: Strukturprotein-Icons

- **Dateiname:** `icons_struktur_0.png … icons_struktur_2.png`
- **Zielordner:** `assets/figuren/`
- **Verarbeiten mit:** Sheet teilen (Spalten 3, Magenta freistellen, Name icons_struktur)
- **Referenzbild anhängen:** keins
- **Stil:** Drei einfache Icons: Haarsträhne, Spinne mit Seidenfaden, Sehne beziehungsweise Faserbündel. Pixel-Optik. Nicht im Spiel verdrahtet.

**Prompt:**

```
Pixel art look, three-quarter top-down view like a classic 16-bit adventure game, chunky visible pixels, dark outlines, soft cel shading, warm friendly colours (teal, off-white, warm wood brown, signal orange, soft grey, a little yellow), clean readable shapes. No text, no letters, no numbers, no logos, no watermark, no photorealism, no blur. Friendly, school-appropriate mood. A sheet of three simple icons in one row, same size, equal spacing: a strand of hair, a spider hanging on a silk thread, a rope-like bundle of fibres (a tendon). Flat pure magenta background (#FF00FF) without gradient, texture or shadow. Nothing cropped. No ground shadow under the figure.
```

**Prüfliste:**

- [ ] Drei Icons, klar erkennbar.

### Nr 29: Zertifikat-Rahmen (Mitgliedskarte)

- **Dateiname:** `zertifikat_rahmen.webp`
- **Zielordner:** `assets/szenen/`
- **Verarbeiten mit:** Szene umwandeln (Breite 1536, Höhe 1024)
- **Referenzbild anhängen:** szene_trainingsflaeche
- **Stil:** Dekorativer Rahmen im Pixel-Stil mit Hanteln und Lorbeerzweigen, leere helle Mitte für Text. Warme Töne (Creme, Orange, Türkis). Wird im Spiel automatisch hinter das Zertifikat gelegt, sobald die Datei vorhanden ist.

**Prompt:**

```
Pixel art look, three-quarter top-down view like a classic 16-bit adventure game, chunky visible pixels, dark outlines, soft cel shading, warm friendly colours (teal, off-white, warm wood brown, signal orange, soft grey, a little yellow), clean readable shapes. No text, no letters, no numbers, no logos, no watermark, no photorealism, no blur. Friendly, school-appropriate mood. Use the attached image as style reference. A landscape membership card frame, 3:2, pixel art, a decorative border with small dumbbells and laurel branches in warm cream, orange and teal colours, a completely empty light cream centre area for text, no writing, no numbers, no logos.
```

**Prüfliste:**

- [ ] Die Mitte ist leer und hell (dort steht der Text), kein Text im Bild.

### Nr 30: App-Icon

- **Dateiname:** `icon.png (512 × 512)`
- **Zielordner:** `assets/icons/`
- **Verarbeiten mit:** Szene umwandeln (Breite 512, Höhe 512) oder von Hand skalieren
- **Referenzbild anhängen:** keins
- **Stil:** Einfaches, kräftiges Symbol: eine Hantel, deren Enden zwei verbundene runde Scheiben sind, auf türkisem Grund. Pixel-Optik, ohne Text. (Es gibt bereits ein Vektor-Icon als Platzhalter.)

**Prompt:**

```
Pixel art look, three-quarter top-down view like a classic 16-bit adventure game, chunky visible pixels, dark outlines, soft cel shading, warm friendly colours (teal, off-white, warm wood brown, signal orange, soft grey, a little yellow), clean readable shapes. No text, no letters, no numbers, no logos, no watermark, no photorealism, no blur. Friendly, school-appropriate mood. An app icon, square, a dumbbell whose two ends are connected round discs, simple bold shapes, teal background, no text, no letters.
```

**Prüfliste:**

- [ ] Quadratisch, ohne Text, auch klein noch erkennbar.

## 8. Fundstücke (Papiertexturen)

Leere Papier- und Materialflächen für die Hinweis-Funde im Spiel (Haftnotiz, Zeitung, Heft …). Der Text und alle Beschriftungen kommen aus dem Spiel selbst. Ohne diese Bilder zeigt das Spiel einfache Farbflächen. Bitte als eigene Bildfamilie in einem Chat erzeugen.

### Nr 31: Haftnotiz (gelbes Papier)

- **Dateiname:** `fund_haftnotiz.png`
- **Zielordner:** `assets/funde/`
- **Verarbeiten mit:** Mit Pillow zu WebP umwandeln (Breite 1024, Höhe 683), Zieldatei fund_haftnotiz.webp
- **Referenzbild anhängen:** keins
- **Stil:** Gelbes Haftnotiz-Papier, leicht wellig, oben ein etwas dunklerer Klebestreifen. Leere Fläche, Pixel-Optik. Hier liegt später die Handschrift des Spiels darüber.

**Prompt:**

```
Pixel art look, flat straight-on view in the style of a classic 16-bit adventure game, no perspective, chunky visible pixels, dark outlines, soft cel shading, warm friendly colours (teal, off-white, warm wood brown, signal orange, soft grey, a little yellow), clean readable shapes. No text, no letters, no numbers, no logos, no watermark, no photorealism, no blur. Friendly, school-appropriate mood. A close-up of a yellow sticky-note paper surface, slightly wavy, with a darker sticky strip along the top 12 percent, soft paper fibres. 3:2 landscape image. The surface fills the entire image edge to edge. No text, no letters, no numbers, no pictures, no objects on it.
```

**Prüfliste:**

- [ ] Kein Text, keine Buchstaben, keine Zahlen, keine Pseudoschrift, keine Bilder auf dem Papier.
- [ ] Die Fläche füllt das ganze Bild bis an den Rand (keine Tischplatte, keine Hand, kein Rahmen drumherum).
- [ ] Die Mitte ist weitgehend ruhig und hell genug, damit dort Text gut lesbar bleibt.

### Nr 32: Karteikarte (Linien, rote Kopflinie)

- **Dateiname:** `fund_karteikarte.png`
- **Zielordner:** `assets/funde/`
- **Verarbeiten mit:** Mit Pillow zu WebP umwandeln (Breite 1024, Höhe 683), Zieldatei fund_karteikarte.webp
- **Referenzbild anhängen:** keins
- **Stil:** Cremefarbene Karteikarte mit feinen hellblauen Linien und einer roten Linie am oberen Rand. Leer.

**Prompt:**

```
Pixel art look, flat straight-on view in the style of a classic 16-bit adventure game, no perspective, chunky visible pixels, dark outlines, soft cel shading, warm friendly colours (teal, off-white, warm wood brown, signal orange, soft grey, a little yellow), clean readable shapes. No text, no letters, no numbers, no logos, no watermark, no photorealism, no blur. Friendly, school-appropriate mood. A close-up of an off-white index card, faint light-blue horizontal ruled lines across the whole card and one thin red line along the top edge. 3:2 landscape image. The surface fills the entire image edge to edge. No text, no letters, no numbers, no pictures, no objects on it.
```

**Prüfliste:**

- [ ] Kein Text, keine Buchstaben, keine Zahlen, keine Pseudoschrift, keine Bilder auf dem Papier.
- [ ] Die Fläche füllt das ganze Bild bis an den Rand (keine Tischplatte, keine Hand, kein Rahmen drumherum).
- [ ] Die Mitte ist weitgehend ruhig und hell genug, damit dort Text gut lesbar bleibt.

### Nr 33: Zeitungspapier

- **Dateiname:** `fund_zeitung.png`
- **Zielordner:** `assets/funde/`
- **Verarbeiten mit:** Mit Pillow zu WebP umwandeln (Breite 1024, Höhe 683), Zieldatei fund_zeitung.webp
- **Referenzbild anhängen:** keins
- **Stil:** Vergilbtes Zeitungspapier mit Papierfasern und leichten Falzspuren, aber ohne gedruckten Text und ohne Fotos.

**Prompt:**

```
Pixel art look, flat straight-on view in the style of a classic 16-bit adventure game, no perspective, chunky visible pixels, dark outlines, soft cel shading, warm friendly colours (teal, off-white, warm wood brown, signal orange, soft grey, a little yellow), clean readable shapes. No text, no letters, no numbers, no logos, no watermark, no photorealism, no blur. Friendly, school-appropriate mood. A close-up of aged cream-grey newsprint paper with visible paper fibres and faint fold lines. Completely blank: absolutely no printed text, no headlines, no columns of letters, no photos. 3:2 landscape image. The surface fills the entire image edge to edge. No text, no letters, no numbers, no pictures, no objects on it.
```

**Prüfliste:**

- [ ] Kein Text, keine Buchstaben, keine Zahlen, keine Pseudoschrift, keine Bilder auf dem Papier.
- [ ] Die Fläche füllt das ganze Bild bis an den Rand (keine Tischplatte, keine Hand, kein Rahmen drumherum).
- [ ] Die Mitte ist weitgehend ruhig und hell genug, damit dort Text gut lesbar bleibt.

### Nr 34: Karo-Heftseite

- **Dateiname:** `fund_heft.png`
- **Zielordner:** `assets/funde/`
- **Verarbeiten mit:** Mit Pillow zu WebP umwandeln (Breite 1024, Höhe 683), Zieldatei fund_heft.webp
- **Referenzbild anhängen:** keins
- **Stil:** Kariertes Schulheftpapier mit hellblauem Gitter und rosa Randlinie links. Leer.

**Prompt:**

```
Pixel art look, flat straight-on view in the style of a classic 16-bit adventure game, no perspective, chunky visible pixels, dark outlines, soft cel shading, warm friendly colours (teal, off-white, warm wood brown, signal orange, soft grey, a little yellow), clean readable shapes. No text, no letters, no numbers, no logos, no watermark, no photorealism, no blur. Friendly, school-appropriate mood. A close-up of squared school notebook paper with a light-blue grid and one pink vertical margin line near the left edge. 3:2 landscape image. The surface fills the entire image edge to edge. No text, no letters, no numbers, no pictures, no objects on it.
```

**Prüfliste:**

- [ ] Kein Text, keine Buchstaben, keine Zahlen, keine Pseudoschrift, keine Bilder auf dem Papier.
- [ ] Die Fläche füllt das ganze Bild bis an den Rand (keine Tischplatte, keine Hand, kein Rahmen drumherum).
- [ ] Die Mitte ist weitgehend ruhig und hell genug, damit dort Text gut lesbar bleibt.

### Nr 35: Formularpapier

- **Dateiname:** `fund_formular.png`
- **Zielordner:** `assets/funde/`
- **Verarbeiten mit:** Mit Pillow zu WebP umwandeln (Breite 1024, Höhe 683), Zieldatei fund_formular.webp
- **Referenzbild anhängen:** keins
- **Stil:** Helles Formularpapier mit sehr feinen grauen Linien und leeren Kästchen. Wird für Laborzettel, Protokoll und Spurenbericht benutzt.

**Prompt:**

```
Pixel art look, flat straight-on view in the style of a classic 16-bit adventure game, no perspective, chunky visible pixels, dark outlines, soft cel shading, warm friendly colours (teal, off-white, warm wood brown, signal orange, soft grey, a little yellow), clean readable shapes. No text, no letters, no numbers, no logos, no watermark, no photorealism, no blur. Friendly, school-appropriate mood. A close-up of pale off-white form paper with very faint blue-grey thin lines and empty table boxes, like a blank lab form. 3:2 landscape image. The surface fills the entire image edge to edge. No text, no letters, no numbers, no pictures, no objects on it.
```

**Prüfliste:**

- [ ] Kein Text, keine Buchstaben, keine Zahlen, keine Pseudoschrift, keine Bilder auf dem Papier.
- [ ] Die Fläche füllt das ganze Bild bis an den Rand (keine Tischplatte, keine Hand, kein Rahmen drumherum).
- [ ] Die Mitte ist weitgehend ruhig und hell genug, damit dort Text gut lesbar bleibt.

### Nr 36: Emailleschild (Metall)

- **Dateiname:** `fund_metallschild.png`
- **Zielordner:** `assets/funde/`
- **Verarbeiten mit:** Mit Pillow zu WebP umwandeln (Breite 1024, Höhe 683), Zieldatei fund_metallschild.webp
- **Referenzbild anhängen:** keins
- **Stil:** Helles, leicht abgenutztes Emailleschild aus Metall mit vier Schrauben in den Ecken. Leer.

**Prompt:**

```
Pixel art look, flat straight-on view in the style of a classic 16-bit adventure game, no perspective, chunky visible pixels, dark outlines, soft cel shading, warm friendly colours (teal, off-white, warm wood brown, signal orange, soft grey, a little yellow), clean readable shapes. No text, no letters, no numbers, no logos, no watermark, no photorealism, no blur. Friendly, school-appropriate mood. A close-up of a light-grey worn enamel metal plate with a subtle raised rim and four round screw heads, one in each corner. 3:2 landscape image. The surface fills the entire image edge to edge. No text, no letters, no numbers, no pictures, no objects on it.
```

**Prüfliste:**

- [ ] Kein Text, keine Buchstaben, keine Zahlen, keine Pseudoschrift, keine Bilder auf dem Papier.
- [ ] Die Fläche füllt das ganze Bild bis an den Rand (keine Tischplatte, keine Hand, kein Rahmen drumherum).
- [ ] Die Mitte ist weitgehend ruhig und hell genug, damit dort Text gut lesbar bleibt.

### Nr 37: Korkwand (Pinnwand)

- **Dateiname:** `pinnwand_kork.png`
- **Zielordner:** `assets/funde/`
- **Verarbeiten mit:** Mit Pillow zu WebP umwandeln (Breite 1024, Höhe 683), Zieldatei pinnwand_kork.webp
- **Referenzbild anhängen:** keins
- **Stil:** Korkplatte in warmem Braun mit feiner Körnung. Hier hängen später die Funde. Ohne Rahmen.

**Prompt:**

```
Pixel art look, flat straight-on view in the style of a classic 16-bit adventure game, no perspective, chunky visible pixels, dark outlines, soft cel shading, warm friendly colours (teal, off-white, warm wood brown, signal orange, soft grey, a little yellow), clean readable shapes. No text, no letters, no numbers, no logos, no watermark, no photorealism, no blur. Friendly, school-appropriate mood. A close-up of a warm brown cork board surface with fine speckled grain, evenly lit, no frame, no pins, no notes. 3:2 landscape image. The surface fills the entire image edge to edge. No text, no letters, no numbers, no pictures, no objects on it.
```

**Prüfliste:**

- [ ] Kein Text, keine Buchstaben, keine Zahlen, keine Pseudoschrift, keine Bilder auf dem Papier.
- [ ] Die Fläche füllt das ganze Bild bis an den Rand (keine Tischplatte, keine Hand, kein Rahmen drumherum).
- [ ] Die Mitte ist weitgehend ruhig und hell genug, damit dort Text gut lesbar bleibt.

## 9. Adventure 2.0 (optional)

Optionale Bilder für die Adventure-Erweiterung (Laborführerschein, Saunacode, Inventar, Schließfächer). Das Spiel zeichnet diese Objekte zunächst selbst im Code; die Bilder sind nur schöner und nicht nötig.

### Nr 38: Labor-Ausweis (Karte)

- **Dateiname:** `obj_ausweis.png`
- **Zielordner:** `assets/figuren/`
- **Verarbeiten mit:** Einzel-Sprite (Art Objekt, Name obj_ausweis), Magenta freistellen
- **Referenzbild anhängen:** keins
- **Stil:** Kleine Ausweiskarte, Querformat, türkis mit orangem Streifen, links ein leeres Foto-Feld, rechts leere Linien. Ohne Text. Name und Datum setzt das Spiel darüber. Das Spiel zeichnet dieses Objekt zunächst selbst im Code; das Bild ist nur eine schönere Alternative.

**Prompt:**

```
Pixel art look, three-quarter top-down view like a classic 16-bit adventure game, chunky visible pixels, dark outlines, soft cel shading, warm friendly colours (teal, off-white, warm wood brown, signal orange, soft grey, a little yellow), clean readable shapes. No text, no letters, no numbers, no logos, no watermark, no photorealism, no blur. Friendly, school-appropriate mood. A single laboratory ID badge card, landscape, rounded corners, teal with an orange stripe along the top, a blank empty light square on the left for a photo, a few blank grey bars on the right where text would be, a small hole at the top for a lanyard. No text, no numbers, no logo. Flat pure magenta background (#FF00FF) without gradient, texture or shadow. Nothing cropped. No ground shadow under the figure.
```

**Prüfliste:**

- [ ] Karte vollständig sichtbar, keine Schrift, leere Flächen für Foto und Zeilen.

### Nr 39: Kartenlesegerät (Lämpchen rot und grün)

- **Dateiname:** `obj_leser_0.png … obj_leser_1.png`
- **Zielordner:** `assets/figuren/`
- **Verarbeiten mit:** Sheet teilen (Spalten 2, Magenta freistellen, Name obj_leser)
- **Referenzbild anhängen:** keins
- **Stil:** Kleines Wandlesegerät neben einer Tür: links mit rotem Lämpchen (gesperrt), rechts mit grünem Lämpchen (frei). Gleiche Größe, gleicher Abstand, ohne Aufdruck. Das Spiel zeichnet dieses Objekt zunächst selbst im Code; das Bild ist nur eine schönere Alternative.

**Prompt:**

```
Pixel art look, three-quarter top-down view like a classic 16-bit adventure game, chunky visible pixels, dark outlines, soft cel shading, warm friendly colours (teal, off-white, warm wood brown, signal orange, soft grey, a little yellow), clean readable shapes. No text, no letters, no numbers, no logos, no watermark, no photorealism, no blur. Friendly, school-appropriate mood. Two views of the same small wall-mounted card reader box in a row, equal size and spacing: left with a red indicator light, right with a green indicator light. Each has a narrow card slot and a tiny dark screen without content. No text, no numbers, no logos. Flat pure magenta background (#FF00FF) without gradient, texture or shadow. Nothing cropped. No ground shadow under the figure.
```

**Prüfliste:**

- [ ] Zwei Bilder, nur das Lämpchen unterscheidet sich, keine Schrift.

### Nr 40: Zahlenschloss-Tastenfeld

- **Dateiname:** `obj_tastenfeld.png`
- **Zielordner:** `assets/figuren/`
- **Verarbeiten mit:** Einzel-Sprite (Art Objekt, Name obj_tastenfeld), Magenta freistellen
- **Referenzbild anhängen:** keins
- **Stil:** Tastenfeld mit zwölf leeren Tasten (3 mal 4) und einem leeren dunklen Anzeigefeld darüber. Die Ziffern setzt das Spiel selbst auf die Tasten. Das Spiel zeichnet dieses Objekt zunächst selbst im Code; das Bild ist nur eine schönere Alternative.

**Prompt:**

```
Pixel art look, three-quarter top-down view like a classic 16-bit adventure game, chunky visible pixels, dark outlines, soft cel shading, warm friendly colours (teal, off-white, warm wood brown, signal orange, soft grey, a little yellow), clean readable shapes. No text, no letters, no numbers, no logos, no watermark, no photorealism, no blur. Friendly, school-appropriate mood. A door keypad with a small empty dark display on top and twelve identical blank rounded keys below in a grid of 3 columns and 4 rows, metal frame, seen straight from the front. The keys carry no numbers and no symbols. No text. Flat pure magenta background (#FF00FF) without gradient, texture or shadow. Nothing cropped. No ground shadow under the figure.
```

**Prüfliste:**

- [ ] Zwölf Tasten im Raster 3 mal 4, alle leer (keine Ziffern), Anzeige leer.

### Nr 41: Zettel mit Gekritzel

- **Dateiname:** `obj_zettel.png`
- **Zielordner:** `assets/figuren/`
- **Verarbeiten mit:** Einzel-Sprite (Art Objekt, Name obj_zettel), Magenta freistellen
- **Referenzbild anhängen:** keins
- **Stil:** Kleiner gelber Zettel, leicht schief, mit angedeutetem Gekritzel aus unleserlichen Strichen. Den echten Code schreibt das Spiel darauf. Das Spiel zeichnet dieses Objekt zunächst selbst im Code; das Bild ist nur eine schönere Alternative.

**Prompt:**

```
Pixel art look, three-quarter top-down view like a classic 16-bit adventure game, chunky visible pixels, dark outlines, soft cel shading, warm friendly colours (teal, off-white, warm wood brown, signal orange, soft grey, a little yellow), clean readable shapes. No text, no letters, no numbers, no logos, no watermark, no photorealism, no blur. Friendly, school-appropriate mood. A small crooked yellow paper note with a few abstract wavy pencil scribble lines on it that do not form letters or numbers, a little tape on the top edge. No readable writing. Flat pure magenta background (#FF00FF) without gradient, texture or shadow. Nothing cropped. No ground shadow under the figure.
```

**Prüfliste:**

- [ ] Das Gekritzel sieht nicht wie Buchstaben oder Zahlen aus.

### Nr 42: Taschensymbol (Inventar)

- **Dateiname:** `icon_tasche.png`
- **Zielordner:** `assets/icons/`
- **Verarbeiten mit:** Einzel-Sprite (Art Icon, Name icon_tasche), Magenta freistellen
- **Referenzbild anhängen:** keins
- **Stil:** Kleine Sporttasche in Türkis mit orangem Reißverschluss, Seitenansicht, gut lesbar auch in klein. Das Spiel zeichnet dieses Objekt zunächst selbst im Code; das Bild ist nur eine schönere Alternative.

**Prompt:**

```
Pixel art look, three-quarter top-down view like a classic 16-bit adventure game, chunky visible pixels, dark outlines, soft cel shading, warm friendly colours (teal, off-white, warm wood brown, signal orange, soft grey, a little yellow), clean readable shapes. No text, no letters, no numbers, no logos, no watermark, no photorealism, no blur. Friendly, school-appropriate mood. A single small icon of a teal gym duffel bag with an orange zipper and a short carrying strap, side view, bold simple shapes, readable at small size. No text, no logo. Flat pure magenta background (#FF00FF) without gradient, texture or shadow. Nothing cropped. No ground shadow under the figure.
```

**Prüfliste:**

- [ ] Auch klein noch als Tasche erkennbar, keine Schrift.

### Nr 43: Schließfach (zu und offen)

- **Dateiname:** `obj_fach_0.png … obj_fach_1.png`
- **Zielordner:** `assets/figuren/`
- **Verarbeiten mit:** Sheet teilen (Spalten 2, Magenta freistellen, Name obj_fach)
- **Referenzbild anhängen:** keins
- **Stil:** Ein Schließfach, links geschlossen, rechts mit offener Tür und leerem Inneren. Gleiche Größe, mit Ziffernschloss ohne Ziffern. Das Spiel zeichnet dieses Objekt zunächst selbst im Code; das Bild ist nur eine schönere Alternative.

**Prompt:**

```
Pixel art look, three-quarter top-down view like a classic 16-bit adventure game, chunky visible pixels, dark outlines, soft cel shading, warm friendly colours (teal, off-white, warm wood brown, signal orange, soft grey, a little yellow), clean readable shapes. No text, no letters, no numbers, no logos, no watermark, no photorealism, no blur. Friendly, school-appropriate mood. Two views of the same small locker door in a row, equal size and spacing: left closed, with a blank keypad lock on the door, right with the door swung open showing an empty teal interior. Teal metal, no numbers, no text, no stickers. Flat pure magenta background (#FF00FF) without gradient, texture or shadow. Nothing cropped. No ground shadow under the figure.
```

**Prüfliste:**

- [ ] Zwei Bilder: zu und offen, gleiche Größe, keine Ziffern am Schloss.

### Nr 44: Aufkleber (vier Stück)

- **Dateiname:** `obj_aufkleber_0.png … obj_aufkleber_3.png`
- **Zielordner:** `assets/figuren/`
- **Verarbeiten mit:** Sheet teilen (Spalten 4, Magenta freistellen, Name obj_aufkleber)
- **Referenzbild anhängen:** keins
- **Stil:** Vier runde Aufkleber als Belohnung für Bonusfächer: Stern, Hantel, Reagenzglas, Blitz. Gleiche Größe, ohne Schrift. Das Spiel zeichnet dieses Objekt zunächst selbst im Code; das Bild ist nur eine schönere Alternative.

**Prompt:**

```
Pixel art look, three-quarter top-down view like a classic 16-bit adventure game, chunky visible pixels, dark outlines, soft cel shading, warm friendly colours (teal, off-white, warm wood brown, signal orange, soft grey, a little yellow), clean readable shapes. No text, no letters, no numbers, no logos, no watermark, no photorealism, no blur. Friendly, school-appropriate mood. Four round sticker badges in one row, same size, equal spacing, each with a thick white outline: (1) a yellow star, (2) a small dumbbell, (3) a test tube with green liquid, (4) an orange lightning bolt. No text, no numbers. Flat pure magenta background (#FF00FF) without gradient, texture or shadow. Nothing cropped. No ground shadow under the figure.
```

**Prüfliste:**

- [ ] Vier Aufkleber, gleich groß, klarer Abstand, keine Schrift.

## 10. Nachbesserungs-Prompts (kurz, höchstens zweimal pro Bild)

Diese Sätze im selben Chat direkt nach dem unbefriedigenden Bild senden:

| Problem | Prompt |
|---|---|
| Text oder Pseudoschrift im Bild | „Redo the image exactly the same, but remove all text, letters, numbers and symbols that look like writing. Posters, boards and labels must be completely blank.“ |
| Hintergrund nicht einfarbig | „Redo the image exactly the same, but make the background one single flat pure magenta (#FF00FF), without gradient, noise, shadow or texture.“ |
| Figuren berühren sich oder Abstand fehlt | „Redo the strip exactly the same, but leave clearly more empty space between the frames so that no frame touches another.“ |
| Figur weicht vom Referenzbild ab | „The character does not match the attached reference. Use the attached character exactly: same face, hair, clothes, colours and proportions.“ |
| Bodenmitte nicht frei | „Redo the scene exactly the same, but keep the middle of the floor completely empty, with no furniture or objects between 15 and 85 percent of the width and 35 and 92 percent of the height.“ |
| Personen in der Szene | „Redo the scene exactly the same, but without any people or figures.“ |
| Stil weicht von der Referenz ab | „Match the attached reference exactly in pixel size, outlines, shading and colour palette.“ |
| Zu wenig Pixel-Optik | „Make it look more like chunky pixel art: clearly visible pixels, dark outlines, flat cel shading, no soft gradients, no blur.“ |

## 11. Wie die Bilder ins Spiel kommen

Das Grafik-Werkzeug starten: `node tools/serve.mjs 4195`, dann `http://localhost:4195/tools/sprite-slicer.html` öffnen. Bild per Ziehen, Einfügen (Strg+V) oder „Datei wählen“ laden, Vorschau prüfen, speichern. Die gespeicherte Datei in den Zielordner legen und `node tools/precache.mjs` ausführen (sonst fehlt sie offline).

- **Lauf-Streifen:** Reiter „Lauf-Streifen“, Richtung und Variante wählen. Findet das Werkzeug nicht vier Figuren, warnt es und teilt in gleich breite Spalten; dann Magenta-Toleranz ändern oder das Bild mit mehr Abstand neu erzeugen.
- **NPC-Sprites:** Reiter „Einzel-Sprite“, Art NPC, Name wie in den Dateinamen oben (trainer, alex, hannes, zoe, desi, kurt).
- **Porträts:** Reiter „Sheet teilen“, Spalten wie in der Tabelle, quadratisch, 256 Pixel. Im Dialog wählt `"portrait": "trainer_1"` in `data/dialoge.json` den zweiten Ausdruck; fehlt die Datei, zeigt das Spiel den Anfangsbuchstaben.
- **Szenen:** Reiter „Szene umwandeln“, 1536 × 1024, Qualität etwa 88. Danach Kollision und Hotspots mit `?edit=1` im Spiel setzen und in `data/szenen.json` übernehmen.
- **Spielfigur:** Es gibt nur eine Figur (Dateien `figur_v1_walk_*`), das Spiel verändert sie nicht. Fehlen die Dateien, zeichnet das Spiel eine Platzhalterfigur.

## Hinweis zum Urheberrecht und zur Datenschutz-Sicht

Alle Bilder sind selbst erzeugt, es werden keine Figuren oder Sprites aus bekannten Spielen nachgebaut. Prüfe die Nutzungsbedingungen deines ChatGPT-Tarifs für die schulische Verwendung der erzeugten Bilder.
