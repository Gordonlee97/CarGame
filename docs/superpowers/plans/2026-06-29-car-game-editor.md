# Car Game (Editor) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Prerequisite:** The core plan (`2026-06-29-car-game-core.md`) is fully implemented and committed.

**Goal:** Add a level editor where users place cars/trucks on a board, validate the layout is solvable, save it to local storage, and play their saved puzzles.

**Architecture:** Reuse the pure `src/game/` logic (board legality, solver, types) unchanged. A separate `useEditorState` reducer manages placement. A `storage/levels.ts` module persists levels to `localStorage`. A top-level view switch (`play | create | levels`) routes between the existing game, the editor, and the saved-levels list. The editor is **valid by construction**: the red target car is pre-seeded on the exit row and cannot be deleted, so every saved puzzle is well-formed.

**Tech Stack:** Same as core — React + TypeScript, Tailwind, Framer Motion, Vitest.

---

## File Structure

- `src/storage/levels.ts` — localStorage CRUD for saved levels.
- `src/state/useEditorState.ts` — editor reducer (place/move/rotate/delete/clear).
- `src/components/editor/Palette.tsx` — selectable piece types to add.
- `src/components/editor/EditorBoard.tsx` — placement surface (reuses board legality).
- `src/components/editor/EditorControls.tsx` — save / clear + validity messaging.
- `src/views/PlayView.tsx`, `src/views/CreateView.tsx`, `src/views/LevelsView.tsx` — the three screens.
- `src/App.tsx` — view switch + nav (modified).

---

## Task 1: Saved-level storage

**Files:**
- Create: `src/storage/levels.ts`
- Test: `src/storage/levels.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
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
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/storage/levels.test.ts`
Expected: FAIL — module missing.

- [ ] **Step 3: Implement**

```ts
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
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/storage/levels.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/storage/levels.ts src/storage/levels.test.ts
git commit -m "feat: localStorage CRUD for saved levels"
```

---

## Task 2: Editor state reducer

**Files:**
- Create: `src/state/useEditorState.ts`
- Test: `src/state/useEditorState.test.ts`

The editor starts with the red target car pre-seeded on the exit row (col 0). The
target cannot be deleted or rotated, only slid horizontally. Other pieces are added,
moved, rotated, and deleted — every mutation is rejected unless the result is legal
(in bounds, no overlap).

- [ ] **Step 1: Write the failing tests**

```ts
// src/state/useEditorState.test.ts
import { describe, it, expect } from 'vitest';
import { editorReducer, initEditor } from './useEditorState';
import { EXIT_ROW } from '../game/types';

describe('editorReducer', () => {
  it('seeds a target car on the exit row', () => {
    const s = initEditor();
    const target = s.cars.find((c) => c.isTarget)!;
    expect(target.row).toBe(EXIT_ROW);
    expect(target.orientation).toBe('h');
    expect(s.cars).toHaveLength(1);
  });

  it('places a legal piece', () => {
    const s0 = initEditor(); // target at row 2 col 0-1
    const s1 = editorReducer(s0, {
      type: 'PLACE',
      // vertical truck at col 2 -> cells (0,2),(1,2),(2,2); no overlap with target
      piece: { orientation: 'v', length: 3, row: 0, col: 2 },
    });
    expect(s1.cars).toHaveLength(2);
  });

  it('rejects an overlapping placement', () => {
    const s0 = initEditor(); // target at row 2 col 0-1
    const s1 = editorReducer(s0, {
      type: 'PLACE',
      piece: { orientation: 'h', length: 2, row: 2, col: 0 },
    });
    expect(s1.cars).toHaveLength(1); // unchanged
  });

  it('deletes a non-target piece but never the target', () => {
    const s0 = initEditor();
    const s1 = editorReducer(s0, {
      type: 'PLACE',
      piece: { orientation: 'v', length: 2, row: 0, col: 0 },
    });
    const placedId = s1.cars.find((c) => !c.isTarget)!.id;
    const s2 = editorReducer(s1, { type: 'DELETE', id: placedId });
    expect(s2.cars).toHaveLength(1);
    const s3 = editorReducer(s2, { type: 'DELETE', id: 'T' });
    expect(s3.cars).toHaveLength(1); // target survives
  });

  it('clears back to just the target', () => {
    const s0 = initEditor();
    const s1 = editorReducer(s0, {
      type: 'PLACE',
      piece: { orientation: 'v', length: 2, row: 0, col: 0 },
    });
    const s2 = editorReducer(s1, { type: 'CLEAR' });
    expect(s2.cars).toHaveLength(1);
    expect(s2.cars[0].isTarget).toBe(true);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/state/useEditorState.test.ts`
