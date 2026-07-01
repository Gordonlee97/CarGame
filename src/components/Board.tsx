// src/components/Board.tsx
import { GRID_SIZE, EXIT_ROW } from '../game/types';
import type { Car } from '../game/types';
import { CarPiece, CELL } from './CarPiece';
import { legalMoves } from '../game/board';

interface BoardProps {
  cars: Car[];
  cell?: number; // px per grid cell; defaults to CELL constant
  solved?: boolean; // triggers the target car's drive-out animation
  onMove: (carId: string, row: number, col: number) => void;
}

export function Board({ cars, cell = CELL, solved = false, onMove }: BoardProps) {
  const size = GRID_SIZE * cell;
  const wall = Math.max(12, Math.round(cell * 0.3));
  const outer = size + wall * 2;
  // Right wall is split by a one-cell gap at the exit row (the car's way out).
  const gapTop = wall + EXIT_ROW * cell;
  const gapBottom = wall + (EXIT_ROW + 1) * cell;
  const wallCls = 'absolute bg-[#b8860b]';

  return (
    <div className="relative" style={{ width: outer, height: outer }}>
      {/* walls around the lot */}
      <div className={`${wallCls} rounded-t-2xl`} style={{ left: 0, top: 0, width: outer, height: wall }} />
      <div className={`${wallCls} rounded-b-2xl`} style={{ left: 0, bottom: 0, width: outer, height: wall }} />
      <div className={wallCls} style={{ left: 0, top: 0, width: wall, height: outer }} />
      {/* right wall, split by the exit gap */}
      <div className={wallCls} style={{ right: 0, top: 0, width: wall, height: gapTop }} />
      <div className={wallCls} style={{ right: 0, top: gapBottom, width: wall, height: outer - gapBottom }} />
      {/* the gap is part of the lot — continue the board surface through the opening */}
      <div
        className="absolute flex items-center justify-center bg-slate-800 text-slate-500"
        style={{ right: 0, top: gapTop, width: wall, height: cell }}
      >
        <span style={{ fontSize: wall, lineHeight: 1 }}>›</span>
      </div>

      {/* playing surface */}
      <div
        className="absolute rounded-md bg-slate-800"
        style={{ left: wall, top: wall, width: size, height: size }}
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
              cell={cell}
              legalRange={{ min, max }}
              exiting={solved && car.isTarget}
              onMove={onMove}
            />
          );
        })}
      </div>
    </div>
  );
}
