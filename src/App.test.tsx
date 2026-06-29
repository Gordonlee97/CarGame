// src/App.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders a board and controls on load', () => {
    render(<App />);
    expect(screen.getByRole('button', { name: /random/i })).toBeInTheDocument();
    // at least the target car renders
    expect(screen.getByTestId('car-T')).toBeInTheDocument();
  });
});
