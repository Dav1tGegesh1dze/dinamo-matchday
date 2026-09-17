# Dinamo Road to Goal — Stand Game

A short 2D browser game for a Dinamo Tbilisi workshop stand. One device, one player at a time.
Winners (fastest goals of the day) get merch. A full run should take about 2 minutes.

## Tech
- Phaser 3 + Vite + plain JavaScript (no TypeScript, no framework, no backend)
- Must work fully offline once loaded
- Storage: browser localStorage only
- Keep code simple. Zero dead code, no unused abstractions, no features not listed here.

## Game flow
1. **Name entry** – player enters a nickname, presses Start. The run timer starts here.
2. **Dressing room** – top-down maze (dressing room → tunnel), player-controlled.
   Decoy rooms (Physio, Showers). Target: 20–40 seconds. Reaching the coach triggers Question 1.
3. **Question 1 (easy)** – the coach asks. Correct → substituted in. Wrong → "Stay on the bench" → game over.
4. **Cutscene (automatic)** – walk onto the pitch, substitution board, receive the ball.
5. **Defender 1** – auto-dribble to him, Question 2 (medium). Correct → dribble past. Wrong → tackled → game over.
6. **Defender 2** – same, Question 3 (hard).
7. **Goalkeeper** – one-on-one, Question 4 (hardest). Correct → GOAL, timer stops. Wrong → saved → game over.
8. **Result** – shows time / stage reached, then the leaderboard. Auto-return to name entry after ~15 s.

## Questions
- Exactly 4 questions per run, one per stage: easy, medium, hard, hardest
- Each stage has a small pool (~3). One is picked at random per run; answer order is shuffled.
- 4 answer buttons. Countdown per question: 20s, 15s, 12s, 10s. Timeout = wrong answer.
- Text in Georgian (default) and English.
- Real questions will come from the club later; use placeholders until then.

## Leaderboard
- Save every attempt: `{ name, timeMs, stageReached, scored, date }`
- Main ranking: only runs where `scored === true`, sorted by fastest `timeMs`
- Hidden admin key combo: export results as a JSON download, and reset the board

## Controls
- Keyboard (arrow keys / WASD) for now.
- The stand device is not confirmed yet (laptop or touchscreen tablet). Design input so a
  touch joystick can be added later without rewriting the maze.

## Assets
- Art and sounds come from files in `public/assets/`, never drawn in code.
- Placeholder shapes are fine until the polish phase.

## Workflow rules (always follow)
- The plan and roadmap live in `docs/SPEC.md`. Read it before starting any feature.
- Branches: `main` (final release only), `develop` (integration), `feature/<short-name>` (one per roadmap item).
- NEVER commit or push to `main`. NEVER merge pull requests — the developer reviews and merges.
- Every feature: branch from latest `develop` → implement → `npm run build` passes →
  commit → push → open a PR into `develop` with `gh pr create`, acceptance criteria as a checklist.
- One feature per branch. Do not touch files outside the feature's scope. No drive-by refactors.
- Build order: ugly full flow first, polish last.
