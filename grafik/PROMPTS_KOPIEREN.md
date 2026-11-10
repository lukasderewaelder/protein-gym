# Prompts zum Kopieren (Protein-Gym)

**Stand:** Erledigt und im Spiel eingebaut: die sechs Szenen (Nr 1–6), die Spielfigur (Nr 7–11), Markus (Trainer), Alex, Hannes, Zoe und Kurt (Sprite und Porträts), das Porträt-Sheet von Desi (Nr 21), Zertifikat-Rahmen (Nr 29), App-Icon (Nr 30) und die Haftnotiz-Textur (Nr 31). Objekte und Icons (Nr 24–28) sind aufbereitet und liegen in `assets/figuren`, werden aber noch nicht im Spiel gezeigt. **Noch offen:** der Sprite von Desi (Nr 20, `npc_desi.png`) und die Papiertexturen Nr 32–37 (Karteikarte, Zeitung, Heft, Formular, Emailleschild, Korkwand). Bereits erledigte Nummern kannst du überspringen.

Von oben nach unten abarbeiten. Je Bild: Block kopieren, in ChatGPT einfügen, bei „Anhängen“ das genannte Bild mitschicken, Ergebnis unter dem Dateinamen speichern. Jeder Block ist vollständig, es muss nichts ergänzt werden. Die Reihenfolge ist so gewählt, dass jedes Referenzbild schon vorher entstanden ist.

Ein Chat pro Gruppe: Szenen in einem Chat, Spielfigur in einem Chat, jede NPC-Figur (Sprite und Porträt) in einem eigenen Chat. Höchstens zwei Nachbesserungen je Bild, die kurzen Sätze stehen ganz unten. Stil, Ablauf und Prüflisten stehen in `PROMPTS.md`.

| Nr | Datei | Anhängen |
|---|---|---|
| 1 | szene_trainingsflaeche.webp | - |
| 2 | szene_empfang.webp | szene_trainingsflaeche (Ergebnis der Szene Trainingsfläche) |
| 3 | szene_labor.webp | szene_trainingsflaeche |
| 4 | szene_sauna.webp | szene_trainingsflaeche |
| 5 | szene_shakebar.webp | szene_trainingsflaeche |
| 6 | titel.webp | szene_trainingsflaeche |
| 7 | figur_v1_ref.png | - |
| 8 | figur_v1_walk_down.png | figur_v1_ref.png (Referenzblatt der Spielfigur) |
| 9 | figur_v1_walk_up.png | figur_v1_ref.png (Referenzblatt der Spielfigur) |
| 10 | figur_v1_walk_left.png | figur_v1_ref.png (Referenzblatt der Spielfigur) |
| 11 | figur_v1_walk_right.png | figur_v1_ref.png (Referenzblatt der Spielfigur) |
| 12 | npc_trainer.png | figur_v1_ref.png (damit Proportionen und Stil passen) |
| 13 | trainer_0.png … trainer_3.png | npc_trainer.png (der Sprite dieser Figur) |
| 14 | npc_alex.png | figur_v1_ref.png (damit Proportionen und Stil passen) |
| 15 | alex_0.png … alex_3.png | npc_alex.png (der Sprite dieser Figur) |
| 16 | npc_hannes.png | figur_v1_ref.png (damit Proportionen und Stil passen) |
| 17 | hannes_0.png … hannes_2.png | npc_hannes.png (der Sprite dieser Figur) |
| 18 | npc_zoe.png | figur_v1_ref.png (damit Proportionen und Stil passen) |
| 19 | zoe_0.png … zoe_2.png | npc_zoe.png (der Sprite dieser Figur) |
| 20 | npc_desi.png | figur_v1_ref.png (damit Proportionen und Stil passen) |
| 21 | desi_0.png … desi_2.png | npc_desi.png (der Sprite dieser Figur) |
| 22 | npc_kurt.png | figur_v1_ref.png (damit Proportionen und Stil passen) |
| 23 | kurt_0.png … kurt_2.png | npc_kurt.png (der Sprite dieser Figur) |
| 24 | obj_pfanne.png | szene_sauna (für den Stil) |
| 25 | obj_scheibe.png | - |
| 26 | obj_sonstiges_0.png … obj_sonstiges_3.png | - |
| 27 | icons_quellen_0.png … icons_quellen_5.png | - |
| 28 | icons_struktur_0.png … icons_struktur_2.png | - |
| 29 | zertifikat_rahmen.webp | szene_trainingsflaeche |
| 30 | icon.png | - |
| 31 | fund_haftnotiz.png | - |
| 32 | fund_karteikarte.png | - |
| 33 | fund_zeitung.png | - |
| 34 | fund_heft.png | - |
| 35 | fund_formular.png | - |
| 36 | fund_metallschild.png | - |
| 37 | pinnwand_kork.png | - |

## Szenen

### Nr 1: Szene Trainingsfläche (zuerst erzeugen, legt den Stil fest)

Speichern als: `szene_trainingsflaeche.webp`

**Anhängen:** nichts

