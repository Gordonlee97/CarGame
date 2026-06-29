// src/game/board.ts
import { GRID_SIZE, EXIT_ROW } from './types';
import type { Car, Move } from './types';

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
