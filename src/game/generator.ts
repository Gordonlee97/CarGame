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