```
Pixel art look, three-quarter top-down view like a classic 16-bit adventure game, chunky visible pixels, dark outlines, soft cel shading, warm friendly colours (teal, off-white, warm wood brown, signal orange, soft grey, a little yellow), clean readable shapes. No text, no letters, no numbers, no logos, no watermark, no photorealism, no blur. Friendly, school-appropriate mood. A bright modern gym training floor, seen from above at a slight angle. 3:2 landscape image. Keep the middle of the floor completely empty and free for walking (roughly 15 to 85 percent of the width and 35 to 92 percent of the height). Positions are given as percent of image width (x) and height (y), measured from the top left. No people, no text anywhere. Back wall (top 30 percent of the image): in the centre (x 50) a large dumbbell rack with a barbell and empty plate holders; at x 30 a wall mirror with a small blank information board beside it; at x 66 a blank wall board for a training plan (empty light panel, no writing); at x 82 an empty framed poster with blank paper. Left wall: a padded bench at x 4 to 15, y 41 to 66, and a water cooler above it at x 9, y 38. Right wall: a sturdy wooden workbench at x 81 to 96, y 37 to 66, with a large blank dark screen mounted above it. Floor: grey rubber tiles with a teal stripe. One door in the middle of the bottom edge (x 50). Do not draw weight plates lying around.
```

### Nr 2: Szene Empfang

Speichern als: `szene_empfang.webp`

**Anhängen:** szene_trainingsflaeche (Ergebnis der Szene Trainingsfläche)

```
Pixel art look, three-quarter top-down view like a classic 16-bit adventure game, chunky visible pixels, dark outlines, soft cel shading, warm friendly colours (teal, off-white, warm wood brown, signal orange, soft grey, a little yellow), clean readable shapes. No text, no letters, no numbers, no logos, no watermark, no photorealism, no blur. Friendly, school-appropriate mood. Use the attached image as exact style reference (same pixel size, outlines, shading and colours). Reception area of the same gym, seen from above at a slight angle. 3:2 landscape image. Keep the middle of the floor completely empty and free for walking (roughly 15 to 85 percent of the width and 35 to 92 percent of the height). Positions are given as percent of image width (x) and height (y), measured from the top left. No people, no text anywhere. Back wall (top 30 percent): a wall of tall lockers spanning x 25 to 75, about 8 lockers, one slightly open, the middle locker at x 51; an empty framed poster with blank paper at x 69; a large blank cork board on the right wall at x 95, y 59. Left side: a reception counter at x 4 to 25, y 32 to 51, with a blank computer monitor, a lamp and a tray. Top right: a small sofa at x 74 to 94, y 29 to 45. A hand-sanitiser dispenser on the left wall at x 8, y 75. Bottom wall: four different doors evenly spaced at x 20, 39, 59 and 78, each with a small round symbol plate above it without any writing: a dumbbell, a test tube, a puff of steam, a shaker cup. Floor: warm wood with a teal runner.
```

### Nr 3: Szene Labor

Speichern als: `szene_labor.webp`

**Anhängen:** szene_trainingsflaeche

```
Pixel art look, three-quarter top-down view like a classic 16-bit adventure game, chunky visible pixels, dark outlines, soft cel shading, warm friendly colours (teal, off-white, warm wood brown, signal orange, soft grey, a little yellow), clean readable shapes. No text, no letters, no numbers, no logos, no watermark, no photorealism, no blur. Friendly, school-appropriate mood. Use the attached image as exact style reference (same pixel size, outlines, shading and colours). A small school chemistry lab room, bright and clean (white, light grey, teal), seen from above at a slight angle. 3:2 landscape image. Keep the middle of the floor completely empty and free for walking (roughly 15 to 85 percent of the width and 35 to 92 percent of the height). Positions are given as percent of image width (x) and height (y), measured from the top left. No people, no text anywhere. Back wall (top 30 percent): a large clean blank whiteboard at x 50, y 29; a framed blank wall chart (empty panel, no writing) at x 33; a fridge with a half-open door and egg cartons inside at x 66, a sink at x 18. Left side: a long lab table at x 4 to 21, y 32 to 83, carrying a hotplate and an empty water-bath pot (no test tubes), the hotplate at about x 21, y 59. Right side: a second long lab table at x 79 to 96, y 32 to 83, with an empty space for a test-tube rack (no tubes), the rack spot at about x 78, y 59. A yellow lidded waste bin near the right table. Hooks with safety goggles and white lab coats beside the door in the bottom wall (door at x 50). No test tubes, no bottles with labels.
```

### Nr 4: Szene Sauna

Speichern als: `szene_sauna.webp`

**Anhängen:** szene_trainingsflaeche

```
Pixel art look, three-quarter top-down view like a classic 16-bit adventure game, chunky visible pixels, dark outlines, soft cel shading, warm friendly colours (teal, off-white, warm wood brown, signal orange, soft grey, a little yellow), clean readable shapes. No text, no letters, no numbers, no logos, no watermark, no photorealism, no blur. Friendly, school-appropriate mood. Use the attached image as exact style reference (same pixel size, outlines, shading and colours). A wooden sauna room with a small kitchenette corner, warm orange light and soft steam, seen from above at a slight angle. 3:2 landscape image. Keep the middle of the floor completely empty and free for walking (roughly 15 to 85 percent of the width and 35 to 92 percent of the height). Positions are given as percent of image width (x) and height (y), measured from the top left. No people, no text anywhere. Two tiers of wooden benches along the back wall and the left wall. A stone-filled sauna oven in the left corner at x 4 to 23, y 32 to 58 with soft steam rising, a bucket and ladle next to it. Back wall: an empty round thermometer plate at x 50, y 30 (no numbers, no marks). Right side: a small counter at x 79 to 96, y 37 to 60 with a single-plate hotplate, EMPTY (no pan on it), the hotplate at about x 87, y 62. A single door in the bottom wall (x 50).
```

