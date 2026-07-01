// src/storage/levels.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { saveLevel, listLevels, getLevel, deleteLevel } from './levels';
import type { Car } from '../game/types';

const cars: Car[] = [
  { id: 'T', orientation: 'h', length: 2, row: 2, col: 0, isTarget: true },
  { id: 'C0', orientation: 'v', length: 3, row: 0, col: 3, isTarget: false },
];

describe('levels storage', () => {
  beforeEach(() => localStorage.clear());

  it('saves and lists a level', () => {
    const saved = saveLevel('My Level', cars, 7);
    const all = listLevels();
    expect(all).toHaveLength(1);
    expect(all[0].name).toBe('My Level');
    expect(all[0].optimal).toBe(7);
    expect(all[0].id).toBe(saved.id);
  });

  it('gets a level by id', () => {
    const saved = saveLevel('A', cars, 5);
    expect(getLevel(saved.id)!.cars).toEqual(cars);
  });

  it('deletes a level', () => {
    const saved = saveLevel('A', cars, 5);
    deleteLevel(saved.id);
    expect(listLevels()).toHaveLength(0);
  });
});
