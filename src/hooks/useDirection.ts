import { useRef } from 'react';

/**
 * 값이 바뀐 방향으로 들어오는 애니메이션 클래스 — 다음 날/다음 달이면 오른쪽에서, 이전이면 왼쪽에서.
 * 처음 그릴 땐 빈 문자열 (화면 전환 애니메이션이 대신한다)
 */
export function useDirection<T extends string | number>(value: T): string {
  const prev = useRef(value);
  const cls = useRef('');
  if (prev.current !== value) {
    cls.current = value > prev.current ? 'anim-from-right' : 'anim-from-left';
    prev.current = value;
  }
  return cls.current;
}
