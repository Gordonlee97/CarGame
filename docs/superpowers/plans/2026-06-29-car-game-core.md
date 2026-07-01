# Car Game (Core) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a playable, polished Rush Hour–style puzzle game: slide cars to free the red target car, with procedurally generated solvable puzzles and a move counter scored against the optimal solution.

**Architecture:** Pure, framework-free game logic (`src/game/`) — board rules, a BFS solver, and a generator — sits under a React UI. Gameplay state lives in a `useReducer` hook. Components render a CSS-grid board with Framer Motion draggable cars. Logic is TDD'd with Vitest; the UI is layered on top.

**Tech Stack:** React + TypeScript + Vite, Tailwind CSS v4, Framer Motion, Vitest + React Testing Library.

---

## File Structure

- `src/game/types.ts` — shared domain types and constants.
- `src/game/board.ts` — pure board rules: occupancy, legality, moves, solved check, serialize.
- `src/game/solver.ts` — BFS solver → optimal move count + path.
- `src/game/generator.ts` — random-place-then-verify puzzle generation.
- `src/state/useGameState.ts` — gameplay reducer hook (move/undo/reset/new).
- `src/components/Board.tsx` — grid + exit rendering, hosts cars.
- `src/components/CarPiece.tsx` — one draggable car.
- `src/components/Controls.tsx` — Random / Reset / Undo.
- `src/components/Hud.tsx` — move counter + optimal par.
- `src/components/WinOverlay.tsx` — solve celebration + stats.
- `src/App.tsx` — composition + responsive layout.
- Test files colocated as `*.test.ts(x)`.

---

## Task 1: Scaffold the project

**Files:**
- Create: project skeleton via Vite, `vite.config.ts`, `src/index.css`, `src/test/setup.ts`

- [ ] **Step 1: Scaffold Vite React-TS into the current directory**

Run:
```bash
npm create vite@latest . -- --template react-ts
npm install
```
If prompted that the directory is not empty, choose to **ignore/continue** (keep existing files).

- [ ] **Step 2: Install runtime + dev dependencies**

Run:
```bash
npm install framer-motion tailwindcss @tailwindcss/vite
npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

- [ ] **Step 3: Configure Vite for Tailwind v4 + Vitest**

Replace `vite.config.ts` with:
```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
});
```

- [ ] **Step 4: Wire Tailwind + test setup**

Replace `src/index.css` with:
```css
@import "tailwindcss";
```

Create `src/test/setup.ts`:
```ts
import '@testing-library/jest-dom';
```

Add a `test` script to `package.json` `scripts`:
```json
"test": "vitest run"
```

- [ ] **Step 5: Add a smoke test**

Create `src/smoke.test.ts`:
```ts
import { describe, it, expect } from 'vitest';

