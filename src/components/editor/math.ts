import type { Editor } from '@tiptap/core';
import katex from 'katex';
import { create } from 'zustand';

export const PLACEHOLDER = 'x';

export type MathKind = 'inlineMath' | 'blockMath';

/** fresh: 방금 넣은 자리표시 수식 — 안 고치고 닫으면 지운다 */
type MathTarget = { editor: Editor; pos: number; kind: MathKind; latex: string; anchor: HTMLElement; fresh: boolean };

/** 지금 편집 중인 수식 (MathPopover 가 읽는다) */
export const useMathStore = create<{ target: MathTarget | null; open: (t: MathTarget) => void; close: () => void }>((set) => ({
  target: null,
  open: (target) => set({ target }),
  close: () => set({ target: null }),
}));

export function renderLatex(latex: string, displayMode: boolean): string {
  return katex.renderToString(latex || '\\square', { throwOnError: false, displayMode, output: 'html', strict: 'ignore' });
}

/** pos 의 수식 노드를 편집 창으로 연다 */
export function openMathAt(editor: Editor, pos: number, fresh = false) {
  const node = editor.state.doc.nodeAt(pos);
  if (!node || (node.type.name !== 'inlineMath' && node.type.name !== 'blockMath')) return;
  const anchor = editor.view.nodeDOM(pos) as HTMLElement | null;
  if (!anchor) return;
  useMathStore.getState().open({ editor, pos, kind: node.type.name as MathKind, latex: String(node.attrs.latex ?? ''), anchor, fresh });
}

/** 커서 자리에 수식을 넣고 바로 편집 창을 연다 */
export function insertMath(editor: Editor, kind: MathKind) {
  const from = editor.state.selection.from;
  const selected = editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to, ' ');
  // 빈 수식은 넣을 수 없어서 자리표시로 넣고, 편집 창에서 전체 선택해 바로 덮어쓰게 한다
  const latex = selected.trim() || PLACEHOLDER;
  const chain = editor.chain().focus();
  if (kind === 'inlineMath') {
    if (selected) chain.deleteSelection();
    chain.insertInlineMath({ latex }).run();
  } else {
    chain.insertBlockMath({ latex }).run();
  }
  // 방금 넣은 노드를 찾아서 편집
  let found: number | null = null;
  let best = Infinity;
  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === kind && String(node.attrs.latex ?? '') === latex) {
      const d = Math.abs(pos - from);
      if (d < best) {
        best = d;
        found = pos;
      }
    }
  });
  if (found !== null) {
    const pos: number = found;
    requestAnimationFrame(() => openMathAt(editor, pos, latex === PLACEHOLDER));
  }
}
