// Erzeugt grafik/PROMPTS.md aus den Daten unten. Aufruf: node make-prompts.mjs <Zieldatei>
import { writeFileSync } from 'node:fs';

const F = '`'.repeat(3);
const out = process.argv[2];

const CORE = 'Pixel art look, three-quarter top-down view like a classic 16-bit adventure game, chunky visible pixels, dark outlines, soft cel shading, warm friendly colours (teal, off-white, warm wood brown, signal orange, soft grey, a little yellow), clean readable shapes. No text, no letters, no numbers, no logos, no watermark, no photorealism, no blur. Friendly, school-appropriate mood.';
const CORE_PORTRAIT = CORE.replace('three-quarter top-down view like a classic 16-bit adventure game', 'frontal view in the style of a classic 16-bit adventure game dialogue portrait');
const CORE_FLACH = CORE.replace('three-quarter top-down view like a classic 16-bit adventure game', 'flat straight-on view in the style of a classic 16-bit adventure game, no perspective');
const kern = (a) => (a.titel.includes('Porträt') ? CORE_PORTRAIT : a.gruppe.startsWith('Fundstücke') ? CORE_FLACH : CORE);
const SPRITE = ' Flat pure magenta background (#FF00FF) without gradient, texture or shadow. Nothing cropped. No ground shadow under the figure.';
const PORTRAIT_BG = ' Flat dark teal background (#0F3B40) behind every portrait.';

const NACHBESSERUNG = [
  ['Text oder Pseudoschrift im Bild', 'Redo the image exactly the same, but remove all text, letters, numbers and symbols that look like writing. Posters, boards and labels must be completely blank.'],
  ['Hintergrund nicht einfarbig', 'Redo the image exactly the same, but make the background one single flat pure magenta (#FF00FF), without gradient, noise, shadow or texture.'],
  ['Figuren berühren sich oder Abstand fehlt', 'Redo the strip exactly the same, but leave clearly more empty space between the frames so that no frame touches another.'],
  ['Figur weicht vom Referenzbild ab', 'The character does not match the attached reference. Use the attached character exactly: same face, hair, clothes, colours and proportions.'],
  ['Bodenmitte nicht frei', 'Redo the scene exactly the same, but keep the middle of the floor completely empty, with no furniture or objects between 15 and 85 percent of the width and 35 and 92 percent of the height.'],
  ['Personen in der Szene', 'Redo the scene exactly the same, but without any people or figures.'],
  ['Stil weicht von der Referenz ab', 'Match the attached reference exactly in pixel size, outlines, shading and colour palette.'],
  ['Zu wenig Pixel-Optik', 'Make it look more like chunky pixel art: clearly visible pixels, dark outlines, flat cel shading, no soft gradients, no blur.'],
];

const FIGUR = 'a friendly teenage gym-goer, gender-neutral, medium skin tone, HAIR, a plain bright red t-shirt, dark sport shorts, white sneakers, a sweat band on one wrist, chibi-like proportions about 3 heads tall';

const PRUEF_SCENE = [
  'Kein Text, keine Buchstaben, keine Zahlen, keine Pseudoschrift (Poster und Tafeln leer).',
  'Die Mitte des Bodens ist frei (hier läuft die Figur).',
  'Keine Personen im Bild.',
  'Gleicher Stil und gleiche Perspektive wie die Referenzszene (Trainingsfläche).',
  'Wichtige Objekte stehen ungefähr dort, wo die Prozentangaben im Prompt sie verlangen (sonst im Editiermodus die Hotspots anpassen).',
];
const PRUEF_SPRITE = [
  'Hintergrund ist einfarbiges Magenta, ohne Verlauf und ohne Schatten.',
  'Figur vollständig sichtbar, nicht abgeschnitten.',
  'Gleiche Figur, gleiche Farben, gleiche Proportionen wie im Referenzbild.',
  'Kein Text im Bild.',
];

const assets = [];
const add = (a) => assets.push(a);

// ---------- Szenen ----------
const SZ = ' 3:2 landscape image. Keep the middle of the floor completely empty and free for walking (roughly 15 to 85 percent of the width and 35 to 92 percent of the height). Positions are given as percent of image width (x) and height (y), measured from the top left. No people, no text anywhere.';

