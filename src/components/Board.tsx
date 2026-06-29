// src/components/Board.tsx
import { GRID_SIZE } from '../game/types';
import type { Car } from '../game/types';
import { CarPiece, CELL } from './CarPiece';
import { legalMoves } from '../game/board';

interface BoardProps {
  cars: Car[];
  cell?: number; // px per grid cell; defaults to CELL constant
  onMove: (carId: string, row: number, col: number) => void;
}

export function Board({ cars, cell = CELL, onMove }: BoardProps) {
  const size = GRID_SIZE * cell;
  return (
    <div
      className="relative rounded-2xl bg-slate-800"
      style={{ width: size, height: size }}
    >
      {/* grid lines */}
      <div
        className="absolute inset-0 grid"
        style={{
          gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
          gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
        }}
      >
        {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => (
          <div key={i} className="border border-slate-700/50" />
        ))}
      </div>
      {cars.map((car) => {
        const moves = legalMoves(cars, car.id);
        const axisVals = moves.map((m) => (car.orientation === 'h' ? m.col : m.row));
        const cur = car.orientation === 'h' ? car.col : car.row;
        const min = Math.min(cur, ...axisVals);
        const max = Math.max(cur, ...axisVals);
        return (
          <CarPiece
            key={car.id}
            car={car}
            cars={cars}
            cell={cell}
            legalRange={{ min, max }}
            onMove={onMove}
          />
        );
      })}
    </div>
  );
}
