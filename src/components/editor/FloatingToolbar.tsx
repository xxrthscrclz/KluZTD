import type { Editor } from '@tiptap/core';
import { useEditorState } from '@tiptap/react';
import {
  Bold,
  CheckSquare,
  ChevronsDownUp,
  Code,
  Code2,
  GripVertical,
  Heading1,
  Heading2,
  Heading3,
  Highlighter,
  Italic,
  Lightbulb,
  Link2,
  List,
  ListOrdered,
  Minus,
  PenLine,
  Quote,
  Redo2,
  Sigma,
  SquareSigma,
  Strikethrough,
  Table2,
  Type,
  Underline,
  Undo2,
} from 'lucide-react';
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';

import Popover from '@/components/ui/Popover';
import Portal from '@/components/ui/Portal';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { usePresence } from '@/hooks/usePresence';
import { targetEditor, useEditorStore } from '@/stores/editorStore';

import { safeHref } from './BubbleToolbar';
import { insertMath } from './math';

const POS_KEY = 'kluztd:toolbar';

type Saved = { dx: number; dy: number; collapsed: boolean };

function loadSaved(): Saved {
  try {
    const v = JSON.parse(localStorage.getItem(POS_KEY) ?? '{}') as Partial<Saved>;
    return { dx: Number(v.dx) || 0, dy: Number(v.dy) || 0, collapsed: Boolean(v.collapsed) };
  } catch {
    return { dx: 0, dy: 0, collapsed: false };
  }
}

function save(v: Saved) {
  try {
    localStorage.setItem(POS_KEY, JSON.stringify(v));
  } catch {
    /* 저장 못 해도 동작은 한다 */
  }
}

/** 키보드가 올라오면(모바일) 그 위에 붙도록 아래 여백 계산 */
function useKeyboardInset() {
  const [inset, setInset] = useState(0);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => setInset(Math.max(0, window.innerHeight - vv.height - vv.offsetTop));
    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);
  return inset;
}

function Tool({
  label,
  onRun,
  active = false,
  children,
  testId,
}: {
  label: string;
  onRun: (editor: Editor) => void;
  active?: boolean;
  children: ReactNode;
  testId?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={active}
      data-testid={testId}
      // 누를 때 에디터 포커스·선택이 풀리지 않게
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => {
        const editor = targetEditor();
        if (editor) onRun(editor);
      }}
      className={`grid size-9 flex-none place-items-center rounded-lg transition-colors sm:size-8 ${
        active ? 'bg-accent-soft text-accent-ink' : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
      }`}
    >
      {children}
    </button>
  );
}

const Sep = () => <div className="mx-0.5 h-5 w-px flex-none bg-border-default" />;
const ic = 'size-4';

/**
 * 떠 있는 서식 막대 — 노션처럼 블록·서식·표·코드·콜아웃·수식을 버튼으로.
 * 마지막으로 쓰던 에디터에 적용된다. 손잡이로 끌어 옮기고, 접어 둘 수 있다.
 * 데스크톱은 계속 떠 있고, 모바일은 입력 중일 때만 키보드 위에 뜬다.
 */