add({
  gruppe: 'Szenen', titel: 'Szene Trainingsfläche (zuerst erzeugen, legt den Stil fest)', datei: 'szene_trainingsflaeche.webp', ordner: 'assets/szenen/', werkzeug: 'Szene umwandeln', ref: null,
  stil: 'Helle, moderne Trainingsfläche in Pixel-Art-Optik, Draufsicht leicht von schräg oben. Türkis, Off-White und warmes Holzbraun, graue Gummifliesen mit türkisem Streifen. Dunkle Konturen, weiche Schattierung. Diese Szene bestimmt den Stil aller anderen Räume.',
  body: 'A bright modern gym training floor, seen from above at a slight angle.' + SZ + ' Back wall (top 30 percent of the image): in the centre (x 50) a large dumbbell rack with a barbell and empty plate holders; at x 30 a wall mirror with a small blank information board beside it; at x 66 a blank wall board for a training plan (empty light panel, no writing); at x 82 an empty framed poster with blank paper. Left wall: a padded bench at x 4 to 15, y 41 to 66, and a water cooler above it at x 9, y 38. Right wall: a sturdy wooden workbench at x 81 to 96, y 37 to 66, with a large blank dark screen mounted above it. Floor: grey rubber tiles with a teal stripe. One door in the middle of the bottom edge (x 50). Do not draw weight plates lying around.',
  pruef: PRUEF_SCENE.slice(0, 3).concat(['Dieses Bild gilt als Stil-Vorgabe: Erst wenn es passt, die übrigen Szenen erzeugen und dieses Bild als Referenz anhängen.']),
});
add({
  gruppe: 'Szenen', titel: 'Szene Empfang', datei: 'szene_empfang.webp', ordner: 'assets/szenen/', werkzeug: 'Szene umwandeln', ref: 'szene_trainingsflaeche (Ergebnis der Szene Trainingsfläche)',
  stil: 'Freundlicher Eingangsbereich desselben Studios, Türkis und Holz, Spindwand, Empfangstresen, vier Türen am unteren Rand mit kleinen Symbolen (Hantel, Reagenzglas, Dampf, Shaker). Gleicher Pixel-Stil wie die Trainingsfläche.',
  body: 'Use the attached image as exact style reference (same pixel size, outlines, shading and colours). Reception area of the same gym, seen from above at a slight angle.' + SZ + ' Back wall (top 30 percent): a wall of tall lockers spanning x 25 to 75, about 8 lockers, one slightly open, the middle locker at x 51; an empty framed poster with blank paper at x 69; a large blank cork board on the right wall at x 95, y 59. Left side: a reception counter at x 4 to 25, y 32 to 51, with a blank computer monitor, a lamp and a tray. Top right: a small sofa at x 74 to 94, y 29 to 45. A hand-sanitiser dispenser on the left wall at x 8, y 75. Bottom wall: four different doors evenly spaced at x 20, 39, 59 and 78, each with a small round symbol plate above it without any writing: a dumbbell, a test tube, a puff of steam, a shaker cup. Floor: warm wood with a teal runner.',
  pruef: PRUEF_SCENE.concat(['Vier Türen am unteren Rand, jede mit eigenem Symbol, keine Schrift.']),
});
add({
  gruppe: 'Szenen', titel: 'Szene Labor', datei: 'szene_labor.webp', ordner: 'assets/szenen/', werkzeug: 'Szene umwandeln', ref: 'szene_trainingsflaeche',
  stil: 'Kleines Schul-Chemielabor, sauber und hell: Weiß, Hellgrau und Türkis mit gelbem Abfallbehälter als Farbtupfer. Gleicher Pixel-Stil, aber kühler als die Trainingsfläche. Keine Chemikalien-Etiketten.',
  body: 'Use the attached image as exact style reference (same pixel size, outlines, shading and colours). A small school chemistry lab room, bright and clean (white, light grey, teal), seen from above at a slight angle.' + SZ + ' Back wall (top 30 percent): a large clean blank whiteboard at x 50, y 29; a framed blank wall chart (empty panel, no writing) at x 33; a fridge with a half-open door and egg cartons inside at x 66, a sink at x 18. Left side: a long lab table at x 4 to 21, y 32 to 83, carrying a hotplate and an empty water-bath pot (no test tubes), the hotplate at about x 21, y 59. Right side: a second long lab table at x 79 to 96, y 32 to 83, with an empty space for a test-tube rack (no tubes), the rack spot at about x 78, y 59. A yellow lidded waste bin near the right table. Hooks with safety goggles and white lab coats beside the door in the bottom wall (door at x 50). No test tubes, no bottles with labels.',
  pruef: PRUEF_SCENE.concat(['Keine Reagenzgläser im Bild (die zeichnet das Spiel), keine beschrifteten Flaschen.']),
});
add({
  gruppe: 'Szenen', titel: 'Szene Sauna', datei: 'szene_sauna.webp', ordner: 'assets/szenen/', werkzeug: 'Szene umwandeln', ref: 'szene_trainingsflaeche',
  stil: 'Warme Holzsauna mit kleiner Küchenzeile, Orange- und Honigtöne, sanfter Dampf, gedämpftes warmes Licht. Gleicher Pixel-Stil, aber wärmste Szene des Spiels.',
  body: 'Use the attached image as exact style reference (same pixel size, outlines, shading and colours). A wooden sauna room with a small kitchenette corner, warm orange light and soft steam, seen from above at a slight angle.' + SZ + ' Two tiers of wooden benches along the back wall and the left wall. A stone-filled sauna oven in the left corner at x 4 to 23, y 32 to 58 with soft steam rising, a bucket and ladle next to it. Back wall: an empty round thermometer plate at x 50, y 30 (no numbers, no marks). Right side: a small counter at x 79 to 96, y 37 to 60 with a single-plate hotplate, EMPTY (no pan on it), the hotplate at about x 87, y 62. A single door in the bottom wall (x 50).',
  pruef: PRUEF_SCENE.concat(['Die Herdplatte ist leer (die Pfanne kommt als eigenes Objekt dazu).']),
});
add({
  gruppe: 'Szenen', titel: 'Szene Shake-Bar', datei: 'szene_shakebar.webp', ordner: 'assets/szenen/', werkzeug: 'Szene umwandeln', ref: 'szene_trainingsflaeche',
  stil: 'Helle Smoothie- und Shake-Bar, Zitronengelb und Orange mit Türkis, frisch und freundlich. Gleicher Pixel-Stil. Alle Etiketten und Tafeln bleiben leer.',
  body: 'Use the attached image as exact style reference (same pixel size, outlines, shading and colours). A gym smoothie and protein shake bar, fresh and bright (lemon yellow, orange, teal), seen from above at a slight angle.' + SZ + ' A bar counter along the whole back wall (top 33 percent): a blender at x 50, y 34; shelves with plain unlabeled tubs at x 26, y 34; a bowl of citrus fruit on the counter at x 67; a glass display fridge with plain unlabeled bottles at x 81, y 34. Three bar stools in front of the counter. Left wall: a blank framed advertising board (empty panel, no writing) at x 4 to 13, y 39 to 68. One door in the bottom wall (x 50). All bottles, tubs and boards completely blank.',
  pruef: PRUEF_SCENE.concat(['Alle Dosen und Flaschen ohne Etikett.']),
});
add({
  gruppe: 'Szenen', titel: 'Titelbild (Studio-Fassade)', datei: 'titel.webp', ordner: 'assets/szenen/', werkzeug: 'Szene umwandeln', ref: 'szene_trainingsflaeche',
  stil: 'Außenansicht des Fitnessstudios am Abend, warmes Licht, große Glastür, leeres Schild. Gleicher Pixel-Stil. (Wird noch nicht im Spiel verwendet, ist für den Startbildschirm vorgesehen.)',
  body: 'Use the attached image as style reference. The front of a friendly modern gym building seen from the street at dusk, 3:2 landscape image, a big glass door in the centre, an empty blank sign above the door (no writing), a small dumbbell symbol on the door, warm light from inside, a few potted plants. No people, no text, no letters.',
  pruef: PRUEF_SCENE.slice(0, 1).concat(['Schild über der Tür ist leer.']),
});

// ---------- Spielfigur ----------
const refSheet = (haar, stil, ref) => ({
  gruppe: 'Spielfigur', datei: null, ordner: 'assets/figuren/',
  stil, ref,
  body: `Character reference sheet. ${ref ? 'Use the attached character as the exact reference (same face, outfit and proportions), only change the hair. ' : ''}A character: ${FIGUR.replace('HAIR', haar)}. Show four poses next to each other with clear empty space between them, same size and same proportions in every pose: standing facing down (towards the viewer), standing facing up (seen from behind), standing facing left, standing facing right. No text.`,
  pruef: PRUEF_SPRITE,
});
add({ ...refSheet('short hair', 'Freundliche, geschlechtsneutrale Jugendliche im Chibi-Stil (ca. 3 Köpfe hoch), rotes Shirt, dunkle Shorts, helle Sneaker. Es gibt nur diese eine Spielfigur (keine Auswahl). Dieses Blatt legt Figur, Proportionen und Farben für alle Lauf-Streifen und alle NPCs fest.', null), titel: 'Spielfigur: Referenzblatt', datei: 'figur_v1_ref.png (nur Referenz, nicht ins Spiel)', werkzeug: 'nicht nötig (nur Vorlage für die nächsten Prompts)', body: refSheet('short hair', '', null).body + SPRITE });

