// src/App.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Feed PlayView a fixed puzzle so the smoke test is deterministic.
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
  it('shows the nav and a play board by default', () => {
    render(<App />);
    expect(screen.getByRole('button', { name: /^play$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /my levels/i })).toBeInTheDocument();
    expect(screen.getByTestId('car-T')).toBeInTheDocument();
  });

  it('switches to the create view', async () => {
    render(<App />);
    await userEvent.click(screen.getByRole('button', { name: /create/i }));
    // Create view offers the palette
    expect(screen.getByRole('button', { name: /add car/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add truck/i })).toBeInTheDocument();
  });
});
