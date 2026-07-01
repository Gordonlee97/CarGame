// src/components/Controls.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Controls } from './Controls';

describe('Controls', () => {
  it('fires callbacks', async () => {
    const onRandom = vi.fn();
    const onReset = vi.fn();
    const onUndo = vi.fn();
    render(<Controls onRandom={onRandom} onReset={onReset} onUndo={onUndo} canUndo />);
    await userEvent.click(screen.getByRole('button', { name: /random/i }));
    await userEvent.click(screen.getByRole('button', { name: /reset/i }));
    await userEvent.click(screen.getByRole('button', { name: /undo/i }));
    expect(onRandom).toHaveBeenCalledOnce();
    expect(onReset).toHaveBeenCalledOnce();
    expect(onUndo).toHaveBeenCalledOnce();
  });

  it('disables undo when canUndo is false', () => {
    render(<Controls onRandom={() => {}} onReset={() => {}} onUndo={() => {}} canUndo={false} />);
    expect(screen.getByRole('button', { name: /undo/i })).toBeDisabled();
  });
});