const WALK = (richtung, beschreibung) => `Use the attached character exactly (same face, hair, colours, outfit and proportions). Create ONE horizontal strip with exactly 4 walking animation frames. The character ${beschreibung}. All four frames have the same size and are clearly separated by empty space, equally spaced, with the feet of all four frames on the same baseline. Frame 1 and frame 3 are a standing pose with legs together, frame 2 and frame 4 are a stride pose with opposite legs forward and arms swinging a little. Same pixel art look as the reference. No text.`;
const RICHTUNGEN = [
  ['down', 'faces down towards the viewer (front view)'],
  ['up', 'faces away from the viewer (back view)'],
  ['left', 'is seen from the side, facing left'],
  ['right', 'is seen from the side, facing right'],
];
for (const v of [1]) {
  for (const [d, t] of RICHTUNGEN) {
    add({
      gruppe: 'Spielfigur', titel: `Spielfigur: Lauf-Streifen ${d}`, datei: `figur_v${v}_walk_${d}.png`, ordner: 'assets/figuren/', werkzeug: 'Lauf-Streifen (Richtung ' + d + ', Variante ' + v + ')',
      ref: `figur_v${v}_ref.png (Referenzblatt der Spielfigur)`,
      stil: 'Vier Lauf-Bilder der Figur in einer Reihe, gleiche Größe, gleiche Fußlinie, Standbild-Schritt-Standbild-Schritt. Gleicher Pixel-Stil wie das Referenzblatt, Kleidung und Farben unverändert.',
      body: WALK(d, t) + SPRITE,
      pruef: PRUEF_SPRITE.concat(['Genau vier Bilder, deutlicher Abstand dazwischen (die Figuren dürfen sich nicht berühren).']),
    });
  }
}
// Reihenfolge der Figuren-Einträge ordnen: v1 ref, v1 walks, v2 ref, v2 walks, v3 ref, v3 walks
const figuren = assets.filter((a) => a.gruppe === 'Spielfigur');
const rest = assets.filter((a) => a.gruppe !== 'Spielfigur');
const sorted = [];
sorted.push(...figuren); // Referenzblatt zuerst, dann die vier Lauf-Streifen
assets.length = 0;
assets.push(...rest.filter((a) => a.gruppe === 'Szenen'), ...sorted, ...rest.filter((a) => a.gruppe !== 'Szenen'));

// ---------- NPCs ----------
const NPCS = [
  { id: 'trainer', name: 'Markus (Trainer)', beschr: 'a friendly male coach in his thirties, athletic, wearing a teal tracksuit with a whistle around the neck, relaxed standing pose with arms down, kind smile', ausdruecke: ['neutral and friendly', 'grinning', 'thoughtful with a hand on the chin', 'excited with raised eyebrows'], stil: 'Sportlicher Trainer Markus, Anfang dreißig, türkisfarbener Trainingsanzug mit Trillerpfeife, freundlich. Führt durch das Spiel.' },
  { id: 'alex', name: 'Alex (Trainingspartner)', beschr: 'a teenage gym buddy, gender-neutral, wearing a grey hoodie and jeans, holding a protein shaker bottle without any label, relaxed standing pose', ausdruecke: ['curious', 'sceptical', 'convinced and smiling', 'disappointed'], stil: 'Jugendlicher Trainingspartner in grauem Kapuzenpulli mit unbeschriftetem Shaker. Wirkt neugierig und etwas skeptisch (Bossfight in der Shake-Bar).' },
  { id: 'hannes', name: 'Hitze-Hannes (Sauna, Verdächtiger „Hitze“)', beschr: 'a stocky friendly sauna attendant, wearing a towel over one shoulder and a red-orange felt sauna hat, a little sweat on the forehead, standing relaxed', ausdruecke: ['innocent', 'nervous', 'caught'], stil: 'Gemütlicher, kräftiger Saunameister mit Handtuch und rotorangem Saunahut, leicht verschwitzt. Freundlich, keine Karikatur.' },
  { id: 'zoe', name: 'Zitrus-Zoe (Shake-Bar, Verdächtige „Säure“)', beschr: 'a cheerful bartender wearing a yellow apron and a lemon-yellow headband, holding a lemon in one hand, standing relaxed', ausdruecke: ['innocent', 'nervous', 'caught'], stil: 'Fröhliche Barkeeperin oder Barkeeper in gelber Schürze und zitronengelbem Stirnband, hält eine Zitrone. Freundlich, keine Karikatur.' },
  { id: 'desi', name: 'Desi (Empfang, Verdächtige „Alkohol“)', beschr: 'a tidy hygiene helper wearing a light blue tunic, holding a spray bottle with a completely blank bottle, standing relaxed', ausdruecke: ['innocent', 'nervous', 'caught'], stil: 'Ordentliche Hygiene-Helferin oder -Helfer in hellblauer Kasack-Jacke mit leerer Sprühflasche (kein Etikett). Freundlich, keine Karikatur.' },
  { id: 'kurt', name: 'Kupfer-Kurt (Labor, Verdächtiger „Schwermetallsalz“)', beschr: 'a scientist wearing a white lab coat with copper-coloured safety goggles pushed up on the forehead, an old copper kettle standing at their side, standing relaxed', ausdruecke: ['innocent', 'nervous', 'caught'], stil: 'Wissenschaftler im weißen Kittel, kupferfarbene Schutzbrille auf der Stirn, alter Kupferkessel an der Seite. Freundlich, keine Karikatur.' },
];
for (const n of NPCS) {
  add({
    gruppe: 'NPCs', titel: `${n.name}: Sprite (Stehbild)`, datei: `npc_${n.id}.png`, ordner: 'assets/figuren/', werkzeug: 'Einzel-Sprite (Art NPC, Name ' + n.id + ')',
    ref: 'figur_v1_ref.png (damit Proportionen und Stil passen)',
    stil: n.stil + ' Gleicher Chibi-Stil (ca. 3 Köpfe hoch) und gleiche Pixel-Optik wie die Spielfigur.',
    body: `Use the attached character sheet only as reference for the pixel art style, proportions (chibi-like, about 3 heads tall) and line work. Create a different character: a single full-body sprite of ${n.beschr}. Standing facing the viewer.` + SPRITE + ' No text.',
    pruef: PRUEF_SPRITE.slice(0, 2).concat(['Gleicher Stil und gleiche Proportionen wie die Spielfigur, aber erkennbar eine andere Person.', 'Keine Beschriftung auf Kleidung, Flaschen oder Gegenständen.']),
  });
  add({
    gruppe: 'NPCs', titel: `${n.name}: Porträt-Sheet (${n.ausdruecke.length} Ausdrücke)`, datei: `${n.id}_0.png … ${n.id}_${n.ausdruecke.length - 1}.png`, ordner: 'assets/portraits/', werkzeug: `Sheet teilen (Spalten ${n.ausdruecke.length}, Zeilen 1, quadratisch, 256 px, Name ${n.id})`,
    ref: `npc_${n.id}.png (der Sprite dieser Figur)`,
    stil: `Porträts im selben Pixel-Stil wie der Sprite, nur größer und detaillierter: Kopf und Schultern, gleiches Gesicht in jedem Porträt. Ausdrücke von links nach rechts: ${n.ausdruecke.map((a, i) => `${i} = ${a}`).join(', ')}. Dunkelblaugrüner Hintergrund.`,
    body: `Use the attached character exactly (same face, hair, clothes and colours). Create a portrait sheet: ${n.ausdruecke.length} head-and-shoulders portraits in one row, same face in every portrait, same size, equal spacing, nothing cropped. Expressions from left to right: ${n.ausdruecke.map((a, i) => `(${i + 1}) ${a}`).join(', ')}. Pixel art look as in the reference, square portraits.` + PORTRAIT_BG + ' No text.',
    pruef: ['Genau ' + n.ausdruecke.length + ' Porträts, gleich groß, gleicher Abstand.', 'Dasselbe Gesicht und dieselbe Kleidung in jedem Porträt.', 'Kein Text im Bild.', 'Im Spiel: "portrait": "' + n.id + '_1" wählt den zweiten Ausdruck.'],
  });
}

