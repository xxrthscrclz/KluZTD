import { Monitor, Moon, Sun } from 'lucide-react';

import IconButton from '@/components/ui/IconButton';
import { useThemeStore, type ThemeMode } from '@/stores/themeStore';

const MODES: { mode: ThemeMode; label: string; icon: typeof Sun }[] = [
  { mode: 'light', label: '라이트', icon: Sun },
  { mode: 'dark', label: '다크', icon: Moon },
  { mode: 'system', label: '시스템', icon: Monitor },
];

export default function ThemeSwitch() {
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);
  return (
    <div role="radiogroup" aria-label="테마" className="flex items-center gap-0.5 rounded-[10px] bg-bg-muted p-0.5">
      {MODES.map(({ mode: m, label, icon: Icon }) => (
        <button
          key={m}
          type="button"
          role="radio"
          aria-checked={mode === m}
          aria-label={label}
          title={label}
          onClick={() => setMode(m)}
          className={`grid h-7 flex-1 place-items-center rounded-lg px-2 transition-colors ${
            mode === m ? 'bg-bg-surface text-text-primary shadow-card' : 'text-text-muted hover:text-text-primary'
          }`}
        >
          <Icon className="size-3.5" strokeWidth={2.2} />
        </button>
      ))}
    </div>
  );
}

/** 좁은 화면용: 라이트 ↔ 다크 한 번에 */
export function ThemeToggle() {
  const theme = useThemeStore((s) => s.theme);
  const toggle = useThemeStore((s) => s.toggleTheme);
  return (
    <IconButton label={theme === 'dark' ? '라이트 모드로' : '다크 모드로'} onClick={toggle}>
      {theme === 'dark' ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
    </IconButton>
  );
}
