// src/game/solver.test.ts
import { describe, it, expect } from 'vitest';
import { solve } from './solver';
import { applyMove, isSolved } from './board';
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

  it('returns a path that actually solves the puzzle when applied', () => {
    const target = t({ id: 'T', orientation: 'h', length: 2, row: 2, col: 0, isTarget: true });
    const blocker = t({ id: 'B', orientation: 'v', length: 2, row: 1, col: 3 });
    const res = solve([target, blocker]);
    expect(res).not.toBeNull();
    expect(res!.path).toHaveLength(res!.optimal);

    let cars: Car[] = [target, blocker];
    for (const move of res!.path) cars = applyMove(cars, move);
    expect(isSolved(cars)).toBe(true);
  });
});