// ---------- Objekte und Icons ----------
add({
  gruppe: 'Objekte und Icons', titel: 'Pfanne in drei Zuständen', datei: 'obj_pfanne.png (Streifen mit drei Bildern)', ordner: 'assets/figuren/', werkzeug: 'Sheet teilen (Spalten 3, Magenta freistellen, Name obj_pfanne) ergibt obj_pfanne_0 bis _2', ref: 'szene_sauna (für den Stil)',
  stil: 'Bratpfanne in Draufsicht (leicht schräg): leer, mit rohem Ei (glasig durchsichtiges Eiklar, gelbes Eigelb), mit gebratenem Ei (undurchsichtiges weißes Eiklar, goldenes Eigelb). Pixel-Optik wie die Szenen. Nicht im Spiel verdrahtet.',
  body: 'Three frying pan states in one horizontal row, equal size and equal spacing, seen from above at a slight angle: (1) an empty black pan, (2) a pan with a raw egg: clear glossy transparent egg white and a yellow yolk, (3) a pan with a fried egg: opaque solid white egg white and a golden yolk. No text.' + SPRITE,
  pruef: ['Drei Pfannen, gleich groß, klarer Abstand.', 'Rohes Ei sichtbar glasig, gebratenes Ei deutlich weiß und fest (der Unterschied ist die Lernaussage).'],
  nutzenStil: true,
});
add({
  gruppe: 'Objekte und Icons', titel: 'Hantelscheibe (Vorder- und Seitenansicht)', datei: 'obj_scheibe.png', ordner: 'assets/figuren/', werkzeug: 'Sheet teilen (Spalten 2, Magenta freistellen, Name obj_scheibe)', ref: null,
  stil: 'Runde graue Hantelscheibe, links Vorderansicht (Loch in der Mitte), rechts Seitenansicht. Mittelgrau und ohne Aufschrift, damit sie im Spiel eingefärbt werden kann. Nicht im Spiel verdrahtet.',
  body: 'Two views of one round grey barbell weight plate next to each other: left a front view (round, with a centre hole), right a side view. Neutral mid-grey, no numbers, no writing, no logo.' + SPRITE,
  pruef: ['Zwei Ansichten, neutral grau, ohne Zahlen.'],
  nutzenStil: true,
});
add({
  gruppe: 'Objekte und Icons', titel: 'Kleine Gegenstände (Thermometer, Dose, Shaker, Handtuch)', datei: 'obj_sonstiges_0.png … obj_sonstiges_3.png', ordner: 'assets/figuren/', werkzeug: 'Sheet teilen (Spalten 4, Magenta freistellen, Name obj_sonstiges)', ref: null,
  stil: 'Vier Gegenstände in einer Reihe: rundes Thermometer-Zifferblatt ohne Zahlen, Proteinpulver-Dose ohne Etikett, Shaker-Flasche ohne Etikett, kleines Handtuch. Gleiche Größe, gleicher Abstand. Nicht im Spiel verdrahtet.',
  body: 'Four small gym items in one horizontal row, same size, equal spacing: (1) a round wall thermometer face with no numbers and no marks, (2) a plain protein powder tub with no label, (3) a protein shaker bottle with no label, (4) a small plain folded gym towel.' + SPRITE,
  pruef: ['Vier Gegenstände, kein Aufdruck, keine Zahlen.'],
  nutzenStil: true,
});
add({
  gruppe: 'Objekte und Icons', titel: 'Eiweißquellen-Icons', datei: 'icons_quellen_0.png … icons_quellen_5.png', ordner: 'assets/figuren/', werkzeug: 'Sheet teilen (Spalten 3, Zeilen 2, Magenta freistellen, Name icons_quellen)', ref: null,
  stil: 'Sechs einfache, gut lesbare Icons in Pixel-Optik: Ei, Milchpackung (blanko), Quark-Schüssel, Linsen-Schüssel, Fisch, Handvoll Nüsse. Raster 3 mal 2, gleiche Größe. Nicht im Spiel verdrahtet.',
  body: 'A sheet of six simple food icons in a grid of 3 columns and 2 rows, same size, equal spacing: an egg, a blank milk carton (no writing), a bowl of quark, a bowl of lentils, a fish, a handful of nuts.' + SPRITE,
  pruef: ['Sechs Icons im Raster, jedes klar erkennbar, keine Schrift auf der Milchpackung.'],
  nutzenStil: true,
});
add({
  gruppe: 'Objekte und Icons', titel: 'Strukturprotein-Icons', datei: 'icons_struktur_0.png … icons_struktur_2.png', ordner: 'assets/figuren/', werkzeug: 'Sheet teilen (Spalten 3, Magenta freistellen, Name icons_struktur)', ref: null,
  stil: 'Drei einfache Icons: Haarsträhne, Spinne mit Seidenfaden, Sehne beziehungsweise Faserbündel. Pixel-Optik. Nicht im Spiel verdrahtet.',
  body: 'A sheet of three simple icons in one row, same size, equal spacing: a strand of hair, a spider hanging on a silk thread, a rope-like bundle of fibres (a tendon).' + SPRITE,
  pruef: ['Drei Icons, klar erkennbar.'],
  nutzenStil: true,
});
add({
  gruppe: 'Objekte und Icons', titel: 'Zertifikat-Rahmen (Mitgliedskarte)', datei: 'zertifikat_rahmen.webp', ordner: 'assets/szenen/', werkzeug: 'Szene umwandeln (Breite 1536, Höhe 1024)', ref: 'szene_trainingsflaeche',
  stil: 'Dekorativer Rahmen im Pixel-Stil mit Hanteln und Lorbeerzweigen, leere helle Mitte für Text. Warme Töne (Creme, Orange, Türkis). Wird im Spiel automatisch hinter das Zertifikat gelegt, sobald die Datei vorhanden ist.',
  body: 'Use the attached image as style reference. A landscape membership card frame, 3:2, pixel art, a decorative border with small dumbbells and laurel branches in warm cream, orange and teal colours, a completely empty light cream centre area for text, no writing, no numbers, no logos.',
  pruef: ['Die Mitte ist leer und hell (dort steht der Text), kein Text im Bild.'],
  nutzenStil: true,
});
add({
  gruppe: 'Objekte und Icons', titel: 'App-Icon', datei: 'icon.png (512 × 512)', ordner: 'assets/icons/', werkzeug: 'Szene umwandeln (Breite 512, Höhe 512) oder von Hand skalieren', ref: null,
  stil: 'Einfaches, kräftiges Symbol: eine Hantel, deren Enden zwei verbundene runde Scheiben sind, auf türkisem Grund. Pixel-Optik, ohne Text. (Es gibt bereits ein Vektor-Icon als Platzhalter.)',
  body: 'An app icon, square, a dumbbell whose two ends are connected round discs, simple bold shapes, teal background, no text, no letters.',
  pruef: ['Quadratisch, ohne Text, auch klein noch erkennbar.'],
  nutzenStil: true,
});
const PRUEF_TEXTUR = [
  'Kein Text, keine Buchstaben, keine Zahlen, keine Pseudoschrift, keine Bilder auf dem Papier.',
  'Die Fläche füllt das ganze Bild bis an den Rand (keine Tischplatte, keine Hand, kein Rahmen drumherum).',
  'Die Mitte ist weitgehend ruhig und hell genug, damit dort Text gut lesbar bleibt.',
];
const TEXTUR = (titel, datei, stil, body) => add({
  gruppe: 'Fundstücke (Papiertexturen)', titel, datei: `${datei}.png`, ordner: 'assets/funde/', werkzeug: `Mit Pillow zu WebP umwandeln (Breite 1024, Höhe 683), Zieldatei ${datei}.webp`, ref: null,
  stil, body: `${body} 3:2 landscape image. The surface fills the entire image edge to edge. No text, no letters, no numbers, no pictures, no objects on it.`, pruef: PRUEF_TEXTUR,
});
TEXTUR('Haftnotiz (gelbes Papier)', 'fund_haftnotiz', 'Gelbes Haftnotiz-Papier, leicht wellig, oben ein etwas dunklerer Klebestreifen. Leere Fläche, Pixel-Optik. Hier liegt später die Handschrift des Spiels darüber.', 'A close-up of a yellow sticky-note paper surface, slightly wavy, with a darker sticky strip along the top 12 percent, soft paper fibres.');
TEXTUR('Karteikarte (Linien, rote Kopflinie)', 'fund_karteikarte', 'Cremefarbene Karteikarte mit feinen hellblauen Linien und einer roten Linie am oberen Rand. Leer.', 'A close-up of an off-white index card, faint light-blue horizontal ruled lines across the whole card and one thin red line along the top edge.');
TEXTUR('Zeitungspapier', 'fund_zeitung', 'Vergilbtes Zeitungspapier mit Papierfasern und leichten Falzspuren, aber ohne gedruckten Text und ohne Fotos.', 'A close-up of aged cream-grey newsprint paper with visible paper fibres and faint fold lines. Completely blank: absolutely no printed text, no headlines, no columns of letters, no photos.');
TEXTUR('Karo-Heftseite', 'fund_heft', 'Kariertes Schulheftpapier mit hellblauem Gitter und rosa Randlinie links. Leer.', 'A close-up of squared school notebook paper with a light-blue grid and one pink vertical margin line near the left edge.');
TEXTUR('Formularpapier', 'fund_formular', 'Helles Formularpapier mit sehr feinen grauen Linien und leeren Kästchen. Wird für Laborzettel, Protokoll und Spurenbericht benutzt.', 'A close-up of pale off-white form paper with very faint blue-grey thin lines and empty table boxes, like a blank lab form.');
TEXTUR('Emailleschild (Metall)', 'fund_metallschild', 'Helles, leicht abgenutztes Emailleschild aus Metall mit vier Schrauben in den Ecken. Leer.', 'A close-up of a light-grey worn enamel metal plate with a subtle raised rim and four round screw heads, one in each corner.');
TEXTUR('Korkwand (Pinnwand)', 'pinnwand_kork', 'Korkplatte in warmem Braun mit feiner Körnung. Hier hängen später die Funde. Ohne Rahmen.', 'A close-up of a warm brown cork board surface with fine speckled grain, evenly lit, no frame, no pins, no notes.');

