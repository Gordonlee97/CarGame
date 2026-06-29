// src/components/CarPiece.tsx
import { motion, useMotionValue } from 'framer-motion';
import { useEffect } from 'react';
import type { Car } from '../game/types';
import { GRID_SIZE } from '../game/types';

export const CELL = 56;

interface CarPieceProps {
  car: Car;
  cars: Car[];
  legalRange: { min: number; max: number }; // anchor min/max along the car's axis
  onMove: (carId: string, row: number, col: number) => void;
}

export function CarPiece({ car, legalRange, onMove }: CarPieceProps) {
  const w = car.orientation === 'h' ? car.length : 1;
  const h = car.orientation === 'v' ? car.length : 1;
  const x = useMotionValue(car.col * CELL);
  const y = useMotionValue(car.row * CELL);

  useEffect(() => {
    x.set(car.col * CELL);
    y.set(car.row * CELL);
  }, [car.col, car.row, x, y]);

  const axis = car.orientation === 'h' ? 'x' : 'y';

  return (
    <motion.div
      data-testid={`car-${car.id}`}
      data-target={car.isTarget}
      drag={axis}
      dragMomentum={false}
      dragElastic={0}
      dragConstraints={{
        left: car.orientation === 'h' ? legalRange.min * CELL : car.col * CELL,
        right: car.orientation === 'h' ? legalRange.max * CELL : car.col * CELL,
        top: car.orientation === 'v' ? legalRange.min * CELL : car.row * CELL,
        bottom: car.orientation === 'v' ? legalRange.max * CELL : car.row * CELL,
      }}
      whileDrag={{ scale: 1.04 }}
      style={{
        x, y,
        width: w * CELL - 8,
        height: h * CELL - 8,
        marginLeft: 4,
        marginTop: 4,
        position: 'absolute',
      }}
      className={`rounded-xl shadow-md cursor-grab active:cursor-grabbing ${
        car.isTarget ? 'bg-red-500' : 'bg-slate-400'
      }`}
      onDragEnd={() => {
        const raw = axis === 'x' ? x.get() : y.get();
        const cell = Math.round(raw / CELL);
        const clamped = Math.max(legalRange.min, Math.min(legalRange.max, cell));
        if (car.orientation === 'h') {
          if (clamped !== car.col) onMove(car.id, car.row, clamped);
          else x.set(car.col * CELL);
        } else {
          if (clamped !== car.row) onMove(car.id, clamped, car.col);
          else y.set(car.row * CELL);
        }
      }}
    />
  );
}

export function clampCell(v: number) {
  return Math.max(0, Math.min(GRID_SIZE - 1, v));
}
