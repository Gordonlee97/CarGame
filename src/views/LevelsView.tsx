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
