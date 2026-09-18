# Dinamo Road to Goal — 3D Version: Architecture Spec

Status: **design only, no code yet.** This is the plan for a 3D remake of the 2D stand game once the
2D version (see `SPEC.md`) has shipped. Same game, same rules, same questions and leaderboard; the
presentation moves from a flat top-down view to a real 3D dressing room, tunnel and pitch.

Every decision below gives the recommendation, the reason, and the alternative, in the same style
as `SPEC.md`. Nothing here is final until the developer approves it.

---

## 1. Glossary (3D terms used in this doc)

| Term | Meaning |
|------|---------|
| **Three.js** | The most widely used JavaScript library for drawing 3D in the browser (WebGL). |
| **Babylon.js** | A bigger all-in-one 3D engine for the browser: rendering, physics, UI, animation in one package. |
| **Mesh** | A 3D object: a shape (geometry) plus how it looks (material). A wall, a player, a ball. |
| **glTF / .glb** | The standard file format for 3D models and animations on the web. Exported from Blender. |
| **Blender** | Free desktop 3D modelling tool. Where the club's artists (or we) make models. |
| **Camera** | The viewpoint. Perspective camera = real depth, like a film camera. |
| **Rig / animation clip** | A skeleton inside a character model, and a named movement on it (idle, walk, kick). |
| **Instanced mesh** | Drawing many copies of the same shape (e.g. 500 wall blocks) in one GPU call. |
| **AABB** | Axis-aligned bounding box. The simplest collision check: two boxes overlap or not. |
| **Draw call** | One instruction to the GPU. Fewer = faster. Low-end laptops want under ~200 per frame. |
| **Baked lighting** | Lighting painted into textures in Blender ahead of time, so the game does no real lighting work. |

---

## 2. What stays exactly the same

The 3D version is **not** a rewrite of the game. The rules live in engine-independent modules that
already exist and are reused untouched:

| Module | Reused as-is | Why it can be reused |
|--------|--------------|----------------------|
| `src/data/questions.js` | yes | plain data, no Phaser |
| `src/lib/run.js` | yes | plain object + 3 functions |
| `src/lib/leaderboard.js` | yes | localStorage only |
| `src/lib/i18n.js` | yes | strings only |
| `public/assets/maze.json` | yes | the tile grid becomes the 3D floor plan (see §6) |

What is replaced: everything under `src/scenes/`, plus `hud.js` and `input.js` (they call Phaser APIs).

**Why this matters:** the club's questions, the ranking rule, the export format and the language
strings are the parts that get tuned right up to the event. They must not fork between the two versions.

---

## 3. Engine  (decision: Three.js)

**Recommended: Three.js** (`three` on npm) with Vite, plain JavaScript, no framework.

- Small, fast to load, and works offline once bundled, like Phaser does today.
- The biggest community and the most tutorials of any browser 3D library, which matters for a
  developer new to 3D.
- We only need: load glTF models, move a camera, play animation clips, tween positions. Three.js
  does all of that; we do not need a full game engine.

**Alternative: Babylon.js.** More built in (physics, GUI, inspector, scene editor). Better if we wanted
real physics or a visual editor. Rejected for now because it is roughly 3× the download, and its
extra features would be unused: our collisions are a grid check and our UI is HTML.

**Rejected outright:** Unity / Godot exports to WebGL. Large builds (20–100 MB), slow first load,
no plain-JS code sharing with the 2D game, and a whole new toolchain to learn.

---

## 4. Folder structure  (decision: second entry point in the same repo)

```
index.html              # 2D game (unchanged)
3d.html                 # 3D game entry page
src/
  data/                 # shared (questions)
  lib/                  # shared (run, leaderboard, i18n)
  scenes/               # 2D Phaser scenes (unchanged)
  3d/
    main.js             # renderer, resize, stage controller
    stages/
      maze.js
      cutscene.js
      pitch.js
    ui/                 # HTML overlays: name entry, question, result, timer
      nameEntry.js
      question.js
      result.js
      hud.js
    world/
      mazeBuilder.js    # Tiled JSON → wall meshes + collision grid
      character.js      # glTF loading + animation clips
      cameraRig.js      # follow camera + scripted camera moves
    input.js            # keyboard → { x, y }; joystick later
public/assets/3d/       # .glb models, textures, audio
```

