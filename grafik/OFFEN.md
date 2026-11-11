# Noch offene Grafiken (Protein-Gym)

Diese Datei enthält **nur** Bilder, die noch fehlen. Alles Fertige steht in `PROMPTS_KOPIEREN.md` und ist hier nicht mehr aufgeführt. Die Nummern sind dieselben wie dort. Je Bild: Block kopieren, in ChatGPT einfügen, bei „Anhängen“ das genannte Bild mitschicken, Ergebnis unter dem Dateinamen speichern, danach `node tools/precache.mjs` ausführen. Höchstens zwei Nachbesserungen je Bild (die kurzen Sätze stehen unten).

**Ohne diese Bilder läuft das Spiel vollständig:** es zeichnet die fehlenden Papierflächen als Farbflächen und die fehlende Figur als Platzhalter. Offen sind 7 Bilder, optional 7.

| Nr | Datei | Anhängen | Status |
|---|---|---|---|
| 20 | npc_desi.png | figur_v1_ref.png (damit Proportionen und Stil passen) | offen |
| 32 | fund_karteikarte.png | - | offen |
| 33 | fund_zeitung.png | - | offen |
| 34 | fund_heft.png | - | offen |
| 35 | fund_formular.png | - | offen |
| 36 | fund_metallschild.png | - | offen |
| 37 | pinnwand_kork.png | - | offen |
| 38 | obj_ausweis.png | - | optional |
| 39 | obj_leser_0.png … obj_leser_1.png | - | optional |
| 40 | obj_tastenfeld.png | - | optional |
| 41 | obj_zettel.png | - | optional |
| 42 | icon_tasche.png | - | optional |
| 43 | obj_fach_0.png … obj_fach_1.png | - | optional |
| 44 | obj_aufkleber_0.png … obj_aufkleber_3.png | - | optional |

## Offen (fehlt im Spiel)

### Nr 20: Desi (Empfang, Verdächtige „Alkohol“): Sprite (Stehbild)

Speichern als: `npc_desi.png` in `assets/figuren/`

**Werkzeug:** Einzel-Sprite (Art NPC, Name desi)

**Anhängen:** figur_v1_ref.png (damit Proportionen und Stil passen)

```
Pixel art look, three-quarter top-down view like a classic 16-bit adventure game, chunky visible pixels, dark outlines, soft cel shading, warm friendly colours (teal, off-white, warm wood brown, signal orange, soft grey, a little yellow), clean readable shapes. No text, no letters, no numbers, no logos, no watermark, no photorealism, no blur. Friendly, school-appropriate mood. Use the attached character sheet only as reference for the pixel art style, proportions (chibi-like, about 3 heads tall) and line work. Create a different character: a single full-body sprite of a tidy hygiene helper wearing a light blue tunic, holding a spray bottle with a completely blank bottle, standing relaxed. Standing facing the viewer. Flat pure magenta background (#FF00FF) without gradient, texture or shadow. Nothing cropped. No ground shadow under the figure. No text.
```

**Prüfen:**

- [ ] Hintergrund ist einfarbiges Magenta, ohne Verlauf und ohne Schatten.
- [ ] Figur vollständig sichtbar, nicht abgeschnitten.
- [ ] Gleicher Stil und gleiche Proportionen wie die Spielfigur, aber erkennbar eine andere Person.
- [ ] Keine Beschriftung auf Kleidung, Flaschen oder Gegenständen.

### Nr 32: Karteikarte (Linien, rote Kopflinie)

Speichern als: `fund_karteikarte.png` in `assets/funde/`

**Werkzeug:** Mit Pillow zu WebP umwandeln (Breite 1024, Höhe 683), Zieldatei fund_karteikarte.webp

**Anhängen:** nichts

```
Pixel art look, flat straight-on view in the style of a classic 16-bit adventure game, no perspective, chunky visible pixels, dark outlines, soft cel shading, warm friendly colours (teal, off-white, warm wood brown, signal orange, soft grey, a little yellow), clean readable shapes. No text, no letters, no numbers, no logos, no watermark, no photorealism, no blur. Friendly, school-appropriate mood. A close-up of an off-white index card, faint light-blue horizontal ruled lines across the whole card and one thin red line along the top edge. 3:2 landscape image. The surface fills the entire image edge to edge. No text, no letters, no numbers, no pictures, no objects on it.
```