// ---------- Adventure 2.0 (optional): erst im Code gezeichnet, schönere Pixel-Art nur bei Bedarf ----------
const A2 = 'Adventure 2.0 (optional)';
const A2_NOTE = ' Das Spiel zeichnet dieses Objekt zunächst selbst im Code; das Bild ist nur eine schönere Alternative.';
add({
  gruppe: A2, titel: 'Labor-Ausweis (Karte)', datei: 'obj_ausweis.png', ordner: 'assets/figuren/', werkzeug: 'Einzel-Sprite (Art Objekt, Name obj_ausweis), Magenta freistellen', ref: null,
  stil: 'Kleine Ausweiskarte, Querformat, türkis mit orangem Streifen, links ein leeres Foto-Feld, rechts leere Linien. Ohne Text. Name und Datum setzt das Spiel darüber.' + A2_NOTE,
  body: 'A single laboratory ID badge card, landscape, rounded corners, teal with an orange stripe along the top, a blank empty light square on the left for a photo, a few blank grey bars on the right where text would be, a small hole at the top for a lanyard. No text, no numbers, no logo.' + SPRITE,
  pruef: ['Karte vollständig sichtbar, keine Schrift, leere Flächen für Foto und Zeilen.'],
});
add({
  gruppe: A2, titel: 'Kartenlesegerät (Lämpchen rot und grün)', datei: 'obj_leser_0.png … obj_leser_1.png', ordner: 'assets/figuren/', werkzeug: 'Sheet teilen (Spalten 2, Magenta freistellen, Name obj_leser)', ref: null,
  stil: 'Kleines Wandlesegerät neben einer Tür: links mit rotem Lämpchen (gesperrt), rechts mit grünem Lämpchen (frei). Gleiche Größe, gleicher Abstand, ohne Aufdruck.' + A2_NOTE,
  body: 'Two views of the same small wall-mounted card reader box in a row, equal size and spacing: left with a red indicator light, right with a green indicator light. Each has a narrow card slot and a tiny dark screen without content. No text, no numbers, no logos.' + SPRITE,
  pruef: ['Zwei Bilder, nur das Lämpchen unterscheidet sich, keine Schrift.'],
});
add({
  gruppe: A2, titel: 'Zahlenschloss-Tastenfeld', datei: 'obj_tastenfeld.png', ordner: 'assets/figuren/', werkzeug: 'Einzel-Sprite (Art Objekt, Name obj_tastenfeld), Magenta freistellen', ref: null,
  stil: 'Tastenfeld mit zwölf leeren Tasten (3 mal 4) und einem leeren dunklen Anzeigefeld darüber. Die Ziffern setzt das Spiel selbst auf die Tasten.' + A2_NOTE,
  body: 'A door keypad with a small empty dark display on top and twelve identical blank rounded keys below in a grid of 3 columns and 4 rows, metal frame, seen straight from the front. The keys carry no numbers and no symbols. No text.' + SPRITE,
  pruef: ['Zwölf Tasten im Raster 3 mal 4, alle leer (keine Ziffern), Anzeige leer.'],
});
add({
  gruppe: A2, titel: 'Taschensymbol (Inventar)', datei: 'icon_tasche.png', ordner: 'assets/icons/', werkzeug: 'Einzel-Sprite (Art Icon, Name icon_tasche), Magenta freistellen', ref: null,
  stil: 'Kleine Sporttasche in Türkis mit orangem Reißverschluss, Seitenansicht, gut lesbar auch in klein.' + A2_NOTE,
  body: 'A single small icon of a teal gym duffel bag with an orange zipper and a short carrying strap, side view, bold simple shapes, readable at small size. No text, no logo.' + SPRITE,
  pruef: ['Auch klein noch als Tasche erkennbar, keine Schrift.'],
});
add({
  gruppe: A2, titel: 'Schließfach (zu und offen)', datei: 'obj_fach_0.png … obj_fach_1.png', ordner: 'assets/figuren/', werkzeug: 'Sheet teilen (Spalten 2, Magenta freistellen, Name obj_fach)', ref: null,
  stil: 'Ein Schließfach, links geschlossen, rechts mit offener Tür und leerem Inneren. Gleiche Größe, mit Ziffernschloss ohne Ziffern.' + A2_NOTE,
  body: 'Two views of the same small locker door in a row, equal size and spacing: left closed, with a blank keypad lock on the door, right with the door swung open showing an empty teal interior. Teal metal, no numbers, no text, no stickers.' + SPRITE,
  pruef: ['Zwei Bilder: zu und offen, gleiche Größe, keine Ziffern am Schloss.'],
});
add({
  gruppe: A2, titel: 'Klebe-Tattoos (zwei Stück)', datei: 'obj_tattoo_0.png … obj_tattoo_1.png', ordner: 'assets/figuren/', werkzeug: 'Sheet teilen (Spalten 2, Magenta freistellen, Name obj_tattoo)', ref: null,
  stil: 'Zwei Klebe-Tattoos auf Trägerpapier als ironische Belohnung „für wirklich harte Typen“ (Bonusfächer 3 und 6): links eine Hantel, rechts ein goldener Bizeps mit Sonnenbrille. Gleiche Größe, ohne Schrift, nichts Bedrohliches.' + A2_NOTE,
  body: 'Two temporary tattoo stickers in one row, same size, equal spacing, each on a small rectangular piece of glossy backing paper with a slightly peeled corner: (1) a bold black-and-teal dumbbell, (2) a shiny golden flexed biceps arm wearing tiny cool sunglasses, playful and friendly. No text, no numbers, no skulls.' + SPRITE,
  pruef: ['Zwei Tattoos auf Trägerpapier, gleich groß, klarer Abstand, keine Schrift, wirkt lustig statt hart.'],
});