describe('smoke', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 6: Run the test suite**

Run: `npm test`
Expected: 1 passing test.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite + React + TS + Tailwind + Vitest"
```

---

## Task 2: Domain types

**Files:**
- Create: `src/game/types.ts`

- [ ] **Step 1: Write the types and constants**

```ts
// src/game/types.ts
export type Orientation = 'h' | 'v';

export interface Car {
  id: string;
  orientation: Orientation;
  length: 2 | 3;
  row: number; // top-most cell for 'v', the row for 'h'
  col: number; // left-most cell for 'h', the col for 'v'
  isTarget: boolean;
}

export interface Move {
  carId: string;
  row: number; // new anchor row
  col: number; // new anchor col
}

export interface PuzzleDef {
  id: string;
  cars: Car[];
}

export const GRID_SIZE = 6;
export const EXIT_ROW = 2; // target car's row; exit is the right edge of this row
```

- [ ] **Step 2: Commit**

```bash
git add src/game/types.ts
git commit -m "feat: add core domain types"
```

---

## Task 3: Board occupancy, bounds, and serialization

**Files:**
- Create: `src/game/board.ts`
- Test: `src/game/board.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// src/game/board.test.ts
import { describe, it, expect } from 'vitest';
import { cellsOf, isWithinBounds, hasOverlap, serialize } from './board';
import type { Car } from './types';

const car = (over: Partial<Car>): Car => ({
  id: 'A', orientation: 'h', length: 2, row: 0, col: 0, isTarget: false, ...over,
});

describe('cellsOf', () => {
  it('lists horizontal cells', () => {
    expect(cellsOf(car({ orientation: 'h', length: 2, row: 1, col: 2 })))
      .toEqual([[1, 2], [1, 3]]);
  });
  it('lists vertical cells', () => {
    expect(cellsOf(car({ orientation: 'v', length: 3, row: 1, col: 4 })))
      .toEqual([[1, 4], [2, 4], [3, 4]]);
  });
});

describe('isWithinBounds', () => {
  it('accepts an in-bounds car', () => {
    expect(isWithinBounds(car({ orientation: 'h', length: 2, row: 0, col: 4 }))).toBe(true);
  });
  it('rejects a car off the right edge', () => {
    expect(isWithinBounds(car({ orientation: 'h', length: 2, row: 0, col: 5 }))).toBe(false);
  });
});

describe('hasOverlap', () => {
  it('detects overlapping cars', () => {
    const a = car({ id: 'A', orientation: 'h', row: 0, col: 0 });
    const b = car({ id: 'B', orientation: 'v', row: 0, col: 1 });
    expect(hasOverlap([a, b])).toBe(true);
  });
  it('passes non-overlapping cars', () => {
    const a = car({ id: 'A', orientation: 'h', row: 0, col: 0 });
    const b = car({ id: 'B', orientation: 'h', row: 1, col: 0 });
    expect(hasOverlap([a, b])).toBe(false);
  });
});

describe('serialize', () => {
  it('is order-independent and position-sensitive', () => {
    const a = car({ id: 'A', row: 0, col: 0 });
    const b = car({ id: 'B', orientation: 'v', row: 1, col: 1 });
    expect(serialize([a, b])).toBe(serialize([b, a]));
    const moved = { ...a, col: 1 };
    expect(serialize([moved, b])).not.toBe(serialize([a, b]));
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/game/board.test.ts`
Expected: FAIL — `board.ts` has no such exports.

- [ ] **Step 3: Implement**

```ts
// src/game/board.ts
import { GRID_SIZE } from './types';
import type { Car } from './types';

export function cellsOf(car: Car): Array<[number, number]> {
  const cells: Array<[number, number]> = [];
  for (let i = 0; i < car.length; i++) {
    cells.push(
      car.orientation === 'h' ? [car.row, car.col + i] : [car.row + i, car.col],
    );
  }
  return cells;
}

export function isWithinBounds(car: Car): boolean {
  return cellsOf(car).every(
    ([r, c]) => r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE,
  );
}

export function hasOverlap(cars: Car[]): boolean {
  const seen = new Set<string>();
  for (const car of cars) {
    for (const [r, c] of cellsOf(car)) {
      const key = `${r},${c}`;
      if (seen.has(key)) return true;
      seen.add(key);
    }
  }
  return false;
}

export function serialize(cars: Car[]): string {
  return [...cars]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((c) => `${c.id}:${c.row},${c.col}`)
    .join('|');
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/game/board.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/game/board.ts src/game/board.test.ts
git commit -m "feat: board occupancy, bounds, overlap, serialize"
```

---

## Task 4: Legal moves, applyMove, isSolved

**Files:**
- Modify: `src/game/board.ts`
- Test: `src/game/board.test.ts`

- [ ] **Step 1: Add failing tests**

Append to `src/game/board.test.ts`:
```ts
import { legalMoves, applyMove, isSolved } from './board';

describe('legalMoves', () => {
  it('returns reachable anchor positions for a horizontal car', () => {
    // Row 0: car A at col 0-1, nothing else on row 0 -> can slide to cols 0..4
    const a = car({ id: 'A', orientation: 'h', length: 2, row: 0, col: 0 });
    const moves = legalMoves([a], 'A').map((m) => m.col).sort((x, y) => x - y);
    expect(moves).toEqual([1, 2, 3, 4]); // excludes current col 0
  });
  it('is blocked by another car', () => {
    const a = car({ id: 'A', orientation: 'h', length: 2, row: 0, col: 0 });
    const b = car({ id: 'B', orientation: 'h', length: 2, row: 0, col: 3 });
    const moves = legalMoves([a, b], 'A').map((m) => m.col).sort((x, y) => x - y);
    expect(moves).toEqual([1]); // can only reach col 1 (col 2 would touch B at col 3? no) 
  });
});

describe('applyMove', () => {
  it('repositions only the moved car', () => {
    const a = car({ id: 'A', row: 0, col: 0 });
    const b = car({ id: 'B', orientation: 'v', row: 1, col: 1 });
    const next = applyMove([a, b], { carId: 'A', row: 0, col: 2 });
    expect(next.find((c) => c.id === 'A')!.col).toBe(2);
    expect(next.find((c) => c.id === 'B')!.col).toBe(1);
  });
});

describe('isSolved', () => {
  it('is solved when the target reaches the right edge', () => {
    const t = car({ id: 'T', orientation: 'h', length: 2, row: 2, col: 4, isTarget: true });
    expect(isSolved([t])).toBe(true);
  });
  it('is not solved otherwise', () => {
    const t = car({ id: 'T', orientation: 'h', length: 2, row: 2, col: 3, isTarget: true });
    expect(isSolved([t])).toBe(false);
  });
});
```

Note on the "blocked by another car" test: A occupies cols 0–1; B occupies cols 3–4. A can move right until its right cell hits col 2 (anchor col 1). So only `[1]`. Keep the assertion as written.

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/game/board.test.ts`
Expected: FAIL — new exports missing.

- [ ] **Step 3: Implement**

Append to `src/game/board.ts`:
```ts
import { EXIT_ROW } from './types';
import type { Move } from './types';

function occupiedByOthers(cars: Car[], carId: string): Set<string> {
  const occ = new Set<string>();
  for (const c of cars) {
    if (c.id === carId) continue;
    for (const [r, cc] of cellsOf(c)) occ.add(`${r},${cc}`);
  }
  return occ;
}

export function legalMoves(cars: Car[], carId: string): Move[] {
  const car = cars.find((c) => c.id === carId);
  if (!car) return [];
  const blocked = occupiedByOthers(cars, carId);
  const moves: Move[] = [];

  const tryDirection = (dr: number, dc: number) => {
    let { row, col } = car;
    while (true) {
      row += dr;
      col += dc;
      const candidate: Car = { ...car, row, col };
      if (!isWithinBounds(candidate)) break;
      if (cellsOf(candidate).some(([r, c]) => blocked.has(`${r},${c}`))) break;
      moves.push({ carId, row, col });
    }
  };

  if (car.orientation === 'h') {
    tryDirection(0, -1);
    tryDirection(0, 1);
  } else {
    tryDirection(-1, 0);
    tryDirection(1, 0);
  }
  return moves;
}

export function applyMove(cars: Car[], move: Move): Car[] {
  return cars.map((c) =>
    c.id === move.carId ? { ...c, row: move.row, col: move.col } : c,
  );
}

export function isSolved(cars: Car[]): boolean {
  const target = cars.find((c) => c.isTarget);
  if (!target) return false;
  return target.row === EXIT_ROW && target.col + target.length === GRID_SIZE;
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/game/board.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/game/board.ts src/game/board.test.ts
git commit -m "feat: legal moves, applyMove, isSolved"
```

---

## Task 5: BFS solver

**Files:**
- Create: `src/game/solver.ts`
- Test: `src/game/solver.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// src/game/solver.test.ts
import { describe, it, expect } from 'vitest';
import { solve } from './solver';
import type { Car } from './types';

const t = (over: Partial<Car>): Car => ({
  id: 'X', orientation: 'h', length: 2, row: 0, col: 0, isTarget: false, ...over,
});

describe('solve', () => {
  it('returns 0 moves when already solved', () => {
    const target = t({ id: 'T', row: 2, col: 4, isTarget: true });
    const res = solve([target]);
    expect(res).not.toBeNull();
    expect(res!.optimal).toBe(0);
  });

  it('solves a one-move puzzle', () => {
    // Target at row 2 col 0-1, must reach col 4-5. Nothing blocks -> 1 slide.
    const target = t({ id: 'T', row: 2, col: 0, isTarget: true });
    const res = solve([target]);
    expect(res!.optimal).toBe(1);
  });

  it('requires clearing a blocker first', () => {
    // Target row 2 col 0-1. Vertical car B occupies col 3 rows 1-2, blocking the exit.
    // Move B up (to rows 0-1) then target slides out: 2 moves.
    const target = t({ id: 'T', orientation: 'h', length: 2, row: 2, col: 0, isTarget: true });
    const blocker = t({ id: 'B', orientation: 'v', length: 2, row: 1, col: 3 });
    const res = solve([target, blocker]);
    expect(res!.optimal).toBe(2);
  });

  it('returns null for an unsolvable puzzle', () => {
    // Target row 2 col 0-1. A vertical 3-car fills col 3 rows 0-2; another fills rows 3-5
    // of col 3 — the exit column is permanently blocked and the blockers cannot move
    // (boxed by walls), so no solution.
    const target = t({ id: 'T', orientation: 'h', length: 2, row: 2, col: 0, isTarget: true });
    const top = t({ id: 'B1', orientation: 'v', length: 3, row: 0, col: 3 });
    const bottom = t({ id: 'B2', orientation: 'v', length: 3, row: 3, col: 3 });
    expect(solve([target, top, bottom])).toBeNull();
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/game/solver.test.ts`
Expected: FAIL — `solve` not defined.

- [ ] **Step 3: Implement**

```ts
// src/game/solver.ts
import { serialize, legalMoves, applyMove, isSolved } from './board';
import type { Car, Move } from './types';

interface Node {
  key: string;
  cars: Car[];
}

export function solve(cars: Car[]): { optimal: number; path: Move[] } | null {
  const startKey = serialize(cars);
  if (isSolved(cars)) return { optimal: 0, path: [] };

  const visited = new Set<string>([startKey]);
  const queue: Node[] = [{ key: startKey, cars }];
  // parent[childKey] = { parentKey, move }
  const parent = new Map<string, { parentKey: string; move: Move }>();

  while (queue.length > 0) {
    const { key: currentKey, cars: current } = queue.shift()!;
    for (const car of current) {
      for (const move of legalMoves(current, car.id)) {
        const nextCars = applyMove(current, move);
        const key = serialize(nextCars);
        if (visited.has(key)) continue;
        visited.add(key);
        parent.set(key, { parentKey: currentKey, move });
        if (isSolved(nextCars)) {
          return { optimal: pathLength(parent, key), path: buildPath(parent, key) };
        }
        queue.push({ key, cars: nextCars });
      }
    }
  }
  return null;
}

function buildPath(
  parent: Map<string, { parentKey: string; move: Move }>,
  endKey: string,
): Move[] {
  const path: Move[] = [];
  let key = endKey;
  while (parent.has(key)) {
    const { parentKey, move } = parent.get(key)!;
    path.unshift(move);
    key = parentKey;
  }
  return path;
}

function pathLength(
  parent: Map<string, { parentKey: string; move: Move }>,
  endKey: string,
): number {
  return buildPath(parent, endKey).length;
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/game/solver.test.ts`
Expected: PASS (all four cases).

- [ ] **Step 5: Commit**

```bash
git add src/game/solver.ts src/game/solver.test.ts
git commit -m "feat: BFS solver with optimal path"
```

---

## Task 6: Puzzle generator

**Files:**
- Create: `src/game/generator.ts`
- Test: `src/game/generator.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// src/game/generator.test.ts
import { describe, it, expect } from 'vitest';
import { generate } from './generator';
import { solve } from './solver';
import { hasOverlap, isWithinBounds, isSolved } from './board';
import { EXIT_ROW } from './types';

function seededRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

describe('generate', () => {
  it('produces a legal, unsolved, solvable puzzle within the difficulty band', () => {
    const puzzle = generate({ minOptimal: 4, maxOptimal: 12, rng: seededRng(42) });
    expect(hasOverlap(puzzle.cars)).toBe(false);
    expect(puzzle.cars.every(isWithinBounds)).toBe(true);
    expect(isSolved(puzzle.cars)).toBe(false);

    const target = puzzle.cars.find((c) => c.isTarget)!;
    expect(target.row).toBe(EXIT_ROW);
    expect(target.orientation).toBe('h');

    const res = solve(puzzle.cars);
    expect(res).not.toBeNull();
    expect(res!.optimal).toBeGreaterThanOrEqual(4);
    expect(res!.optimal).toBeLessThanOrEqual(12);
  });

  it('is deterministic for a given seed', () => {
    const a = generate({ minOptimal: 4, maxOptimal: 12, rng: seededRng(7) });
    const b = generate({ minOptimal: 4, maxOptimal: 12, rng: seededRng(7) });
    expect(a.cars).toEqual(b.cars);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/game/generator.test.ts`
Expected: FAIL — `generate` not defined.

- [ ] **Step 3: Implement**

```ts
// src/game/generator.ts
import { GRID_SIZE, EXIT_ROW } from './types';
import type { Car, PuzzleDef, Orientation } from './types';
import { hasOverlap, isWithinBounds, isSolved } from './board';
import { solve } from './solver';

interface GenerateOpts {
  minOptimal?: number;
  maxOptimal?: number;
  carCount?: number;
  rng?: () => number;
  maxAttempts?: number;
}

const randInt = (rng: () => number, n: number) => Math.floor(rng() * n);

function randomTarget(rng: () => number): Car {
  // horizontal length-2 on the exit row, not already at the exit
  const col = randInt(rng, GRID_SIZE - 2); // 0..3, so col+2 < GRID_SIZE (not solved)
  return { id: 'T', orientation: 'h', length: 2, row: EXIT_ROW, col, isTarget: true };
}

function randomCar(rng: () => number, id: string): Car {
  const orientation: Orientation = rng() < 0.5 ? 'h' : 'v';
  const length: 2 | 3 = rng() < 0.7 ? 2 : 3;
  const row = randInt(rng, GRID_SIZE);
  const col = randInt(rng, GRID_SIZE);
  return { id, orientation, length, row, col, isTarget: false };
}

export function generate(opts: GenerateOpts = {}): PuzzleDef {
  const {
    minOptimal = 4,
    maxOptimal = 14,
    carCount = 8,
    rng = Math.random,
    maxAttempts = 5000,
  } = opts;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const cars: Car[] = [randomTarget(rng)];
    let id = 0;
    let placements = 0;
    const maxPlacementTries = carCount * 20;

    while (cars.length < carCount + 1 && placements < maxPlacementTries) {
      placements++;
      const candidate = randomCar(rng, `C${id}`);
      if (!isWithinBounds(candidate)) continue;
      if (hasOverlap([...cars, candidate])) continue;
      cars.push(candidate);
      id++;
    }

    if (isSolved(cars)) continue;
    const res = solve(cars);
    if (!res) continue;
    if (res.optimal < minOptimal || res.optimal > maxOptimal) continue;

    return { id: `gen-${attempt}`, cars };
  }

  throw new Error('generate: exhausted attempts without a valid puzzle');
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/game/generator.test.ts`
Expected: PASS. (If flaky on the seed, widen the band or bump `maxAttempts` — the test asserts the contract, not a specific layout.)

- [ ] **Step 5: Commit**

```bash
git add src/game/generator.ts src/game/generator.test.ts
git commit -m "feat: procedural puzzle generator with difficulty band"
```

---

## Task 7: Gameplay state hook

**Files:**
- Create: `src/state/useGameState.ts`
- Test: `src/state/useGameState.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// src/state/useGameState.test.ts
import { describe, it, expect } from 'vitest';
import { gameReducer, initGame } from './useGameState';
import type { PuzzleDef } from '../game/types';

const puzzle: PuzzleDef = {
  id: 'p1',
  cars: [
    { id: 'T', orientation: 'h', length: 2, row: 2, col: 0, isTarget: true },
    { id: 'B', orientation: 'v', length: 2, row: 0, col: 3, isTarget: false },
  ],
};

describe('gameReducer', () => {
  it('initializes with zero moves and computed par', () => {
    const s = initGame(puzzle, 3);
    expect(s.moveCount).toBe(0);
    expect(s.optimal).toBe(3);
    expect(s.solved).toBe(false);
  });

  it('counts a move and records history', () => {
    const s0 = initGame(puzzle, 3);
    const s1 = gameReducer(s0, { type: 'MOVE_CAR', move: { carId: 'T', row: 2, col: 2 } });
    expect(s1.moveCount).toBe(1);
    expect(s1.cars.find((c) => c.id === 'T')!.col).toBe(2);
    expect(s1.history.length).toBe(1);
  });

  it('undoes back to the prior state', () => {
    const s0 = initGame(puzzle, 3);
    const s1 = gameReducer(s0, { type: 'MOVE_CAR', move: { carId: 'T', row: 2, col: 2 } });
    const s2 = gameReducer(s1, { type: 'UNDO' });
    expect(s2.moveCount).toBe(0);
    expect(s2.cars.find((c) => c.id === 'T')!.col).toBe(0);
  });

  it('resets to the initial layout', () => {
    const s0 = initGame(puzzle, 3);
    const s1 = gameReducer(s0, { type: 'MOVE_CAR', move: { carId: 'T', row: 2, col: 2 } });
    const s2 = gameReducer(s1, { type: 'RESET' });
    expect(s2.moveCount).toBe(0);
    expect(s2.cars).toEqual(puzzle.cars);
  });

  it('flags solved when the target reaches the exit', () => {
    const s0 = initGame(puzzle, 3);
    const s1 = gameReducer(s0, { type: 'MOVE_CAR', move: { carId: 'T', row: 2, col: 4 } });
    expect(s1.solved).toBe(true);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/state/useGameState.test.ts`
Expected: FAIL — module missing.

- [ ] **Step 3: Implement**

```ts
// src/state/useGameState.ts
import { useReducer } from 'react';
import type { Car, Move, PuzzleDef } from '../game/types';
import { applyMove, isSolved } from '../game/board';

export interface GameState {
  initialCars: Car[];
  cars: Car[];
  history: Car[][]; // snapshots before each move
  moveCount: number;
  optimal: number;
  solved: boolean;
}

export type GameAction =
  | { type: 'MOVE_CAR'; move: Move }
  | { type: 'UNDO' }
  | { type: 'RESET' }
  | { type: 'NEW_PUZZLE'; puzzle: PuzzleDef; optimal: number };

export function initGame(puzzle: PuzzleDef, optimal: number): GameState {
  return {
    initialCars: puzzle.cars,
    cars: puzzle.cars,
    history: [],
    moveCount: 0,
    optimal,
    solved: isSolved(puzzle.cars),
  };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'MOVE_CAR': {
      const cars = applyMove(state.cars, action.move);
      return {
        ...state,
        history: [...state.history, state.cars],
        cars,
        moveCount: state.moveCount + 1,
        solved: isSolved(cars),
      };
    }
    case 'UNDO': {
      if (state.history.length === 0) return state;
      const prev = state.history[state.history.length - 1];
      return {
        ...state,
        cars: prev,
        history: state.history.slice(0, -1),
        moveCount: Math.max(0, state.moveCount - 1),
        solved: isSolved(prev),
      };
    }
    case 'RESET':
      return {
        ...state,
        cars: state.initialCars,
        history: [],
        moveCount: 0,
        solved: isSolved(state.initialCars),
      };
    case 'NEW_PUZZLE':
      return initGame(action.puzzle, action.optimal);
    default:
      return state;
  }
}

export function useGameState(puzzle: PuzzleDef, optimal: number) {
  return useReducer(gameReducer, initGame(puzzle, optimal));
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/state/useGameState.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/state/useGameState.ts src/state/useGameState.test.ts
git commit -m "feat: gameplay state reducer (move/undo/reset/new)"
```

---

## Task 8: Board + CarPiece rendering (static, no drag yet)

**Files:**
- Create: `src/components/Board.tsx`, `src/components/CarPiece.tsx`
- Test: `src/components/Board.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/Board.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Board } from './Board';
import type { Car } from '../game/types';

const cars: Car[] = [
  { id: 'T', orientation: 'h', length: 2, row: 2, col: 0, isTarget: true },
  { id: 'B', orientation: 'v', length: 3, row: 0, col: 3, isTarget: false },
];

describe('Board', () => {
  it('renders one element per car', () => {
    render(<Board cars={cars} onMove={() => {}} />);
    expect(screen.getByTestId('car-T')).toBeInTheDocument();
    expect(screen.getByTestId('car-B')).toBeInTheDocument();
  });

  it('marks the target car', () => {
    render(<Board cars={cars} onMove={() => {}} />);
    expect(screen.getByTestId('car-T')).toHaveAttribute('data-target', 'true');
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/components/Board.test.tsx`
Expected: FAIL — components missing.

- [ ] **Step 3: Implement CarPiece (static positioning)**

```tsx
// src/components/CarPiece.tsx
import type { Car } from '../game/types';

export const CELL = 56; // px per grid cell; board is 6*CELL square

interface CarPieceProps {
  car: Car;
  onMove: (carId: string, row: number, col: number) => void;
}

export function CarPiece({ car }: CarPieceProps) {
  const w = car.orientation === 'h' ? car.length : 1;
  const h = car.orientation === 'v' ? car.length : 1;
  return (
    <div
      data-testid={`car-${car.id}`}
      data-target={car.isTarget}
      className={`absolute rounded-xl shadow-md ${
        car.isTarget ? 'bg-red-500' : 'bg-slate-400'
      }`}
      style={{
        width: w * CELL - 8,
        height: h * CELL - 8,
        transform: `translate(${car.col * CELL + 4}px, ${car.row * CELL + 4}px)`,
      }}
    />
  );
}
```

- [ ] **Step 4: Implement Board**

```tsx
// src/components/Board.tsx
import { GRID_SIZE } from '../game/types';
import type { Car } from '../game/types';
import { CarPiece, CELL } from './CarPiece';

interface BoardProps {
  cars: Car[];
  onMove: (carId: string, row: number, col: number) => void;
}

export function Board({ cars, onMove }: BoardProps) {
  const size = GRID_SIZE * CELL;
  return (
    <div
      className="relative rounded-2xl bg-slate-800"
      style={{ width: size, height: size }}
    >
      {/* grid lines */}
      <div
        className="absolute inset-0 grid"
        style={{
          gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
          gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
        }}
      >
        {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => (
          <div key={i} className="border border-slate-700/50" />
        ))}
      </div>
      {cars.map((car) => (
        <CarPiece key={car.id} car={car} onMove={onMove} />
      ))}
    </div>
  );
}
```

- [ ] **Step 5: Run to verify pass**

Run: `npx vitest run src/components/Board.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/Board.tsx src/components/CarPiece.tsx src/components/Board.test.tsx
git commit -m "feat: static board + car rendering"
```

---

## Task 9: Draggable cars with snap-to-grid

**Files:**
- Modify: `src/components/CarPiece.tsx`
- Test: manual (drag is integration-tested by hand; unit tests cover the math via `legalMoves`)

- [ ] **Step 1: Make CarPiece draggable with Framer Motion**

Replace `src/components/CarPiece.tsx` with:
```tsx
// src/components/CarPiece.tsx
import { motion, useMotionValue } from 'framer-motion';
import { useEffect } from 'react';
import type { Car } from '../game/types';
import { GRID_SIZE } from '../game/types';

export const CELL = 56;

interface CarPieceProps {
  car: Car;
  cars: Car[];
  legalRange: { min: number; max: number }; // anchor min/max along the car's axis
  onMove: (carId: string, row: number, col: number) => void;
}

export function CarPiece({ car, legalRange, onMove }: CarPieceProps) {
  const w = car.orientation === 'h' ? car.length : 1;
  const h = car.orientation === 'v' ? car.length : 1;
  const x = useMotionValue(car.col * CELL);
  const y = useMotionValue(car.row * CELL);

  useEffect(() => {
    x.set(car.col * CELL);
    y.set(car.row * CELL);
  }, [car.col, car.row, x, y]);

  const axis = car.orientation === 'h' ? 'x' : 'y';

  return (
    <motion.div
      data-testid={`car-${car.id}`}
      data-target={car.isTarget}
      drag={axis}
      dragMomentum={false}
      dragElastic={0}
      dragConstraints={{
        left: car.orientation === 'h' ? legalRange.min * CELL : car.col * CELL,
        right: car.orientation === 'h' ? legalRange.max * CELL : car.col * CELL,
        top: car.orientation === 'v' ? legalRange.min * CELL : car.row * CELL,
        bottom: car.orientation === 'v' ? legalRange.max * CELL : car.row * CELL,
      }}
      whileDrag={{ scale: 1.04 }}
      style={{
        x, y,
        width: w * CELL - 8,
        height: h * CELL - 8,
        marginLeft: 4,
        marginTop: 4,
        position: 'absolute',
      }}
      className={`rounded-xl shadow-md cursor-grab active:cursor-grabbing ${
        car.isTarget ? 'bg-red-500' : 'bg-slate-400'
      }`}
      onDragEnd={() => {
        const raw = axis === 'x' ? x.get() : y.get();
        const cell = Math.round(raw / CELL);
        const clamped = Math.max(legalRange.min, Math.min(legalRange.max, cell));
        if (car.orientation === 'h') {
          if (clamped !== car.col) onMove(car.id, car.row, clamped);
          else x.set(car.col * CELL);
        } else {
          if (clamped !== car.row) onMove(car.id, clamped, car.col);
          else y.set(car.row * CELL);
        }
      }}
    />
  );
}

export function clampCell(v: number) {
  return Math.max(0, Math.min(GRID_SIZE - 1, v));
}
```

- [ ] **Step 2: Update Board to compute legal ranges and pass them down**

Replace the `cars.map(...)` block in `src/components/Board.tsx` and its imports so Board derives each car's legal slide range from `legalMoves`:
```tsx
// add import at top of Board.tsx
import { legalMoves } from '../game/board';

// inside Board, replace the cars.map block:
{cars.map((car) => {
  const moves = legalMoves(cars, car.id);
  const axisVals = moves.map((m) => (car.orientation === 'h' ? m.col : m.row));
  const cur = car.orientation === 'h' ? car.col : car.row;
  const min = Math.min(cur, ...axisVals);
  const max = Math.max(cur, ...axisVals);
  return (
    <CarPiece
      key={car.id}
      car={car}
      cars={cars}
      legalRange={{ min, max }}
      onMove={onMove}
    />
  );
})}
```

- [ ] **Step 3: Verify the suite still passes**

Run: `npm test`
Expected: PASS (Board test still finds `car-T`/`car-B`; drag is exercised manually).

- [ ] **Step 4: Manual check via dev server**

Run: `npm run dev`, open the URL, and confirm a car drags along its axis and snaps to a cell. (App wiring lands in Task 12; if `App.tsx` isn't ready, defer this manual check until then.)

- [ ] **Step 5: Commit**

```bash
git add src/components/CarPiece.tsx src/components/Board.tsx
git commit -m "feat: axis-locked draggable cars with snap-to-grid"
```

---

## Task 10: Controls and HUD

**Files:**
- Create: `src/components/Controls.tsx`, `src/components/Hud.tsx`
- Test: `src/components/Controls.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/Controls.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Controls } from './Controls';

describe('Controls', () => {
  it('fires callbacks', async () => {
    const onRandom = vi.fn();
    const onReset = vi.fn();
    const onUndo = vi.fn();
    render(<Controls onRandom={onRandom} onReset={onReset} onUndo={onUndo} canUndo />);
    await userEvent.click(screen.getByRole('button', { name: /random/i }));
    await userEvent.click(screen.getByRole('button', { name: /reset/i }));
    await userEvent.click(screen.getByRole('button', { name: /undo/i }));
    expect(onRandom).toHaveBeenCalledOnce();
    expect(onReset).toHaveBeenCalledOnce();
    expect(onUndo).toHaveBeenCalledOnce();
  });

  it('disables undo when canUndo is false', () => {
    render(<Controls onRandom={() => {}} onReset={() => {}} onUndo={() => {}} canUndo={false} />);
    expect(screen.getByRole('button', { name: /undo/i })).toBeDisabled();
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/components/Controls.test.tsx`
Expected: FAIL — component missing.

- [ ] **Step 3: Implement Controls and Hud**

```tsx
// src/components/Controls.tsx
interface ControlsProps {
  onRandom: () => void;
  onReset: () => void;
  onUndo: () => void;
  canUndo: boolean;
}

const btn =
  'px-5 py-2 rounded-full font-medium shadow-sm transition active:scale-95 ' +
  'bg-slate-200 hover:bg-slate-300 disabled:opacity-40 disabled:active:scale-100';

export function Controls({ onRandom, onReset, onUndo, canUndo }: ControlsProps) {
  return (
    <div className="flex gap-3">
      <button className={btn} onClick={onRandom}>Random</button>
      <button className={btn} onClick={onReset}>Reset</button>
      <button className={btn} onClick={onUndo} disabled={!canUndo}>Undo</button>
    </div>
  );
}
```

```tsx
// src/components/Hud.tsx
interface HudProps {
  moveCount: number;
  optimal: number;
}

export function Hud({ moveCount, optimal }: HudProps) {
  return (
    <div className="flex gap-6 text-lg font-semibold text-slate-700">
      <span>Moves: {moveCount}</span>
      <span>Optimal: {optimal}</span>
    </div>
  );
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/components/Controls.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/Controls.tsx src/components/Hud.tsx src/components/Controls.test.tsx
git commit -m "feat: controls and HUD"
```

---

## Task 11: Win overlay

**Files:**
- Create: `src/components/WinOverlay.tsx`
- Test: `src/components/WinOverlay.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/WinOverlay.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WinOverlay } from './WinOverlay';

describe('WinOverlay', () => {
  it('shows moves and optimal and fires play-again', async () => {
    const onPlayAgain = vi.fn();
    render(<WinOverlay moveCount={9} optimal={6} onPlayAgain={onPlayAgain} />);
    expect(screen.getByText(/9/)).toBeInTheDocument();
    expect(screen.getByText(/6/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /play again/i }));
    expect(onPlayAgain).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/components/WinOverlay.test.tsx`
Expected: FAIL — component missing.

- [ ] **Step 3: Implement**

```tsx
// src/components/WinOverlay.tsx
import { motion } from 'framer-motion';

interface WinOverlayProps {
  moveCount: number;
  optimal: number;
  onPlayAgain: () => void;
}

export function WinOverlay({ moveCount, optimal, onPlayAgain }: WinOverlayProps) {
  const perfect = moveCount === optimal;
  return (
    <motion.div
      className="absolute inset-0 z-10 flex items-center justify-center bg-black/50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="rounded-2xl bg-white p-8 text-center shadow-xl"
        initial={{ scale: 0.8, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      >
        <h2 className="text-2xl font-bold text-slate-800">Solved!</h2>
        <p className="mt-2 text-slate-600">
          {moveCount} moves · optimal {optimal}
        </p>
        {perfect && <p className="mt-1 font-semibold text-emerald-600">Perfect!</p>}
        <button
          className="mt-5 rounded-full bg-red-500 px-6 py-2 font-medium text-white shadow active:scale-95"
          onClick={onPlayAgain}
        >
          Play again
        </button>
      </motion.div>
    </motion.div>
  );
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/components/WinOverlay.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/WinOverlay.tsx src/components/WinOverlay.test.tsx
git commit -m "feat: win overlay"
```

---

## Task 12: Assemble the app (responsive)

**Files:**
- Modify: `src/App.tsx`, `src/main.tsx` (ensure `index.css` imported)
- Test: `src/App.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/App.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders a board and controls on load', () => {
    render(<App />);
    expect(screen.getByRole('button', { name: /random/i })).toBeInTheDocument();
    // at least the target car renders
    expect(screen.getByTestId('car-T')).toBeInTheDocument();
  });
});
```

Note: `App` must generate a starting puzzle synchronously on first render so the target car exists immediately.

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/App.test.tsx`
Expected: FAIL — App not wired.

- [ ] **Step 3: Implement App**

```tsx
// src/App.tsx
import { useCallback, useReducer, useMemo } from 'react';
import { gameReducer, initGame } from './state/useGameState';
import { generate } from './game/generator';
import { solve } from './game/solver';
import { Board } from './components/Board';
import { Controls } from './components/Controls';
import { Hud } from './components/Hud';
import { WinOverlay } from './components/WinOverlay';
import type { PuzzleDef } from './game/types';

function newPuzzle(): { puzzle: PuzzleDef; optimal: number } {
  const puzzle = generate({ minOptimal: 6, maxOptimal: 14 });
  const optimal = solve(puzzle.cars)!.optimal;
  return { puzzle, optimal };
}

export default function App() {
  const first = useMemo(() => newPuzzle(), []);
  const [state, dispatch] = useReducer(
    gameReducer,
    initGame(first.puzzle, first.optimal),
  );

  const onMove = useCallback(
    (carId: string, row: number, col: number) =>
      dispatch({ type: 'MOVE_CAR', move: { carId, row, col } }),
    [],
  );

  const onRandom = useCallback(() => {
    const { puzzle, optimal } = newPuzzle();
    dispatch({ type: 'NEW_PUZZLE', puzzle, optimal });
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-100 p-4">
      <Hud moveCount={state.moveCount} optimal={state.optimal} />
      <div className="relative">
        <Board cars={state.cars} onMove={onMove} />
        {state.solved && (
          <WinOverlay
            moveCount={state.moveCount}
            optimal={state.optimal}
            onPlayAgain={onRandom}
          />
        )}
      </div>
      <Controls
        onRandom={onRandom}
        onReset={() => dispatch({ type: 'RESET' })}
        onUndo={() => dispatch({ type: 'UNDO' })}
        canUndo={state.history.length > 0}
      />
    </div>
  );
}
```

- [ ] **Step 4: Ensure `src/main.tsx` imports `./index.css`** (Vite's template already does; confirm the line exists).

- [ ] **Step 5: Run to verify pass**

Run: `npx vitest run src/App.test.tsx`
Expected: PASS.

- [ ] **Step 6: Run the full suite**

Run: `npm test`
Expected: all tests PASS.

- [ ] **Step 7: Manual play check**

Run: `npm run dev` and confirm: a puzzle loads, cars drag and snap, the move counter increments, Undo/Reset/Random work, and reaching the exit shows the win overlay.

- [ ] **Step 8: Commit**

```bash
git add src/App.tsx
git commit -m "feat: assemble playable game"
```

---

## Task 13: Responsive scaling (fit mobile + desktop)

**Files:**
- Modify: `src/components/Board.tsx`, `src/components/CarPiece.tsx`, `src/App.tsx`

- [ ] **Step 1: Make CELL responsive via a board-size prop**

Change `CELL` from a constant to a value derived from available space. In `Board.tsx`, accept a `cell` prop (px per cell), compute `size = GRID_SIZE * cell`, and pass `cell` down to `CarPiece` instead of importing the constant. In `App.tsx`, compute `cell` from viewport with a `useEffect` + resize listener: `cell = Math.floor(Math.min(window.innerWidth - 32, window.innerHeight - 220) / GRID_SIZE)`, clamped to a sensible `[44, 72]` range. Pass `cell` to `Board`. Replace `CarPiece`'s `CELL` import usages with the passed `cell` prop (drag constraints, snap math, sizing).

This is a mechanical refactor: every `CELL` reference becomes the `cell` prop. Keep the snap/constraint math identical, just parameterized.

- [ ] **Step 2: Verify suite still passes**

Run: `npm test`
Expected: PASS (give `Board`/`App` a default `cell` so existing tests render without a layout pass).

- [ ] **Step 3: Manual responsive check**

Run `npm run dev`, resize the window and use device emulation; confirm the board stays square and fits both a narrow phone and a desktop window.

- [ ] **Step 4: Commit**

```bash
git add src/components/Board.tsx src/components/CarPiece.tsx src/App.tsx
git commit -m "feat: responsive board sizing for mobile and desktop"
```

---

## Self-Review Notes (addressed)

- **Spec coverage:** generation (Task 6), solver/par (Task 5), move counter vs optimal (Tasks 7, 10, 11), drag UX (Task 9), responsive (Task 13), win flow (Tasks 11–12). Editor + storage are in the separate editor plan.
- **Move definition:** one slide = one move, enforced in `gameReducer` (`MOVE_CAR` increments once per drag) and matched by the BFS (one `legalMoves` edge per slide).
- **Type consistency:** `Car`, `Move`, `PuzzleDef`, `GRID_SIZE`, `EXIT_ROW` defined in Task 2 and used unchanged throughout; `legalMoves`/`applyMove`/`isSolved`/`serialize`/`solve`/`generate` signatures match across tasks.
