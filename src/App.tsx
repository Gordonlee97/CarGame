// src/App.tsx
import { useCallback, useReducer, useMemo } from 'react';
import { gameReducer, initGame } from './state/useGameState';
import { generate } from './game/generator';
import { solve } from './game/solver';
import { Board } from './components/Board';
import { Controls } from './components/Controls';
import { Hud } from './components/Hud';
import { WinOverlay } from './components/WinOverlay';
import type { PuzzleDef } from './game/types';

function newPuzzle(): { puzzle: PuzzleDef; optimal: number } {
  const puzzle = generate({ minOptimal: 6, maxOptimal: 14 });
  const optimal = solve(puzzle.cars)!.optimal;
  return { puzzle, optimal };
}

export default function App() {
  const first = useMemo(() => newPuzzle(), []);
  const [state, dispatch] = useReducer(
    gameReducer,
    initGame(first.puzzle, first.optimal),
  );

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
        <Board cars={state.cars} onMove={onMove} />
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
