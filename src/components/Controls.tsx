// src/components/Controls.tsx
interface ControlsProps {
  onRandom: () => void;
  onReset: () => void;
  onUndo: () => void;
  canUndo: boolean;
}

const btn =
  'px-5 py-2 rounded-full font-medium shadow-sm transition active:scale-95 ' +
  'bg-slate-200 hover:bg-slate-300 disabled:opacity-40 disabled:active:scale-100';

export function Controls({ onRandom, onReset, onUndo, canUndo }: ControlsProps) {
  return (
    <div className="flex gap-3">
      <button className={btn} onClick={onRandom}>Random</button>
      <button className={btn} onClick={onReset}>Reset</button>
      <button className={btn} onClick={onUndo} disabled={!canUndo}>Undo</button>
    </div>
  );
}