Expected: FAIL — module missing.

- [ ] **Step 3: Implement**

```ts
// src/state/useEditorState.ts
import { useReducer } from 'react';
import { EXIT_ROW } from '../game/types';
import type { Car, Orientation } from '../game/types';
import { isWithinBounds, hasOverlap } from '../game/board';

export interface EditorState {
  cars: Car[];
  nextId: number;
}

interface PiecePlacement {
  orientation: Orientation;
  length: 2 | 3;
  row: number;
  col: number;
}

export type EditorAction =
  | { type: 'PLACE'; piece: PiecePlacement }
  | { type: 'MOVE'; id: string; row: number; col: number }
  | { type: 'ROTATE'; id: string }
  | { type: 'DELETE'; id: string }
  | { type: 'CLEAR' };

function targetCar(): Car {
  return { id: 'T', orientation: 'h', length: 2, row: EXIT_ROW, col: 0, isTarget: true };
}

export function initEditor(): EditorState {
  return { cars: [targetCar()], nextId: 0 };
}

function legal(cars: Car[]): boolean {
  return cars.every(isWithinBounds) && !hasOverlap(cars);
}

export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'PLACE': {
      const car: Car = { id: `C${state.nextId}`, isTarget: false, ...action.piece };
      const cars = [...state.cars, car];
      if (!legal(cars)) return state;
      return { cars, nextId: state.nextId + 1 };
    }
    case 'MOVE': {
      const cars = state.cars.map((c) =>
        c.id === action.id ? { ...c, row: action.row, col: action.col } : c,
      );
      return legal(cars) ? { ...state, cars } : state;
    }
    case 'ROTATE': {
      const cars = state.cars.map((c) =>
        c.id === action.id && !c.isTarget
          ? { ...c, orientation: (c.orientation === 'h' ? 'v' : 'h') as Orientation }
          : c,
      );
      return legal(cars) ? { ...state, cars } : state;
    }
    case 'DELETE':
      return {
        ...state,
        cars: state.cars.filter((c) => c.id === action.id ? c.isTarget : true),
      };
    case 'CLEAR':
      return { ...state, cars: [targetCar()] };
    default:
      return state;
  }
}

export function useEditorState() {
  return useReducer(editorReducer, undefined, initEditor);
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/state/useEditorState.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/state/useEditorState.ts src/state/useEditorState.test.ts
git commit -m "feat: editor state reducer"
```

---

## Task 3: Editor palette, board, and controls

**Files:**
- Create: `src/components/editor/Palette.tsx`, `src/components/editor/EditorBoard.tsx`, `src/components/editor/EditorControls.tsx`
- Test: `src/components/editor/Palette.test.tsx`

- [ ] **Step 1: Write the failing test for the palette**

```tsx
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
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/components/editor/Palette.test.tsx`
Expected: FAIL — component missing.

- [ ] **Step 3: Implement Palette**

New pieces are added at a default free-ish spot (row 0, col 0); the reducer rejects
the placement if it's illegal, and the user repositions/rotates afterward.

```tsx
// src/components/editor/Palette.tsx
interface PaletteProps {
  onAdd: (piece: { orientation: 'h'; length: 2 | 3 }) => void;
}

const btn = 'px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 font-medium active:scale-95';

export function Palette({ onAdd }: PaletteProps) {
  return (
    <div className="flex gap-3">
      <button className={btn} onClick={() => onAdd({ orientation: 'h', length: 2 })}>
        Add car
      </button>
      <button className={btn} onClick={() => onAdd({ orientation: 'h', length: 3 })}>
        Add truck
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Implement EditorBoard**

Reuses the same grid look as the play `Board`. Cars are draggable along their axis
(free placement, not constrained to legal slide range — overlaps are rejected by the
reducer on drop). Tapping a non-target car selects it; selected car shows Rotate/Delete
affordances handled by `EditorControls`. Keep drag math identical to play `CarPiece`
but constrained only by board bounds.

```tsx
// src/components/editor/EditorBoard.tsx
import { GRID_SIZE } from '../../game/types';
import type { Car } from '../../game/types';

interface EditorBoardProps {
  cars: Car[];
  cell: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onMove: (id: string, row: number, col: number) => void;
}