### Nr 5: Szene Shake-Bar

Speichern als: `szene_shakebar.webp`

**Anhängen:** szene_trainingsflaeche

```
Pixel art look, three-quarter top-down view like a classic 16-bit adventure game, chunky visible pixels, dark outlines, soft cel shading, warm friendly colours (teal, off-white, warm wood brown, signal orange, soft grey, a little yellow), clean readable shapes. No text, no letters, no numbers, no logos, no watermark, no photorealism, no blur. Friendly, school-appropriate mood. Use the attached image as exact style reference (same pixel size, outlines, shading and colours). A gym smoothie and protein shake bar, fresh and bright (lemon yellow, orange, teal), seen from above at a slight angle. 3:2 landscape image. Keep the middle of the floor completely empty and free for walking (roughly 15 to 85 percent of the width and 35 to 92 percent of the height). Positions are given as percent of image width (x) and height (y), measured from the top left. No people, no text anywhere. A bar counter along the whole back wall (top 33 percent): a blender at x 50, y 34; shelves with plain unlabeled tubs at x 26, y 34; a bowl of citrus fruit on the counter at x 67; a glass display fridge with plain unlabeled bottles at x 81, y 34. Three bar stools in front of the counter. Left wall: a blank framed advertising board (empty panel, no writing) at x 4 to 13, y 39 to 68. One door in the bottom wall (x 50). All bottles, tubs and boards completely blank.
```

### Nr 6: Titelbild (Studio-Fassade)

Speichern als: `titel.webp`

**Anhängen:** szene_trainingsflaeche

```
Pixel art look, three-quarter top-down view like a classic 16-bit adventure game, chunky visible pixels, dark outlines, soft cel shading, warm friendly colours (teal, off-white, warm wood brown, signal orange, soft grey, a little yellow), clean readable shapes. No text, no letters, no numbers, no logos, no watermark, no photorealism, no blur. Friendly, school-appropriate mood. Use the attached image as style reference. The front of a friendly modern gym building seen from the street at dusk, 3:2 landscape image, a big glass door in the centre, an empty blank sign above the door (no writing), a small dumbbell symbol on the door, warm light from inside, a few potted plants. No people, no text, no letters.
```

## Spielfigur

### Nr 7: Spielfigur: Referenzblatt

Speichern als: `figur_v1_ref.png`

**Anhängen:** nichts

```
Pixel art look, three-quarter top-down view like a classic 16-bit adventure game, chunky visible pixels, dark outlines, soft cel shading, warm friendly colours (teal, off-white, warm wood brown, signal orange, soft grey, a little yellow), clean readable shapes. No text, no letters, no numbers, no logos, no watermark, no photorealism, no blur. Friendly, school-appropriate mood. Character reference sheet. A character: a friendly teenage gym-goer, gender-neutral, medium skin tone, short hair, a plain bright red t-shirt, dark sport shorts, white sneakers, a sweat band on one wrist, chibi-like proportions about 3 heads tall. Show four poses next to each other with clear empty space between them, same size and same proportions in every pose: standing facing down (towards the viewer), standing facing up (seen from behind), standing facing left, standing facing right. No text. Flat pure magenta background (#FF00FF) without gradient, texture or shadow. Nothing cropped. No ground shadow under the figure.
```

### Nr 8: Spielfigur: Lauf-Streifen down

Speichern als: `figur_v1_walk_down.png`

**Anhängen:** figur_v1_ref.png (Referenzblatt der Spielfigur)

```
Pixel art look, three-quarter top-down view like a classic 16-bit adventure game, chunky visible pixels, dark outlines, soft cel shading, warm friendly colours (teal, off-white, warm wood brown, signal orange, soft grey, a little yellow), clean readable shapes. No text, no letters, no numbers, no logos, no watermark, no photorealism, no blur. Friendly, school-appropriate mood. Use the attached character exactly (same face, hair, colours, outfit and proportions). Create ONE horizontal strip with exactly 4 walking animation frames. The character faces down towards the viewer (front view). All four frames have the same size and are clearly separated by empty space, equally spaced, with the feet of all four frames on the same baseline. Frame 1 and frame 3 are a standing pose with legs together, frame 2 and frame 4 are a stride pose with opposite legs forward and arms swinging a little. Same pixel art look as the reference. No text. Flat pure magenta background (#FF00FF) without gradient, texture or shadow. Nothing cropped. No ground shadow under the figure.
```

### Nr 9: Spielfigur: Lauf-Streifen up

Speichern als: `figur_v1_walk_up.png`

**Anhängen:** figur_v1_ref.png (Referenzblatt der Spielfigur)

```
Pixel art look, three-quarter top-down view like a classic 16-bit adventure game, chunky visible pixels, dark outlines, soft cel shading, warm friendly colours (teal, off-white, warm wood brown, signal orange, soft grey, a little yellow), clean readable shapes. No text, no letters, no numbers, no logos, no watermark, no photorealism, no blur. Friendly, school-appropriate mood. Use the attached character exactly (same face, hair, colours, outfit and proportions). Create ONE horizontal strip with exactly 4 walking animation frames. The character faces away from the viewer (back view). All four frames have the same size and are clearly separated by empty space, equally spaced, with the feet of all four frames on the same baseline. Frame 1 and frame 3 are a standing pose with legs together, frame 2 and frame 4 are a stride pose with opposite legs forward and arms swinging a little. Same pixel art look as the reference. No text. Flat pure magenta background (#FF00FF) without gradient, texture or shadow. Nothing cropped. No ground shadow under the figure.
```