**Why:** Vite supports several HTML entry points in one build, so `dist/` contains both games and
the stand can open either. Shared data and lib stay in one place with one git history.

**Alternative:** a separate repository. Cleaner on paper, but the shared question/leaderboard files
would have to be copied and kept in sync by hand, which is exactly the failure mode we want to avoid.

---

## 5. Flow and stage controller  (decision: one renderer, a tiny state machine, HTML for all UI)

Phaser's scene system is replaced by a ~40-line **stage controller** in `src/3d/main.js`:

```
nameEntry (HTML) → maze (3D) → question (HTML over 3D, stage 1) → cutscene (3D)
→ pitch (3D) → question ×3 → result (HTML) → nameEntry
```

- One `THREE.WebGLRenderer` and one canvas for the whole game.
- Each 3D stage is an object with `enter()`, `update(dt)`, `exit()`; it owns its own `THREE.Scene`
  and camera. The controller calls `update` every frame for the active stage only.
- **All UI is plain HTML/CSS** positioned over the canvas: name input, KA | EN toggle, the question
  panel with 4 buttons and countdown bar, the run clock, the result list. `question.js` exposes
  `askQuestion(stage) → Promise<boolean>`; the 3D stage `await`s it while the world is frozen.

**Why:** HTML text handles Georgian, wrapping, buttons and touch for free. Rendering crisp text in
WebGL is a known pain. It also means the 2D and 3D question flows behave identically.

**Alternative:** in-world 3D UI (text meshes, a floating panel). Looks fancy, costs a lot, and is
harder to read on a stand.

Run state (`run.js`) is shared exactly as in 2D: `startRun`, `setStage`, `finishRun`.

---

## 6. Maze  (decision: build the 3D maze from the existing Tiled JSON)

- `mazeBuilder.js` reads `public/assets/maze.json`: every wall tile becomes a 1×2.5×1 box placed at
  (col, 0, row); all wall boxes are drawn with **one instanced mesh** (one draw call). The floor is
  one plane with a tiled texture. Room label objects become floating HTML labels or simple signs.
- **Collision:** no physics engine. The player is a circle of radius 0.35 in the grid plane; each frame
  we try the move on X then on Z separately and cancel the axis that would enter a wall tile. This
  is ~20 lines and identical in feel to the 2D Arcade collision.
- The coach object rectangle from the JSON becomes the trigger volume.
- **Camera:** third-person, slightly above and behind the player, looking down at ~45°, smoothed
  with a lerp. Player always sees the walls around them but not the whole maze, which makes the
  same layout noticeably harder than the top-down 2D view (a design goal for the 3D version).

**Why:** one map file feeds both games, so layout tuning stays a Tiled edit. Grid collision is
faster to write and to debug than any physics library.

**Alternative:** author the maze in Blender as a single model and use a physics library
(cannon-es / rapier). Prettier walls, but every layout change becomes a modelling task and we add
a physics dependency for what is a corridor walk.

---

## 7. Characters and animation  (decision: glTF with clips, capsule placeholders first)

- Player, coach, two defenders, goalkeeper: one low-poly rigged model each (or one model with kit
  colour swaps), exported as `.glb` with clips `idle`, `walk`, `dribble`, `kick`, `dive`, `tackle`.
- Free starting point: Mixamo (Adobe) rigs and animations, retargeted in Blender.
- Until real models exist: capsules with a coloured material. The code loads models by name, so
  swapping a placeholder for the real file needs no code change.
- Ball: a sphere with a texture, rolled by rotating it with the distance travelled.

**Alternative:** Ready Player Me or similar avatar services. Rejected: online dependency; the stand is offline.

---

## 8. Cutscene and pitch  (decision: tween.js for scripted moves, AnimationMixer for clips)

- `@tweenjs/tween.js` (tiny) drives positions and camera moves, exactly like Phaser tweens do today:
  walk in from the tunnel, board rises, ball rolls, dribble to defender, dribble around, shot, keeper dive.