**Prüfen:**

- [ ] Kein Text, keine Buchstaben, keine Zahlen, keine Pseudoschrift, keine Bilder auf dem Papier.
- [ ] Die Fläche füllt das ganze Bild bis an den Rand (keine Tischplatte, keine Hand, kein Rahmen drumherum).
- [ ] Die Mitte ist weitgehend ruhig und hell genug, damit dort Text gut lesbar bleibt.

### Nr 33: Zeitungspapier

Speichern als: `fund_zeitung.png` in `assets/funde/`

**Werkzeug:** Mit Pillow zu WebP umwandeln (Breite 1024, Höhe 683), Zieldatei fund_zeitung.webp

**Anhängen:** nichts

```
Pixel art look, flat straight-on view in the style of a classic 16-bit adventure game, no perspective, chunky visible pixels, dark outlines, soft cel shading, warm friendly colours (teal, off-white, warm wood brown, signal orange, soft grey, a little yellow), clean readable shapes. No text, no letters, no numbers, no logos, no watermark, no photorealism, no blur. Friendly, school-appropriate mood. A close-up of aged cream-grey newsprint paper with visible paper fibres and faint fold lines. Completely blank: absolutely no printed text, no headlines, no columns of letters, no photos. 3:2 landscape image. The surface fills the entire image edge to edge. No text, no letters, no numbers, no pictures, no objects on it.
```

**Prüfen:**

- [ ] Kein Text, keine Buchstaben, keine Zahlen, keine Pseudoschrift, keine Bilder auf dem Papier.
- [ ] Die Fläche füllt das ganze Bild bis an den Rand (keine Tischplatte, keine Hand, kein Rahmen drumherum).
- [ ] Die Mitte ist weitgehend ruhig und hell genug, damit dort Text gut lesbar bleibt.

### Nr 34: Karo-Heftseite

Speichern als: `fund_heft.png` in `assets/funde/`

**Werkzeug:** Mit Pillow zu WebP umwandeln (Breite 1024, Höhe 683), Zieldatei fund_heft.webp

**Anhängen:** nichts

```
Pixel art look, flat straight-on view in the style of a classic 16-bit adventure game, no perspective, chunky visible pixels, dark outlines, soft cel shading, warm friendly colours (teal, off-white, warm wood brown, signal orange, soft grey, a little yellow), clean readable shapes. No text, no letters, no numbers, no logos, no watermark, no photorealism, no blur. Friendly, school-appropriate mood. A close-up of squared school notebook paper with a light-blue grid and one pink vertical margin line near the left edge. 3:2 landscape image. The surface fills the entire image edge to edge. No text, no letters, no numbers, no pictures, no objects on it.
```

**Prüfen:**

- [ ] Kein Text, keine Buchstaben, keine Zahlen, keine Pseudoschrift, keine Bilder auf dem Papier.
- [ ] Die Fläche füllt das ganze Bild bis an den Rand (keine Tischplatte, keine Hand, kein Rahmen drumherum).
- [ ] Die Mitte ist weitgehend ruhig und hell genug, damit dort Text gut lesbar bleibt.

### Nr 35: Formularpapier

Speichern als: `fund_formular.png` in `assets/funde/`

**Werkzeug:** Mit Pillow zu WebP umwandeln (Breite 1024, Höhe 683), Zieldatei fund_formular.webp

**Anhängen:** nichts

```
Pixel art look, flat straight-on view in the style of a classic 16-bit adventure game, no perspective, chunky visible pixels, dark outlines, soft cel shading, warm friendly colours (teal, off-white, warm wood brown, signal orange, soft grey, a little yellow), clean readable shapes. No text, no letters, no numbers, no logos, no watermark, no photorealism, no blur. Friendly, school-appropriate mood. A close-up of pale off-white form paper with very faint blue-grey thin lines and empty table boxes, like a blank lab form. 3:2 landscape image. The surface fills the entire image edge to edge. No text, no letters, no numbers, no pictures, no objects on it.
```

