// src/components/CarPiece.tsx
import { motion, useMotionValue } from 'framer-motion';
import { useEffect } from 'react';
import type { Car } from '../game/types';
import { GRID_SIZE } from '../game/types';

export const CELL = 56; // default px per grid cell (used as fallback)

interface CarPieceProps {
  car: Car;
  cars: Car[];
  cell: number; // px per grid cell
  legalRange: { min: number; max: number }; // anchor min/max along the car's axis
  onMove: (carId: string, row: number, col: number) => void;
}

export function CarPiece({ car, legalRange, cell, onMove }: CarPieceProps) {
  const w = car.orientation === 'h' ? car.length : 1;
  const h = car.orientation === 'v' ? car.length : 1;
  const x = useMotionValue(car.col * cell);
  const y = useMotionValue(car.row * cell);

  useEffect(() => {
    x.set(car.col * cell);
    y.set(car.row * cell);
  }, [car.col, car.row, cell, x, y]);

  const axis = car.orientation === 'h' ? 'x' : 'y';

  return (
    <motion.div
      data-testid={`car-${car.id}`}
      data-target={car.isTarget}
      drag={axis}
      dragMomentum={false}
      dragElastic={0}
      dragConstraints={{
        left: car.orientation === 'h' ? legalRange.min * cell : car.col * cell,
        right: car.orientation === 'h' ? legalRange.max * cell : car.col * cell,
        top: car.orientation === 'v' ? legalRange.min * cell : car.row * cell,
        bottom: car.orientation === 'v' ? legalRange.max * cell : car.row * cell,
      }}
      whileDrag={{ scale: 1.04 }}
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
      }`}
      onDragEnd={() => {
        const raw = axis === 'x' ? x.get() : y.get();
        const snapped = Math.round(raw / cell);
        const clamped = Math.max(legalRange.min, Math.min(legalRange.max, snapped));
        if (car.orientation === 'h') {
          if (clamped !== car.col) onMove(car.id, car.row, clamped);
          else x.set(car.col * cell);
        } else {
          if (clamped !== car.row) onMove(car.id, clamped, car.col);
          else y.set(car.row * cell);
        }
      }}
    />
  );
}

export function clampCell(v: number) {
  return Math.max(0, Math.min(GRID_SIZE - 1, v));
}
