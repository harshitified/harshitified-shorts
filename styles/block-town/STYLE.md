# Block Town 3D: true stories with blocky 3D people, 9:16

Chunky blocky toy people (rounded-cube heads with drawn, acting faces, box bodies, one hair or hat) living in low-poly 3D
places that are lit like a film: sunny cobbled town squares, glowing night streets, sci-fi labs, dark forests, floodlit
night cities. Giant original creatures loom when the story is spooky. Bold captions, 1-3 words, one word in colour.
Example: `example/` = **THE CITY THAT COULDN'T STOP DANCING** (Strasbourg 1518; 27 s, 22 shots). Sheet: `style-sheet.png`.

This style is ORIGINAL: its people, faces, hair, creatures and sets are our own designs. Never copy a game's avatar look,
default faces, logos, named characters or a creator's monsters, and never put a game or brand name on screen.

## 1. Rules
- **People are real 3D.** Every person is a `Blocky`: it turns (`turn`, `faceTo`), walks, runs, sits, dances, waves,
  and casts real shadows. Faces are drawn on the head and change on the beat.
- **Faces do the acting.** `grin` / `laugh` for the fun, `shock` / `scared` on the reveal, `worried` + `sweat` for trouble,
  `sly` / `smug` when someone has an idea, `tired` / `dizzy` when it all goes wrong. Blink with `blink(t)`.
- **Bodies act too.** Arms up for joy or panic, a hand to the chin to think, `dance()` for crowds, `legs: 'sit'` to flop.
- One outfit + one hair or hat per character; the same look all video. Crowds = many `Blocky` with `townLook(i)` mixes.
- **Light sets the mood.** Day = bright blue sky, crisp sun. Sunset = orange sky, warm string lights. Night = deep blue, every
  lamp, window and ring glows (bloom). Spooky = dark forest fog, a red sky glow, glowing creature eyes.
- **Creatures** (`Lanky`, `Brute`) are big, slow and silhouetted: glowing eyes, maybe a grin. Never blood, gore or wounds.
- Camera always moving: crane-downs, push-ins, a punch-in on the reveal word. New shot every 0.8-2.3 s.
- **Captions** (`core/captions.js`): 1-3 words, white Inter Black with a heavy black edge + drop shadow, ONE word coloured,
  y 1330. Colour code: yellow = the key word, purple `{p}` = mystery, green `{g}` = place / nature, red `{r}` = danger,
  cyan `{c}` = science. Big reveal words go on their own second line in CAPITALS: `"stepped out of the / *{p}darkness"`.
- Story shape: open on the strangest true fact, shown at once; then set the scene; one picture per clause; reaction shots;
  end on a line that loops back to the start.
- Narration `am_michael` (fast, 1.15-1.2), music `"bounce"` for fun stories (`"none"` or a low bed for spooky ones).
  Sounds: `whoosh` on cuts, `boing`, `pop`, `ding`, `thud`, `tock`, `zip`, `chirp`.
- True stories only, checked against good sources and listed in `script.json` "sources".

## 2. Engine map (`example/src/`)
| file | gives you |
|---|---|
| `core/engine.js` | `makeEngine` (tone curve, soft shadows, bloom, depth of field, saturation), `camera(fov)` |
| `core/blocky.js` | `new Blocky(look, { scale })` (`.at(x,y,z)`, `.turn(deg)`, `.faceTo(x,z)`, `.set(state)`), `drawFace(g, state, look)`, `CAST` (8 ready looks), `SKINS`, `roundedBox()`; creatures `new Lanky({ height, col, eye, grin })` `.set({ phase, walk, reach, grin, headTilt })` and `new Brute({ height, col, eye })` `.set({ phase, walk, jaw, arms })` |
| `core/sets.js` | `townSquare(E, { time: day│sunset│night, stage })`, `suburbNight(E)`, `lab(E)` (`.teleporter`, `.console`), `darkForest(E, { glow, fog })`, `nightCity(E)` (`.cars`); pieces `timberHouse, autumnTree, pine, stringLights, streetLamp, policeCar, floodTower, teleporter, console3D`; textures `TX.cobbles/timber/roof/road/pavement/plate/panels/litter/tiles/windows`. Every set returns `{ scene, sun, update(t) }`: call `update(t)` each frame |
| `core/world.js` | shared pieces: `sky, clouds, sunlight, tree, wire, car, fence, signBoard, mat, canvasTex, snapshot` |
| `core/props.js` | `house()` (porch house), `desk`, `poster(lines)`, `parcel`, `signpost` |
| `core/captions.js` | the caption look + `captionText(text, x, y, scale)` |

