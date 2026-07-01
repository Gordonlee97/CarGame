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
