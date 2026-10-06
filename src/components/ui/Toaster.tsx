import { X } from 'lucide-react';

import Portal from '@/components/ui/Portal';
import { useToastStore } from '@/stores/toastStore';

export default function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <Portal>
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-[95] flex flex-col items-center gap-2 px-4 sm:bottom-6"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`${t.leaving ? 'anim-sink' : 'anim-rise'} pointer-events-auto flex max-w-md min-w-0 items-center gap-3 rounded-xl bg-text-primary py-2.5 pr-2 pl-4 text-sm text-bg-surface shadow-pop`}
          >
            <div className="min-w-0 flex-1 leading-snug">{t.message}</div>
            {t.action ? (
              <button
                type="button"
                onClick={() => {
                  t.action?.run();
                  dismiss(t.id);
                }}
                className="h-7 flex-none rounded-lg px-2.5 text-[0.8rem] font-bold text-accent-soft hover:bg-white/10"
              >
                {t.action.label}
              </button>
            ) : null}
            <button
              type="button"
              aria-label="닫기"
              onClick={() => dismiss(t.id)}
              className="grid size-7 flex-none place-items-center rounded-lg opacity-60 hover:bg-white/10 hover:opacity-100"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}
      </div>
    </Portal>
  );
}
