// src/components/editor/EditorBoard.tsx
import { motion, useMotionValue } from 'framer-motion';
import { useEffect } from 'react';
import { GRID_SIZE, EXIT_ROW } from '../../game/types';
import type { Car } from '../../game/types';

interface EditorBoardProps {
  cars: Car[];
  cell: number;
  selectedId: string | null;
  boardRef: React.RefObject<HTMLDivElement | null>;
  onSelect: (id: string) => void;
  onMove: (id: string, row: number, col: number) => void;
}

export function EditorBoard({ cars, cell, selectedId, boardRef, onSelect, onMove }: EditorBoardProps) {
  const size = GRID_SIZE * cell;

  return (
    <div
      ref={boardRef}
      className="relative touch-none rounded-2xl bg-slate-800"
      style={{ width: size, height: size }}
    >
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
        <EditorPiece
          key={car.id}
          car={car}
          cell={cell}
          boardRef={boardRef}
          selected={car.id === selectedId}
          onSelect={onSelect}
          onMove={onMove}
        />
      ))}
    </div>
  );
}

interface EditorPieceProps {
  car: Car;
  cell: number;
  boardRef: React.RefObject<HTMLDivElement | null>;
  selected: boolean;
  onSelect: (id: string) => void;
  onMove: (id: string, row: number, col: number) => void;
}

function EditorPiece({ car, cell, boardRef, selected, onSelect, onMove }: EditorPieceProps) {
  const w = car.orientation === 'h' ? car.length : 1;
  const h = car.orientation === 'v' ? car.length : 1;
  const x = useMotionValue(car.col * cell);
  const y = useMotionValue(car.row * cell);

  useEffect(() => {
    x.set(car.col * cell);
    y.set(car.row * cell);
  }, [car.col, car.row, cell, x, y]);

  return (
    <motion.div
      data-testid={`editor-car-${car.id}`}
      data-target={car.isTarget}
      draggable={false}
      drag
      dragConstraints={boardRef}
      dragMomentum={false}
      dragElastic={0}
      onTap={() => onSelect(car.id)}
      whileDrag={{ scale: 1.05, zIndex: 20 }}
      style={{
        x, y,
        width: w * cell - 8,
        height: h * cell - 8,
        marginLeft: 4,
        marginTop: 4,
        position: 'absolute',
      }}
      className={`rounded-xl shadow-md cursor-grab active:cursor-grabbing ${
        car.isTarget ? 'bg-red-500' : 'bg-slate-400'
      } ${selected ? 'z-10 ring-4 ring-amber-400' : ''}`}
      onDragEnd={() => {
        const col = Math.round(x.get() / cell);
        // The target stays on the exit row (that's where the puzzle's exit is).
        const row = car.isTarget ? EXIT_ROW : Math.round(y.get() / cell);
        // Reset to the current grid position; if onMove is accepted the prop change
        // repositions via the effect, if rejected the piece snaps back here.
        x.set(car.col * cell);
        y.set(car.row * cell);
        onMove(car.id, row, col);
      }}
    />
  );
}