### Nr 10: Spielfigur: Lauf-Streifen left

Speichern als: `figur_v1_walk_left.png`

**Anhängen:** figur_v1_ref.png (Referenzblatt der Spielfigur)

```
Pixel art look, three-quarter top-down view like a classic 16-bit adventure game, chunky visible pixels, dark outlines, soft cel shading, warm friendly colours (teal, off-white, warm wood brown, signal orange, soft grey, a little yellow), clean readable shapes. No text, no letters, no numbers, no logos, no watermark, no photorealism, no blur. Friendly, school-appropriate mood. Use the attached character exactly (same face, hair, colours, outfit and proportions). Create ONE horizontal strip with exactly 4 walking animation frames. The character is seen from the side, facing left. All four frames have the same size and are clearly separated by empty space, equally spaced, with the feet of all four frames on the same baseline. Frame 1 and frame 3 are a standing pose with legs together, frame 2 and frame 4 are a stride pose with opposite legs forward and arms swinging a little. Same pixel art look as the reference. No text. Flat pure magenta background (#FF00FF) without gradient, texture or shadow. Nothing cropped. No ground shadow under the figure.
```

### Nr 11: Spielfigur: Lauf-Streifen right

Speichern als: `figur_v1_walk_right.png`

**Anhängen:** figur_v1_ref.png (Referenzblatt der Spielfigur)

```
Pixel art look, three-quarter top-down view like a classic 16-bit adventure game, chunky visible pixels, dark outlines, soft cel shading, warm friendly colours (teal, off-white, warm wood brown, signal orange, soft grey, a little yellow), clean readable shapes. No text, no letters, no numbers, no logos, no watermark, no photorealism, no blur. Friendly, school-appropriate mood. Use the attached character exactly (same face, hair, colours, outfit and proportions). Create ONE horizontal strip with exactly 4 walking animation frames. The character is seen from the side, facing right. All four frames have the same size and are clearly separated by empty space, equally spaced, with the feet of all four frames on the same baseline. Frame 1 and frame 3 are a standing pose with legs together, frame 2 and frame 4 are a stride pose with opposite legs forward and arms swinging a little. Same pixel art look as the reference. No text. Flat pure magenta background (#FF00FF) without gradient, texture or shadow. Nothing cropped. No ground shadow under the figure.
```

## NPCs

### Nr 12: Markus (Trainer): Sprite (Stehbild)

Speichern als: `npc_trainer.png`

**Anhängen:** figur_v1_ref.png (damit Proportionen und Stil passen)

```
Pixel art look, three-quarter top-down view like a classic 16-bit adventure game, chunky visible pixels, dark outlines, soft cel shading, warm friendly colours (teal, off-white, warm wood brown, signal orange, soft grey, a little yellow), clean readable shapes. No text, no letters, no numbers, no logos, no watermark, no photorealism, no blur. Friendly, school-appropriate mood. Use the attached character sheet only as reference for the pixel art style, proportions (chibi-like, about 3 heads tall) and line work. Create a different character: a single full-body sprite of a friendly male coach in his thirties, athletic, wearing a teal tracksuit with a whistle around the neck, relaxed standing pose with arms down, kind smile. Standing facing the viewer. Flat pure magenta background (#FF00FF) without gradient, texture or shadow. Nothing cropped. No ground shadow under the figure. No text.
```

### Nr 13: Markus (Trainer): Porträt-Sheet (4 Ausdrücke)

Speichern als: `trainer_sheet.png` (das Grafik-Werkzeug teilt es danach in trainer_0.png … trainer_3.png)

**Anhängen:** npc_trainer.png (der Sprite dieser Figur)

```
Pixel art look, frontal view in the style of a classic 16-bit adventure game dialogue portrait, chunky visible pixels, dark outlines, soft cel shading, warm friendly colours (teal, off-white, warm wood brown, signal orange, soft grey, a little yellow), clean readable shapes. No text, no letters, no numbers, no logos, no watermark, no photorealism, no blur. Friendly, school-appropriate mood. Use the attached character exactly (same face, hair, clothes and colours). Create a portrait sheet: 4 head-and-shoulders portraits in one row, same face in every portrait, same size, equal spacing, nothing cropped. Expressions from left to right: (1) neutral and friendly, (2) grinning, (3) thoughtful with a hand on the chin, (4) excited with raised eyebrows. Pixel art look as in the reference, square portraits. Flat dark teal background (#0F3B40) behind every portrait. No text.
```

### Nr 14: Alex (Trainingspartner): Sprite (Stehbild)

Speichern als: `npc_alex.png`

**Anhängen:** figur_v1_ref.png (damit Proportionen und Stil passen)

