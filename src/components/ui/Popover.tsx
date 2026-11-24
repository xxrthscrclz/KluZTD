import { autoUpdate, computePosition, flip, offset, shift, size, type Placement } from '@floating-ui/dom';
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react';

import Portal from '@/components/ui/Portal';
import { usePresence } from '@/hooks/usePresence';
import { useIsMobile } from '@/hooks/useMediaQuery';

type Props = {
  anchorRef: RefObject<HTMLElement | null>;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  placement?: Placement;
  /** 앵커 너비 이상으로 */
  matchWidth?: boolean;
  /** 모바일에서는 화면 아래 시트로 */
  sheetOnMobile?: boolean;
  /** 시트 제목 (모바일) */
  title?: string;
  className?: string;
  /** 바깥 클릭으로 닫힘을 막을 추가 요소 (예: 함께 쓰는 입력창) */
  ignoreRefs?: RefObject<HTMLElement | null>[];
};

const NO_REFS: RefObject<HTMLElement | null>[] = [];

/**
 * 열려 있는 팝오버 순서 (나중에 연 게 위).
 * 정보 카드 안의 날짜 고르기처럼 팝오버 안에서 또 팝오버를 열 때,
 * 안쪽을 눌러도 바깥이 닫히지 않고, Esc 는 맨 위 것만 닫히게 한다.
 */
const openStack: number[] = [];
let nextPopoverId = 1;

/** 앵커 옆에 붙는 떠 있는 패널. 바깥 클릭·Esc 로 닫힌다. */
export default function Popover({
  anchorRef,
  open,
  onClose,
  children,
  placement = 'bottom-start',
  matchWidth = false,
  sheetOnMobile = true,
  title,
  className = '',
  ignoreRefs = NO_REFS,
}: Props) {
  const isMobile = useIsMobile();
  const asSheet = sheetOnMobile && isMobile;
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number; placed: boolean }>({ x: 0, y: 0, placed: false });
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const { mounted, leaving } = usePresence(open);
  const idRef = useRef(0);
  if (!idRef.current) idRef.current = nextPopoverId++;

  useLayoutEffect(() => {
    if (!mounted || asSheet) return;
    const anchor = anchorRef.current;
    const panel = panelRef.current;
    if (!anchor || !panel) return;
    return autoUpdate(anchor, panel, () => {
      void computePosition(anchor, panel, {
        placement,
        strategy: 'fixed',
        middleware: [
          offset(6),
          flip({ padding: 8 }),
          shift({ padding: 8 }),
          size({
            padding: 8,
            apply({ availableHeight, rects, elements }) {
              elements.floating.style.maxHeight = `${Math.max(160, Math.min(availableHeight, 440))}px`;
              if (matchWidth) elements.floating.style.minWidth = `${rects.reference.width}px`;
            },
          }),
        ],
      }).then(({ x, y }) => setPos({ x, y, placed: true }));
    });
  }, [mounted, asSheet, anchorRef, placement, matchWidth]);

  // 완전히 사라진 뒤에만 위치를 지운다 (닫히는 동안엔 제자리에서 사라지게)
  useEffect(() => {
    if (!mounted) setPos((p) => ({ ...p, placed: false }));
  }, [mounted]);

  useEffect(() => {
    if (!open) return;
    const myId = idRef.current;
    openStack.push(myId);
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (panelRef.current?.contains(t) || anchorRef.current?.contains(t)) return;
      if (ignoreRefs.some((r) => r.current?.contains(t))) return;
      // 나보다 나중에 연(안쪽) 팝오버를 누른 거면 닫지 않는다
      const inner = (t as HTMLElement).closest?.('[data-kz-popover]') as HTMLElement | null;
      const innerId = Number(inner?.dataset.kzPopover ?? 0);
      if (innerId && openStack.indexOf(innerId) > openStack.indexOf(myId)) return;
      onCloseRef.current();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || openStack[openStack.length - 1] !== myId) return;
      e.stopPropagation();
      onCloseRef.current();
    };
    document.addEventListener('pointerdown', onDown, true);
    document.addEventListener('keydown', onKey, true);
    return () => {
      const i = openStack.indexOf(myId);
      if (i >= 0) openStack.splice(i, 1);
      document.removeEventListener('pointerdown', onDown, true);
      document.removeEventListener('keydown', onKey, true);
    };
  }, [open, anchorRef, ignoreRefs]);

  if (!mounted) return null;

  if (asSheet) {
    return (
      <Portal>
        <div data-kz-popover={idRef.current} className={`fixed inset-0 z-[70] flex flex-col justify-end ${leaving ? 'pointer-events-none' : ''}`}>
          <div className={`absolute inset-0 bg-bg-overlay ${leaving ? 'anim-fade-out' : 'anim-fade'}`} onPointerDown={() => onClose()} />
          <div
            ref={panelRef}
            role="dialog"
            className={`pb-safe relative flex max-h-[78dvh] flex-col rounded-t-[22px] bg-bg-surface shadow-pop ${leaving ? 'anim-sheet-out' : 'anim-sheet'}`}
          >
            <div className="flex flex-none flex-col items-center gap-2 px-4 pt-2.5 pb-1">
              <div className="h-1 w-9 rounded-full bg-border-strong" />
              {title ? <div className="w-full text-[0.8rem] font-semibold text-text-muted">{title}</div> : null}
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">{children}</div>
          </div>
        </div>
      </Portal>
    );
  }

  return (
    <Portal>
      <div
        ref={panelRef}
        role="dialog"
        data-kz-popover={idRef.current}
        style={{ left: pos.x, top: pos.y, visibility: pos.placed ? 'visible' : 'hidden' }}
        className={`fixed z-[70] flex flex-col overflow-y-auto rounded-xl border border-border-default bg-bg-surface shadow-pop ${
          leaving ? 'anim-pop-out' : pos.placed ? 'anim-pop' : ''
        } ${className}`}
      >
        {children}
      </div>
    </Portal>
  );
}
