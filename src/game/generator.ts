// src/game/generator.ts
import { GRID_SIZE, EXIT_ROW } from './types';
import type { Car, PuzzleDef, Orientation, Move } from './types';
import { hasOverlap, isWithinBounds, isSolved, legalMoves, applyMove } from './board';
import { solve } from './solver';

interface GenerateOpts {
  minOptimal?: number;
  maxOptimal?: number;
  carCount?: number;
  rng?: () => number;
  maxAttempts?: number;
  /** Node budget for the verification solve; loose boards exceeding it are rejected fast. */
  maxNodes?: number;
}

const randInt = (rng: () => number, n: number) => Math.floor(rng() * n);

/** The target car in its solved position: flush against the right wall on the exit row. */
function solvedTarget(): Car {
  return {
    id: 'T',
    orientation: 'h',
    length: 2,
    row: EXIT_ROW,
    col: GRID_SIZE - 2,
    isTarget: true,
  };
}

function randomCar(rng: () => number, id: string): Car {
  const orientation: Orientation = rng() < 0.5 ? 'h' : 'v';
  const length: 2 | 3 = rng() < 0.7 ? 2 : 3;
  const row = randInt(rng, GRID_SIZE);
  const col = randInt(rng, GRID_SIZE);
  return { id, orientation, length, row, col, isTarget: false };
}

/**
 * Scramble a solved board with `steps` random legal moves. Avoids moving the same
 * car twice in a row to limit trivial back-and-forth. O(steps) — no state-space
 * enumeration — so this is cheap regardless of board mobility.
 */
function randomWalk(start: Car[], steps: number, rng: () => number): Car[] {
  let cars = start;
  let lastCarId = '';
  for (let i = 0; i < steps; i++) {
    let options: Move[] = [];
    for (const car of cars) {
      if (car.id === lastCarId) continue;
      options = options.concat(legalMoves(cars, car.id));
    }
    if (options.length === 0) {
      // Everything that's movable belongs to lastCar; allow it rather than stall.
      for (const car of cars) options = options.concat(legalMoves(cars, car.id));
      if (options.length === 0) break;
    }
    const move = options[randInt(rng, options.length)];
    cars = applyMove(cars, move);
    lastCarId = move.carId;
  }
  return cars;
}

/**
 * Generate a solvable puzzle whose optimal solution length is in [minOptimal, maxOptimal].
 *
 * Strategy: place the target in its solved position plus random blockers, scramble
 * with a random walk (cheap), then confirm the exact optimal with a node-capped
 * solve. The walk avoids the expensive full state-space enumeration; the capped
 * solve rejects too-easy / too-hard / loose boards in bounded time.
 */
export function generate(opts: GenerateOpts = {}): PuzzleDef {
  const {
    minOptimal = 4,
    maxOptimal = 14,
    carCount = 8,
    rng = Math.random,
    maxAttempts = 2000,
    maxNodes = 30000,
  } = opts;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // 1. Build a solved board: target at the exit + random non-overlapping blockers.
    const cars: Car[] = [solvedTarget()];
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

    // 2. Scramble with a long random walk so the target can end up well boxed in.
    const steps = 25 + randInt(rng, 45); // 25..69
    const scrambled = randomWalk(cars, steps, rng);
    if (isSolved(scrambled)) continue;

    // 3. Confirm the exact optimal with a bounded solve.
    const res = solve(scrambled, maxOptimal, maxNodes);
    if (!res || res.optimal < minOptimal) continue;

    return { id: `gen-${attempt}`, cars: scrambled };
  }

  throw new Error('generate: exhausted attempts without a valid puzzle');
}
