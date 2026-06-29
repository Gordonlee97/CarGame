# Car Game — Design Spec

**Date:** 2026-06-29
**Status:** Approved (pending spec review)

## Overview

A Rush Hour / "Unblock Me"–style sliding-block puzzle game. Cars and trucks occupy
a 6×6 grid. The player slides blocking vehicles out of the way to drive the **red
target car** out through the exit on the right edge. The goal is to solve each
puzzle in as few moves as possible; the game shows the player's move count against
the computed optimal.

The game is a polished, animated, responsive web app playable on both mobile
(touch) and desktop (mouse + keyboard).

## Goals

- Clean, minimalist visuals with fluid, snappy animations — "feels like a polished game."
- Procedurally generated, always-solvable puzzles.
- Move counter scored against the optimal (minimum) move count.
- A level editor where users build their own puzzles, validate them, and save them to play.
- Works well on mobile and desktop from a single responsive codebase.

## Non-Goals (v1)

- No accounts, backend, or cloud sync. Custom levels are stored locally.
- No shareable level codes/URLs (easy later add; explicitly deferred).
- No difficulty selector UI (the generator targets a medium band internally).
- No stars, timers, streaks, leaderboards, or sound (can come later).

## Tech Stack

- **React + TypeScript + Vite** — app shell and components.
- **Tailwind CSS** — styling.
- **Framer Motion** — drag interaction and animations.
- **Vitest + React Testing Library** — tests.
- **ESLint + Prettier** — lint/format.
- Static build, deployable to Vercel.

## Platform / Responsiveness

- The board is a square sized to `min(viewport width, height)` minus chrome, so it
  fits portrait on phones and any desktop window.
- Input uses pointer events, so touch-drag and mouse-drag share one code path.
- Arrow keys move the currently selected car (accessibility + desktop convenience).

## Core Domain Model

Grid: **6×6**, coordinates `(row, col)`, 0-indexed, row 0 at top.

```ts
type Orientation = 'h' | 'v';

interface Car {
  id: string;
  orientation: Orientation;
  length: 2 | 3;        // 2 = car, 3 = truck
  row: number;          // anchor cell (top-most / left-most)
  col: number;
  isTarget: boolean;    // the red car
}

interface PuzzleDef {
  id: string;
  cars: Car[];
  // exit is implied: right edge of the target car's row
}
```

- The **target car** is horizontal, length 2, on the **exit row** (row index 2).
  The exit is the gap on the right edge of that row.
- A puzzle is **solved** when the target car's right edge reaches the right wall
  (and slides out the exit).

### Move definition

A **move** = sliding one car any distance in a single direction. Distance does not
matter; repositioning a car once = one move. This matches drag UX (drag from A to B
= one move) and classic Rush Hour move-counting. The solver's optimal count uses the
same definition.

## Module Architecture

Game logic is pure (no React) and independently unit-testable. UI is layered on top.

### `src/game/types.ts`
Shared types: `Car`, `Orientation`, `PuzzleDef`, `Move`, `Board` helpers.

### `src/game/board.ts`
Pure functions over a set of cars:
- `buildOccupancy(cars): Grid` — which cell is occupied by which car id.
- `legalMoves(cars, carId): Move[]` / `canPlaceAt(...)` — legal slide range for a car.
- `applyMove(cars, move): Car[]` — returns a new car array.
- `isSolved(cars): boolean` — target car at the exit.
- `serialize(cars): string` / `deserialize(string): Car[]` — compact state key for
  the solver and storage.
- Placement legality (overlap / bounds) used by both gameplay and the editor.

### `src/game/solver.ts`
- `solve(cars): { optimal: number; path: Move[] } | null`
- BFS over board states (states keyed by `serialize`). Returns the minimum-move
  solution path, or `null` if unsolvable.
- Powers **both** puzzle generation (validity + difficulty) and **par** (optimal score).
- 6×6 state space is small; BFS runs in milliseconds. If generation loops ever get
  heavy, move generation to a Web Worker (deferred until measured necessary).

### `src/game/generator.ts`
- `generate(opts): PuzzleDef`
- Random-place-then-verify: place the target car on the exit row, scatter a mix of
  length-2/3 cars in random legal positions/orientations (no overlaps), run `solve`.