// ---------- Status: Quelle der Wahrheit für OFFEN.md ----------
// Alle Pflichtbilder sind eingebaut (Desi, Papierflächen und Korkwand seit dem 11.11.); offen sind nur noch die optionalen Objekte (A2).
const OFFEN_DATEIEN = new Set([]);
assets.forEach((a) => { a.status = a.gruppe === A2 ? 'optional' : OFFEN_DATEIEN.has(a.datei) ? 'offen' : 'fertig'; });

// ---------- Datei bauen ----------
const lines = [];
const p = (s = '') => lines.push(s);

p('# Grafik-Prompts für ChatGPT');
p();
p('Alle Bilder des Spiels Protein-Gym. Jeder Prompt ist vollständig und kann einzeln kopiert werden (der Stil-Block ist schon eingesetzt). Zu jedem Bild stehen Dateiname, Zielordner, das Werkzeug zum Weiterverarbeiten, die Beschreibung des Stils und eine Prüfliste. Die Prompts sind Englisch, weil ChatGPT Bildvorgaben so zuverlässiger trifft; alles andere ist Deutsch.');
p();
p('## 1. So gehst du vor');
p();
p('1. **Reihenfolge einhalten:** Die Szenen (Nr 1–6) sind schon fertig und eingebaut. Weiter mit dem Referenzblatt der Spielfigur, dann ein Lauf-Streifen, dann das Grafik-Werkzeug testen. Erst wenn das trägt, den Rest erzeugen.');
p('2. **Ein Chat pro Bildfamilie:** Szenen in einem Chat, Spielfigur in einem Chat, jede NPC-Figur in einem eigenen Chat. So bleibt der Stil im Gedächtnis des Chats. Bei „Referenz“ im Prompt das genannte Bild als Anhang mitschicken und den Satz im Prompt unverändert lassen.');
p('3. **Höchstens zwei Nachbesserungen je Bild.** Danach das Bild nehmen und kleine Fehler im Spiel kaschieren (Kollision und Hotspots im Editiermodus).');
p('4. **Bildformat:** Szenen im Querformat 3:2 (voraussichtlich 1536 × 1024, das größte angebotene Format wählen, vorher prüfen). Sprites, Porträts und Icons quadratisch oder breit, egal; wichtig ist der einfarbige Hintergrund.');
p('5. **Kein Text im Bild.** ChatGPT malt Pseudoschrift und falsche Formeln. Alle Beschriftungen, Formeln, Reagenzgläser, Dampf und Konfetti zeichnet das Spiel selbst.');
p('6. **Keine Marken oder Spielnamen** in den Prompts. Der Stil wird beschrieben, nicht benannt.');
p('7. **Danach:** Bild im Grafik-Werkzeug verarbeiten (siehe Abschnitt 9), Datei in den Zielordner legen, `node tools/precache.mjs` ausführen.');
p();
p('## 2. Allgemeiner Stil (gilt für alle Bilder)');
p();
p('| Merkmal | Vorgabe |');
p('|---|---|');
p('| Technik | Pixel-Art-Optik: sichtbare, kräftige Pixel, dunkle Konturen, weiche Zell-Schattierung. Kein Foto-Look, keine Unschärfe, kein Kantenglätten. Echtes Pixelraster ist nicht nötig (ChatGPT trifft es nicht exakt), es soll nur „nach Pixel-Art aussehen“. |');
p('| Perspektive | Draufsicht leicht von schräg oben („Dreiviertelansicht“), wie ein klassisches 16-Bit-Abenteuerspiel. Figuren in Chibi-Proportionen, etwa 3 Köpfe hoch. |');
p('| Farben | Warm und freundlich: Türkis, Off-White, warmes Holzbraun, Signalorange, weiches Grau, ein Hauch Gelb. Eigene Stimmung je Raum (siehe unten), aber immer dieselbe Farbfamilie. |');
p('| Stimmung | Freundlich, schulgeeignet, sauber, ohne Körperideale und ohne Gewichts- oder Kalorienbezug. Figuren sind sympathisch, nie Karikaturen. |');
p('| Inhalte | Nie Text, Buchstaben, Zahlen, Logos, Wasserzeichen. Poster, Tafeln, Etiketten bleiben leer. |');
p('| Sprites | Einfarbiger Magenta-Hintergrund (#FF00FF), kein Verlauf, kein Schatten, Figur vollständig sichtbar. Es gibt nur eine Spielfigur (rotes Shirt), das Spiel verändert sie nicht. |');
p('| Stimmung je Raum | Trainingsfläche: Grau und Türkis, Gummifliesen. Empfang: Türkis und Holz, Spindwand. Labor: Weiß, Hellgrau, Türkis, gelber Abfallbehälter. Sauna: Holz, Orange, Dampf. Shake-Bar: Zitronengelb, Orange, Türkis. |');
p();
p('**Stil-Block für Szenen und Objekte** (steckt schon in jedem Prompt):');
p();
p(F); p(CORE); p(F);
p();
p('**Zusatz für Sprites und Icons** (steckt ebenfalls schon drin):');
p();
p(F); p(SPRITE.trim()); p(F);
p();
p('**Positionsangaben in den Szenen:** „x 50, y 30“ heißt 50 Prozent der Bildbreite von links und 30 Prozent der Bildhöhe von oben. Sie passen zu den Hotspots im Spiel (Spind, Poster, Hantelständer, Tafel …). Weichen die Objekte ab, passt du die Hotspots später im Editiermodus (`?edit=1`) an. Der Boden in der Mitte muss frei bleiben, dort läuft die Figur.');
p();
p('## 3. Übersicht aller Dateien');
p();
p('| Nr | Bild | Datei | Ordner | Werkzeug |');
p('|---|---|---|---|---|');
assets.forEach((a, i) => p(`| ${i + 1} | ${a.titel} | ${a.datei} | ${a.ordner} | ${a.werkzeug} |`));
p();

