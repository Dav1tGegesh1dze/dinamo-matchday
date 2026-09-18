# Dinamo Road to Goal — Spec & Roadmap

This is the single source of truth for how the game is built. `CLAUDE.md` says *what* the game is;
this file says *how* we build it and *in which order*. Read both before starting any feature.

Every architecture choice below was agreed on 2026-09-17. Each one lists the decision, the reason,
and the alternative we rejected, so the reasoning is not lost.

---

## 1. Glossary (game-dev terms used in this doc)

| Term | Meaning |
|------|---------|
| **Scene** | One screen of the game (menu, maze, quiz…). Phaser runs one or more scenes at a time. |
| **Overlay scene** | A scene drawn *on top of* another one while the one underneath is paused. |
| **Sprite** | An image placed in the game world that can move, animate and collide. |
| **Tween** | An animation that changes a value (position, alpha, scale) from A to B over a set time. |
| **Tilemap** | A grid-based map. Each cell holds a tile number that maps to a small image. Walls are tiles with a "collides" flag. |
| **Tiled** | Free desktop map editor (mapeditor.org). We draw the maze there and export JSON. |
| **Arcade physics** | Phaser's simple, fast collision system. Enough for "player cannot walk through walls". |
| **localStorage** | A small key/value store inside the browser. Survives reloads, works offline, per device. |
| **Run** | One player's attempt: from pressing Start to GOAL or game over. |

---

## 2. Tech stack

- **Phaser 3** (game engine), **Vite** (dev server + build), **plain JavaScript** (ES modules).
- No TypeScript, no UI framework, no backend, no state library.
- After `npm run build`, the `dist/` folder is a fully static site that works offline from a local file server.

Why: the game is ~2 minutes long and has 7 screens. Anything beyond Phaser + Vite is weight without payoff.

---

## 3. Folder structure  (decision: split by kind)

```
index.html
package.json
vite.config.js
public/
  assets/               # ALL art, tiles, map JSON and sounds live here. Never draw art in code.
src/
  main.js               # Phaser.Game config + list of scenes. Nothing else.
  scenes/
    BootScene.js        # preloads every asset, then starts NameEntry
    NameEntryScene.js   # nickname input, KA/EN toggle, Start button
    MazeScene.js        # dressing room → tunnel, top-down, player-controlled
    QuestionScene.js    # ONE reusable quiz overlay used for all 4 questions
    CutsceneScene.js    # automatic walk-on, sub board, receive ball
    PitchScene.js       # defender 1, defender 2, goalkeeper
    ResultScene.js      # time / stage reached + leaderboard, auto-return
  data/
    questions.js        # the 4 question pools in Georgian and English
  lib/
    run.js              # current run state (name, start time, stage, scored)
    leaderboard.js      # localStorage save / rank / export / reset
    input.js            # keyboard today, touch joystick later
    i18n.js             # current language + UI strings
    hud.js              # the always-visible run timer in the corner
docs/
  SPEC.md               # this file
```

**Why:** with 7 scenes and 5 helpers, grouping by *kind* (scenes / data / lib) is the fastest to scan and
matches how Phaser tutorials are written, so any future contributor feels at home.

**Rejected:** one folder per game part (`maze/`, `pitch/`, `quiz/`). Good for large games; here it would
mean 5 folders holding 1–2 files each.

---

## 4. Scenes and run state  (decision: shared `run.js` module, one overlay Question scene)

### Scene list and flow

```
Boot → NameEntry → Maze ──(coach)──▶ [Question 1] ──ok──▶ Cutscene → Pitch ──(def 1)──▶ [Question 2] ──ok──▶
      ──(def 2)──▶ [Question 3] ──ok──▶ ──(keeper)──▶ [Question 4] ──ok──▶ GOAL → Result → (15 s) → NameEntry
                                                                    any wrong / timeout ──────────▶ Result
```