**Prüfen:**

- [ ] Kein Text, keine Buchstaben, keine Zahlen, keine Pseudoschrift, keine Bilder auf dem Papier.
- [ ] Die Fläche füllt das ganze Bild bis an den Rand (keine Tischplatte, keine Hand, kein Rahmen drumherum).
- [ ] Die Mitte ist weitgehend ruhig und hell genug, damit dort Text gut lesbar bleibt.

### Nr 36: Emailleschild (Metall)

Speichern als: `fund_metallschild.png` in `assets/funde/`

**Werkzeug:** Mit Pillow zu WebP umwandeln (Breite 1024, Höhe 683), Zieldatei fund_metallschild.webp

**Anhängen:** nichts

```
Pixel art look, flat straight-on view in the style of a classic 16-bit adventure game, no perspective, chunky visible pixels, dark outlines, soft cel shading, warm friendly colours (teal, off-white, warm wood brown, signal orange, soft grey, a little yellow), clean readable shapes. No text, no letters, no numbers, no logos, no watermark, no photorealism, no blur. Friendly, school-appropriate mood. A close-up of a light-grey worn enamel metal plate with a subtle raised rim and four round screw heads, one in each corner. 3:2 landscape image. The surface fills the entire image edge to edge. No text, no letters, no numbers, no pictures, no objects on it.
```

**Prüfen:**

- [ ] Kein Text, keine Buchstaben, keine Zahlen, keine Pseudoschrift, keine Bilder auf dem Papier.
- [ ] Die Fläche füllt das ganze Bild bis an den Rand (keine Tischplatte, keine Hand, kein Rahmen drumherum).
- [ ] Die Mitte ist weitgehend ruhig und hell genug, damit dort Text gut lesbar bleibt.

### Nr 37: Korkwand (Pinnwand)

Speichern als: `pinnwand_kork.png` in `assets/funde/`

**Werkzeug:** Mit Pillow zu WebP umwandeln (Breite 1024, Höhe 683), Zieldatei pinnwand_kork.webp

**Anhängen:** nichts

```
Pixel art look, flat straight-on view in the style of a classic 16-bit adventure game, no perspective, chunky visible pixels, dark outlines, soft cel shading, warm friendly colours (teal, off-white, warm wood brown, signal orange, soft grey, a little yellow), clean readable shapes. No text, no letters, no numbers, no logos, no watermark, no photorealism, no blur. Friendly, school-appropriate mood. A close-up of a warm brown cork board surface with fine speckled grain, evenly lit, no frame, no pins, no notes. 3:2 landscape image. The surface fills the entire image edge to edge. No text, no letters, no numbers, no pictures, no objects on it.
```

**Prüfen:**

- [ ] Kein Text, keine Buchstaben, keine Zahlen, keine Pseudoschrift, keine Bilder auf dem Papier.
- [ ] Die Fläche füllt das ganze Bild bis an den Rand (keine Tischplatte, keine Hand, kein Rahmen drumherum).
- [ ] Die Mitte ist weitgehend ruhig und hell genug, damit dort Text gut lesbar bleibt.

## Optional (Adventure-Erweiterung, Spiel zeichnet es sonst selbst im Code)

### Nr 38: Labor-Ausweis (Karte)

Speichern als: `obj_ausweis.png` in `assets/figuren/`

**Werkzeug:** Einzel-Sprite (Art Objekt, Name obj_ausweis), Magenta freistellen

**Anhängen:** nichts

```
Pixel art look, three-quarter top-down view like a classic 16-bit adventure game, chunky visible pixels, dark outlines, soft cel shading, warm friendly colours (teal, off-white, warm wood brown, signal orange, soft grey, a little yellow), clean readable shapes. No text, no letters, no numbers, no logos, no watermark, no photorealism, no blur. Friendly, school-appropriate mood. A single laboratory ID badge card, landscape, rounded corners, teal with an orange stripe along the top, a blank empty light square on the left for a photo, a few blank grey bars on the right where text would be, a small hole at the top for a lanyard. No text, no numbers, no logo. Flat pure magenta background (#FF00FF) without gradient, texture or shadow. Nothing cropped. No ground shadow under the figure.
```

