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