```
Pixel art look, three-quarter top-down view like a classic 16-bit adventure game, chunky visible pixels, dark outlines, soft cel shading, warm friendly colours (teal, off-white, warm wood brown, signal orange, soft grey, a little yellow), clean readable shapes. No text, no letters, no numbers, no logos, no watermark, no photorealism, no blur. Friendly, school-appropriate mood. Use the attached character sheet only as reference for the pixel art style, proportions (chibi-like, about 3 heads tall) and line work. Create a different character: a single full-body sprite of a teenage gym buddy, gender-neutral, wearing a grey hoodie and jeans, holding a protein shaker bottle without any label, relaxed standing pose. Standing facing the viewer. Flat pure magenta background (#FF00FF) without gradient, texture or shadow. Nothing cropped. No ground shadow under the figure. No text.
```

### Nr 15: Alex (Trainingspartner): Porträt-Sheet (4 Ausdrücke)

Speichern als: `alex_sheet.png` (das Grafik-Werkzeug teilt es danach in alex_0.png … alex_3.png)

**Anhängen:** npc_alex.png (der Sprite dieser Figur)

```
Pixel art look, frontal view in the style of a classic 16-bit adventure game dialogue portrait, chunky visible pixels, dark outlines, soft cel shading, warm friendly colours (teal, off-white, warm wood brown, signal orange, soft grey, a little yellow), clean readable shapes. No text, no letters, no numbers, no logos, no watermark, no photorealism, no blur. Friendly, school-appropriate mood. Use the attached character exactly (same face, hair, clothes and colours). Create a portrait sheet: 4 head-and-shoulders portraits in one row, same face in every portrait, same size, equal spacing, nothing cropped. Expressions from left to right: (1) curious, (2) sceptical, (3) convinced and smiling, (4) disappointed. Pixel art look as in the reference, square portraits. Flat dark teal background (#0F3B40) behind every portrait. No text.
```

### Nr 16: Hitze-Hannes (Sauna, Verdächtiger „Hitze“): Sprite (Stehbild)

Speichern als: `npc_hannes.png`

**Anhängen:** figur_v1_ref.png (damit Proportionen und Stil passen)

```
Pixel art look, three-quarter top-down view like a classic 16-bit adventure game, chunky visible pixels, dark outlines, soft cel shading, warm friendly colours (teal, off-white, warm wood brown, signal orange, soft grey, a little yellow), clean readable shapes. No text, no letters, no numbers, no logos, no watermark, no photorealism, no blur. Friendly, school-appropriate mood. Use the attached character sheet only as reference for the pixel art style, proportions (chibi-like, about 3 heads tall) and line work. Create a different character: a single full-body sprite of a stocky friendly sauna attendant, wearing a towel over one shoulder and a red-orange felt sauna hat, a little sweat on the forehead, standing relaxed. Standing facing the viewer. Flat pure magenta background (#FF00FF) without gradient, texture or shadow. Nothing cropped. No ground shadow under the figure. No text.
```

### Nr 17: Hitze-Hannes (Sauna, Verdächtiger „Hitze“): Porträt-Sheet (3 Ausdrücke)

Speichern als: `hannes_sheet.png` (das Grafik-Werkzeug teilt es danach in hannes_0.png … hannes_2.png)

**Anhängen:** npc_hannes.png (der Sprite dieser Figur)

```
Pixel art look, frontal view in the style of a classic 16-bit adventure game dialogue portrait, chunky visible pixels, dark outlines, soft cel shading, warm friendly colours (teal, off-white, warm wood brown, signal orange, soft grey, a little yellow), clean readable shapes. No text, no letters, no numbers, no logos, no watermark, no photorealism, no blur. Friendly, school-appropriate mood. Use the attached character exactly (same face, hair, clothes and colours). Create a portrait sheet: 3 head-and-shoulders portraits in one row, same face in every portrait, same size, equal spacing, nothing cropped. Expressions from left to right: (1) innocent, (2) nervous, (3) caught. Pixel art look as in the reference, square portraits. Flat dark teal background (#0F3B40) behind every portrait. No text.
```

### Nr 18: Zitrus-Zoe (Shake-Bar, Verdächtige „Säure“): Sprite (Stehbild)

Speichern als: `npc_zoe.png`

**Anhängen:** figur_v1_ref.png (damit Proportionen und Stil passen)

```
Pixel art look, three-quarter top-down view like a classic 16-bit adventure game, chunky visible pixels, dark outlines, soft cel shading, warm friendly colours (teal, off-white, warm wood brown, signal orange, soft grey, a little yellow), clean readable shapes. No text, no letters, no numbers, no logos, no watermark, no photorealism, no blur. Friendly, school-appropriate mood. Use the attached character sheet only as reference for the pixel art style, proportions (chibi-like, about 3 heads tall) and line work. Create a different character: a single full-body sprite of a cheerful bartender wearing a yellow apron and a lemon-yellow headband, holding a lemon in one hand, standing relaxed. Standing facing the viewer. Flat pure magenta background (#FF00FF) without gradient, texture or shadow. Nothing cropped. No ground shadow under the figure. No text.
```

### Nr 19: Zitrus-Zoe (Shake-Bar, Verdächtige „Säure“): Porträt-Sheet (3 Ausdrücke)

Speichern als: `zoe_sheet.png` (das Grafik-Werkzeug teilt es danach in zoe_0.png … zoe_2.png)

**Anhängen:** npc_zoe.png (der Sprite dieser Figur)

