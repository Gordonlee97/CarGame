// src/state/useEditorState.test.ts
import { describe, it, expect } from 'vitest';
import { editorReducer, initEditor } from './useEditorState';
import { EXIT_ROW } from '../game/types';

describe('editorReducer', () => {
  it('seeds a target car on the exit row', () => {
    const s = initEditor();
    const target = s.cars.find((c) => c.isTarget)!;
    expect(target.row).toBe(EXIT_ROW);
    expect(target.orientation).toBe('h');
    expect(s.cars).toHaveLength(1);
  });

  it('places a legal piece', () => {
    const s0 = initEditor(); // target at row 2 col 0-1
    const s1 = editorReducer(s0, {
      type: 'PLACE',
      // vertical truck at col 2 -> cells (0,2),(1,2),(2,2); no overlap with target
      piece: { orientation: 'v', length: 3, row: 0, col: 2 },
    });
    expect(s1.cars).toHaveLength(2);
  });

  it('rejects an overlapping placement', () => {
    const s0 = initEditor(); // target at row 2 col 0-1
    const s1 = editorReducer(s0, {
      type: 'PLACE',
      piece: { orientation: 'h', length: 2, row: 2, col: 0 },
    });
    expect(s1.cars).toHaveLength(1); // unchanged
  });

  it('deletes a non-target piece but never the target', () => {
    const s0 = initEditor();
    const s1 = editorReducer(s0, {
      type: 'PLACE',
      piece: { orientation: 'v', length: 2, row: 0, col: 0 },
    });
    const placedId = s1.cars.find((c) => !c.isTarget)!.id;
    const s2 = editorReducer(s1, { type: 'DELETE', id: placedId });
    expect(s2.cars).toHaveLength(1);
    const s3 = editorReducer(s2, { type: 'DELETE', id: 'T' });
    expect(s3.cars).toHaveLength(1); // target survives
  });

  it('clears back to just the target', () => {
    const s0 = initEditor();
    const s1 = editorReducer(s0, {
      type: 'PLACE',
      piece: { orientation: 'v', length: 2, row: 0, col: 0 },
    });
    const s2 = editorReducer(s1, { type: 'CLEAR' });
    expect(s2.cars).toHaveLength(1);
    expect(s2.cars[0].isTarget).toBe(true);
  });
});
