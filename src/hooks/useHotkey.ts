import { useEffect, useRef } from 'react';

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}

/**
 * 키 이름 → KeyboardEvent.code 후보.
 * e.key 대신 e.code 로 비교한다 — 한글 입력기가 켜져 있으면 N 키의 e.key 가 'ㅜ' 가 되기 때문.
 */
function codesFor(key: string): string[] {
  if (/^[a-z]$/.test(key)) return [`Key${key.toUpperCase()}`];
  if (/^[0-9]$/.test(key)) return [`Digit${key}`, `Numpad${key}`];
  if (key === '/') return ['Slash', 'NumpadDivide'];
  if (key === 'enter') return ['Enter', 'NumpadEnter'];
  if (key === 'escape') return ['Escape'];
  return [key];
}

type Parsed = { codes: string[]; mod: boolean; shift: boolean; key: string };

function parse(combo: string): Parsed {
  const parts = combo.toLowerCase().split('+');
  const key = parts[parts.length - 1];
  return { codes: codesFor(key), mod: parts.includes('mod'), shift: parts.includes('shift'), key };
}

function matches(p: Parsed, e: KeyboardEvent): boolean {
  if (e.isComposing && p.mod === false && p.key !== 'escape') {
    // 조합 중인 글자를 치는 중 — 단축키로 보지 않는다
    return false;
  }
  const mod = e.metaKey || e.ctrlKey;
  if (p.mod !== mod || p.shift !== e.shiftKey || e.altKey) return false;
  if (!p.codes.includes(e.code)) return false;
  // 입력 중에는 mod 조합과 Esc 만
  if (!p.mod && p.key !== 'escape' && isTyping(e.target)) return false;
  return true;
}

/**
 * 여러 단축키를 한 번에. 예: useHotkeys({ n: goCapture, '1': goTriage, 'mod+enter': send })
 * 팝오버·대화상자가 열려 있으면 (aria-modal/role=dialog 가 포커스를 가진 경우) 단일 키는 무시한다.
 */
export function useHotkeys(map: Record<string, (e: KeyboardEvent) => void>, enabled = true) {
  const ref = useRef(map);
  ref.current = map;
  const signature = Object.keys(map).join('|');

  useEffect(() => {
    if (!enabled) return;
    const parsed = signature.split('|').map((combo) => ({ combo, p: parse(combo) }));
    const onKey = (e: KeyboardEvent) => {
      for (const { combo, p } of parsed) {
        if (!matches(p, e)) continue;
        if (!p.mod && (e.target as HTMLElement | null)?.closest?.('[role="dialog"],[role="alertdialog"],[role="listbox"]')) return;
        ref.current[combo]?.(e);
        return;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [signature, enabled]);
}

export function useHotkey(combo: string, handler: (e: KeyboardEvent) => void, enabled = true) {
  useHotkeys({ [combo]: handler }, enabled);
}