```
Pixel art look, frontal view in the style of a classic 16-bit adventure game dialogue portrait, chunky visible pixels, dark outlines, soft cel shading, warm friendly colours (teal, off-white, warm wood brown, signal orange, soft grey, a little yellow), clean readable shapes. No text, no letters, no numbers, no logos, no watermark, no photorealism, no blur. Friendly, school-appropriate mood. Use the attached character exactly (same face, hair, clothes and colours). Create a portrait sheet: 3 head-and-shoulders portraits in one row, same face in every portrait, same size, equal spacing, nothing cropped. Expressions from left to right: (1) innocent, (2) nervous, (3) caught. Pixel art look as in the reference, square portraits. Flat dark teal background (#0F3B40) behind every portrait. No text.
```

### Nr 20: Desi (Empfang, Verdächtige „Alkohol“): Sprite (Stehbild)

Speichern als: `npc_desi.png`

**Anhängen:** figur_v1_ref.png (damit Proportionen und Stil passen)

```
Pixel art look, three-quarter top-down view like a classic 16-bit adventure game, chunky visible pixels, dark outlines, soft cel shading, warm friendly colours (teal, off-white, warm wood brown, signal orange, soft grey, a little yellow), clean readable shapes. No text, no letters, no numbers, no logos, no watermark, no photorealism, no blur. Friendly, school-appropriate mood. Use the attached character sheet only as reference for the pixel art style, proportions (chibi-like, about 3 heads tall) and line work. Create a different character: a single full-body sprite of a tidy hygiene helper wearing a light blue tunic, holding a spray bottle with a completely blank bottle, standing relaxed. Standing facing the viewer. Flat pure magenta background (#FF00FF) without gradient, texture or shadow. Nothing cropped. No ground shadow under the figure. No text.
```

### Nr 21: Desi (Empfang, Verdächtige „Alkohol“): Porträt-Sheet (3 Ausdrücke)

Speichern als: `desi_sheet.png` (das Grafik-Werkzeug teilt es danach in desi_0.png … desi_2.png)

**Anhängen:** npc_desi.png (der Sprite dieser Figur)

```
Pixel art look, frontal view in the style of a classic 16-bit adventure game dialogue portrait, chunky visible pixels, dark outlines, soft cel shading, warm friendly colours (teal, off-white, warm wood brown, signal orange, soft grey, a little yellow), clean readable shapes. No text, no letters, no numbers, no logos, no watermark, no photorealism, no blur. Friendly, school-appropriate mood. Use the attached character exactly (same face, hair, clothes and colours). Create a portrait sheet: 3 head-and-shoulders portraits in one row, same face in every portrait, same size, equal spacing, nothing cropped. Expressions from left to right: (1) innocent, (2) nervous, (3) caught. Pixel art look as in the reference, square portraits. Flat dark teal background (#0F3B40) behind every portrait. No text.
```

### Nr 22: Kupfer-Kurt (Labor, Verdächtiger „Schwermetallsalz“): Sprite (Stehbild)

Speichern als: `npc_kurt.png`

**Anhängen:** figur_v1_ref.png (damit Proportionen und Stil passen)

```
Pixel art look, three-quarter top-down view like a classic 16-bit adventure game, chunky visible pixels, dark outlines, soft cel shading, warm friendly colours (teal, off-white, warm wood brown, signal orange, soft grey, a little yellow), clean readable shapes. No text, no letters, no numbers, no logos, no watermark, no photorealism, no blur. Friendly, school-appropriate mood. Use the attached character sheet only as reference for the pixel art style, proportions (chibi-like, about 3 heads tall) and line work. Create a different character: a single full-body sprite of a laboratory technician wearing a white lab coat with copper-coloured safety goggles pushed up on the forehead, an old copper kettle standing at their side, standing relaxed. Standing facing the viewer. Flat pure magenta background (#FF00FF) without gradient, texture or shadow. Nothing cropped. No ground shadow under the figure. No text.
```

### Nr 23: Kupfer-Kurt (Labor, Verdächtiger „Schwermetallsalz“): Porträt-Sheet (3 Ausdrücke)

Speichern als: `kurt_sheet.png` (das Grafik-Werkzeug teilt es danach in kurt_0.png … kurt_2.png)

**Anhängen:** npc_kurt.png (der Sprite dieser Figur)

```
Pixel art look, frontal view in the style of a classic 16-bit adventure game dialogue portrait, chunky visible pixels, dark outlines, soft cel shading, warm friendly colours (teal, off-white, warm wood brown, signal orange, soft grey, a little yellow), clean readable shapes. No text, no letters, no numbers, no logos, no watermark, no photorealism, no blur. Friendly, school-appropriate mood. Use the attached character exactly (same face, hair, clothes and colours). Create a portrait sheet: 3 head-and-shoulders portraits in one row, same face in every portrait, same size, equal spacing, nothing cropped. Expressions from left to right: (1) innocent, (2) nervous, (3) caught. Pixel art look as in the reference, square portraits. Flat dark teal background (#0F3B40) behind every portrait. No text.
```

## Objekte und Icons

### Nr 24: Pfanne in drei Zuständen

Speichern als: `obj_pfanne.png`

**Anhängen:** szene_sauna (für den Stil)

