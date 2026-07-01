// src/state/useGameState.ts
import { useReducer } from 'react';
import type { Car, Move, PuzzleDef } from '../game/types';
import { applyMove, isSolved } from '../game/board';

export interface GameState {
  initialCars: Car[];
  cars: Car[];
  history: Car[][]; // snapshots before each move
  moveCount: number;
  optimal: number;
  solved: boolean;
}

export type GameAction =
  | { type: 'MOVE_CAR'; move: Move }
  | { type: 'UNDO' }
  | { type: 'RESET' }
  | { type: 'NEW_PUZZLE'; puzzle: PuzzleDef; optimal: number };

export function initGame(puzzle: PuzzleDef, optimal: number): GameState {
  return {
    initialCars: puzzle.cars,
    cars: puzzle.cars,
    history: [],
    moveCount: 0,
    optimal,
    solved: isSolved(puzzle.cars),
  };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'MOVE_CAR': {
      const cars = applyMove(state.cars, action.move);
      return {
        ...state,
        history: [...state.history, state.cars],
        cars,
        moveCount: state.moveCount + 1,
        solved: isSolved(cars),
      };
    }
    case 'UNDO': {
      if (state.history.length === 0) return state;
      const prev = state.history[state.history.length - 1];
      return {
        ...state,
        cars: prev,
        history: state.history.slice(0, -1),
        moveCount: Math.max(0, state.moveCount - 1),
        solved: isSolved(prev),
      };
    }
    case 'RESET':
      return {
        ...state,
        cars: state.initialCars,
        history: [],
        moveCount: 0,
        solved: isSolved(state.initialCars),
      };
    case 'NEW_PUZZLE':
      return initGame(action.puzzle, action.optimal);
    default:
      return state;
  }
}

export function useGameState(puzzle: PuzzleDef, optimal: number) {
  return useReducer(gameReducer, initGame(puzzle, optimal));
}
