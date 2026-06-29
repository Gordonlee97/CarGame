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
  const byKey = new Map<string, Car[]>([[startKey, cars]]);

  while (queue.length > 0) {
    const { cars: current } = queue.shift()!;
    for (const car of current) {
      for (const move of legalMoves(current, car.id)) {
        const nextCars = applyMove(current, move);
        const key = serialize(nextCars);
        if (visited.has(key)) continue;
        visited.add(key);
        parent.set(key, { parentKey: serialize(current), move });
        byKey.set(key, nextCars);
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
