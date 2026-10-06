import { MoreHorizontal, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import NoteEditor from '@/components/editor/NoteEditor';
import ActivityList from '@/components/task/ActivityList';
import { DelegateField, DueField, PlannedField, PriorityField, ProjectField, StatusField } from '@/components/task/fields';
import IssueLog from '@/components/task/IssueLog';
import IconButton from '@/components/ui/IconButton';
import Popover from '@/components/ui/Popover';
import Portal from '@/components/ui/Portal';
import { statusTone } from '@/components/ui/tone';
import { useAutosize } from '@/hooks/useAutosize';
import { useDraftText } from '@/hooks/useDraftText';
import { useIsMobile, useMediaQuery } from '@/hooks/useMediaQuery';
import { useLatest } from '@/hooks/usePresence';
import { useTaskParam } from '@/hooks/useTaskParam';
import { announceDelete } from '@/lib/feedback';
import { useTaskStore } from '@/stores/taskStore';
import { useUiStore } from '@/stores/uiStore';
import type { Task } from '@/types/task';
import { formatDateTime } from '@/utils/date';

function Property({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid min-h-9 grid-cols-[5.5rem_minmax(0,1fr)] items-center gap-2">
      <div className="text-[0.8rem] text-text-muted">{label}</div>
      <div className="flex min-w-0 items-center">{children}</div>
    </div>
  );
}

function TitleInput({ task }: { task: Task }) {
  const updateTask = useTaskStore((s) => s.updateTask);
  const title = useDraftText(task.title, (next) => updateTask(task.id, { title: next }));
  const ref = useRef<HTMLTextAreaElement>(null);
  useAutosize(ref, title.value);

  return (
    <textarea
      ref={ref}
      rows={1}
      value={title.value}
      onChange={(e) => title.onChange(e.target.value.replace(/\n/g, ''))}
      onBlur={title.commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
          e.preventDefault();
          e.currentTarget.blur();
        }
      }}
      placeholder="제목 없음"
      aria-label="제목"
      data-testid="drawer-title"
      className="w-full resize-none overflow-hidden bg-transparent text-[1.45rem] leading-snug font-extrabold tracking-[-0.025em] outline-none placeholder:text-text-muted"
    />
  );
}

function DrawerMenu({ task }: { task: Task }) {
  const [open, setOpen] = useState(false);
  const anchor = useRef<HTMLButtonElement>(null);
  const deleteTask = useTaskStore((s) => s.deleteTask);

  const remove = () => {
    setOpen(false);
    // 지우면 할 일이 없어지므로 상세는 아래 효과에서 한 번만 닫힌다
    announceDelete('삭제했어요', deleteTask(task.id));
  };

  return (
    <>
      <IconButton ref={anchor} label="더 보기" onClick={() => setOpen((v) => !v)} active={open}>
        <MoreHorizontal className="size-4" />
      </IconButton>
      <Popover anchorRef={anchor} open={open} onClose={() => setOpen(false)} placement="bottom-end" title="할 일">
        <div className="flex min-w-44 flex-col p-1">
          <button
            type="button"
            onClick={remove}
            className="flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-sm text-danger hover:bg-danger-soft"
          >
            <Trash2 className="size-4" />
            삭제
          </button>
        </div>
      </Popover>
    </>
  );
}

/** 할 일 상세 — 데스크톱은 오른쪽 패널, 모바일은 전체 화면 */
type DrawerProps = { taskId: string; issueId: string | null; leaving: boolean };