`Question` is **one scene launched as an overlay**: `this.scene.launch('Question', { stage })`.
It pauses the scene underneath, shows the question, and when finished emits a single event
`answered` with `{ correct: true|false }`, then stops itself. The scene underneath decides what happens
next (dribble past the defender, or go to Result). This avoids four near-identical quiz scenes.

### Run state

`src/lib/run.js` exports one plain object and three functions:

```js
export const run = { name: '', startedAt: 0, finishedAt: 0, stage: 0, scored: false };
export function startRun(name)     // sets name, startedAt = Date.now(), stage = 0
export function setStage(stage)    // 1 = maze/coach, 2 = defender 1, 3 = defender 2, 4 = keeper
export function finishRun(scored)  // sets finishedAt, scored; returns elapsed ms
```

Every scene imports `run` directly. The only thing passed through Phaser's scene data is the
question `stage` number.

**Why:** a module import is the simplest thing that works. Threading an object through six scene
transitions is more code and easy to forget in one place. Phaser's `registry` would also work but
its change-event system is unused here, so it is just a longer way to write a module.

**Rejected:** passing `run` via `scene.start(key, data)` at each transition.

### Stage numbers

Stage reached is stored as a number so the leaderboard can sort and display it:

| stage | meaning |
|-------|---------|
| 0 | did not reach the coach |
| 1 | coach (Question 1) |
| 2 | defender 1 (Question 2) |
| 3 | defender 2 (Question 3) |
| 4 | goalkeeper (Question 4) |

`scored === true` means Question 4 was answered correctly.

---

## 5. Questions  (decision: JS module `src/data/questions.js`)

```js
export const questions = {
  easy:    [ { ka: { text, answers: [4] }, en: { text, answers: [4] }, correct: 0 }, … ],
  medium:  [ … ],
  hard:    [ … ],
  hardest: [ … ],
};
export const COUNTDOWN_SECONDS = [20, 15, 12, 10];   // index = stage - 1
```

- `correct` is the index into the *original* `answers` array (same for both languages).
- Per run: one random question per pool, answers shuffled with `Phaser.Utils.Array.Shuffle` on a copy,
  tracking where the correct answer landed.
- Timeout counts as a wrong answer.
- Placeholder questions until the club supplies real ones. The file format is deliberately simple
  enough for a non-developer to edit.

**Why:** a JS module is bundled into the game, so it can never fail to load offline and needs no
loader step. It is exactly as editable as JSON.

**Rejected:** `public/assets/questions.json` loaded by Phaser. Swappable without rebuilding, but adds a
load step and a failure point for no real gain on a single stand device.

---

## 6. Leaderboard  (decision: one list in localStorage, filter + sort)

`src/lib/leaderboard.js`:

```js
const KEY = 'dinamo-leaderboard';
export function save(attempt)      // attempt = { name, timeMs, stageReached, scored, date }
export function getAll()           // every attempt, newest last
export function getRanked()        // getAll().filter(a => a.scored).sort((a, b) => a.timeMs - b.timeMs)
export function exportJson()       // builds a Blob and triggers a download: dinamo-results-<date>.json
export function reset()            // localStorage.removeItem(KEY)
```

- **Every** attempt is saved, including failed ones, so the club can see how far people got.
- Main ranking = scored runs only, fastest first.
- Result screen shows the top 10, plus one extra line with the current player's own rank if they
  scored but are outside the top 10.

**Why:** one array plus a filter is the least code and preserves all data for export.

**Rejected:** two keys (scored / failed). Two things to keep in sync for no benefit.

---

## 7. Cutscene  (decision: Phaser tweens)

`CutsceneScene` chains 3–4 tweens with `this.tweens.chain()`: player walks in from the tunnel,
substitution board rises showing the player's number, ball rolls to the player, then
`this.scene.start('Pitch')`. About 5 seconds, not skippable. The timer keeps running (it is part of the run).

**Why:** tweens are built into Phaser, need no extra assets beyond the sprites we already have, and
timing is a number in code.

