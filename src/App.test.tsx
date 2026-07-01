// src/App.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Feed the App a fixed puzzle so the smoke test is deterministic and doesn't
// depend on the contents of the generated pool.
vi.mock('./game/puzzles', () => ({
  randomPuzzle: () => ({
    cars: [
      { id: 'T', orientation: 'h', length: 2, row: 2, col: 0, isTarget: true },
      { id: 'C0', orientation: 'v', length: 2, row: 0, col: 3, isTarget: false },
    ],
    optimal: 5,
    difficulty: 'medium',
  }),
}));

import App from './App';

describe('App', () => {
  it('renders a board and controls on load', () => {
    render(<App />);
    expect(screen.getByRole('button', { name: /random/i })).toBeInTheDocument();
    // at least the target car renders
    expect(screen.getByTestId('car-T')).toBeInTheDocument();
  });
});
