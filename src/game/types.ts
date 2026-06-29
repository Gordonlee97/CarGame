// src/game/types.ts
export type Orientation = 'h' | 'v';

export interface Car {
  id: string;
  orientation: Orientation;
  length: 2 | 3;
  row: number; // top-most cell for 'v', the row for 'h'
  col: number; // left-most cell for 'h', the col for 'v'
  isTarget: boolean;
}

export interface Move {
  carId: string;
  row: number; // new anchor row
  col: number; // new anchor col
}

export interface PuzzleDef {
  id: string;
  cars: Car[];
}

export const GRID_SIZE = 6;
export const EXIT_ROW = 2; // target car's row; exit is the right edge of this row
