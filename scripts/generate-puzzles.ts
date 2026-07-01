/**
 * Build-time puzzle generation.
 *
 * Procedural generation needs a BFS to confirm solvability and exact optimal, which
 * is too slow/variable to run in the browser. We run it offline once and ship the
 * result as static data; the game picks from this pool at runtime for instant,
 * jank-free puzzles.
 *
 * Difficulty is labelled post-hoc from each puzzle's computed optimal rather than
 * enforced with a narrow target band (narrow high-optimal bands cause a rejection
 * storm and are pathologically slow). The pool's difficulty spread is whatever the
 * generator naturally produces across a range of board densities.
 *
 * Run with: npm run gen:puzzles   (QUICK=1 for a tiny validation pool)
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { generate } from '../src/game/generator';
import { solve } from '../src/game/solver';
import { serialize } from '../src/game/board';
import type { Car } from '../src/game/types';

type Difficulty = 'easy' | 'medium' | 'hard';

interface PoolPuzzle {
  cars: Car[];
  optimal: number;
  difficulty: Difficulty;
}

const QUICK = process.env.QUICK === '1';
const SCALE = QUICK ? 0.2 : 1;

// Per-difficulty targets. Easy puzzles are common and hard ones are rare, so we
// cap easy to force the rarer buckets into the pool; any shortfall (e.g. hard) is
// padded at the end so the pool always reaches its total.
const TARGETS: Record<Difficulty, number> = {
  easy: Math.round(60 * SCALE),
  medium: Math.round(70 * SCALE),
  hard: Math.round(30 * SCALE),
};
const POOL_SIZE = TARGETS.easy + TARGETS.medium + TARGETS.hard;
const ATTEMPT_BUDGET = QUICK ? 1500 : 12000;

// Wide acceptance band — everything in range is kept, so each generation is fast.
const MIN_OPTIMAL = 4;
const MAX_OPTIMAL = 12;
const MAX_NODES = 30000;

function difficultyOf(optimal: number): Difficulty {
  if (optimal <= 5) return 'easy';
  if (optimal <= 7) return 'medium';
  return 'hard';
}

/** Deterministic LCG so the generated pool is reproducible across builds. */
function seededRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

const randInt = (rng: () => number, n: number) => Math.floor(rng() * n);

function main() {
  const pool: PoolPuzzle[] = [];
  const overflow: PoolPuzzle[] = []; // capped-bucket puzzles, used to pad shortfalls
  const seen = new Set<string>();
  const counts: Record<Difficulty, number> = { easy: 0, medium: 0, hard: 0 };
  const seedRng = seededRng(12345);
  let seed = 1;
  const t0 = Date.now();

  for (let attempt = 0; attempt < ATTEMPT_BUDGET && pool.length < POOL_SIZE; attempt++) {
    let puzzle;
    try {
      // Vary density so the pool spans a range of difficulties.
      const carCount = 8 + randInt(seedRng, 4); // 8..11
      puzzle = generate({
        minOptimal: MIN_OPTIMAL,
        maxOptimal: MAX_OPTIMAL,
        carCount,
        maxNodes: MAX_NODES,
        rng: seededRng(seed),
      });
    } catch {
      seed++;
      continue;
    }
    seed++;

    const key = serialize(puzzle.cars);
    if (seen.has(key)) continue;
    const res = solve(puzzle.cars, MAX_OPTIMAL, MAX_NODES);
    if (!res || res.optimal < MIN_OPTIMAL || res.optimal > MAX_OPTIMAL) continue;
    seen.add(key);

    const difficulty = difficultyOf(res.optimal);
    const entry: PoolPuzzle = { cars: puzzle.cars, optimal: res.optimal, difficulty };
    if (counts[difficulty] < TARGETS[difficulty]) {
      pool.push(entry);
      counts[difficulty]++;
    } else {
      overflow.push(entry); // keep for padding if a rarer bucket can't fill
    }
  }

  // Pad any shortfall (typically the rare "hard" bucket) with overflow puzzles.
  for (const entry of overflow) {
    if (pool.length >= POOL_SIZE) break;
    pool.push(entry);
  }

  const finalCounts: Record<string, number> = {};
  for (const p of pool) finalCounts[p.difficulty] = (finalCounts[p.difficulty] ?? 0) + 1;

  const gameDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'game');
  writeFileSync(join(gameDir, 'puzzles.json'), JSON.stringify(pool));
  writeFileSync(
    join(gameDir, '..', '..', 'pool-stats.json'),
    JSON.stringify(
      {
        total: pool.length,
        byDifficulty: finalCounts,
        seconds: Number(((Date.now() - t0) / 1000).toFixed(1)),
      },
      null,
      2,
    ),
  );
  // eslint-disable-next-line no-console
  console.log(`Wrote ${pool.length} puzzles`, finalCounts);
}

main();
