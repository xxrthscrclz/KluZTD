import { useEffect, useRef, useState } from 'react';

import { exitMs } from '@/lib/motion';

/**
 * 닫혀도 사라지는 애니메이션이 끝날 때까지 남겨 둔다.
 * mounted: 그릴지, leaving: 지금 사라지는 중인지 (anim-*-out 클래스를 붙이면 된다)
 */
export function usePresence(open: boolean) {
  const [mounted, setMounted] = useState(open);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (open) {
      setMounted(true);
      return;
    }
    const ms = exitMs();
    if (!ms) {
      setMounted(false);
      return;
    }
    timer.current = setTimeout(() => setMounted(false), ms);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [open]);

  return { mounted: open || mounted, leaving: !open && mounted };
}

/** 마지막으로 보인 값을 기억 — 닫히는 동안에도 내용을 그대로 그리려고 */
export function useLatest<T>(value: T | null | undefined): T | null {
  const ref = useRef<T | null>(value ?? null);
  if (value !== null && value !== undefined) ref.current = value;
  return ref.current;
}
