// src/game/solver.ts
import { serialize, legalMoves, applyMove, isSolved } from './board';
import type { Car, Move } from './types';

interface Node {
  key: string;
  cars: Car[];
  depth: number;
}

/**
 * BFS for the minimum-move solution.
 *
 * `maxDepth` bounds the search by solution length: states deeper than `maxDepth`
 * moves are never expanded, so a puzzle whose optimal solution exceeds `maxDepth`
 * (or that is unsolvable) returns `null` without exploring the entire state space.
 * `maxNodes` bounds it by work: if more than `maxNodes` states are visited without
 * a solution, the search gives up and returns `null` — used by generation to
 * reject "loose" boards with huge state spaces in bounded time. Any solution found
 * is still genuinely optimal because BFS expands in depth order.
 */
export function solve(
  cars: Car[],
  maxDepth = Infinity,
  maxNodes = Infinity,
): { optimal: number; path: Move[] } | null {
  const startKey = serialize(cars);
  if (isSolved(cars)) return { optimal: 0, path: [] };

  const visited = new Set<string>([startKey]);
  const queue: Node[] = [{ key: startKey, cars, depth: 0 }];
  // parent[childKey] = { parentKey, move }
  const parent = new Map<string, { parentKey: string; move: Move }>();

  while (queue.length > 0) {
    if (visited.size > maxNodes) return null; // work budget exhausted
    const { key: currentKey, cars: current, depth } = queue.shift()!;
    if (depth >= maxDepth) continue; // don't expand beyond the depth bound
    for (const car of current) {
      for (const move of legalMoves(current, car.id)) {
        const nextCars = applyMove(current, move);
        const key = serialize(nextCars);
        if (visited.has(key)) continue;
        visited.add(key);
        parent.set(key, { parentKey: currentKey, move });
        if (isSolved(nextCars)) {
          return { optimal: pathLength(parent, key), path: buildPath(parent, key) };
        }
        queue.push({ key, cars: nextCars, depth: depth + 1 });
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
