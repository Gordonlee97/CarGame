// src/views/CreateView.tsx
import { useRef, useState } from 'react';
import { useEditorState } from '../state/useEditorState';
import { solve } from '../game/solver';
import { isWithinBounds, hasOverlap } from '../game/board';
import type { Car } from '../game/types';
import { saveLevel, listLevels } from '../storage/levels';
import { Palette, type PieceSpec } from '../components/editor/Palette';
import { EditorBoard } from '../components/editor/EditorBoard';
import { EditorControls } from '../components/editor/EditorControls';

interface CreateViewProps {
  onSaved: () => void;
}

const CELL = 56;

function pointerXY(event: MouseEvent | TouchEvent | PointerEvent): { x: number; y: number } {
  if ('clientX' in event) return { x: event.clientX, y: event.clientY };
  const t = event.changedTouches[0];
  return { x: t.clientX, y: t.clientY };
}

export function CreateView({ onSaved }: CreateViewProps) {
  const [state, dispatch] = useEditorState();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  const selected = state.cars.find((c) => c.id === selectedId) ?? null;

  // Drop a bank piece onto the board: place it centered on the pointer's cell if
  // that lands a legal spot, otherwise ignore it (the bank piece snaps back).
  const onDrop = (spec: PieceSpec, event: MouseEvent | TouchEvent | PointerEvent) => {
    const el = boardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const { x, y } = pointerXY(event);
    const w = spec.orientation === 'h' ? spec.length : 1;
    const h = spec.orientation === 'v' ? spec.length : 1;
    const col = Math.round((x - rect.left) / CELL - w / 2);
    const row = Math.round((y - rect.top) / CELL - h / 2);
    const candidate: Car = {
      id: '_',
      orientation: spec.orientation,
      length: spec.length,
      row,
      col,
      isTarget: false,
    };
    if (!isWithinBounds(candidate) || hasOverlap([...state.cars, candidate])) return;
    dispatch({ type: 'PLACE', piece: { orientation: spec.orientation, length: spec.length, row, col } });
  };

  const onSave = () => {
    setSaveError(null);
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
      <Palette cell={CELL} onDrop={onDrop} />
      <EditorBoard
        cars={state.cars}
        cell={CELL}
        selectedId={selectedId}
        boardRef={boardRef}
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
        onClear={() => {
          dispatch({ type: 'CLEAR' });
          setSelectedId(null);
        }}
        onSave={onSave}
        saveError={saveError}
      />
    </div>
  );
}