export default function FloatingToolbar({ visible }: { visible: boolean }) {
  const isMobile = useIsMobile();
  const focused = useEditorStore((s) => s.focused);
  const active = useEditorStore((s) => s.active);
  const fallback = useEditorStore((s) => s.fallback);
  const editor = active && !active.isDestroyed ? active : fallback && !fallback.isDestroyed ? fallback : null;
  const keyboard = useKeyboardInset();
  const [saved, setSaved] = useState(loadSaved);
  const [linkOpen, setLinkOpen] = useState(false);
  const [href, setHref] = useState('');
  const linkAnchor = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; dx: number; dy: number } | null>(null);

  const state = useEditorState({
    editor,
    selector: ({ editor: e }) =>
      e
        ? {
            h1: e.isActive('heading', { level: 1 }),
            h2: e.isActive('heading', { level: 2 }),
            h3: e.isActive('heading', { level: 3 }),
            bold: e.isActive('bold'),
            italic: e.isActive('italic'),
            underline: e.isActive('underline'),
            strike: e.isActive('strike'),
            code: e.isActive('code'),
            highlight: e.isActive('highlight'),
            link: e.isActive('link'),
            bullet: e.isActive('bulletList'),
            ordered: e.isActive('orderedList'),
            task: e.isActive('taskList'),
            quote: e.isActive('blockquote'),
            codeBlock: e.isActive('codeBlock'),
            callout: e.isActive('callout'),
            canUndo: e.can().undo(),
            canRedo: e.can().redo(),
          }
        : null,
  });

  // 창 크기가 바뀌어 화면 밖으로 나가면 되돌린다
  useEffect(() => {
    const clamp = () => {
      const el = barRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (r.left < 0 || r.right > window.innerWidth || r.top < 0 || r.bottom > window.innerHeight) {
        setSaved((s) => ({ ...s, dx: 0, dy: 0 }));
      }
    };
    window.addEventListener('resize', clamp);
    return () => window.removeEventListener('resize', clamp);
  }, []);

  useEffect(() => save(saved), [saved]);

  const show = isMobile ? visible && focused : visible;
  const presence = usePresence(show);
  if (!presence.mounted) return null;
  const leaving = presence.leaving;

  const onGripDown = (e: ReactPointerEvent) => {
    if (isMobile) return;
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, dx: saved.dx, dy: saved.dy };
  };
  const onGripMove = (e: ReactPointerEvent) => {
    const d = drag.current;
    if (!d) return;
    setSaved((s) => ({ ...s, dx: d.dx + e.clientX - d.x, dy: d.dy + e.clientY - d.y }));
  };
  const onGripUp = () => {
    drag.current = null;
  };

  // 모바일: 키보드가 떠 있으면 그 바로 위, 아니면 하단 메뉴 위 (클래스로)
  const style = isMobile
    ? keyboard > 0
      ? { bottom: `${keyboard + 8}px` }
      : undefined
    : { transform: `translate(calc(-50% + ${saved.dx}px), ${saved.dy}px)` };

  const position = isMobile
    ? `fixed inset-x-0 z-[60] px-2 ${keyboard > 0 ? '' : 'bottom-[calc(4.25rem+env(safe-area-inset-bottom))]'}`
    : 'fixed bottom-5 left-1/2 z-[60]';

  if (saved.collapsed && !isMobile) {
    return (
      <Portal>
        <div ref={barRef} className={position} style={style}>
          <button
            type="button"
            aria-label="서식 막대 펼치기"
            title="서식 막대 펼치기"
            data-testid="toolbar-expand"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setSaved((s) => ({ ...s, collapsed: false }))}
            className={`${leaving ? 'anim-sink' : 'anim-pop'} flex h-10 items-center gap-2 rounded-full border border-border-default bg-bg-surface px-4 text-sm font-semibold text-text-secondary shadow-pop hover:text-text-primary`}
          >
            <PenLine className="size-4" />
            서식
          </button>
        </div>
      </Portal>
    );
  }

  const disabled = !editor;

  return (
    <Portal>
      <div ref={barRef} className={position} style={style}>
        <div
          role="toolbar"
          aria-label="서식 막대"
          data-testid="floating-toolbar"
          className={`${leaving ? 'anim-sink' : 'anim-rise'} no-scrollbar flex items-center gap-0.5 overflow-x-auto rounded-2xl border border-border-default bg-bg-surface/95 p-1 shadow-pop backdrop-blur-xl ${
            disabled ? 'opacity-60' : ''
          } ${isMobile ? 'mx-auto max-w-full' : 'max-w-[calc(100vw-2rem)]'}`}
        >
          {!isMobile ? (
            <div
              onPointerDown={onGripDown}
              onPointerMove={onGripMove}
              onPointerUp={onGripUp}
              onDoubleClick={() => setSaved((s) => ({ ...s, dx: 0, dy: 0 }))}
              title="끌어서 옮기기 (두 번 누르면 제자리)"
              aria-label="막대 옮기기"
              className="grid h-8 w-5 flex-none cursor-grab touch-none place-items-center text-text-muted active:cursor-grabbing"
            >
              <GripVertical className="size-4" />
            </div>
          ) : null}

          <Tool label="실행 취소 (⌘Z)" onRun={(e) => e.chain().focus().undo().run()}>
            <Undo2 className={`${ic} ${state?.canUndo ? '' : 'opacity-40'}`} />
          </Tool>
          <Tool label="다시 실행 (⌘⇧Z)" onRun={(e) => e.chain().focus().redo().run()}>
            <Redo2 className={`${ic} ${state?.canRedo ? '' : 'opacity-40'}`} />
          </Tool>
          <Sep />
          <Tool label="텍스트" onRun={(e) => e.chain().focus().setParagraph().run()}>
            <Type className={ic} />
          </Tool>
          <Tool label="제목 1 (#)" active={state?.h1} onRun={(e) => e.chain().focus().toggleHeading({ level: 1 }).run()}>
            <Heading1 className={ic} />
          </Tool>
          <Tool label="제목 2 (##)" active={state?.h2} onRun={(e) => e.chain().focus().toggleHeading({ level: 2 }).run()}>
            <Heading2 className={ic} />
          </Tool>
          <Tool label="제목 3 (###)" active={state?.h3} onRun={(e) => e.chain().focus().toggleHeading({ level: 3 }).run()}>
            <Heading3 className={ic} />
          </Tool>
          <Sep />
          <Tool label="굵게 (⌘B)" active={state?.bold} onRun={(e) => e.chain().focus().toggleBold().run()}>
            <Bold className={ic} strokeWidth={2.6} />
          </Tool>
          <Tool label="기울임 (⌘I)" active={state?.italic} onRun={(e) => e.chain().focus().toggleItalic().run()}>
            <Italic className={ic} />
          </Tool>
          <Tool label="밑줄 (⌘U)" active={state?.underline} onRun={(e) => e.chain().focus().toggleUnderline().run()}>
            <Underline className={ic} />
          </Tool>
          <Tool label="취소선" active={state?.strike} onRun={(e) => e.chain().focus().toggleStrike().run()}>
            <Strikethrough className={ic} />
          </Tool>
          <Tool label="인라인 코드 (`)" active={state?.code} onRun={(e) => e.chain().focus().toggleCode().run()}>
            <Code className={ic} />
          </Tool>
          <Tool label="형광펜 (==)" active={state?.highlight} onRun={(e) => e.chain().focus().toggleHighlight().run()}>
            <Highlighter className={ic} />
          </Tool>
          <div ref={linkAnchor} className="flex">
            <Tool
              label="링크"
              active={state?.link}
              onRun={(e) => {
                setHref((e.getAttributes('link').href as string | undefined) ?? '');
                setLinkOpen(true);
              }}
            >
              <Link2 className={ic} />
            </Tool>
          </div>
          <Sep />
          <Tool label="글머리 목록 (-)" active={state?.bullet} onRun={(e) => e.chain().focus().toggleBulletList().run()}>
            <List className={ic} />
          </Tool>
          <Tool label="번호 목록 (1.)" active={state?.ordered} onRun={(e) => e.chain().focus().toggleOrderedList().run()}>
            <ListOrdered className={ic} />
          </Tool>
          <Tool label="체크리스트 ([ ])" active={state?.task} onRun={(e) => e.chain().focus().toggleTaskList().run()}>
            <CheckSquare className={ic} />
          </Tool>
          <Sep />
          <Tool label="인용 (>)" active={state?.quote} onRun={(e) => e.chain().focus().toggleBlockquote().run()}>
            <Quote className={ic} />
          </Tool>
          <Tool label="코드 블록 (</>)" active={state?.codeBlock} onRun={(e) => e.chain().focus().toggleCodeBlock().run()}>
            <Code2 className={ic} />
          </Tool>
          <Tool label="콜아웃 (!>)" active={state?.callout} onRun={(e) => e.chain().focus().toggleCallout('note').run()}>
            <Lightbulb className={ic} />
          </Tool>
          <Tool label="표" onRun={(e) => e.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
            <Table2 className={ic} />
          </Tool>
          <Tool label="구분선 (---)" onRun={(e) => e.chain().focus().setHorizontalRule().run()}>
            <Minus className={ic} />
          </Tool>
          <Sep />
          <Tool label="수식 ($$)" testId="tool-math" onRun={(e) => insertMath(e, 'inlineMath')}>
            <Sigma className={ic} />
          </Tool>
          <Tool label="수식 블록 ($$$)" testId="tool-math-block" onRun={(e) => insertMath(e, 'blockMath')}>
            <SquareSigma className={ic} />
          </Tool>

          {!isMobile ? (
            <>
              <Sep />
              <button
                type="button"
                aria-label="서식 막대 접기"
                title="접기"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setSaved((s) => ({ ...s, collapsed: true }))}
                className="grid size-8 flex-none place-items-center rounded-lg text-text-muted hover:bg-bg-hover hover:text-text-primary"
              >
                <ChevronsDownUp className={ic} />
              </button>
            </>
          ) : null}
        </div>
      </div>

      <Popover anchorRef={linkAnchor} open={linkOpen} onClose={() => setLinkOpen(false)} placement="top" title="링크">
        <div className="flex items-center gap-1 p-1.5">
          <input
            autoFocus
            value={href}
            onChange={(e) => setHref(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== 'Enter' || e.nativeEvent.isComposing) return;
              e.preventDefault();
              const target = targetEditor();
              const url = safeHref(href);
              if (target) {
                const chain = target.chain().focus().extendMarkRange('link');
                if (url) chain.setLink({ href: url }).run();
                else chain.unsetLink().run();
              }
              setLinkOpen(false);
            }}
            placeholder="링크 주소 (선택한 글자에 걸림) — Enter"
            className="h-8 w-full rounded-md bg-bg-muted px-2 text-sm outline-none sm:w-64"
          />
        </div>
      </Popover>
    </Portal>
  );
}
