// src/components/Board.tsx
import { GRID_SIZE } from '../game/types';
import type { Car } from '../game/types';
import { CarPiece, CELL } from './CarPiece';

interface BoardProps {
  cars: Car[];
  onMove: (carId: string, row: number, col: number) => void;
}

export function Board({ cars, onMove }: BoardProps) {
  const size = GRID_SIZE * CELL;
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
      {cars.map((car) => (
        <CarPiece key={car.id} car={car} onMove={onMove} />
      ))}
    </div>
  );
}
