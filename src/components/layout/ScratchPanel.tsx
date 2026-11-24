import { Bookmark, ChevronsRight } from 'lucide-react';
import { useEffect, useState } from 'react';

import NoteEditor from '@/components/editor/NoteEditor';
import IconButton from '@/components/ui/IconButton';
import Portal from '@/components/ui/Portal';
import { useHotkey } from '@/hooks/useHotkey';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useTaskStore } from '@/stores/taskStore';
import { useUiStore } from '@/stores/uiStore';

/**
 * 자유공간 — 어느 화면에서나 오른쪽 가장자리의 책갈피를 눌러 펼치고 접는다.
 * 데스크톱은 화면을 가리지 않는 옆 패널, 모바일은 전체 화면.
 */
export default function ScratchPanel() {
  const open = useUiStore((s) => s.scratchOpen);
  const setOpen = useUiStore((s) => s.setScratchOpen);
  const scratch = useTaskStore((s) => s.scratch);
  const setScratch = useTaskStore((s) => s.setScratch);
  const isMobile = useIsMobile();
  // 에디터를 미리(한가할 때) 만들어 두고 계속 둔다 — 누르는 순간 바로 미끄러져 나오게
  const [ready, setReady] = useState(open);
  useEffect(() => {
    if (ready) return;
    if (open) {
      setReady(true);
      return;
    }
    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 800));
    const cancel = window.cancelIdleCallback ?? window.clearTimeout;
    const id = idle(() => setReady(true));
    return () => cancel(id);
  }, [open, ready]);

  useHotkey('m', (e) => {
    e.preventDefault();
    setOpen(!open);
  });

  return (
    <Portal>
      {/*
        책갈피 — 언제나 맨 앞(상세·팝업·서식 막대보다 위).
        데스크톱은 펼치면 패널 왼쪽 가장자리에 붙어 따라가며 접기 손잡이가 된다.
        모바일은 가는 탭, 패널이 화면을 다 덮을 땐 패널 머리의 접기 버튼을 쓴다.
      */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label={open ? '자유공간 접기 (M)' : '자유공간 펼치기 (M)'}
        aria-expanded={open}
        title="자유공간 (M)"
        data-testid="scratch-tab"
        style={{ right: open && !isMobile ? 'min(27rem, 92vw)' : 0 }}
        className={`fixed z-[100] flex flex-col items-center rounded-l-xl border border-r-0 border-border-default bg-bg-surface text-text-secondary shadow-pop transition-[right,translate,opacity,padding,color] duration-500 ease-[ease] hover:text-text-primary ${
          isMobile ? 'top-[45%] gap-1 px-1 py-2.5' : 'top-28 gap-1.5 px-1.5 py-3 hover:pr-2.5'
        } ${open ? 'text-accent-ink' : ''} ${open && isMobile ? 'pointer-events-none translate-x-full opacity-0' : 'translate-x-0 opacity-100'}`}
      >
        <Bookmark className={`size-4 flex-none text-accent ${open ? 'fill-current' : ''}`} strokeWidth={2.4} />
        {!isMobile ? <div className="text-[0.72rem] font-bold tracking-[0.12em] [writing-mode:vertical-rl]">자유공간</div> : null}
      </button>
      {ready ? (
        <div
          role="complementary"
          aria-label="자유공간"
          data-testid="scratch-panel"
          data-open={open}
          // 화면 끝에서 통째로 미끄러져 나온다 — 첫 프레임부터 보이게 투명도는 건드리지 않는다
          // 닫혀 있을 땐 화면 밖에 두고 inert(누르기·포커스 불가). visibility:hidden 은 쓰지 않는다 —
          // 숨긴 채 만든 에디터는 나중에 눌러도 커서가 안 잡히는 문제가 있다
          inert={!open}
          className={`fixed z-[57] flex flex-col bg-bg-surface transition-[translate,box-shadow] duration-500 ease-[ease] ${
            open ? 'translate-x-0 shadow-pop' : 'pointer-events-none translate-x-full shadow-none'
          } ${
            isMobile
              ? 'pt-safe inset-x-0 top-0 bottom-[calc(3.75rem+env(safe-area-inset-bottom))]'
              : 'top-0 right-0 bottom-0 w-[min(27rem,92vw)] border-l border-border-default'
          }`}
        >
          <div className="flex h-12 flex-none items-center gap-2 border-b border-border-default px-4">
            <Bookmark className="size-4 text-accent" strokeWidth={2.4} />
            <div className="text-sm font-bold">자유공간</div>
            <div className="hidden text-xs text-text-muted sm:block">어느 화면에서나 · M</div>
            <IconButton label="자유공간 접기 (M)" className="ml-auto" onClick={() => setOpen(false)} data-testid="scratch-close">
              <ChevronsRight className="size-[18px]" />
            </IconButton>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <NoteEditor
              value={scratch}
              onChange={setScratch}
              placeholder="자주 보는 링크, 계산, 아이디어, 연락처 … '/' 로 표·수식·코드"
              testId="scratch-note"
              ariaLabel="자유공간"
              // 펼쳐져 있을 때만 떠 있는 막대의 기본 대상
              toolbarFallback={open}
              frameClassName="min-h-full px-5 pt-4 pb-24"
            />
          </div>
        </div>
      ) : null}
    </Portal>
  );
}
