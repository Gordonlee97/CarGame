// src/App.tsx
import { useState } from 'react';
import { PlayView } from './views/PlayView';
import { CreateView } from './views/CreateView';
import { LevelsView } from './views/LevelsView';
import { getLevel } from './storage/levels';
import type { Car } from './game/types';

type View = 'play' | 'create' | 'levels';

const tab = (active: boolean) =>
  `px-4 py-2 rounded-full font-medium transition ${
    active ? 'bg-red-500 text-white shadow' : 'bg-slate-200 hover:bg-slate-300'
  }`;

export default function App() {
  const [view, setView] = useState<View>('play');
  const [customLevel, setCustomLevel] = useState<{ cars: Car[]; optimal: number } | undefined>();
  const [playKey, setPlayKey] = useState(0);

  const playCustom = (id: string) => {
    const lvl = getLevel(id);
    if (!lvl) return;
    setCustomLevel({ cars: lvl.cars, optimal: lvl.optimal });
    setPlayKey((k) => k + 1); // remount PlayView with the custom level
    setView('play');
  };

  return (
    <div className="flex min-h-screen flex-col items-center gap-6 bg-slate-100 p-4">
      <nav className="flex gap-3">
        <button className={tab(view === 'play')} onClick={() => setView('play')}>
          Play
        </button>
        <button className={tab(view === 'create')} onClick={() => setView('create')}>
          Create
        </button>
        <button className={tab(view === 'levels')} onClick={() => setView('levels')}>
          My Levels
        </button>
      </nav>

      {view === 'play' && <PlayView key={playKey} initialLevel={customLevel} />}
      {view === 'create' && <CreateView onSaved={() => setView('levels')} />}
      {view === 'levels' && <LevelsView onPlay={playCustom} />}
    </div>
  );
}