- Three.js `AnimationMixer` plays the character clips in sync (walk while moving, kick on the shot).
- The pitch is one flat textured plane plus a goal model; the camera is a broadcast-style angle for
  the dribbles and a low behind-the-ball angle for the shot.

**Alternative:** author whole cutscenes in Blender as animated glTF and just play them. Great for
polish later, but the player's name on the board and the branching (tackled vs. beaten) are easier
to script in code.

---

## 9. Input  (decision: same abstraction as 2D)

`src/3d/input.js` exposes `getAxis() → { x, y }` from arrows + WASD, converted to world X/Z.
A touch joystick (`nipplejs`) plugs into the same function later. Question buttons are HTML, so
touch works already.

---

## 10. Assets and pipeline

- All models in `public/assets/3d/*.glb`, textures embedded. Nothing drawn in code except placeholders.
- Blender → File › Export › glTF 2.0, "glb" format, apply modifiers, include animations.
- Optional: Draco compression when total assets exceed ~15 MB (Three.js has a loader for it).
- Audio: same files as the 2D version, played with `THREE.Audio` or plain `<audio>`.

---

## 11. Performance budget (stand laptop with integrated graphics)

| Item | Budget |
|------|--------|
| Frame rate | 60 fps at 1280×720; must never drop below 30 |
| Draw calls per frame | < 150 |
| Triangles on screen | < 200k |
| Lighting | 1 directional + ambient; shadows only from the player, or none; bake the rest |
| Total assets | < 30 MB so the first load is quick and works from a USB stick |

The renderer caps `devicePixelRatio` at 1.5 to avoid rendering 4× pixels on a retina screen.

---

## 12. Offline and stand behaviour

Same as 2D: `npm run build` produces a static `dist/` that runs from any local server or file
share. No CDN, no fonts from the web, no telemetry. Fullscreen and kiosk hardening reuse the 2D
stand-mode feature.

---

# 3D ROADMAP (build order, ugly full flow first)

Each item is one branch `feature/3d-<short-name>`, small enough for one session, with acceptance
criteria checkable by playing. The 2D game keeps working throughout.

1. **`3d-setup`** — `3d.html`, Three.js renderer, resize, stage controller, HTML name entry reusing
   `i18n.js` and `run.js`, empty 3D stage with a spinning placeholder cube and the run clock.
   - [ ] `npm run dev` opens both `/` (2D) and `/3d.html` (3D)
   - [ ] Name entry works in KA/EN, Start shows a 3D scene with the clock running
2. **`3d-maze`** — maze built from `maze.json`, capsule player, grid collision, follow camera, coach trigger.
   - [ ] Walls match the 2D layout; player cannot pass through them; reaching the coach fires an event
3. **`3d-question`** — HTML question overlay reusing `questions.js`, countdown, reveal, freezes the 3D stage.
   - [ ] Identical behaviour to the 2D quiz (random pick, shuffle, timeout = wrong)
4. **`3d-cutscene`** — tween.js walk-in, board with name, ball delivery, camera move.
5. **`3d-pitch`** — dribbles, defenders, keeper, shot, goal / tackled / saved; `finishRun`.
6. **`3d-result`** — HTML result screen reusing `leaderboard.js`, admin combos, auto-return.
   **→ full 3D flow playable with placeholder capsules.**
7. **`3d-models`** — glTF characters with clips, textured pitch, dressing room props.
8. **`3d-audio`** — reuse the 2D sound set.
9. **`3d-stand-mode`** — fullscreen, pixel-ratio cap, performance pass on the actual stand device.

---

## Open questions for the developer

1. Stand device GPU: integrated laptop graphics, or something better? This sets how detailed the models can be.
2. Who makes the models: club artists, purchased low-poly packs, or Mixamo placeholders for the event?
3. Does the 3D version replace the 2D one at the stand, or do both ship and the club chooses on the day?
4. Should the 3D maze use the same `maze.json` layout, or a purpose-built harder layout (the 3D camera already hides the overview)?
