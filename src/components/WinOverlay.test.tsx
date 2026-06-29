// src/components/WinOverlay.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WinOverlay } from './WinOverlay';

describe('WinOverlay', () => {
  it('shows moves and optimal and fires play-again', async () => {
    const onPlayAgain = vi.fn();
    render(<WinOverlay moveCount={9} optimal={6} onPlayAgain={onPlayAgain} />);
    expect(screen.getByText(/9/)).toBeInTheDocument();
    expect(screen.getByText(/6/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /play again/i }));
    expect(onPlayAgain).toHaveBeenCalledOnce();
  });
});
