/**
 * 화살표 자동 변환 — 에디터와 일반 입력칸이 같은 규칙을 쓴다.
 *   ->  →     <-  ←     <->  ↔     =>  ⇒
 * (`<->` 는 `<-` 가 먼저 `←` 로 바뀐 뒤 `>` 를 치면 `↔` 가 되도록 `←>` 도 받는다)
 */
export const ARROW_RULES: { from: string; to: string }[] = [
  { from: '<->', to: '↔' },
  { from: '←>', to: '↔' },
  { from: '->', to: '→' },
  { from: '<-', to: '←' },
  { from: '=>', to: '⇒' },
];

/** 커서 바로 앞이 규칙에 맞으면 바꾼 값과 새 커서 위치 */
export function applyArrow(value: string, caret: number): { value: string; caret: number } | null {
  const before = value.slice(0, caret);
  for (const { from, to } of ARROW_RULES) {
    if (before.endsWith(from)) {
      const head = before.slice(0, -from.length) + to;
      return { value: head + value.slice(caret), caret: head.length };
    }
  }
  return null;
}

const TEXT_TYPES = new Set(['text', 'search', '']);

/**
 * 모든 일반 입력칸(input·textarea)에 화살표 변환.
 * React 가 값을 읽기 전에(문서 캡처 단계) 바꿔서 상태에도 그대로 들어간다.
 * 수식(LaTeX)·링크 주소처럼 글자 그대로여야 하는 칸은 data-no-arrows 로 뺀다.
 */
export function installArrowInput() {
  if (typeof document === 'undefined') return;
  const setInput = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
  const setArea = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;
  document.addEventListener(
    'input',
    (e) => {
      const el = e.target;
      if ((e as InputEvent).isComposing) return;
      const isInput = el instanceof HTMLInputElement && TEXT_TYPES.has(el.type);
      const isArea = el instanceof HTMLTextAreaElement;
      if (!isInput && !isArea) return;
      if (el.closest('[data-no-arrows]')) return;
      const caret = el.selectionStart ?? el.value.length;
      const next = applyArrow(el.value, caret);
      if (!next) return;
      (isInput ? setInput : setArea)?.call(el, next.value);
      el.setSelectionRange(next.caret, next.caret);
    },
    true,
  );
}
