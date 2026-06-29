// src/components/Hud.tsx
interface HudProps {
  moveCount: number;
  optimal: number;
}

export function Hud({ moveCount, optimal }: HudProps) {
  return (
    <div className="flex gap-6 text-lg font-semibold text-slate-700">
      <span>Moves: {moveCount}</span>
      <span>Optimal: {optimal}</span>
    </div>
  );
}