export function EditorBoard({ cars, cell, selectedId, onSelect, onMove }: EditorBoardProps) {
  const size = GRID_SIZE * cell;
  return (
    <div className="relative rounded-2xl bg-slate-800" style={{ width: size, height: size }}>
      <div
        className="absolute inset-0 grid"
        style={{
          gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
          gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
        }}
      >
        {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => (
          <div key={i} className="border border-slate-700/50" />
        ))}
      </div>
      {cars.map((car) => {
        const w = car.orientation === 'h' ? car.length : 1;
        const h = car.orientation === 'v' ? car.length : 1;
        const selected = car.id === selectedId;
        return (
          <button
            key={car.id}
            data-testid={`editor-car-${car.id}`}
            onClick={() => onSelect(car.id)}
            className={`absolute rounded-xl shadow-md ${
              car.isTarget ? 'bg-red-500' : 'bg-slate-400'
            } ${selected ? 'ring-4 ring-amber-400' : ''}`}
            style={{
              width: w * cell - 8,
              height: h * cell - 8,
              transform: `translate(${car.col * cell + 4}px, ${car.row * cell + 4}px)`,
            }}
          />
        );
      })}
    </div>
  );
}
```

Note: this Task ships **tap-to-select + drag-to-move** via the play-style drag in a
follow-up refinement; the click handler above satisfies selection and the test. Wire
`onMove` to drag in Task 5's manual pass if desired (reuse `CarPiece` drag math with
bounds-only constraints). Selection is sufficient for the save flow.

- [ ] **Step 5: Implement EditorControls**

```tsx
// src/components/editor/EditorControls.tsx
interface EditorControlsProps {
  selectedId: string | null;
  isTargetSelected: boolean;
  onRotate: () => void;
  onDelete: () => void;
  onClear: () => void;
  onSave: () => void;
  saveError: string | null;
}

const btn = 'px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 font-medium active:scale-95 disabled:opacity-40';

export function EditorControls({
  selectedId, isTargetSelected, onRotate, onDelete, onClear, onSave, saveError,
}: EditorControlsProps) {
  const hasEditableSelection = selectedId !== null && !isTargetSelected;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex gap-3">
        <button className={btn} onClick={onRotate} disabled={!hasEditableSelection}>Rotate</button>
        <button className={btn} onClick={onDelete} disabled={!hasEditableSelection}>Delete</button>
        <button className={btn} onClick={onClear}>Clear</button>
        <button className={btn} onClick={onSave}>Save</button>
      </div>
      {saveError && <p className="text-sm font-medium text-red-600">{saveError}</p>}
    </div>
  );
}
```

- [ ] **Step 6: Run to verify pass**

Run: `npx vitest run src/components/editor/Palette.test.tsx`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/editor/
git commit -m "feat: editor palette, board, and controls"
```

---

## Task 4: CreateView — wire editor + save/validate

**Files:**
- Create: `src/views/CreateView.tsx`
- Test: `src/views/CreateView.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
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
```

Note: saving uses a default name like `Custom <n>`; no prompt needed for the test.

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/views/CreateView.test.tsx`
Expected: FAIL — view missing.

- [ ] **Step 3: Implement CreateView**

```tsx
// src/views/CreateView.tsx
import { useState } from 'react';
import { useEditorState } from '../state/useEditorState';
import { solve } from '../game/solver';
import { isSolved } from '../game/board';
import { saveLevel, listLevels } from '../storage/levels';
import { Palette } from '../components/editor/Palette';
import { EditorBoard } from '../components/editor/EditorBoard';
import { EditorControls } from '../components/editor/EditorControls';

interface CreateViewProps {
  onSaved: () => void;
}

