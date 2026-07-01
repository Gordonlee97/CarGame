// src/game/puzzles.ts
// Runtime access to the precomputed puzzle pool (built offline by
// scripts/generate-puzzles.ts). Picking from this pool is instant — no BFS at
// runtime — which keeps "Random" snappy and the UI thread free.
import poolData from './puzzles.json';
import type { Car } from './types';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface PoolPuzzle {
  cars: Car[];
  optimal: number;
  difficulty: Difficulty;
}

const pool = poolData as unknown as PoolPuzzle[];

export function poolSize(): number {
  return pool.length;
}

export function allPuzzles(): readonly PoolPuzzle[] {
  return pool;
}

/** Pick a random puzzle from the pool. */
export function randomPuzzle(rng: () => number = Math.random): PoolPuzzle {
  return pool[Math.floor(rng() * pool.length)];
}
