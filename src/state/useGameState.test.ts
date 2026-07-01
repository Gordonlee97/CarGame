// src/state/useGameState.test.ts
import { describe, it, expect } from 'vitest';
import { gameReducer, initGame } from './useGameState';
import type { PuzzleDef } from '../game/types';

const puzzle: PuzzleDef = {
  id: 'p1',
  cars: [
    { id: 'T', orientation: 'h', length: 2, row: 2, col: 0, isTarget: true },
    { id: 'B', orientation: 'v', length: 2, row: 0, col: 3, isTarget: false },
  ],
};

describe('gameReducer', () => {
  it('initializes with zero moves and computed par', () => {
    const s = initGame(puzzle, 3);
    expect(s.moveCount).toBe(0);
    expect(s.optimal).toBe(3);
    expect(s.solved).toBe(false);
  });

  it('counts a move and records history', () => {
    const s0 = initGame(puzzle, 3);
    const s1 = gameReducer(s0, { type: 'MOVE_CAR', move: { carId: 'T', row: 2, col: 2 } });
    expect(s1.moveCount).toBe(1);
    expect(s1.cars.find((c) => c.id === 'T')!.col).toBe(2);
    expect(s1.history.length).toBe(1);
  });

  it('undoes back to the prior state', () => {
    const s0 = initGame(puzzle, 3);
    const s1 = gameReducer(s0, { type: 'MOVE_CAR', move: { carId: 'T', row: 2, col: 2 } });
    const s2 = gameReducer(s1, { type: 'UNDO' });
    expect(s2.moveCount).toBe(0);
    expect(s2.cars.find((c) => c.id === 'T')!.col).toBe(0);
  });

  it('resets to the initial layout', () => {
    const s0 = initGame(puzzle, 3);
    const s1 = gameReducer(s0, { type: 'MOVE_CAR', move: { carId: 'T', row: 2, col: 2 } });
    const s2 = gameReducer(s1, { type: 'RESET' });
    expect(s2.moveCount).toBe(0);
    expect(s2.cars).toEqual(puzzle.cars);
  });

  it('flags solved when the target reaches the exit', () => {
    const s0 = initGame(puzzle, 3);
    const s1 = gameReducer(s0, { type: 'MOVE_CAR', move: { carId: 'T', row: 2, col: 4 } });
    expect(s1.solved).toBe(true);
  });
});
