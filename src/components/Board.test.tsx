// src/components/Board.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Board } from './Board';
import type { Car } from '../game/types';

const cars: Car[] = [
  { id: 'T', orientation: 'h', length: 2, row: 2, col: 0, isTarget: true },
  { id: 'B', orientation: 'v', length: 3, row: 0, col: 3, isTarget: false },
];

describe('Board', () => {
  it('renders one element per car', () => {
    render(<Board cars={cars} onMove={() => {}} />);
    expect(screen.getByTestId('car-T')).toBeInTheDocument();
    expect(screen.getByTestId('car-B')).toBeInTheDocument();
  });

  it('marks the target car', () => {
    render(<Board cars={cars} onMove={() => {}} />);
    expect(screen.getByTestId('car-T')).toHaveAttribute('data-target', 'true');
  });
});
