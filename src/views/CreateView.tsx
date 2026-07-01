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
