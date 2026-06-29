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
