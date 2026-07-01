// src/state/useEditorState.ts
import { useReducer } from 'react';
import { EXIT_ROW } from '../game/types';
import type { Car, Orientation } from '../game/types';
import { isWithinBounds, hasOverlap } from '../game/board';

export interface EditorState {
  cars: Car[];
  nextId: number;
}

interface PiecePlacement {
  orientation: Orientation;
  length: 2 | 3;
  row: number;
  col: number;
}

export type EditorAction =
  | { type: 'PLACE'; piece: PiecePlacement }
  | { type: 'MOVE'; id: string; row: number; col: number }
  | { type: 'ROTATE'; id: string }
  | { type: 'DELETE'; id: string }
  | { type: 'CLEAR' };

function targetCar(): Car {
  return { id: 'T', orientation: 'h', length: 2, row: EXIT_ROW, col: 0, isTarget: true };
}

export function initEditor(): EditorState {
  return { cars: [targetCar()], nextId: 0 };
}

function legal(cars: Car[]): boolean {
  return cars.every(isWithinBounds) && !hasOverlap(cars);
}

export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'PLACE': {
      const car: Car = { id: `C${state.nextId}`, isTarget: false, ...action.piece };
      const cars = [...state.cars, car];
      if (!legal(cars)) return state;
      return { cars, nextId: state.nextId + 1 };
    }
    case 'MOVE': {
      const cars = state.cars.map((c) =>
        c.id === action.id ? { ...c, row: action.row, col: action.col } : c,
      );
      return legal(cars) ? { ...state, cars } : state;
    }
    case 'ROTATE': {
      const cars = state.cars.map((c) =>
        c.id === action.id && !c.isTarget
          ? { ...c, orientation: (c.orientation === 'h' ? 'v' : 'h') as Orientation }
          : c,
      );
      return legal(cars) ? { ...state, cars } : state;
    }
    case 'DELETE':
      return {
        ...state,
        cars: state.cars.filter((c) => c.id === action.id ? c.isTarget : true),
      };
    case 'CLEAR':
      return { ...state, cars: [targetCar()] };
    default:
      return state;
  }
}

export function useEditorState() {
  return useReducer(editorReducer, undefined, initEditor);
}