**Rejected:** a pre-made video file. Large, needs a producer, and cannot show the player's name.

---

## 8. Maze  (decision: Tiled map exported as JSON)

- Draw the dressing room → tunnel maze in **Tiled** and export to `public/assets/maze.json`.
- Tileset image in `public/assets/tiles.png` (placeholder colours until polish).
- Layers:
  - `floor` (visual only)
  - `walls` (tiles with custom property `collides = true`)
  - `objects` object layer with points: `spawn`, `coach`, and labelled decoy rooms (`physio`, `showers`)
- `MazeScene` loads the map, creates the layers, calls `setCollisionByProperty({ collides: true })`,
  and adds an Arcade physics collider between the player and the walls.
- Reaching the `coach` zone launches Question 1.
- Target run through the maze: 20–40 s. If it is too fast or slow, **edit the map, not the code.**

### Challenge mechanics (added 2026-09-18, developer found the plain maze too easy)

- **Limited vision.** A full-map black overlay (alpha 0.94) is masked by `public/assets/vision.png`,
  a soft white disc that follows the player (inverted bitmap mask). The player sees ~110 px clearly
  and nothing beyond ~200 px, so the layout and the room labels must be discovered by walking.
- **Collect your kit.** The `objects` layer has `kit` points (`boots` in Physio, `shirt` in Showers).
  Walking over one collects it; two icons top-left light up. Entering the coach zone without the full
  kit shows "Get your kit first!" and does nothing else. This turns the decoy rooms into required
  detours and makes the maze a search rather than a walk.
- Both mechanics are data-driven: move or add kit items in Tiled, no code changes.

**Why:** layout tuning becomes a visual edit. Decoy rooms and labels live in the map alongside walls.

**Rejected:** a hand-typed 2D grid in JS (same idea, no editor), and hardcoded wall rectangles
(fastest to start, but every tweak is code and decoy rooms get messy).

---

## 9. Input  (decision: tiny `input.js` that returns a direction)

```js
export function createInput(scene)   // returns { getAxis() → { x: -1..1, y: -1..1 } }
```

- Reads arrow keys and WASD.
- On touch devices (`game.device.input.touch`) `input.js` also draws an on-screen joystick
  (`joystick-base.png` / `joystick-knob.png`, bottom-left) and prefers it while it is being held.
  `MazeScene` never changed for this.
- Quiz buttons use plain pointer events, which already work with touch.

**Why:** the maze depends on a direction, not on a keyboard. That is the whole abstraction.

**Rejected:** installing `phaser3-rex-plugins` virtual joystick now. The device is not confirmed.

---

## 10. Language  (decision: toggle on Name entry only)

- `src/lib/i18n.js` holds `lang` (`'ka'` default, `'en'`), a `t(key)` function for UI strings, and
  `setLang()`. The choice is remembered in localStorage under `dinamo-lang`.
- A small **KA | EN** button on the Name entry screen. No toggle on other screens.
- Question text and answers are read from `questions[pool][i][lang]`.

**Why:** keeps the quiz screen clean; a player picks once at the start.

---

## 11. Timer HUD  (decision: always visible)

`src/lib/hud.js` exports `createTimer(scene)` which places a small `m:ss.t` text in the top-right
corner and updates it every frame from `run.startedAt`. Used on Maze, Question, Cutscene and Pitch.
It stops when `finishRun()` is called.

**Why:** players must know it is a speed run. Shared helper so the timer looks identical everywhere.

---

## 12. Wrong answer behaviour  (decision: reveal, then game over)

On a wrong answer or timeout: the chosen button turns red, the correct one turns green, hold ~1.5 s,
then the stage's fail message (`Stay on the bench` / `Tackled!` / `Saved!`), then Result.

**Why:** friendlier for a club stand and players learn something.

---

## 13. Admin actions  (decision: keyboard combo on Result screen)

