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
