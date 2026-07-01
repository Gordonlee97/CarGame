// src/components/editor/Palette.tsx
import { motion } from 'framer-motion';
import type { Orientation } from '../../game/types';

export interface PieceSpec {
  orientation: Orientation;
  length: 2 | 3;
}

type DragEndEvent = MouseEvent | TouchEvent | PointerEvent;

interface PaletteProps {
  cell: number;
  onDrop: (spec: PieceSpec, event: DragEndEvent) => void;
}

const BANK: { key: string; label: string; spec: PieceSpec }[] = [
  { key: 'car-h', label: 'Car (horizontal)', spec: { orientation: 'h', length: 2 } },
  { key: 'car-v', label: 'Car (vertical)', spec: { orientation: 'v', length: 2 } },
  { key: 'truck-h', label: 'Truck (horizontal)', spec: { orientation: 'h', length: 3 } },
  { key: 'truck-v', label: 'Truck (vertical)', spec: { orientation: 'v', length: 3 } },
];

export function Palette({ cell, onDrop }: PaletteProps) {
  const unit = Math.round(cell * 0.6); // compact preview size

  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-sm text-slate-500">Drag a vehicle onto the board</p>
      <div className="flex items-center gap-4" style={{ minHeight: unit * 3 }}>
        {BANK.map(({ key, label, spec }) => {
          const w = spec.orientation === 'h' ? spec.length : 1;
          const h = spec.orientation === 'v' ? spec.length : 1;
          const isTruck = spec.length === 3;
          return (
            <motion.div
              key={key}
              data-testid={`bank-${key}`}
              aria-label={label}
              draggable={false}
              drag
              dragSnapToOrigin
              dragElastic={0.15}
              dragMomentum={false}
              whileDrag={{ scale: 1.08, zIndex: 50 }}
              onDragEnd={(event) => onDrop(spec, event as DragEndEvent)}
              className={`cursor-grab touch-none rounded-lg shadow-md active:cursor-grabbing ${
                isTruck ? 'bg-slate-500' : 'bg-slate-400'
              }`}
              style={{ position: 'relative', width: w * unit, height: h * unit }}
            />
          );
        })}
      </div>
    </div>
  );
}
