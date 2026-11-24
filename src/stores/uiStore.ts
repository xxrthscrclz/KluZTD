import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { EMPTY_FILTER, type TaskFilter } from '@/utils/task';

type UiState = {
  boardFilter: TaskFilter;
  setBoardFilter: (patch: Partial<TaskFilter>) => void;
  resetBoardFilter: () => void;
  /** 모바일 보드에서 보고 있는 칸 */
  mobileColumn: number;
  setMobileColumn: (i: number) => void;
  /** 자유공간 책갈피 펼침 */
  scratchOpen: boolean;
  setScratchOpen: (v: boolean) => void;
};

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      boardFilter: EMPTY_FILTER,
      setBoardFilter: (patch) => set((s) => ({ boardFilter: { ...EMPTY_FILTER, ...s.boardFilter, ...patch } })),
      resetBoardFilter: () => set({ boardFilter: EMPTY_FILTER }),
      mobileColumn: 0,
      setMobileColumn: (mobileColumn) => set({ mobileColumn }),
      scratchOpen: false,
      setScratchOpen: (scratchOpen) => set({ scratchOpen }),
    }),
    {
      name: 'kluztd:ui',
      partialize: (s) => ({ boardFilter: { ...s.boardFilter, query: '' }, scratchOpen: s.scratchOpen }),
    },
  ),
);