- `Ctrl+Shift+E` → downloads the JSON export.
- `Ctrl+Shift+X` → browser `confirm()` → resets the board. (Changed from `Ctrl+Shift+R` on
  2026-09-18: on Windows/Linux Chrome that combo is the hard-reload shortcut and the page cannot
  reliably block it.)
- Touch devices: tap the headline on the Result screen 5 times within 3 s → a small panel with
  "Export JSON" and "Reset board" buttons.
- Only active on the Result screen.

---

## 14. Physics & rendering notes

- Arcade physics is enabled **only** for the maze (player vs walls). Pitch stages are scripted with tweens.
- Game size: 1280 × 720, `Phaser.Scale.FIT` with `autoCenter`, so it fits a laptop or tablet screen.
- All assets are preloaded once in `BootScene`; no per-scene loading, so there are no mid-run stalls.

---

# ROADMAP

Rules (from `CLAUDE.md`): one feature = one branch `feature/<short-name>` from latest `develop`;
`npm run build` must pass; open a PR into `develop` with the acceptance criteria as a checklist.
The developer reviews and merges. **Ugly full flow first, polish last.**

Each feature is sized for one focused session. Acceptance criteria are things you can check by
playing the game in the browser.

---

### 1. `feature/project-setup` — skeleton you can click through

Scaffold Vite + Phaser. Create all 7 scenes as placeholders (title text + a "next" key/button).
`run.js`, `i18n.js`, `hud.js`, `input.js`, `leaderboard.js` exist as empty-but-real modules only if the
skeleton needs them; otherwise they are added by the feature that first uses them (zero dead code).

Acceptance:
- [ ] `npm run dev` opens the game; `npm run build` produces `dist/` with no errors
- [ ] Every scene is reachable in order by pressing Space/Enter: Boot → NameEntry → Maze → Question → Cutscene → Pitch → Result → NameEntry
- [ ] Each scene shows its name on screen so you know where you are
- [ ] Game canvas scales to fit the browser window without scrollbars

### 2. `feature/name-entry` — start a run

Real nickname input (DOM `<input>` over the canvas), Start button, `run.js` with `startRun()`,
KA | EN toggle with `i18n.js`, timer HUD via `hud.js`.

Acceptance:
- [ ] Cannot press Start with an empty name
- [ ] Pressing Start (or Enter) goes to Maze and the timer in the corner starts from 0:00.0
- [ ] Timer is visible on Maze, Question, Cutscene and Pitch placeholders
- [ ] KA | EN toggle switches the UI strings on the Name entry screen; default is Georgian
- [ ] Language choice survives a page reload

### 3. `feature/maze` — dressing room to the coach

Tiled map, tileset, player sprite (placeholder), Arcade collision, `input.js` (arrows + WASD),
coach trigger zone, decoy rooms (Physio, Showers) with labels.

Acceptance:
- [ ] Player moves with arrow keys and WASD; diagonal movement is not faster than straight
- [ ] Player cannot walk through walls
- [ ] Physio and Showers rooms exist, are labelled, and are dead ends
- [ ] Walking into the coach zone moves to the next scene (Question placeholder for now)
- [ ] A first-time player takes roughly 20–40 s to reach the coach

### 4. `feature/question-overlay` — the quiz

`QuestionScene` as an overlay, `questions.js` with placeholder pools (3 per stage), random pick +
shuffled answers, countdown bar (20/15/12/10 s), reveal on wrong, `answered` event.
Wired into Maze at the coach as Question 1: correct → Cutscene, wrong → Result.

Acceptance:
- [ ] Reaching the coach pauses the maze and shows a question with 4 answer buttons and a countdown
- [ ] Question text and answers appear in the language chosen on Name entry
- [ ] Playing 3 runs shows different questions / different answer orders
- [ ] Correct answer → short "substituted in" confirmation → Cutscene placeholder
- [ ] Wrong answer → chosen button red, correct button green for ~1.5 s → "Stay on the bench" → Result
- [ ] Letting the countdown hit 0 behaves exactly like a wrong answer
- [ ] Run timer keeps running during the question

