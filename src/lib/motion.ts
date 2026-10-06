/** 모션 공통 — CSS 의 --kz-dur(0.5s) 와 맞춘다 */
export const EXIT_MS = 500;

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** 사라지는 애니메이션 시간 (움직임 줄이기 설정이면 0) */
export const exitMs = () => (prefersReducedMotion() ? 0 : EXIT_MS);

/** 끌기 가능한 요소에 쓰는 이동 애니메이션 (dnd-kit) */
export const SORT_TRANSITION = { duration: 500, easing: 'ease' };
export const DROP_ANIMATION = { duration: 500, easing: 'ease' };

const PRESSABLE = 'button, a, [role="button"], [role="tab"], [role="option"], [role="checkbox"], [role="gridcell"]';

/**
 * 누르는 모든 것에 '눌림' 효과 (0.5초 ease).
 * 드래그 대상(aria-roledescription 이 붙은 카드·줄, 손잡이)은 크기를 바꾸면 드래그 위치가 어긋나서 뺀다.
 */
export function installPressFeedback() {
  if (typeof document === 'undefined') return;
  document.addEventListener(
    'pointerdown',
    (e) => {
      if (prefersReducedMotion() || e.button > 0) return;
      const el = (e.target as HTMLElement | null)?.closest<HTMLElement>(PRESSABLE);
      if (!el || el.closest('[aria-roledescription], .touch-none, [data-no-press], .ProseMirror')) return;
      el.classList.remove('kz-press');
      void el.offsetWidth; // 다시 시작
      el.classList.add('kz-press');
      el.addEventListener('animationend', () => el.classList.remove('kz-press'), { once: true });
    },
    true,
  );
}