```
Pixel art look, three-quarter top-down view like a classic 16-bit adventure game, chunky visible pixels, dark outlines, soft cel shading, warm friendly colours (teal, off-white, warm wood brown, signal orange, soft grey, a little yellow), clean readable shapes. No text, no letters, no numbers, no logos, no watermark, no photorealism, no blur. Friendly, school-appropriate mood. Three frying pan states in one horizontal row, equal size and equal spacing, seen from above at a slight angle: (1) an empty black pan, (2) a pan with a raw egg: clear glossy transparent egg white and a yellow yolk, (3) a pan with a fried egg: opaque solid white egg white and a golden yolk. No text. Flat pure magenta background (#FF00FF) without gradient, texture or shadow. Nothing cropped. No ground shadow under the figure.
```

### Nr 25: Hantelscheibe (Vorder- und Seitenansicht)

Speichern als: `obj_scheibe.png`

**Anhängen:** nichts

```
Pixel art look, three-quarter top-down view like a classic 16-bit adventure game, chunky visible pixels, dark outlines, soft cel shading, warm friendly colours (teal, off-white, warm wood brown, signal orange, soft grey, a little yellow), clean readable shapes. No text, no letters, no numbers, no logos, no watermark, no photorealism, no blur. Friendly, school-appropriate mood. Two views of one round grey barbell weight plate next to each other: left a front view (round, with a centre hole), right a side view. Neutral mid-grey, no numbers, no writing, no logo. Flat pure magenta background (#FF00FF) without gradient, texture or shadow. Nothing cropped. No ground shadow under the figure.
```

### Nr 26: Kleine Gegenstände (Thermometer, Dose, Shaker, Handtuch)

Speichern als: `obj_sonstiges_sheet.png` (das Grafik-Werkzeug teilt es danach in obj_sonstiges_0.png … obj_sonstiges_3.png)

**Anhängen:** nichts

```
Pixel art look, three-quarter top-down view like a classic 16-bit adventure game, chunky visible pixels, dark outlines, soft cel shading, warm friendly colours (teal, off-white, warm wood brown, signal orange, soft grey, a little yellow), clean readable shapes. No text, no letters, no numbers, no logos, no watermark, no photorealism, no blur. Friendly, school-appropriate mood. Four small gym items in one horizontal row, same size, equal spacing: (1) a round wall thermometer face with no numbers and no marks, (2) a plain protein powder tub with no label, (3) a protein shaker bottle with no label, (4) a small plain folded gym towel. Flat pure magenta background (#FF00FF) without gradient, texture or shadow. Nothing cropped. No ground shadow under the figure.
```

### Nr 27: Eiweißquellen-Icons

Speichern als: `icons_quellen_sheet.png` (das Grafik-Werkzeug teilt es danach in icons_quellen_0.png … icons_quellen_5.png)

**Anhängen:** nichts

```
Pixel art look, three-quarter top-down view like a classic 16-bit adventure game, chunky visible pixels, dark outlines, soft cel shading, warm friendly colours (teal, off-white, warm wood brown, signal orange, soft grey, a little yellow), clean readable shapes. No text, no letters, no numbers, no logos, no watermark, no photorealism, no blur. Friendly, school-appropriate mood. A sheet of six simple food icons in a grid of 3 columns and 2 rows, same size, equal spacing: an egg, a blank milk carton (no writing), a bowl of quark, a bowl of lentils, a fish, a handful of nuts. Flat pure magenta background (#FF00FF) without gradient, texture or shadow. Nothing cropped. No ground shadow under the figure.
```

### Nr 28: Strukturprotein-Icons

Speichern als: `icons_struktur_sheet.png` (das Grafik-Werkzeug teilt es danach in icons_struktur_0.png … icons_struktur_2.png)

**Anhängen:** nichts

```
Pixel art look, three-quarter top-down view like a classic 16-bit adventure game, chunky visible pixels, dark outlines, soft cel shading, warm friendly colours (teal, off-white, warm wood brown, signal orange, soft grey, a little yellow), clean readable shapes. No text, no letters, no numbers, no logos, no watermark, no photorealism, no blur. Friendly, school-appropriate mood. A sheet of three simple icons in one row, same size, equal spacing: a strand of hair, a spider hanging on a silk thread, a rope-like bundle of fibres (a tendon). Flat pure magenta background (#FF00FF) without gradient, texture or shadow. Nothing cropped. No ground shadow under the figure.
```

### Nr 29: Zertifikat-Rahmen (Mitgliedskarte)

Speichern als: `zertifikat_rahmen.webp`

**Anhängen:** szene_trainingsflaeche

```
Pixel art look, three-quarter top-down view like a classic 16-bit adventure game, chunky visible pixels, dark outlines, soft cel shading, warm friendly colours (teal, off-white, warm wood brown, signal orange, soft grey, a little yellow), clean readable shapes. No text, no letters, no numbers, no logos, no watermark, no photorealism, no blur. Friendly, school-appropriate mood. Use the attached image as style reference. A landscape membership card frame, 3:2, pixel art, a decorative border with small dumbbells and laurel branches in warm cream, orange and teal colours, a completely empty light cream centre area for text, no writing, no numbers, no logos.
```

### Nr 30: App-Icon

Speichern als: `icon.png`

**Anhängen:** nichts

```
Pixel art look, three-quarter top-down view like a classic 16-bit adventure game, chunky visible pixels, dark outlines, soft cel shading, warm friendly colours (teal, off-white, warm wood brown, signal orange, soft grey, a little yellow), clean readable shapes. No text, no letters, no numbers, no logos, no watermark, no photorealism, no blur. Friendly, school-appropriate mood. An app icon, square, a dumbbell whose two ends are connected round discs, simple bold shapes, teal background, no text, no letters.
```