export default function TaskDrawer({ taskId, issueId, leaving }: DrawerProps) {
  const { close } = useTaskParam();
  const current = useTaskStore((s) => s.tasks.find((t) => t.id === taskId));
  // 지워진 직후에도 사라지는 동안은 마지막 모습을 그린다
  const task = useLatest(current) ?? undefined;
  const updateTask = useTaskStore((s) => s.updateTask);
  const isMobile = useIsMobile();
  const scratchOpen = useUiStore((s) => s.scratchOpen);
  const wide = useMediaQuery('(min-width: 1024px)');
  // 자유공간과 나란히 — 겹쳐서 정보가 가려지지 않게
  const besideScratch = scratchOpen && wide;
  const panelRef = useRef<HTMLDivElement>(null);
  const live = task ?? null;

  // 없는(삭제된) 할 일이면 한 번만 닫는다 — close 가 바뀌어 다시 불려도 history 를 두 번 되돌리지 않게
  const closedFor = useRef<string | null>(null);
  useEffect(() => {
    if (leaving || current !== undefined || closedFor.current === taskId) return;
    closedFor.current = taskId;
    close();
  }, [taskId, current, close, leaving]);

  useEffect(() => {
    if (!live || leaving) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return;
      const t = e.target as HTMLElement | null;
      // 에디터·입력 안에서 Esc 는 먼저 포커스만 뺀다
      if (t && (t.isContentEditable || t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) {
        t.blur();
        return;
      }
      close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [live, close, leaving]);

  useEffect(() => {
    if (live) panelRef.current?.focus({ preventScroll: true });
  }, [live?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const meta = useMemo(() => {
    if (!live) return [];
    const rows: { label: string; value: string }[] = [{ label: '만든 날', value: formatDateTime(live.createdAt) }];
    if (live.startedAt) rows.push({ label: '시작', value: formatDateTime(live.startedAt) });
    if (live.completedAt) rows.push({ label: '완료', value: formatDateTime(live.completedAt) });
    return rows;
  }, [live]);

  if (!live) return null;

  return (
    <Portal>
      <div
        className={`fixed inset-0 flex justify-end ${besideScratch ? 'z-50' : 'z-[56]'} ${leaving ? 'pointer-events-none' : ''}`}
        style={besideScratch ? { right: 'min(27rem, 92vw)' } : undefined}
      >
        {!isMobile ? (
          <div className={`absolute inset-0 bg-bg-overlay/50 ${leaving ? 'anim-fade-out' : 'anim-fade'}`} onClick={leaving ? undefined : close} />
        ) : null}
        <div
          ref={panelRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-label={live.title}
          data-testid="task-drawer"
          className={`relative flex h-full w-full flex-col bg-bg-surface outline-none sm:max-w-[40rem] sm:border-l sm:border-border-default sm:shadow-pop ${
            leaving ? (isMobile ? 'anim-sheet-out' : 'anim-slide-out-right') : isMobile ? 'anim-sheet' : 'anim-slide-left'
          }`}
        >
          <div className={`pt-safe flex flex-none items-center gap-1 border-b border-border-default px-3 sm:px-5 ${statusTone[live.status].soft}`}>
            <div className="flex h-12 min-w-0 flex-1 items-center">
              <StatusField task={live} />
            </div>
            <DrawerMenu task={live} />
            <IconButton label="닫기 (Esc)" onClick={close} data-testid="drawer-close">
              <X className="size-[18px]" />
            </IconButton>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <div className="flex flex-col gap-6 px-5 pt-6 pb-24 sm:px-8">
              <TitleInput key={live.id} task={live} />

              <div className="flex flex-col gap-0.5">
                <Property label="프로젝트">
                  <ProjectField task={live} />
                </Property>
                <Property label="체크리스트">
                  <PlannedField task={live} />
                </Property>
                <Property label="마감일">
                  <DueField task={live} />
                </Property>
                <Property label="담당자">
                  <DelegateField task={live} />
                </Property>
                <Property label="우선순위">
                  <PriorityField task={live} />
                </Property>
                {meta.map((m) => (
                  <Property key={m.label} label={m.label}>
                    <div className="px-2 text-sm text-text-secondary tabular-nums">{m.value}</div>
                  </Property>
                ))}
              </div>

              <div className="flex flex-col gap-2">
                <div className="text-[0.95rem] font-bold">메모</div>
                <div className="rounded-xl bg-bg-raised px-4 py-3 ring-1 ring-border-default focus-within:ring-accent/40">
                  <NoteEditor
                    key={live.id}
                    value={live.note}
                    onChange={(note) => updateTask(live.id, { note })}
                    placeholder="필요한 것, 참고 링크, 진행 방법 — '/' 로 표·체크리스트·코드 추가"
                    testId="note-editor"
                    ariaLabel="메모"
                  />
                </div>
              </div>

              <IssueLog key={`issues-${live.id}`} task={live} focusIssueId={issueId} />

              {live.activity.length ? <ActivityList task={live} /> : null}
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
}