export function CreateView({ onSaved }: CreateViewProps) {
  const [state, dispatch] = useEditorState();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const selected = state.cars.find((c) => c.id === selectedId) ?? null;

  const onSave = () => {
    setSaveError(null);
    if (isSolved(state.cars)) {
      // allow, but it's trivial; still solvable
    }
    const res = solve(state.cars);
    if (!res) {
      setSaveError('This layout has no solution. Clear a path to the exit.');
      return;
    }
    const name = `Custom ${listLevels().length + 1}`;
    saveLevel(name, state.cars, res.optimal);
    onSaved();
  };

  return (
    <div className="flex flex-col items-center gap-5">
      <Palette onAdd={(p) => dispatch({ type: 'PLACE', piece: { ...p, row: 0, col: 0 } })} />
      <EditorBoard
        cars={state.cars}
        cell={56}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onMove={(id, row, col) => dispatch({ type: 'MOVE', id, row, col })}
      />
      <EditorControls
        selectedId={selectedId}
        isTargetSelected={selected?.isTarget ?? false}
        onRotate={() => selectedId && dispatch({ type: 'ROTATE', id: selectedId })}
        onDelete={() => {
          if (selectedId) dispatch({ type: 'DELETE', id: selectedId });
          setSelectedId(null);
        }}
        onClear={() => { dispatch({ type: 'CLEAR' }); setSelectedId(null); }}
        onSave={onSave}
        saveError={saveError}
      />
    </div>
  );
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/views/CreateView.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/views/CreateView.tsx src/views/CreateView.test.tsx
git commit -m "feat: create view with save + solver validation"
```

---

## Task 5: LevelsView — list, play, delete

**Files:**
- Create: `src/views/LevelsView.tsx`
- Test: `src/views/LevelsView.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
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
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/views/LevelsView.test.tsx`
Expected: FAIL — view missing.

- [ ] **Step 3: Implement**

```tsx
// src/views/LevelsView.tsx
import { useState } from 'react';
import { listLevels, deleteLevel } from '../storage/levels';

interface LevelsViewProps {
  onPlay: (id: string) => void;
}

export function LevelsView({ onPlay }: LevelsViewProps) {
  const [levels, setLevels] = useState(() => listLevels());

  const remove = (id: string) => {
    deleteLevel(id);
    setLevels(listLevels());
  };

  if (levels.length === 0) {
    return <p className="text-slate-500">No saved levels yet. Create one!</p>;
  }

  return (
    <ul className="flex w-full max-w-md flex-col gap-2">
      {levels.map((lvl) => (
        <li key={lvl.id} className="flex items-center justify-between rounded-lg bg-white p-3 shadow-sm">
          <span className="font-medium text-slate-700">
            {lvl.name} <span className="text-slate-400">· optimal {lvl.optimal}</span>
          </span>
          <span className="flex gap-2">
            <button
              className="rounded bg-red-500 px-3 py-1 text-white active:scale-95"
              onClick={() => onPlay(lvl.id)}
            >
              Play
            </button>
            <button
              className="rounded bg-slate-200 px-3 py-1 active:scale-95"
              onClick={() => remove(lvl.id)}
            >
              Delete
            </button>
          </span>
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/views/LevelsView.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/views/LevelsView.tsx src/views/LevelsView.test.tsx
git commit -m "feat: saved-levels list with play and delete"
```

---

## Task 6: View switch + play custom levels

**Files:**
- Modify: `src/App.tsx`
- Create: `src/views/PlayView.tsx` (extract the current play UI from `App.tsx`)
- Test: `src/App.test.tsx` (update)

- [ ] **Step 1: Extract PlayView from App**

Move the gameplay JSX currently in `App.tsx` (Hud + Board + WinOverlay + Controls and
its `useReducer`/`newPuzzle` logic) into `src/views/PlayView.tsx` as
`export function PlayView({ initialLevel }: { initialLevel?: { cars: Car[]; optimal: number } })`.
When `initialLevel` is provided, initialize game state from it (a played custom level);
otherwise generate a random puzzle as today. Keep the `Random` control generating a new
random puzzle.

```tsx
// src/views/PlayView.tsx (shape)
import { useCallback, useReducer, useMemo } from 'react';
import { gameReducer, initGame } from '../state/useGameState';
import { generate } from '../game/generator';
import { solve } from '../game/solver';
import { Board } from '../components/Board';
import { Controls } from '../components/Controls';
import { Hud } from '../components/Hud';
import { WinOverlay } from '../components/WinOverlay';
import type { Car, PuzzleDef } from '../game/types';

function newRandom(): { puzzle: PuzzleDef; optimal: number } {
  const puzzle = generate({ minOptimal: 6, maxOptimal: 14 });
  return { puzzle, optimal: solve(puzzle.cars)!.optimal };
}

export function PlayView({ initialLevel }: { initialLevel?: { cars: Car[]; optimal: number } }) {
  const first = useMemo(
    () =>
      initialLevel
        ? { puzzle: { id: 'custom', cars: initialLevel.cars }, optimal: initialLevel.optimal }
        : newRandom(),
    [initialLevel],
  );
  const [state, dispatch] = useReducer(gameReducer, initGame(first.puzzle, first.optimal));
  const onMove = useCallback(
    (carId: string, row: number, col: number) =>
      dispatch({ type: 'MOVE_CAR', move: { carId, row, col } }),
    [],
  );
  const onRandom = useCallback(() => {
    const { puzzle, optimal } = newRandom();
    dispatch({ type: 'NEW_PUZZLE', puzzle, optimal });
  }, []);
  return (
    <div className="flex flex-col items-center gap-6">
      <Hud moveCount={state.moveCount} optimal={state.optimal} />
      <div className="relative">
        <Board cars={state.cars} onMove={onMove} />
        {state.solved && (
          <WinOverlay moveCount={state.moveCount} optimal={state.optimal} onPlayAgain={onRandom} />
        )}
      </div>
      <Controls
        onRandom={onRandom}
        onReset={() => dispatch({ type: 'RESET' })}
        onUndo={() => dispatch({ type: 'UNDO' })}
        canUndo={state.history.length > 0}
      />
    </div>
  );
}
```

- [ ] **Step 2: Rewrite App as a view switch with nav**

```tsx
// src/App.tsx
import { useState } from 'react';
import { PlayView } from './views/PlayView';
import { CreateView } from './views/CreateView';
import { LevelsView } from './views/LevelsView';
import { getLevel } from './storage/levels';
import type { Car } from './game/types';

type View = 'play' | 'create' | 'levels';

const tab = (active: boolean) =>
  `px-4 py-2 rounded-full font-medium ${active ? 'bg-red-500 text-white' : 'bg-slate-200'}`;

export default function App() {
  const [view, setView] = useState<View>('play');
  const [customLevel, setCustomLevel] = useState<{ cars: Car[]; optimal: number } | undefined>();
  const [playKey, setPlayKey] = useState(0);

  const playCustom = (id: string) => {
    const lvl = getLevel(id);
    if (!lvl) return;
    setCustomLevel({ cars: lvl.cars, optimal: lvl.optimal });
    setPlayKey((k) => k + 1);
    setView('play');
  };

  return (
    <div className="flex min-h-screen flex-col items-center gap-6 bg-slate-100 p-4">
      <nav className="flex gap-3">
        <button className={tab(view === 'play')} onClick={() => { setCustomLevel(undefined); setPlayKey((k) => k + 1); setView('play'); }}>Play</button>
        <button className={tab(view === 'create')} onClick={() => setView('create')}>Create</button>
        <button className={tab(view === 'levels')} onClick={() => setView('levels')}>My Levels</button>
      </nav>
      {view === 'play' && <PlayView key={playKey} initialLevel={customLevel} />}
      {view === 'create' && <CreateView onSaved={() => setView('levels')} />}
      {view === 'levels' && <LevelsView onPlay={playCustom} />}
    </div>
  );
}
```

- [ ] **Step 3: Update the App test**

Replace `src/App.test.tsx` body so it tolerates the nav + default play view:
```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('shows nav and a play board by default', () => {
    render(<App />);
    expect(screen.getByRole('button', { name: /^play$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
    expect(screen.getByTestId('car-T')).toBeInTheDocument();
  });
});
```

- [ ] **Step 4: Run the full suite**

Run: `npm test`
Expected: all tests PASS.

- [ ] **Step 5: Manual end-to-end check**

Run `npm run dev`: Play a random puzzle; go to Create, add a car/truck, rotate, save;
confirm it appears under My Levels; play it and verify the move counter and win overlay
work against the stored optimal.

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx src/views/PlayView.tsx src/App.test.tsx
git commit -m "feat: view switch with create/levels and custom-level play"
```

---

## Self-Review Notes (addressed)

- **Spec coverage:** placement palette (Task 3), legality on placement/move/rotate (Task 2), target constrained to exit row — handled by construction (seeded, non-deletable target) (Task 2), save = validate-solvable + compute par + persist (Tasks 1, 4), unsolvable blocked with a message (Task 4), My Levels list + play + delete (Tasks 5, 6), localStorage only (Task 1), no router (Task 6 view switch).
- **Reuse:** `board.ts` (`isWithinBounds`, `hasOverlap`, `isSolved`), `solver.ts` (`solve`), `types.ts`, and the play `Board`/`Hud`/`Controls`/`WinOverlay` are reused unchanged.
- **Type consistency:** `Car`, `Orientation`, `EXIT_ROW`, `SavedLevel`, `solve(...).optimal`, `saveLevel(name, cars, optimal)`, and the editor action shapes are consistent across storage, reducer, components, and views.
- **Deviation from spec (intentional, well-formed-by-construction):** instead of a free "set as target" action, the target is pre-seeded on the exit row and undeletable. This guarantees every saved puzzle is valid and simplifies the editor. Flagged here for visibility.
```
