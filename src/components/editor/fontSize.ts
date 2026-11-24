import type { Editor } from '@tiptap/core';

/** 글자 크기 단계 — 본문 글자 크기에 대한 비율(em)이라 어느 칸에서나 비례해서 커진다 */
export const FONT_SIZES = [
  { id: 'small', label: '작게', value: '0.85em' },
  { id: 'normal', label: '보통', value: null },
  { id: 'large', label: '크게', value: '1.25em' },
  { id: 'xlarge', label: '아주 크게', value: '1.6em' },
] as const;

export function currentSizeIndex(editor: Editor): number {
  const size = editor.getAttributes('textStyle').fontSize as string | undefined;
  const idx = FONT_SIZES.findIndex((s) => s.value === (size ?? null));
  return idx < 0 ? 1 : idx;
}

/** 한 단계 크게(+1) / 작게(-1) */
export function stepFontSize(editor: Editor, dir: 1 | -1) {
  const next = FONT_SIZES[Math.min(FONT_SIZES.length - 1, Math.max(0, currentSizeIndex(editor) + dir))];
  const chain = editor.chain().focus();
  if (next.value) chain.setFontSize(next.value).run();
  else chain.unsetFontSize().run();
}
