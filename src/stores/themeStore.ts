import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark' | 'system';

type ThemeState = {
  mode: ThemeMode;
  /** 실제로 적용된 테마 */
  theme: 'light' | 'dark';
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
};

const media = typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)') : null;

function resolve(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'system') return media?.matches ? 'dark' : 'light';
  return mode;
}

let fadeTimer: ReturnType<typeof setTimeout> | null = null;

function apply(theme: 'light' | 'dark', animate = false) {
  const root = document.documentElement;
  if (animate) {
    root.classList.add('kz-theme-fade');
    if (fadeTimer) clearTimeout(fadeTimer);
    fadeTimer = setTimeout(() => root.classList.remove('kz-theme-fade'), 700);
  }
  root.classList.toggle('dark', theme === 'dark');
  root.style.colorScheme = theme;
  const meta = document.querySelector('meta[name="theme-color"]');
  meta?.setAttribute('content', getComputedStyle(root).getPropertyValue('--color-bg-page').trim() || '#f7f6f3');
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'system',
      theme: resolve('system'),
      setMode: (mode) => {
        const theme = resolve(mode);
        apply(theme, true);
        set({ mode, theme });
      },
      toggleTheme: () => get().setMode(get().theme === 'dark' ? 'light' : 'dark'),
    }),
    {
      name: 'kluztd:theme',
      partialize: (s) => ({ mode: s.mode }),
      onRehydrateStorage: () => (state) => {
        const mode = state?.mode ?? 'system';
        const theme = resolve(mode);
        apply(theme);
        useThemeStore.setState({ mode, theme });
      },
    },
  ),
);

media?.addEventListener('change', () => {
  const { mode } = useThemeStore.getState();
  if (mode !== 'system') return;
  const theme = resolve(mode);
  apply(theme);
  useThemeStore.setState({ theme });
});
