# Noch offene Grafiken (Protein-Gym)

Diese Datei enthält **nur** Bilder, die noch fehlen. Alles Fertige steht in `PROMPTS_KOPIEREN.md` und ist hier nicht mehr aufgeführt. Die Nummern sind dieselben wie dort. Je Bild: Block kopieren, in ChatGPT einfügen, bei „Anhängen“ das genannte Bild mitschicken, Ergebnis unter dem Dateinamen speichern, danach `node tools/precache.mjs` ausführen. Höchstens zwei Nachbesserungen je Bild (die kurzen Sätze stehen unten).

**Ohne diese Bilder läuft das Spiel vollständig:** es zeichnet die fehlenden Papierflächen als Farbflächen und die fehlende Figur als Platzhalter. Offen sind 0 Bilder, optional 6.

| Nr | Datei | Anhängen | Status |
|---|---|---|---|
| 38 | obj_ausweis.png | - | optional |
| 39 | obj_leser_0.png … obj_leser_1.png | - | optional |
| 40 | obj_tastenfeld.png | - | optional |
| 41 | icon_tasche.png | - | optional |
| 42 | obj_fach_0.png … obj_fach_1.png | - | optional |
| 43 | obj_tattoo_0.png … obj_tattoo_1.png | - | optional |

## Offen (fehlt im Spiel)

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

### Nr 41: Taschensymbol (Inventar)

Speichern als: `icon_tasche.png` in `assets/icons/`

**Werkzeug:** Einzel-Sprite (Art Icon, Name icon_tasche), Magenta freistellen

**Anhängen:** nichts

```
Pixel art look, three-quarter top-down view like a classic 16-bit adventure game, chunky visible pixels, dark outlines, soft cel shading, warm friendly colours (teal, off-white, warm wood brown, signal orange, soft grey, a little yellow), clean readable shapes. No text, no letters, no numbers, no logos, no watermark, no photorealism, no blur. Friendly, school-appropriate mood. A single small icon of a teal gym duffel bag with an orange zipper and a short carrying strap, side view, bold simple shapes, readable at small size. No text, no logo. Flat pure magenta background (#FF00FF) without gradient, texture or shadow. Nothing cropped. No ground shadow under the figure.
```

**Prüfen:**

- [ ] Auch klein noch als Tasche erkennbar, keine Schrift.

### Nr 42: Schließfach (zu und offen)

Speichern als: `obj_fach_sheet.png` (das Grafik-Werkzeug teilt es danach in obj_fach_0.png … obj_fach_1.png)

**Werkzeug:** Sheet teilen (Spalten 2, Magenta freistellen, Name obj_fach)

**Anhängen:** nichts

```
Pixel art look, three-quarter top-down view like a classic 16-bit adventure game, chunky visible pixels, dark outlines, soft cel shading, warm friendly colours (teal, off-white, warm wood brown, signal orange, soft grey, a little yellow), clean readable shapes. No text, no letters, no numbers, no logos, no watermark, no photorealism, no blur. Friendly, school-appropriate mood. Two views of the same small locker door in a row, equal size and spacing: left closed, with a blank keypad lock on the door, right with the door swung open showing an empty teal interior. Teal metal, no numbers, no text, no stickers. Flat pure magenta background (#FF00FF) without gradient, texture or shadow. Nothing cropped. No ground shadow under the figure.
```

**Prüfen:**

- [ ] Zwei Bilder: zu und offen, gleiche Größe, keine Ziffern am Schloss.

### Nr 43: Klebe-Tattoos (zwei Stück)

Speichern als: `obj_tattoo_sheet.png` (das Grafik-Werkzeug teilt es danach in obj_tattoo_0.png … obj_tattoo_1.png)

**Werkzeug:** Sheet teilen (Spalten 2, Magenta freistellen, Name obj_tattoo)

**Anhängen:** nichts

```
Pixel art look, three-quarter top-down view like a classic 16-bit adventure game, chunky visible pixels, dark outlines, soft cel shading, warm friendly colours (teal, off-white, warm wood brown, signal orange, soft grey, a little yellow), clean readable shapes. No text, no letters, no numbers, no logos, no watermark, no photorealism, no blur. Friendly, school-appropriate mood. Two temporary tattoo stickers in one row, same size, equal spacing, each on a small rectangular piece of glossy backing paper with a slightly peeled corner: (1) a bold black-and-teal dumbbell, (2) a shiny golden flexed biceps arm wearing tiny cool sunglasses, playful and friendly. No text, no numbers, no skulls. Flat pure magenta background (#FF00FF) without gradient, texture or shadow. Nothing cropped. No ground shadow under the figure.
```

**Prüfen:**

- [ ] Zwei Tattoos auf Trägerpapier, gleich groß, klarer Abstand, keine Schrift, wirkt lustig statt hart.

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

