// src/App.tsx
import { useCallback, useReducer, useMemo, useState, useEffect } from 'react';
import { gameReducer, initGame } from './state/useGameState';
import { randomPuzzle } from './game/puzzles';
import { Board } from './components/Board';
import { Controls } from './components/Controls';
import { Hud } from './components/Hud';
import { WinOverlay } from './components/WinOverlay';
import { CELL } from './components/CarPiece';
import { GRID_SIZE } from './game/types';
import type { PuzzleDef } from './game/types';

const CELL_MIN = 44;
const CELL_MAX = 72;

function computeCell(): number {
  const raw = Math.floor(
    Math.min(window.innerWidth - 32, window.innerHeight - 220) / GRID_SIZE,
  );
  return Math.max(CELL_MIN, Math.min(CELL_MAX, raw));
}

function newPuzzle(): { puzzle: PuzzleDef; optimal: number } {
  const p = randomPuzzle();
  return { puzzle: { id: 'pool', cars: p.cars }, optimal: p.optimal };
}

export default function App() {
  const first = useMemo(() => newPuzzle(), []);
  const [state, dispatch] = useReducer(
    gameReducer,
    initGame(first.puzzle, first.optimal),
  );

  // Responsive cell size — start with default so tests (no layout pass) get CELL
  const [cell, setCell] = useState<number>(CELL);

  useEffect(() => {
    function update() {
      setCell(computeCell());
    }
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const onMove = useCallback(
    (carId: string, row: number, col: number) =>
      dispatch({ type: 'MOVE_CAR', move: { carId, row, col } }),
    [],
  );

  const onRandom = useCallback(() => {
    const { puzzle, optimal } = newPuzzle();
    dispatch({ type: 'NEW_PUZZLE', puzzle, optimal });
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-100 p-4">
      <Hud moveCount={state.moveCount} optimal={state.optimal} />
      <div className="relative">
        <Board cars={state.cars} cell={cell} onMove={onMove} />
        {state.solved && (
          <WinOverlay
            moveCount={state.moveCount}
            optimal={state.optimal}
            onPlayAgain={onRandom}
          />
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