- Accept only if solvable **and** the optimal count lands in the target difficulty
  band; otherwise retry. Bounded retries with a fallback.

### `src/state/useGameState.ts`
A `useReducer` hook (no extra state library). Actions:
- `MOVE_CAR` — apply a legal move, push to history, increment move count.
- `UNDO` — pop history.
- `RESET` — return to the puzzle's initial state.
- `NEW_PUZZLE` — load a generated or custom puzzle.

Holds: current cars, initial cars, move count, history stack, optimal par,
solved flag.

### `src/state/useEditorState.ts`
Separate `useReducer` hook for the editor: piece placement, selection, rotation,
deletion, target designation, and a derived "is this layout valid / saveable" flag.

### `src/storage/levels.ts`
localStorage CRUD over saved custom levels. Each record: serialized `PuzzleDef`,
name, computed optimal par, id, `createdAt`. Functions: `listLevels`, `saveLevel`,
`deleteLevel`, `getLevel`.

### `src/components/`
- `Board` — the 6×6 grid (CSS grid) + exit gap rendering.
- `Car` — Framer Motion draggable. Axis-locked to its orientation, drag constrained
  to its current legal slide range, spring-snaps to the nearest legal cell on release.
  Grab gives a subtle scale/shadow lift.
- `Controls` — Random / Reset / Undo.
- `Hud` — move counter + optimal par (e.g. "Moves: 9 · Optimal: 6").
- `WinOverlay` — shown on solve; target car drives out the exit, then a panel shows
  moves vs optimal and a "Play again / Next" action.
- `editor/Palette` — car/truck × horizontal/vertical pieces to place.
- `editor/EditorBoard` — placement surface (reuses `board.ts` legality).
- `editor/EditorControls` — set-target, save (disabled until valid), clear.

### App shell
A simple top-level view state `'play' | 'create' | 'levels'` with nav. No router
dependency in v1 (router is the upgrade path for shareable URLs).

## Interaction & Animation

- Cars drag only along their axis and cannot pass through occupied cells or walls.
- On release, a car spring-snaps to the nearest legal cell. If its cell changed, that
  counts as one move (history + counter update).
- On solve: the red car animates out through the exit, then `WinOverlay` appears.
- Visuals: flat colors, rounded vehicles, crisp shadows; the red target car is
  visually distinct. Animations are spring-based for a snappy, tactile feel.

## Level Editor Flow (Create mode)

1. User opens **Create**. Empty 6×6 board + palette.
2. Place pieces (car/truck, h/v) by tap or drag; overlaps/out-of-bounds rejected.
3. Tap a placed piece to rotate or delete; drag to reposition.
4. Mark exactly one car as the **target** (constrained to horizontal on the exit row,
   so the puzzle is always well-formed).
5. **Save** is disabled until the layout is legal and has a valid target.
6. On Save, run `solve`:
   - Unsolvable → block with a clear message.
   - Solvable → persist with computed optimal par to localStorage; appears in
     **My Levels**.
7. **My Levels** lists saved puzzles; selecting one plays it on the standard board +
   HUD, scored against the stored par. Levels can be deleted.

## Testing Strategy

- **TDD** for game logic with Vitest:
  - `board.ts`: occupancy, legal moves, apply, isSolved, serialize round-trip.
  - `solver.ts`: known Rush Hour puzzles with known optimal counts; unsolvable
    boards return `null`.
  - `generator.ts`: always returns solvable puzzles whose optimal is in band.
  - `storage/levels.ts`: CRUD round-trips.
- Lighter React Testing Library smoke tests for controls, win condition, and the
  editor's save-validity gating.

## Build Order

- **Phase 1 — Core game:** types, board, solver, generator, gameplay state,
  board/car/controls/HUD/win components, responsive shell. Playable random puzzles
  scored against optimal.
- **Phase 2 — Editor:** editor state, palette/editor components, storage, My Levels.
  Built entirely on Phase 1's board + solver with no rework.

## Deferred / Future

- Shareable level codes or URLs (serialize `PuzzleDef` into a short string; add router).
- Difficulty selector, stars/timer/streaks, sound, themes.
- Cloud sync / accounts.
- Web Worker for generation if profiling shows it's needed.
