import { defaultAnimateLayoutChanges, useSortable, type AnimateLayoutChanges } from '@dnd-kit/sortable';
import { SORT_TRANSITION } from '@/lib/motion';
import { CSS } from '@dnd-kit/utilities';
import { ListChecks, NotebookText } from 'lucide-react';
import { forwardRef, memo, useEffect, useRef, type HTMLAttributes, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';

import { DelegateChip, DueChip, IssueCount, PriorityIcon, ProjectChip, StatusDot } from '@/components/ui/Badges';
import { useTaskStore } from '@/stores/taskStore';
import { formatDate, todayIsoKey } from '@/utils/date';
import type { Task } from '@/types/task';
import { isDocEmpty } from '@/utils/doc';
import type { IssueStat } from '@/utils/issues';

type CardProps = {
  task: Task;
  onOpen?: (id: string) => void;
  overlay?: boolean;
  dragging?: boolean;
  /** 연결된 이슈 수 */
  issueStat?: IssueStat;
} & HTMLAttributes<HTMLDivElement>;

/** 보드 카드 겉모습 (드래그 오버레이에서도 그대로 씀) */
export const TaskCardBody = memo(
  forwardRef<HTMLDivElement, CardProps>(function TaskCardBody({ task, onOpen, overlay = false, dragging = false, issueStat, style, ...rest }, ref) {
    const issueTotal = issueStat?.total ?? 0;
    const done = task.status === 'done';
    const hasNote = !isDocEmpty(task.note);
    const project = useTaskStore((s) => (task.projectId ? s.projects.find((p) => p.id === task.projectId) : undefined));
    const hasMeta = task.due || task.delegate || issueTotal || hasNote || project || task.plannedOn;

    return (
      <div
        ref={ref}
        style={style}
        {...rest}
        role="button"
        tabIndex={overlay ? -1 : 0}
        aria-roledescription="카드"
        aria-label={`${task.title || '제목 없음'} — Enter 열기, Space 집어서 옮기기`}
        onClick={() => onOpen?.(task.id)}
        onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => {
          rest.onKeyDown?.(e);
          if (e.key === 'Enter' && !dragging && !e.defaultPrevented) onOpen?.(task.id);
        }}
        data-testid={overlay ? 'task-card-overlay' : 'task-card'}
        data-status={task.status}
        className={`group/card relative flex cursor-pointer touch-manipulation flex-col gap-2 rounded-xl px-3 py-2.5 text-left transition-[box-shadow,background-color,border-color] select-none ${
          overlay
            ? 'anim-lift cursor-grabbing bg-bg-surface shadow-drag'
            : 'anim-pop bg-bg-surface shadow-card hover:shadow-card-hover'
        }`}
      >
        <div className="flex items-start gap-2">
          {done ? (
            <StatusDot status="done" className="mt-[0.2rem]" />
          ) : task.priority ? (
            <PriorityIcon priority={task.priority} className="mt-[0.2rem]" />
          ) : null}
          <div
            className={`line-clamp-3 min-w-0 flex-1 text-[0.88rem] leading-snug font-medium break-words ${
              done ? 'text-text-muted' : 'text-text-primary'
            }`}
          >
            {task.title || '제목 없음'}
          </div>
        </div>
        {hasMeta ? (
          <div className="flex flex-wrap items-center gap-1">
            {project ? <ProjectChip name={project.name} color={project.color} /> : null}
            {task.due ? <DueChip due={task.due} done={done} /> : null}
            {task.delegate ? <DelegateChip name={task.delegate} /> : null}
            <IssueCount open={issueStat?.open ?? 0} total={issueTotal} />
            {task.plannedOn && !done ? (
              <div
                className={`inline-flex h-[22px] items-center gap-1 rounded-md px-1.5 text-[0.72rem] font-semibold ${
                  task.plannedOn === todayIsoKey() ? 'bg-accent-soft text-accent-ink' : 'bg-bg-muted text-text-muted'
                }`}
                title="체크리스트에 올린 날"
              >
                <ListChecks className="size-3" />
                {task.plannedOn === todayIsoKey() ? '오늘' : formatDate(task.plannedOn)}
              </div>
            ) : null}
            {hasNote ? (
              <div className="grid h-[22px] w-[22px] place-items-center rounded-md text-text-muted" title="메모 있음">
                <NotebookText className="size-3.5" />
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  }),
);

/**
 * 놓일 자리 선 — 자리를 표시하는 칸(부모)의 위치를 매 프레임 따라가며,
 * 들린 카드(오버레이)보다 위 레이어에 그려서 절대 가려지지 않는다.
 */
function DropLine() {
  const anchor = useRef<HTMLDivElement>(null);
  const line = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const follow = () => {
      const slot = anchor.current?.parentElement;
      const el = line.current;
      if (slot && el) {
        const r = slot.getBoundingClientRect();
        el.style.transform = `translate(${r.left}px, ${r.top - 4}px)`;
        el.style.width = `${r.width}px`;
      }
      raf = requestAnimationFrame(follow);
    };
    follow();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <>
      <div ref={anchor} />
      {createPortal(
        <div
          ref={line}
          data-testid="drop-indicator"
          className="pointer-events-none fixed top-0 left-0 z-[1001] flex items-center"
        >
          <div className="anim-fade flex w-full -translate-y-1/2 items-center">
            <div className="size-2.5 flex-none rounded-full border-2 border-accent bg-bg-surface" />
            <div className="h-[3px] flex-1 rounded-full bg-accent shadow-[0_0_10px_color-mix(in_srgb,var(--color-accent)_55%,transparent)]" />
            <div className="size-2.5 flex-none rounded-full border-2 border-accent bg-bg-surface" />
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}

const animateLayoutChanges: AnimateLayoutChanges = (args) => defaultAnimateLayoutChanges({ ...args, wasDragging: true });

/** 끌 수 있는 카드 — 드래그 핸들러와 포커스가 한 요소에 모인다 */
export default function TaskCard({ task, onOpen, issueStat }: { task: Task; onOpen: (id: string) => void; issueStat?: IssueStat }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging, node } = useSortable({
    id: task.id,
    transition: SORT_TRANSITION,
    // 끌 때뿐 아니라 놓은 뒤·순서가 바뀔 때도 미끄러지듯 제자리로
    animateLayoutChanges,
    data: { type: 'card', status: task.status },
  });
  // 들기 직전 카드 높이 — 놓일 영역을 같은 크기로
  const slotHeight = useRef<number | null>(null);
  if (!isDragging && node.current) slotHeight.current = node.current.getBoundingClientRect().height;

  if (isDragging) {
    // 놓일 자리 — 카드 높이만큼 점선 영역, 그 위쪽 틈에 빛나는 선 (선은 들린 카드보다 위 레이어)
    return (
      <div
        ref={setNodeRef}
        style={{ transform: CSS.Translate.toString(transform), transition, height: slotHeight.current ?? undefined }}
        {...attributes}
        {...listeners}
        data-testid="drop-slot"
        className="anim-fade min-h-12 rounded-xl border-2 border-dashed border-accent/50 bg-accent-soft/70"
      >
        <DropLine />
      </div>
    );
  }

  return (
    <TaskCardBody
      ref={setNodeRef}
      task={task}
      onOpen={onOpen}
      issueStat={issueStat}
      dragging={isDragging}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      {...attributes}
      {...listeners}
    />
  );
}
