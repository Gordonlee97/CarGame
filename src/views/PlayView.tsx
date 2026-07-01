// src/views/PlayView.tsx
import { useCallback, useReducer, useMemo, useState, useEffect } from 'react';
import { gameReducer, initGame } from '../state/useGameState';
import { randomPuzzle } from '../game/puzzles';
import { Board } from '../components/Board';
import { Controls } from '../components/Controls';
import { Hud } from '../components/Hud';
import { WinOverlay } from '../components/WinOverlay';
import { CELL } from '../components/CarPiece';
import { GRID_SIZE } from '../game/types';
import type { Car, PuzzleDef } from '../game/types';

const CELL_MIN = 44;
const CELL_MAX = 72;

function computeCell(): number {
  const raw = Math.floor(
    Math.min(window.innerWidth - 32, window.innerHeight - 260) / GRID_SIZE,
  );
  return Math.max(CELL_MIN, Math.min(CELL_MAX, raw));
}

function poolPuzzle(): { puzzle: PuzzleDef; optimal: number } {
  const p = randomPuzzle();
  return { puzzle: { id: 'pool', cars: p.cars }, optimal: p.optimal };
}

interface PlayViewProps {
  /** When provided, play this custom level instead of a random pool puzzle. */
  initialLevel?: { cars: Car[]; optimal: number };
}

export function PlayView({ initialLevel }: PlayViewProps) {
  const first = useMemo(
    () =>
      initialLevel
        ? { puzzle: { id: 'custom', cars: initialLevel.cars }, optimal: initialLevel.optimal }
        : poolPuzzle(),
    [initialLevel],
  );
  const [state, dispatch] = useReducer(gameReducer, first, (f) =>
    initGame(f.puzzle, f.optimal),
  );

  // Responsive cell size — start with default so tests (no layout pass) get CELL.
  const [cell, setCell] = useState<number>(CELL);
  useEffect(() => {
    function update() {
      setCell(computeCell());
    }
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Remount the Board on reset / new so the target car's exit animation state
  // is always clean.
  const [runId, setRunId] = useState(0);

  // Let the winning car drive out through the exit before showing the overlay.
  const [showWin, setShowWin] = useState(false);
  useEffect(() => {
    if (!state.solved) {
      setShowWin(false);
      return;
    }
    const t = setTimeout(() => setShowWin(true), 750);
    return () => clearTimeout(t);
  }, [state.solved]);

  const onMove = useCallback(
    (carId: string, row: number, col: number) =>
      dispatch({ type: 'MOVE_CAR', move: { carId, row, col } }),
    [],
  );

  const onReset = useCallback(() => {
    setRunId((r) => r + 1);
    dispatch({ type: 'RESET' });
  }, []);

  const onRandom = useCallback(() => {
    setRunId((r) => r + 1);
    const { puzzle, optimal } = poolPuzzle();
    dispatch({ type: 'NEW_PUZZLE', puzzle, optimal });
  }, []);

  return (
    <div className="flex flex-col items-center gap-6">
      <Hud moveCount={state.moveCount} optimal={state.optimal} />
      <div className="relative">
        <Board key={runId} cars={state.cars} cell={cell} solved={state.solved} onMove={onMove} />
        {showWin && state.solved && (
          <WinOverlay
            moveCount={state.moveCount}
            optimal={state.optimal}
            onRetry={onReset}
            onNext={onRandom}
          />
        )}
      </div>
      <Controls
        onRandom={onRandom}
        onReset={onReset}
        onUndo={() => dispatch({ type: 'UNDO' })}
        canUndo={state.history.length > 0}
      />
    </div>
  );
}