let lastGruppe = '';
let abschnitt = 3;
let introNachher = false;
assets.forEach((a, i) => {
  if (a.gruppe !== lastGruppe) {
    abschnitt++;
    lastGruppe = a.gruppe;
    p(`## ${abschnitt}. ${a.gruppe}`);
    p();
    introNachher = true;
    if (a.gruppe === 'Szenen') p('Szenenbilder im Format 3:2, ohne Personen. Nach dem Erzeugen im Grafik-Werkzeug (Reiter „Szene umwandeln“) auf 1536 × 1024 bringen und als WebP speichern. Die NPCs und die Spielfigur werden später als eigene Sprites eingesetzt.');
    if (a.gruppe === 'Spielfigur') p('Es gibt nur eine Spielfigur, keine Auswahl. Erst das Referenzblatt, dann die vier Lauf-Streifen. Das Referenzblatt ist nur Vorlage und wird nicht ins Spiel gelegt.');
    if (a.gruppe === 'NPCs') p('Zu jeder Figur zwei Prompts: erst der Sprite (Stehbild), dann das Porträt-Sheet mit dem Sprite als Referenz. Die Verdächtigen sind sympathisch gezeichnet und gehören je zu einem der vier Auslöser der Denaturierung (Hitze, Säure, Alkohol, Schwermetallsalz). Die Namen sind Vorschläge.');
    if (a.gruppe.startsWith('Fundstücke')) p('Leere Papier- und Materialflächen für die Hinweis-Funde im Spiel (Haftnotiz, Zeitung, Heft …). Der Text und alle Beschriftungen kommen aus dem Spiel selbst. Ohne diese Bilder zeigt das Spiel einfache Farbflächen. Bitte als eigene Bildfamilie in einem Chat erzeugen.');
    if (a.gruppe === A2) p('Optionale Bilder für die Adventure-Erweiterung (Laborführerschein, Saunacode, Inventar, Schließfächer). Das Spiel zeichnet diese Objekte zunächst selbst im Code; die Bilder sind nur schöner und nicht nötig.');
    if (a.gruppe === 'Objekte und Icons') p('Diese Bilder sind ergänzend. Pfanne, Scheibe und Sonstiges sind noch nicht im Spiel verdrahtet, das Zertifikat nutzt den Rahmen sofort.');
  }
  if (introNachher) { p(); introNachher = false; }
  p(`### Nr ${i + 1}: ${a.titel}`);
  p();
  p(`- **Dateiname:** ${'`'}${a.datei}${'`'}`);
  p(`- **Zielordner:** ${'`'}${a.ordner}${'`'}`);
  p(`- **Verarbeiten mit:** ${a.werkzeug}`);
  p(`- **Referenzbild anhängen:** ${a.ref ? a.ref : 'keins'}`);
  p(`- **Stil:** ${a.stil}`);
  p();
  const stilBlock = kern(a);
  p('**Prompt:**');
  p();
  p(F);
  p(`${stilBlock} ${a.body}`);
  p(F);
  p();
  p('**Prüfliste:**');
  p();
  a.pruef.forEach((x) => p(`- [ ] ${x}`));
  p();
});

p(`## ${abschnitt + 1}. Nachbesserungs-Prompts (kurz, höchstens zweimal pro Bild)`);
p();
p('Diese Sätze im selben Chat direkt nach dem unbefriedigenden Bild senden:');
p();
p('| Problem | Prompt |');
p('|---|---|');
NACHBESSERUNG.forEach(([problem, text]) => p(`| ${problem} | „${text}“ |`));
p();
p(`## ${abschnitt + 2}. Wie die Bilder ins Spiel kommen`);
p();
p('Das Grafik-Werkzeug starten: `node tools/serve.mjs 4195`, dann `http://localhost:4195/tools/sprite-slicer.html` öffnen. Bild per Ziehen, Einfügen (Strg+V) oder „Datei wählen“ laden, Vorschau prüfen, speichern. Die gespeicherte Datei in den Zielordner legen und `node tools/precache.mjs` ausführen (sonst fehlt sie offline).');
p();
p('- **Lauf-Streifen:** Reiter „Lauf-Streifen“, Richtung und Variante wählen. Findet das Werkzeug nicht vier Figuren, warnt es und teilt in gleich breite Spalten; dann Magenta-Toleranz ändern oder das Bild mit mehr Abstand neu erzeugen.');
p('- **NPC-Sprites:** Reiter „Einzel-Sprite“, Art NPC, Name wie in den Dateinamen oben (trainer, alex, hannes, zoe, desi, kurt).');
p('- **Porträts:** Reiter „Sheet teilen“, Spalten wie in der Tabelle, quadratisch, 256 Pixel. Im Dialog wählt `"portrait": "trainer_1"` in `data/dialoge.json` den zweiten Ausdruck; fehlt die Datei, zeigt das Spiel den Anfangsbuchstaben.');
p('- **Szenen:** Reiter „Szene umwandeln“, 1536 × 1024, Qualität etwa 88. Danach Kollision und Hotspots mit `?edit=1` im Spiel setzen und in `data/szenen.json` übernehmen.');
p('- **Spielfigur:** Es gibt nur eine Figur (Dateien `figur_v1_walk_*`), das Spiel verändert sie nicht. Fehlen die Dateien, zeichnet das Spiel eine Platzhalterfigur.');
p();
p('## Hinweis zum Urheberrecht und zur Datenschutz-Sicht');
p();
p('Alle Bilder sind selbst erzeugt, es werden keine Figuren oder Sprites aus bekannten Spielen nachgebaut. Prüfe die Nutzungsbedingungen deines ChatGPT-Tarifs für die schulische Verwendung der erzeugten Bilder.');

