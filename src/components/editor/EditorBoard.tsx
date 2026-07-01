// src/components/editor/EditorBoard.tsx
import { GRID_SIZE } from '../../game/types';
import type { Car } from '../../game/types';

interface EditorBoardProps {
  cars: Car[];
  cell: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onMove: (id: string, row: number, col: number) => void;
}

export function EditorBoard({ cars, cell, selectedId, onSelect, onMove: _onMove }: EditorBoardProps) {
  const size = GRID_SIZE * cell;
  return (
    <div className="relative rounded-2xl bg-slate-800" style={{ width: size, height: size }}>
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
        const w = car.orientation === 'h' ? car.length : 1;
        const h = car.orientation === 'v' ? car.length : 1;
        const selected = car.id === selectedId;
        return (
          <button
            key={car.id}
            data-testid={`editor-car-${car.id}`}
            onClick={() => onSelect(car.id)}
            className={`absolute rounded-xl shadow-md ${
              car.isTarget ? 'bg-red-500' : 'bg-slate-400'
            } ${selected ? 'ring-4 ring-amber-400' : ''}`}
            style={{
              width: w * cell - 8,
              height: h * cell - 8,
              transform: `translate(${car.col * cell + 4}px, ${car.row * cell + 4}px)`,
            }}
          />
        );
      })}
    </div>
  );
}
