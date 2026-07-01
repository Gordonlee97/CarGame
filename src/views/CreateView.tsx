// src/views/CreateView.tsx
import { useState } from 'react';
import { useEditorState } from '../state/useEditorState';
import { solve } from '../game/solver';
import { isSolved, isWithinBounds, hasOverlap } from '../game/board';
import { GRID_SIZE } from '../game/types';
import type { Car, Orientation } from '../game/types';
import { saveLevel, listLevels } from '../storage/levels';
import { Palette } from '../components/editor/Palette';
import { EditorBoard } from '../components/editor/EditorBoard';
import { EditorControls } from '../components/editor/EditorControls';

interface CreateViewProps {
  onSaved: () => void;
}

/** First grid cell where a piece of this shape fits without overlap, or null. */
function firstFreeCell(
  cars: Car[],
  orientation: Orientation,
  length: 2 | 3,
): { row: number; col: number } | null {
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const candidate: Car = { id: '_', orientation, length, row, col, isTarget: false };
      if (isWithinBounds(candidate) && !hasOverlap([...cars, candidate])) {
        return { row, col };
      }
    }
  }
  return null;
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
      <Palette
        onAdd={(p) => {
          const spot = firstFreeCell(state.cars, p.orientation, p.length);
          if (spot) dispatch({ type: 'PLACE', piece: { ...p, row: spot.row, col: spot.col } });
        }}
      />
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