writeFileSync(out, lines.join('\n') + '\n', 'utf8');
console.log('geschrieben:', out, assets.length, 'Bilder,', lines.length, 'Zeilen');

// Zweite Datei: nur zum Kopieren. Pro Bild eine Überschrift, eine Zeile "Anhängen", ein Block.
const outKopie = process.argv[3];
if (outKopie) {
  const k = [];
  const q = (s = '') => k.push(s);
  q('# Prompts zum Kopieren (Protein-Gym)');
  q();
  q('**Stand:** Erledigt und im Spiel eingebaut: die sechs Szenen (Nr 1–6), die Spielfigur (Nr 7–11), Markus (Trainer), Alex, Hannes, Zoe und Kurt (Sprite und Porträts), das Porträt-Sheet von Desi (Nr 21), Zertifikat-Rahmen (Nr 29), App-Icon (Nr 30) und die Haftnotiz-Textur (Nr 31). Objekte und Icons (Nr 24–28) sind aufbereitet und liegen in `assets/figuren`, werden aber noch nicht im Spiel gezeigt. **Noch offen:** der Sprite von Desi (Nr 20, `npc_desi.png`) und die Papiertexturen Nr 32–37 (Karteikarte, Zeitung, Heft, Formular, Emailleschild, Korkwand). Bereits erledigte Nummern kannst du überspringen. Nur die offenen und optionalen Bilder stehen gesammelt in `OFFEN.md`. Nr 38–44 sind optionale Bilder für die Adventure-Erweiterung.');
  q();
  q('Von oben nach unten abarbeiten. Je Bild: Block kopieren, in ChatGPT einfügen, bei „Anhängen“ das genannte Bild mitschicken, Ergebnis unter dem Dateinamen speichern. Jeder Block ist vollständig, es muss nichts ergänzt werden. Die Reihenfolge ist so gewählt, dass jedes Referenzbild schon vorher entstanden ist.');
  q();
  q('Ein Chat pro Gruppe: Szenen in einem Chat, Spielfigur in einem Chat, jede NPC-Figur (Sprite und Porträt) in einem eigenen Chat. Höchstens zwei Nachbesserungen je Bild, die kurzen Sätze stehen ganz unten. Stil, Ablauf und Prüflisten stehen in `PROMPTS.md`.');
  q();
  q('| Nr | Datei | Anhängen |');
  q('|---|---|---|');
  assets.forEach((a, i) => q(`| ${i + 1} | ${a.datei.replace(/ \(.*$/, '')} | ${a.ref ? a.ref : '-'} |`));
  q();
  let g = '';
  assets.forEach((a, i) => {
    if (a.gruppe !== g) { g = a.gruppe; q(`## ${a.gruppe}`); q(); }
    q(`### Nr ${i + 1}: ${a.titel}`);
    q();
    const d = a.datei.replace(/ \(.*$/, '');
    const sheet = d.match(/^(\w+?)_0\.png/) || d.match(/^(obj_pfanne|obj_scheibe)\.png/);
    q(sheet && d.includes('…')
      ? `Speichern als: \`${sheet[1]}_sheet.png\` (das Grafik-Werkzeug teilt es danach in ${d})`
      : `Speichern als: \`${d}\``);
    q();
    q(a.ref ? `**Anhängen:** ${a.ref}` : '**Anhängen:** nichts');
    q();
    q(F);
    q(`${kern(a)} ${a.body}`);
    q(F);
    q();
  });
  q('## Nachbesserungen (im selben Chat direkt nach dem Bild senden)');
  q();
  NACHBESSERUNG.forEach(([problem, text]) => { q(`**${problem}**`); q(); q(F); q(text); q(F); q(); });
  writeFileSync(outKopie, k.join('\n') + '\n', 'utf8');
  console.log('geschrieben:', outKopie, k.length, 'Zeilen');
}

// Dritte Datei: nur noch offene und optionale Bilder, vollständig zum Kopieren. Nummern wie in PROMPTS_KOPIEREN.md.
const outOffen = process.argv[4];
if (outOffen) {
  const o = [];
  const w = (s = '') => o.push(s);
  const nr = (a) => assets.indexOf(a) + 1;
  const offen = assets.filter((a) => a.status === 'offen');
  const optional = assets.filter((a) => a.status === 'optional');
  w('# Noch offene Grafiken (Protein-Gym)');
  w();
  w('Diese Datei enthält **nur** Bilder, die noch fehlen. Alles Fertige steht in `PROMPTS_KOPIEREN.md` und ist hier nicht mehr aufgeführt. Die Nummern sind dieselben wie dort. Je Bild: Block kopieren, in ChatGPT einfügen, bei „Anhängen“ das genannte Bild mitschicken, Ergebnis unter dem Dateinamen speichern, danach `node tools/precache.mjs` ausführen. Höchstens zwei Nachbesserungen je Bild (die kurzen Sätze stehen unten).');
  w();
  w(`**Ohne diese Bilder läuft das Spiel vollständig:** es zeichnet die fehlenden Papierflächen als Farbflächen und die fehlende Figur als Platzhalter. Offen sind ${offen.length} Bilder, optional ${optional.length}.`);
  w();
  w('| Nr | Datei | Anhängen | Status |');
  w('|---|---|---|---|');
  [...offen, ...optional].forEach((a) => w(`| ${nr(a)} | ${a.datei.replace(/ \(.*$/, '')} | ${a.ref ? a.ref : '-'} | ${a.status} |`));
  w();
  const block = (a) => {
    w(`### Nr ${nr(a)}: ${a.titel}`);
    w();
    const d = a.datei.replace(/ \(.*$/, '');
    const sheet = d.match(/^(\w+?)_0\.png/);
    w(sheet && d.includes('…') ? `Speichern als: \`${sheet[1]}_sheet.png\` (das Grafik-Werkzeug teilt es danach in ${d})` : `Speichern als: \`${d}\` in \`${a.ordner}\``);
    w();
    w(`**Werkzeug:** ${a.werkzeug}`);
    w();
    w(a.ref ? `**Anhängen:** ${a.ref}` : '**Anhängen:** nichts');
    w();
    w(F);
    w(`${kern(a)} ${a.body}`);
    w(F);
    w();
    w('**Prüfen:**');
    w();
    a.pruef.forEach((x) => w(`- [ ] ${x}`));
    w();
  };
  w('## Offen (fehlt im Spiel)');
  w();
  offen.forEach(block);
  w('## Optional (Adventure-Erweiterung, Spiel zeichnet es sonst selbst im Code)');
  w();
  optional.forEach(block);
  w('## Nachbesserungen (im selben Chat direkt nach dem Bild senden)');
  w();
  NACHBESSERUNG.forEach(([problem, text]) => { w(`**${problem}**`); w(); w(F); w(text); w(F); w(); });
  writeFileSync(outOffen, o.join('\n') + '\n', 'utf8');
  console.log('geschrieben:', outOffen, offen.length, 'offen,', optional.length, 'optional');
}
