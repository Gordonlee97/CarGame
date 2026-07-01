// src/game/puzzles.test.ts
import { describe, it, expect } from 'vitest';
import { allPuzzles, poolSize, randomPuzzle } from './puzzles';
import { solve } from './solver';
import { isSolved } from './board';
import { EXIT_ROW } from './types';

describe('puzzle pool', () => {
  it('ships a populated pool', () => {
    expect(poolSize()).toBeGreaterThanOrEqual(150);
  });

  it('every puzzle starts unsolved with a horizontal target on the exit row', () => {
    for (const p of allPuzzles()) {
      expect(isSolved(p.cars)).toBe(false);
      const target = p.cars.find((c) => c.isTarget);
      expect(target).toBeTruthy();
      expect(target!.orientation).toBe('h');
      expect(target!.row).toBe(EXIT_ROW);
    }
  });

  it('a sample of puzzles solve in exactly their stored optimal', () => {
    const all = allPuzzles();
    const step = Math.max(1, Math.floor(all.length / 12));
    for (let i = 0; i < all.length; i += step) {
      const p = all[i];
      const res = solve(p.cars, p.optimal);
      expect(res, `puzzle ${i} should be solvable`).not.toBeNull();
      expect(res!.optimal).toBe(p.optimal);
    }
  });

  it('randomPuzzle returns a pool member', () => {
    const rng = () => 0; // deterministic: first puzzle
    expect(randomPuzzle(rng)).toBe(allPuzzles()[0]);
  });
});
