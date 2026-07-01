// src/storage/levels.ts
import type { Car } from '../game/types';

export interface SavedLevel {
  id: string;
  name: string;
  cars: Car[];
  optimal: number;
  createdAt: number;
}

const KEY = 'car-game:levels';

function readAll(): SavedLevel[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SavedLevel[]) : [];
  } catch {
    return [];
  }
}

function writeAll(levels: SavedLevel[]): void {
  localStorage.setItem(KEY, JSON.stringify(levels));
}

export function listLevels(): SavedLevel[] {
  return readAll().sort((a, b) => b.createdAt - a.createdAt);
}

export function getLevel(id: string): SavedLevel | undefined {
  return readAll().find((l) => l.id === id);
}

export function saveLevel(name: string, cars: Car[], optimal: number): SavedLevel {
  const level: SavedLevel = {
    id: `lvl-${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
    name,
    cars,
    optimal,
    createdAt: Date.now(),
  };
  writeAll([...readAll(), level]);
  return level;
}

export function deleteLevel(id: string): void {
  writeAll(readAll().filter((l) => l.id !== id));
}