**Prüfen:**

- [ ] Karte vollständig sichtbar, keine Schrift, leere Flächen für Foto und Zeilen.

### Nr 39: Kartenlesegerät (Lämpchen rot und grün)

Speichern als: `obj_leser_sheet.png` (das Grafik-Werkzeug teilt es danach in obj_leser_0.png … obj_leser_1.png)

**Werkzeug:** Sheet teilen (Spalten 2, Magenta freistellen, Name obj_leser)

**Anhängen:** nichts

```
Pixel art look, three-quarter top-down view like a classic 16-bit adventure game, chunky visible pixels, dark outlines, soft cel shading, warm friendly colours (teal, off-white, warm wood brown, signal orange, soft grey, a little yellow), clean readable shapes. No text, no letters, no numbers, no logos, no watermark, no photorealism, no blur. Friendly, school-appropriate mood. Two views of the same small wall-mounted card reader box in a row, equal size and spacing: left with a red indicator light, right with a green indicator light. Each has a narrow card slot and a tiny dark screen without content. No text, no numbers, no logos. Flat pure magenta background (#FF00FF) without gradient, texture or shadow. Nothing cropped. No ground shadow under the figure.
```

**Prüfen:**

- [ ] Zwei Bilder, nur das Lämpchen unterscheidet sich, keine Schrift.

### Nr 40: Zahlenschloss-Tastenfeld

Speichern als: `obj_tastenfeld.png` in `assets/figuren/`

**Werkzeug:** Einzel-Sprite (Art Objekt, Name obj_tastenfeld), Magenta freistellen

**Anhängen:** nichts

```
Pixel art look, three-quarter top-down view like a classic 16-bit adventure game, chunky visible pixels, dark outlines, soft cel shading, warm friendly colours (teal, off-white, warm wood brown, signal orange, soft grey, a little yellow), clean readable shapes. No text, no letters, no numbers, no logos, no watermark, no photorealism, no blur. Friendly, school-appropriate mood. A door keypad with a small empty dark display on top and twelve identical blank rounded keys below in a grid of 3 columns and 4 rows, metal frame, seen straight from the front. The keys carry no numbers and no symbols. No text. Flat pure magenta background (#FF00FF) without gradient, texture or shadow. Nothing cropped. No ground shadow under the figure.
```

**Prüfen:**

- [ ] Zwölf Tasten im Raster 3 mal 4, alle leer (keine Ziffern), Anzeige leer.

### Nr 41: Zettel mit Gekritzel

Speichern als: `obj_zettel.png` in `assets/figuren/`

**Werkzeug:** Einzel-Sprite (Art Objekt, Name obj_zettel), Magenta freistellen

**Anhängen:** nichts

```
Pixel art look, three-quarter top-down view like a classic 16-bit adventure game, chunky visible pixels, dark outlines, soft cel shading, warm friendly colours (teal, off-white, warm wood brown, signal orange, soft grey, a little yellow), clean readable shapes. No text, no letters, no numbers, no logos, no watermark, no photorealism, no blur. Friendly, school-appropriate mood. A small crooked yellow paper note with a few abstract wavy pencil scribble lines on it that do not form letters or numbers, a little tape on the top edge. No readable writing. Flat pure magenta background (#FF00FF) without gradient, texture or shadow. Nothing cropped. No ground shadow under the figure.
```

**Prüfen:**

- [ ] Das Gekritzel sieht nicht wie Buchstaben oder Zahlen aus.

### Nr 42: Taschensymbol (Inventar)

Speichern als: `icon_tasche.png` in `assets/icons/`

**Werkzeug:** Einzel-Sprite (Art Icon, Name icon_tasche), Magenta freistellen

**Anhängen:** nichts

