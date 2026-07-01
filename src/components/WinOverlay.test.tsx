// src/components/WinOverlay.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WinOverlay } from './WinOverlay';

describe('WinOverlay', () => {
  it('shows moves and optimal', () => {
    render(<WinOverlay moveCount={9} optimal={6} onRetry={() => {}} onNext={() => {}} />);
    expect(screen.getByText(/9/)).toBeInTheDocument();
    expect(screen.getByText(/6/)).toBeInTheDocument();
  });

  it('fires retry and next callbacks', async () => {
    const onRetry = vi.fn();
    const onNext = vi.fn();
    render(<WinOverlay moveCount={9} optimal={6} onRetry={onRetry} onNext={onNext} />);
    await userEvent.click(screen.getByRole('button', { name: /try again/i }));
    await userEvent.click(screen.getByRole('button', { name: /next puzzle/i }));
    expect(onRetry).toHaveBeenCalledOnce();
    expect(onNext).toHaveBeenCalledOnce();
  });
});