## Fundstücke (Papiertexturen)

### Nr 31: Haftnotiz (gelbes Papier)

Speichern als: `fund_haftnotiz.png`

**Anhängen:** nichts

```
Pixel art look, flat straight-on view in the style of a classic 16-bit adventure game, no perspective, chunky visible pixels, dark outlines, soft cel shading, warm friendly colours (teal, off-white, warm wood brown, signal orange, soft grey, a little yellow), clean readable shapes. No text, no letters, no numbers, no logos, no watermark, no photorealism, no blur. Friendly, school-appropriate mood. A close-up of a yellow sticky-note paper surface, slightly wavy, with a darker sticky strip along the top 12 percent, soft paper fibres. 3:2 landscape image. The surface fills the entire image edge to edge. No text, no letters, no numbers, no pictures, no objects on it.
```

### Nr 32: Karteikarte (Linien, rote Kopflinie)

Speichern als: `fund_karteikarte.png`

**Anhängen:** nichts

```
Pixel art look, flat straight-on view in the style of a classic 16-bit adventure game, no perspective, chunky visible pixels, dark outlines, soft cel shading, warm friendly colours (teal, off-white, warm wood brown, signal orange, soft grey, a little yellow), clean readable shapes. No text, no letters, no numbers, no logos, no watermark, no photorealism, no blur. Friendly, school-appropriate mood. A close-up of an off-white index card, faint light-blue horizontal ruled lines across the whole card and one thin red line along the top edge. 3:2 landscape image. The surface fills the entire image edge to edge. No text, no letters, no numbers, no pictures, no objects on it.
```

### Nr 33: Zeitungspapier

Speichern als: `fund_zeitung.png`

**Anhängen:** nichts

```
Pixel art look, flat straight-on view in the style of a classic 16-bit adventure game, no perspective, chunky visible pixels, dark outlines, soft cel shading, warm friendly colours (teal, off-white, warm wood brown, signal orange, soft grey, a little yellow), clean readable shapes. No text, no letters, no numbers, no logos, no watermark, no photorealism, no blur. Friendly, school-appropriate mood. A close-up of aged cream-grey newsprint paper with visible paper fibres and faint fold lines. Completely blank: absolutely no printed text, no headlines, no columns of letters, no photos. 3:2 landscape image. The surface fills the entire image edge to edge. No text, no letters, no numbers, no pictures, no objects on it.
```

### Nr 34: Karo-Heftseite

Speichern als: `fund_heft.png`

**Anhängen:** nichts

```
Pixel art look, flat straight-on view in the style of a classic 16-bit adventure game, no perspective, chunky visible pixels, dark outlines, soft cel shading, warm friendly colours (teal, off-white, warm wood brown, signal orange, soft grey, a little yellow), clean readable shapes. No text, no letters, no numbers, no logos, no watermark, no photorealism, no blur. Friendly, school-appropriate mood. A close-up of squared school notebook paper with a light-blue grid and one pink vertical margin line near the left edge. 3:2 landscape image. The surface fills the entire image edge to edge. No text, no letters, no numbers, no pictures, no objects on it.
```

### Nr 35: Formularpapier

Speichern als: `fund_formular.png`

**Anhängen:** nichts

```
Pixel art look, flat straight-on view in the style of a classic 16-bit adventure game, no perspective, chunky visible pixels, dark outlines, soft cel shading, warm friendly colours (teal, off-white, warm wood brown, signal orange, soft grey, a little yellow), clean readable shapes. No text, no letters, no numbers, no logos, no watermark, no photorealism, no blur. Friendly, school-appropriate mood. A close-up of pale off-white form paper with very faint blue-grey thin lines and empty table boxes, like a blank lab form. 3:2 landscape image. The surface fills the entire image edge to edge. No text, no letters, no numbers, no pictures, no objects on it.
```

### Nr 36: Emailleschild (Metall)

Speichern als: `fund_metallschild.png`

**Anhängen:** nichts

```
Pixel art look, flat straight-on view in the style of a classic 16-bit adventure game, no perspective, chunky visible pixels, dark outlines, soft cel shading, warm friendly colours (teal, off-white, warm wood brown, signal orange, soft grey, a little yellow), clean readable shapes. No text, no letters, no numbers, no logos, no watermark, no photorealism, no blur. Friendly, school-appropriate mood. A close-up of a light-grey worn enamel metal plate with a subtle raised rim and four round screw heads, one in each corner. 3:2 landscape image. The surface fills the entire image edge to edge. No text, no letters, no numbers, no pictures, no objects on it.
```

### Nr 37: Korkwand (Pinnwand)

Speichern als: `pinnwand_kork.png`

**Anhängen:** nichts

```
Pixel art look, flat straight-on view in the style of a classic 16-bit adventure game, no perspective, chunky visible pixels, dark outlines, soft cel shading, warm friendly colours (teal, off-white, warm wood brown, signal orange, soft grey, a little yellow), clean readable shapes. No text, no letters, no numbers, no logos, no watermark, no photorealism, no blur. Friendly, school-appropriate mood. A close-up of a warm brown cork board surface with fine speckled grain, evenly lit, no frame, no pins, no notes. 3:2 landscape image. The surface fills the entire image edge to edge. No text, no letters, no numbers, no pictures, no objects on it.
```

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

