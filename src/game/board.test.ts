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
