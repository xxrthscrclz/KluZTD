import { create } from 'zustand';

import { exitMs } from '@/lib/motion';

export type Toast = {
  id: number;
  message: string;
  action?: { label: string; run: () => void };
  tone?: 'default' | 'success' | 'danger';
  /** 사라지는 중 */
  leaving?: boolean;
};

type ToastState = {
  toasts: Toast[];
  show: (t: Omit<Toast, 'id'>, ms?: number) => void;
  dismiss: (id: number) => void;
};

let seq = 0;

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  show: (t, ms = 4500) => {
    const id = ++seq;
    set((s) => ({ toasts: [...s.toasts.slice(-2), { ...t, id }] }));
    setTimeout(() => get().dismiss(id), ms);
  },
  // 바로 지우지 않고 내려가며 사라진 뒤 지운다
  dismiss: (id) => {
    set((s) => ({ toasts: s.toasts.map((t) => (t.id === id ? { ...t, leaving: true } : t)) }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), exitMs());
  },
}));

export const toast = (t: Omit<Toast, 'id'>, ms?: number) => useToastStore.getState().show(t, ms);
