import type { Editor } from '@tiptap/core';
import { create } from 'zustand';

/**
 * 떠 있는 서식 막대가 어느 에디터에 적용될지.
 * - active: 마지막으로 포커스된 에디터
 * - fallback: 아무것도 포커스된 적 없을 때 쓸 에디터 (오늘 페이지의 그날 메모)
 */
type EditorState = {
  active: Editor | null;
  fallback: Editor | null;
  /** 지금 포커스가 에디터 안에 있는지 (모바일에서 막대를 보일지 판단) */
  focused: boolean;
  setActive: (editor: Editor) => void;
  setFocused: (focused: boolean) => void;
  setFallback: (editor: Editor | null) => void;
  /** 에디터가 사라질 때 */
  release: (editor: Editor) => void;
};

export const useEditorStore = create<EditorState>((set, get) => ({
  active: null,
  fallback: null,
  focused: false,
  setActive: (editor) => set({ active: editor, focused: true }),
  setFocused: (focused) => set({ focused }),
  setFallback: (fallback) => set({ fallback }),
  release: (editor) => {
    const { active, fallback } = get();
    set({
      active: active === editor ? null : active,
      fallback: fallback === editor ? null : fallback,
      focused: active === editor ? false : get().focused,
    });
  },
}));

/** 막대가 적용할 에디터 (사라진 에디터는 제외) */
export function targetEditor(): Editor | null {
  const { active, fallback } = useEditorStore.getState();
  if (active && !active.isDestroyed) return active;
  if (fallback && !fallback.isDestroyed) return fallback;
  return null;
}
