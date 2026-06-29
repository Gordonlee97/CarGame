// src/components/CarPiece.tsx
import type { Car } from '../game/types';

export const CELL = 56; // px per grid cell; board is 6*CELL square

interface CarPieceProps {
  car: Car;
  onMove: (carId: string, row: number, col: number) => void;
}

export function CarPiece({ car }: CarPieceProps) {
  const w = car.orientation === 'h' ? car.length : 1;
  const h = car.orientation === 'v' ? car.length : 1;
  return (
    <div
      data-testid={`car-${car.id}`}
      data-target={car.isTarget}
      className={`absolute rounded-xl shadow-md ${
        car.isTarget ? 'bg-red-500' : 'bg-slate-400'
      }`}
      style={{
        width: w * CELL - 8,
        height: h * CELL - 8,
        transform: `translate(${car.col * CELL + 4}px, ${car.row * CELL + 4}px)`,
      }}
    />
  );
}
