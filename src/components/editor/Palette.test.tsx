// src/components/editor/Palette.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Palette } from './Palette';

describe('Palette', () => {
  it('offers car and truck and fires the add callback', async () => {
    const onAdd = vi.fn();
    render(<Palette onAdd={onAdd} />);
    await userEvent.click(screen.getByRole('button', { name: /add car/i }));
    expect(onAdd).toHaveBeenCalledWith({ orientation: 'h', length: 2 });
    await userEvent.click(screen.getByRole('button', { name: /add truck/i }));
    expect(onAdd).toHaveBeenCalledWith({ orientation: 'h', length: 3 });
  });
});
