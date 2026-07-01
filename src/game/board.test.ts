// src/game/board.test.ts
import { describe, it, expect } from 'vitest';
import { cellsOf, isWithinBounds, hasOverlap, serialize, legalMoves, applyMove, isSolved } from './board';
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
