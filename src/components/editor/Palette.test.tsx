// src/components/editor/Palette.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Palette } from './Palette';

describe('Palette', () => {
  it('offers four draggable vehicles (car/truck x horizontal/vertical)', () => {
    render(<Palette cell={56} onDrop={() => {}} />);
    expect(screen.getByTestId('bank-car-h')).toBeInTheDocument();
    expect(screen.getByTestId('bank-car-v')).toBeInTheDocument();
    expect(screen.getByTestId('bank-truck-h')).toBeInTheDocument();
    expect(screen.getByTestId('bank-truck-v')).toBeInTheDocument();
  });
});
