// src/views/LevelsView.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LevelsView } from './LevelsView';
import { saveLevel } from '../storage/levels';
import type { Car } from '../game/types';

const cars: Car[] = [
  { id: 'T', orientation: 'h', length: 2, row: 2, col: 0, isTarget: true },
];

describe('LevelsView', () => {
  beforeEach(() => localStorage.clear());

  it('lists saved levels and fires play', async () => {
    const saved = saveLevel('Alpha', cars, 1);
    const onPlay = vi.fn();
    render(<LevelsView onPlay={onPlay} />);
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /play/i }));
    expect(onPlay).toHaveBeenCalledWith(saved.id);
  });

  it('deletes a level', async () => {
    saveLevel('Beta', cars, 1);
    render(<LevelsView onPlay={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: /delete/i }));
    expect(screen.queryByText('Beta')).not.toBeInTheDocument();
  });
});