### 5. `feature/cutscene` — walk onto the pitch

Tween chain: player walks in, sub board rises with the player's name, ball rolls in, then Pitch.

Acceptance:
- [ ] Plays automatically with no input, ~5 s, then goes to Pitch
- [ ] The substitution board shows the nickname entered on Name entry
- [ ] Timer keeps running through the cutscene

### 6. `feature/pitch` — defenders and goalkeeper

`PitchScene`: auto-dribble tween to defender 1 → Question 2; past him to defender 2 → Question 3;
to the goalkeeper → Question 4. Correct on Q4 = GOAL, `finishRun(true)`, timer stops.
Wrong at any point = tackled / saved → `finishRun(false)` → Result.

Acceptance:
- [ ] After the cutscene the player auto-dribbles to defender 1 and Question 2 appears
- [ ] Correct → dribbles past → defender 2 → Question 3 → keeper → Question 4
- [ ] Wrong at defender → "Tackled!" → Result; wrong at keeper → "Saved!" → Result
- [ ] Correct on Question 4 → "GOAL!" and the timer in the corner freezes
- [ ] Countdowns are 15 s, 12 s, 10 s for Questions 2, 3, 4

### 7. `feature/leaderboard` — save and show results

`leaderboard.js`, `ResultScene` shows time (if scored) or stage reached, then the top 10 with the
player's own rank line, then auto-returns to Name entry after 15 s.

Acceptance:
- [ ] After a GOAL the Result screen shows the final time and the player appears in the list
- [ ] After a game over it shows the stage reached ("Tackled at defender 2") and no time
- [ ] Ranking shows only scored runs, fastest first, max 10 rows
- [ ] A scored player outside the top 10 sees their own rank on an extra line
- [ ] Results survive a page reload
- [ ] The screen returns to Name entry by itself after ~15 s

### 8. `feature/admin-tools` — export and reset

Keyboard combos on the Result screen.

Acceptance:
- [ ] `Ctrl+Shift+E` on Result downloads `dinamo-results-<date>.json` containing every attempt (including failed ones)
- [ ] `Ctrl+Shift+R` on Result asks for confirmation; OK empties the board, Cancel does nothing
- [ ] The combos do nothing on any other screen

**→ At this point the full game is playable end to end. Everything below is polish.**

### 9. `feature/art` — real sprites and tiles

Replace placeholder shapes with the final art from `public/assets/`: player, coach, defenders,
keeper, ball, sub board, tileset, backgrounds, UI panels and buttons. Add walk animations.

Acceptance:
- [ ] No coloured rectangles remain anywhere in the game
- [ ] Player has a walk animation in the maze and during the dribble
- [ ] Maze walls, floor and room labels use the final tileset
- [ ] Quiz panel and buttons match the club look

### 10. `feature/audio` — sounds

Whistle on Start, footsteps / crowd loop, correct / wrong stings, tackle, save, goal roar.

Acceptance:
- [ ] Every event above has a sound
- [ ] A mute toggle is available on Name entry and is remembered
- [ ] No sound plays before the first user interaction (browser autoplay rule)

### 11. `feature/stand-mode` — kiosk hardening

Fullscreen on Start, block right-click / text selection / pinch-zoom, re-check offline load from a
built `dist/`. The stand device was still unconfirmed, so the touch parts were built too and only
appear on touch devices: the virtual joystick inside `input.js` and the hidden tap sequence for
the admin actions.

Acceptance:
- [ ] Pressing Start enters fullscreen
- [ ] Right-click and text selection are disabled on the game
- [ ] `npx vite preview` with Wi-Fi off runs a full run with no errors in the console
- [ ] On a touch device the on-screen joystick moves the player in the maze
- [ ] On a touch device tapping the Result headline 5× opens Export / Reset