**Blocky look**: `{ skin, shirt, outfit: tee│hoodie│shirt│jacket│uniform│coat│dress, accent, under, tieCol, pattern: none│stripes│plaid│star│number, number, pants, shoes, sleeves: long│short, hair: none│buzz│spiky│swoop│bob│long│curly│bun, hairCol, hat: none│cap│beanie│ranger│top│helmet│hood, hatCol, face: [glasses, mustache, beard, freckles, blush, bandage] }`.
**Blocky state**: `{ mood: neutral│happy│grin│laugh│shock│scared│worried│angry│sad│smug│sly│tired│dizzy, look: [dx, dy], blink, talk, sweat, tears, armL / armR: [raise°, out°] (0 = down, 90 = forward, 180 = up), legs: stand│walk│run│sit, phase, lean, turn (adds to .turn), headYaw, headTilt, bob, jump }`.
People are 2.15 m tall to the top of the head; seated people drop 0.38 m. Faces read best from the front, within ~60°.

**Set layouts**: town square open area x -7..7, z -14..6 (stage at z -9, top y 0.92). Night suburb: road z 0, sidewalk
z -5 (y 0.12), houses z -12. Lab: teleporter at (0, 0, -4), console (-4, 0, -6). Forest: path along -z, clearing (0, 0, -8).
Night city: fenced ring r 5 around (0, 0, -4), police cars on r 9.

## 3. Shot anatomy (see `example/src/shots.js`)
Build every set once at the top and give each set its own people (a `Blocky` lives in one scene). Per shot: place
people with `.at()` + `.turn()` (set `.turn()` every shot: it persists), `set()` or `dance()` them from `t`, then
`shoot(set, camFrom, camTo, lookFrom, lookTo, k, LOOK, t)` (moves the camera, runs `set.update(t)`, renders with depth of
field), `blit()`, then any 2D overlay. Cues go on the word (`cue(Wd('worse', 11), 'thud')`).
Looks: `DAY { bloom 0.3 }`, `DUSK { bloom 0.45, warm 0.04 }`, `NIGHT { bloom 0.6, threshold 0.72 }`; crowds and aerials use fov 44-50.

## 4. QA pitfalls
- **The camera must never sit inside a person or a crowd.** In crowd shots put the camera above head height (y > 2.6) or
  outside the crowd's ring; check every punch-in frame.
- **Turns persist**: a person turned in one shot keeps facing that way; call `.turn()` in every shot.
- String lights hang at y ~4.3 in the town square: a camera at that height gets blurry bulbs in its face.
- Night lights: use at most 2-4 real point/spot lights per set (software rendering slows down); everything else glows by
  emission + bloom. If a night frame blows out to white, lower `bloom`, raise `bloomThreshold`, or dim the emitters.
- Narrow 9:16 frame: two people more than ~1.2 m apart at 3-4 m fall out of frame; widen the fov or move them closer.
- Rendering without a GPU: `SOFTWARE_GL=1 QS='&res=0.6&aa=0&shadow=1024'` for QA, `res=0.75 FPS=30` for the final (about
  1 s per frame for crowd shots).

## 5. Start a video in this style
`cp -R <this folder>/example ~/faceless-shorts/<short-name>` (the skill's `new_video.sh` only knows its built-in styles),
then `mkdir -p renders review`, write `script.json` and `src/shots.js`, and continue with the skill's normal steps
(voice.py, words.py, capture check / cues / mix / sheet / video). `node tools/capture.mjs stylesheet ../style-sheet.png`
re-renders this style sheet from `src/sheet.js`.