```
Pixel art look, three-quarter top-down view like a classic 16-bit adventure game, chunky visible pixels, dark outlines, soft cel shading, warm friendly colours (teal, off-white, warm wood brown, signal orange, soft grey, a little yellow), clean readable shapes. No text, no letters, no numbers, no logos, no watermark, no photorealism, no blur. Friendly, school-appropriate mood. A single small icon of a teal gym duffel bag with an orange zipper and a short carrying strap, side view, bold simple shapes, readable at small size. No text, no logo. Flat pure magenta background (#FF00FF) without gradient, texture or shadow. Nothing cropped. No ground shadow under the figure.
```

**Prüfen:**

- [ ] Auch klein noch als Tasche erkennbar, keine Schrift.

### Nr 43: Schließfach (zu und offen)

Speichern als: `obj_fach_sheet.png` (das Grafik-Werkzeug teilt es danach in obj_fach_0.png … obj_fach_1.png)

**Werkzeug:** Sheet teilen (Spalten 2, Magenta freistellen, Name obj_fach)

**Anhängen:** nichts

```
Pixel art look, three-quarter top-down view like a classic 16-bit adventure game, chunky visible pixels, dark outlines, soft cel shading, warm friendly colours (teal, off-white, warm wood brown, signal orange, soft grey, a little yellow), clean readable shapes. No text, no letters, no numbers, no logos, no watermark, no photorealism, no blur. Friendly, school-appropriate mood. Two views of the same small locker door in a row, equal size and spacing: left closed, with a blank keypad lock on the door, right with the door swung open showing an empty teal interior. Teal metal, no numbers, no text, no stickers. Flat pure magenta background (#FF00FF) without gradient, texture or shadow. Nothing cropped. No ground shadow under the figure.
```

**Prüfen:**

- [ ] Zwei Bilder: zu und offen, gleiche Größe, keine Ziffern am Schloss.

### Nr 44: Aufkleber (vier Stück)

Speichern als: `obj_aufkleber_sheet.png` (das Grafik-Werkzeug teilt es danach in obj_aufkleber_0.png … obj_aufkleber_3.png)

**Werkzeug:** Sheet teilen (Spalten 4, Magenta freistellen, Name obj_aufkleber)

**Anhängen:** nichts

```
Pixel art look, three-quarter top-down view like a classic 16-bit adventure game, chunky visible pixels, dark outlines, soft cel shading, warm friendly colours (teal, off-white, warm wood brown, signal orange, soft grey, a little yellow), clean readable shapes. No text, no letters, no numbers, no logos, no watermark, no photorealism, no blur. Friendly, school-appropriate mood. Four round sticker badges in one row, same size, equal spacing, each with a thick white outline: (1) a yellow star, (2) a small dumbbell, (3) a test tube with green liquid, (4) an orange lightning bolt. No text, no numbers. Flat pure magenta background (#FF00FF) without gradient, texture or shadow. Nothing cropped. No ground shadow under the figure.
```

**Prüfen:**

- [ ] Vier Aufkleber, gleich groß, klarer Abstand, keine Schrift.

## Nachbesserungen (im selben Chat direkt nach dem Bild senden)

**Text oder Pseudoschrift im Bild**

```
Redo the image exactly the same, but remove all text, letters, numbers and symbols that look like writing. Posters, boards and labels must be completely blank.
```

**Hintergrund nicht einfarbig**

```
Redo the image exactly the same, but make the background one single flat pure magenta (#FF00FF), without gradient, noise, shadow or texture.
```

**Figuren berühren sich oder Abstand fehlt**

```
Redo the strip exactly the same, but leave clearly more empty space between the frames so that no frame touches another.
```

**Figur weicht vom Referenzbild ab**

```
The character does not match the attached reference. Use the attached character exactly: same face, hair, clothes, colours and proportions.
```

**Bodenmitte nicht frei**

```
Redo the scene exactly the same, but keep the middle of the floor completely empty, with no furniture or objects between 15 and 85 percent of the width and 35 and 92 percent of the height.
```

**Personen in der Szene**

```
Redo the scene exactly the same, but without any people or figures.
```

**Stil weicht von der Referenz ab**

```
Match the attached reference exactly in pixel size, outlines, shading and colour palette.
```

**Zu wenig Pixel-Optik**

```
Make it look more like chunky pixel art: clearly visible pixels, dark outlines, flat cel shading, no soft gradients, no blur.
```

