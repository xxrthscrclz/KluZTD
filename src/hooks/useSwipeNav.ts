import { useEffect, useRef, type RefObject } from 'react';

/**
 * 좌우 스와이프로 앞/뒤 이동 — 손가락을 왼쪽으로 밀면 next, 오른쪽으로 밀면 prev.
 *
 * - 터치(휴대폰): 빠르게 옆으로 쓸었을 때만. 꾹 눌렀다 끄는 건 체크리스트 드래그(180ms 지연)라 건드리지 않는다.
 * - 트랙패드(맥 두 손가락): 가로 스크롤 양을 모아 한 번 넘기고, 관성 스크롤이 끝날 때까지 다시 넘기지 않는다.
 * - 입력 중인 칸·편집기, 가로로 스크롤되는 영역(표·코드블록 등) 안에서는 동작하지 않는다.
 */
const TOUCH_MIN = 60; // px — 이만큼은 옆으로 움직여야
const TOUCH_MAX_MS = 600; // 이보다 오래 걸리면 스와이프가 아님
const TOUCH_START_MS = 170; // 이 안에 움직이기 시작해야 (아니면 길게 눌러 드래그)
const WHEEL_MIN = 110; // 트랙패드 가로 누적량
const WHEEL_IDLE_MS = 260; // 이만큼 조용하면 한 번의 제스처가 끝난 것

function isEditable(el: Element | null) {
  return !!el?.closest('input, textarea, select, [contenteditable="true"], [role="dialog"], [role="menu"], [role="listbox"]');
}

/** target 에서 root 까지 올라가며, 그 방향으로 더 스크롤할 수 있는 가로 스크롤 영역이 있는지 */
function canScrollX(target: Element | null, root: Element, dir: 1 | -1) {
  for (let el = target; el && el !== root; el = el.parentElement) {
    if (el.scrollWidth <= el.clientWidth + 1) continue;
    const ox = getComputedStyle(el).overflowX;
    if (ox !== 'auto' && ox !== 'scroll') continue;
    if (dir > 0 ? el.scrollLeft + el.clientWidth < el.scrollWidth - 1 : el.scrollLeft > 0) return true;
  }
  return false;
}

export function useSwipeNav(ref: RefObject<HTMLElement | null>, onPrev: () => void, onNext: () => void) {
  const handlers = useRef({ onPrev, onNext });
  handlers.current = { onPrev, onNext };

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const fire = (dir: 1 | -1) => (dir > 0 ? handlers.current.onNext() : handlers.current.onPrev());

    // ── 터치
    let t: { x: number; y: number; at: number; target: Element | null; moving: boolean; dead: boolean } | null = null;
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1 || isEditable(e.target as Element)) {
        t = null;
        return;
      }
      const p = e.touches[0];
      t = { x: p.clientX, y: p.clientY, at: e.timeStamp, target: e.target as Element, moving: false, dead: false };
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!t || t.dead) return;
      const p = e.touches[0];
      const dx = p.clientX - t.x;
      const dy = p.clientY - t.y;
      if (!t.moving && Math.hypot(dx, dy) > 10) {
        t.moving = true;
        // 늦게 움직이기 시작 = 길게 눌러 드래그 / 세로가 더 크면 = 스크롤
        if (e.timeStamp - t.at > TOUCH_START_MS || Math.abs(dy) > Math.abs(dx)) t.dead = true;
      }
    };
    const onTouchEnd = (e: TouchEvent) => {
      const s = t;
      t = null;
      if (!s || s.dead || !s.moving) return;
      const p = e.changedTouches[0];
      const dx = p.clientX - s.x;
      const dy = p.clientY - s.y;
      if (e.timeStamp - s.at > TOUCH_MAX_MS || Math.abs(dx) < TOUCH_MIN || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      const dir = dx < 0 ? 1 : -1;
      if (canScrollX(s.target, root, dir)) return;
      fire(dir);
    };

    // ── 트랙패드
    let sum = 0;
    let locked = false;
    let idle: ReturnType<typeof setTimeout> | undefined;
    const onWheel = (e: WheelEvent) => {
      clearTimeout(idle);
      idle = setTimeout(() => {
        sum = 0;
        locked = false;
      }, WHEEL_IDLE_MS);
      if (locked || e.ctrlKey || Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      const dir = e.deltaX > 0 ? 1 : -1;
      if (isEditable(e.target as Element) || canScrollX(e.target as Element, root, dir)) return;
      sum += e.deltaX;
      if (Math.abs(sum) >= WHEEL_MIN) {
        locked = true;
        sum = 0;
        fire(dir);
      }
    };

    // 브라우저의 '두 손가락 스와이프 = 뒤로 가기' 가 끼어들지 않게
    const html = document.documentElement;
    const prevOverscroll = html.style.overscrollBehaviorX;
    html.style.overscrollBehaviorX = 'none';

    root.addEventListener('touchstart', onTouchStart, { passive: true });
    root.addEventListener('touchmove', onTouchMove, { passive: true });
    root.addEventListener('touchend', onTouchEnd, { passive: true });
    root.addEventListener('wheel', onWheel, { passive: true });
    return () => {
      clearTimeout(idle);
      html.style.overscrollBehaviorX = prevOverscroll;
      root.removeEventListener('touchstart', onTouchStart);
      root.removeEventListener('touchmove', onTouchMove);
      root.removeEventListener('touchend', onTouchEnd);
      root.removeEventListener('wheel', onWheel);
    };
  }, [ref]);
}
