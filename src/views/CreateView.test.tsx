// src/views/CreateView.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateView } from './CreateView';
import { listLevels } from '../storage/levels';

describe('CreateView', () => {
  beforeEach(() => localStorage.clear());

  it('saves a solvable puzzle (the seeded target alone is solvable)', async () => {
    const onSaved = vi.fn();
    render(<CreateView onSaved={onSaved} />);
    // The default board (target only) is solvable in 1 move, so Save should succeed.
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    expect(listLevels()).toHaveLength(1);
    expect(onSaved).toHaveBeenCalledOnce();
  });
});
