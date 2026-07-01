// src/components/WinOverlay.tsx
import { motion } from 'framer-motion';

interface WinOverlayProps {
  moveCount: number;
  optimal: number;
  onRetry: () => void; // replay the same puzzle from its start
  onNext: () => void; // load a new puzzle
}

export function WinOverlay({ moveCount, optimal, onRetry, onNext }: WinOverlayProps) {
  const perfect = moveCount === optimal;
  return (
    <motion.div
      className="absolute inset-0 z-10 flex items-center justify-center bg-black/50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="rounded-2xl bg-white p-8 text-center shadow-xl"
        initial={{ scale: 0.8, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      >
        <h2 className="text-2xl font-bold text-slate-800">Solved!</h2>
        <p className="mt-2 text-slate-600">
          {moveCount} moves · optimal {optimal}
        </p>
        {perfect && <p className="mt-1 font-semibold text-emerald-600">Perfect!</p>}
        <div className="mt-5 flex justify-center gap-3">
          <button
            className="rounded-full bg-slate-200 px-5 py-2 font-medium text-slate-700 active:scale-95"
            onClick={onRetry}
          >
            Try again
          </button>
          <button
            className="rounded-full bg-red-500 px-5 py-2 font-medium text-white shadow active:scale-95"
            onClick={onNext}
          >
            Next puzzle
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