---

### 12. `feature/maze-challenge` — limited vision + kit collection (added 2026-09-18)

See §8 "Challenge mechanics". Built after feature 8 at the developer's request.

Acceptance:
- [ ] Only a circle around the player is visible; labels and the coach are hidden until close
- [ ] Boots (Physio) and shirt (Showers) can be picked up; the two HUD icons light up
- [ ] Touching the coach with kit missing shows "Get your kit first!" and does not start the quiz
- [ ] With both items the coach asks Question 1 as before

---

# PHASE 2 (requested by the developer on 2026-09-18 after playing the finished Phase 1)

Same rules: one branch per item, PR into `develop`, verified before merge. Build order as listed.

### 13. `feature/kit-locations` — pickups where they belong

The kit (shirt, boots) lives in the **dressing room**; the Physio room holds **ankle tape**. All three
are required before the coach lets you through. Showers stays a pure decoy. Items remain `kit`
points in `maze.json`, so moving them is a Tiled edit. Three HUD icons top-left.

Acceptance:
- [ ] Shirt and boots are picked up in the dressing room; tape in Physio
- [ ] Coach refuses with a hint until all three are collected
- [ ] Showers contain nothing

### 14. `feature/maze-audio` — softer footsteps and relaxing music in the maze

Replace the footstep click with a soft, quiet tap; add a calm ambient music loop
(`maze-music.wav`) that starts with the maze and stops when the cutscene starts (the crowd takes over).

Acceptance:
- [ ] Calm music plays during the maze only; the crowd replaces it from the cutscene onwards
- [ ] Footsteps are soft and clearly quieter than the music
- [ ] Mute toggle silences both

### 15. `feature/registration` — username, mobile number, e-mail

Name entry becomes a registration form: **username**, **mobile number**, **e-mail**, all required.
Basic validation (username 2–20 chars; phone `+` and 9–15 digits; e-mail `x@y.z`) with an inline error
message in KA/EN. The three values are stored on the run and saved with **every** leaderboard attempt
(`{ name, phone, email, timeMs, stageReached, scored, date }`) so the club can call the winners from the
JSON export. The on-screen leaderboard shows only the username.

Privacy note: contact data lives only in the stand device's localStorage and in the exported JSON.
The club should reset the board after the event.

Acceptance:
- [ ] Start is blocked until all three fields are valid; an error line explains which one is wrong
- [ ] The exported JSON contains phone and e-mail for each attempt
- [ ] The Result leaderboard shows usernames only

### 16. `feature/retry` — play again without re-registering

Result screen gets a **Retry** button (also Enter). It starts a new run for the same registered player,
straight into the maze, with a fresh timer. The 15 s auto-return to registration stays for the next player.

Acceptance:
- [ ] Retry (button or Enter) on Result starts a new run from the maze with the timer at 0:00.0
- [ ] The retried run is saved as a separate attempt with the same name / phone / e-mail
- [ ] Doing nothing on Result still returns to registration after ~15 s

### 17. `feature/desktop-package` — downloadable Mac and Windows builds

Electron wrapper around the built `dist/` (fullscreen window, offline, same localStorage data).
`npm run package` produces `release/` with a `.dmg` + `.zip` for macOS and a portable `.exe` + `.zip`
for Windows. Builds are attached to a GitHub **pre-release** so they can be downloaded without any tools.
The web version keeps working unchanged.

Acceptance:
- [ ] `npm run package` succeeds on macOS and produces the four files
- [ ] The Mac app opens fullscreen, plays a full run offline, and keeps results between launches
- [ ] The Windows build is attached to the GitHub release (to be smoke-tested on a Windows machine)

---

## Open items waiting on the club

- Real questions (4 pools × ~3, Georgian + English) → replace placeholders in `src/data/questions.js`
- Final art and sounds → `public/assets/`
- Stand device confirmation (laptop vs touchscreen) → decides the touch parts of feature 11
